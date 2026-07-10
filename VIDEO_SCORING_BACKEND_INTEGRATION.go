// ============================================================================
// BACKEND INTEGRATION GUIDE - Go Implementation
// ============================================================================
//
// This file shows how to integrate the video scoring & rotation system
// into the existing Go backend (video.go)
//
// Services to integrate:
// 1. Scoring calculations (done per video)
// 2. View history tracking (AsyncStorage on client, or Redis on server)
// 3. Diversity post-processing (sort after scoring)
// 4. Rotation algorithm (filter by eligibility)
//
// ============================================================================

package routes

import (
	"apartments-clone-server/models"
	"apartments-clone-server/storage"
	"math"
	"time"
)

// ============================================================================
// SCORING SERVICE - Calculate composite score for each video
// ============================================================================

type VideoScoreBreakdown struct {
	Freshness      float64
	Engagement     float64
	Relevance      float64
	SeenPenalty    float64
	CompositeScore float64
}

type ScoringWeights struct {
	Freshness   float64
	Engagement  float64
	Relevance   float64
	SeenPenalty float64
}

var DefaultWeights = ScoringWeights{
	Freshness:   0.35,
	Engagement:  0.25,
	Relevance:   0.25,
	SeenPenalty: 0.15,
}

// CalculateFreshnessScore - Exponential decay with 48-hour half-life
func CalculateFreshnessScore(createdAt time.Time, currentTime time.Time) float64 {
	ageMs := float64(currentTime.Sub(createdAt).Milliseconds())
	ageHours := ageMs / (1000 * 60 * 60)
	
	halfLife := 48.0
	freshnessScore := math.Exp(-ageHours / halfLife)
	
	// Clamp to [0, 1]
	if freshnessScore > 1 {
		freshnessScore = 1
	}
	if freshnessScore < 0 {
		freshnessScore = 0
	}
	
	return freshnessScore
}

// CalculateEngagementScore - Combine likes, comments, views, completion
func CalculateEngagementScore(video models.Video) float64 {
	likes := float64(video.LikesCount)
	comments := float64(video.CommentsCount)
	views := float64(video.ViewCount)
	if views < 1 {
		views = 1 // Avoid division by zero
	}
	completion := 0.5 // Default if unknown
	if video.CompletionRate > 0 {
		completion = video.CompletionRate
	}
	
	// Normalize metrics
	likeScore := math.Min(1, likes/100)
	commentScore := math.Min(1, comments/20)
	completionScore := math.Min(1, completion)
	
	// Engagement rate: (likes + comments*2) / views
	engagementRate := math.Min(1, (likes+comments*2)/views)
	
	// Weighted average
	score := engagementRate*0.4 + completionScore*0.3 + commentScore*0.2 + likeScore*0.1
	
	return math.Max(0, math.Min(1, score))
}

// CalculateRelevanceScore - Match to user preferences
func CalculateRelevanceScore(
	video models.Video,
	userPreferences models.UserPreferences,
) float64 {
	relevance := 0.5 // Neutral default
	scores := []float64{}
	
	// Location match
	if userPreferences.PreferredCity != "" && video.Property != nil {
		if video.Property.City == userPreferences.PreferredCity {
			scores = append(scores, 1.0)
		} else {
			scores = append(scores, 0.3)
		}
	}
	
	// Zone match
	if userPreferences.PreferredZone != "" && video.Property != nil {
		if video.Property.Zone == userPreferences.PreferredZone {
			scores = append(scores, 0.9)
		} else {
			scores = append(scores, 0.2)
		}
	}
	
	// Property type match
	if len(userPreferences.PreferredPropertyTypes) > 0 && video.Property != nil {
		found := false
		for _, t := range userPreferences.PreferredPropertyTypes {
			if t == video.Property.PropertyType {
				found = true
				break
			}
		}
		if found {
			scores = append(scores, 0.95)
		} else {
			scores = append(scores, 0.2)
		}
	}
	
	// Bedroom match
	if userPreferences.PreferredBedrooms > 0 && video.Property != nil {
		diff := int(math.Abs(float64(video.Property.Bedrooms) - float64(userPreferences.PreferredBedrooms)))
		var bedroomScore float64
		if diff == 0 {
			bedroomScore = 1.0
		} else if diff == 1 {
			bedroomScore = 0.8
		} else {
			bedroomScore = 0.3
		}
		scores = append(scores, bedroomScore)
	}
	
	// Calculate average
	if len(scores) > 0 {
		sum := 0.0
		for _, s := range scores {
			sum += s
		}
		relevance = sum / float64(len(scores))
	}
	
	return math.Max(0, math.Min(1, relevance))
}

// CalculateSeenPenalty - Reduce score for recently viewed
func CalculateSeenPenalty(lastSeenAt *time.Time, currentTime time.Time) float64 {
	if lastSeenAt == nil {
		return 1.0 // No penalty if never seen
	}
	
	timeSinceSeen := currentTime.Sub(*lastSeenAt)
	timeSinceSeenHours := timeSinceSeen.Hours()
	
	var penalty float64
	if timeSinceSeenHours < 1 {
		penalty = 0.05
	} else if timeSinceSeenHours < 6 {
		penalty = 0.1
	} else if timeSinceSeenHours < 24 {
		penalty = 0.3
	} else if timeSinceSeenHours < 48 {
		penalty = 0.6
	} else {
		penalty = 1.0
	}
	
	return penalty
}

// ScoreVideo - Calculate composite score
func ScoreVideo(
	video models.Video,
	userPreferences models.UserPreferences,
	lastSeenAt *time.Time,
	weights ScoringWeights,
	currentTime time.Time,
) (float64, VideoScoreBreakdown) {
	freshness := CalculateFreshnessScore(video.CreatedAt, currentTime)
	engagement := CalculateEngagementScore(video)
	relevance := CalculateRelevanceScore(video, userPreferences)
	seenPenalty := CalculateSeenPenalty(lastSeenAt, currentTime)
	
	// Composite score
	composite :=
		freshness*weights.Freshness +
			engagement*weights.Engagement +
			relevance*weights.Relevance +
			seenPenalty*weights.SeenPenalty
	
	composite = math.Max(0, math.Min(1, composite))
	
	breakdown := VideoScoreBreakdown{
		Freshness:      freshness,
		Engagement:     engagement,
		Relevance:      relevance,
		SeenPenalty:    seenPenalty,
		CompositeScore: composite,
	}
	
	return composite, breakdown
}

// ============================================================================
// DIVERSITY SERVICE - Ensure varied content
// ============================================================================

type VideoWithScore struct {
	Video models.Video
	Score float64
}

// CalculateSimilarity - Measure how similar two videos are (0-1)
func CalculateSimilarity(v1, v2 models.Video) float64 {
	similarity := 0.0
	dimensions := 0.0
	
	// Location similarity
	if v1.Property != nil && v2.Property != nil {
		if v1.Property.City == v2.Property.City {
			similarity += 0.4
		}
		if v1.Property.Zone == v2.Property.Zone {
			similarity += 0.5
		}
		dimensions += 0.9
	}
	
	// Property type
	if v1.Property != nil && v2.Property != nil {
		if v1.Property.PropertyType == v2.Property.PropertyType {
			similarity += 0.25
		}
		dimensions += 0.25
	}
	
	// Price similarity (within 20%)
	if v1.Property != nil && v2.Property != nil && v1.Property.Price > 0 && v2.Property.Price > 0 {
		maxPrice := float64(v1.Property.Price)
		if v2.Property.Price > maxPrice {
			maxPrice = float64(v2.Property.Price)
		}
		priceDiff := math.Abs(float64(v1.Property.Price - v2.Property.Price))
		if priceDiff/maxPrice < 0.2 {
			similarity += 0.15
		}
		dimensions += 0.15
	}
	
	if dimensions > 0 {
		similarity = similarity / dimensions
	}
	
	return math.Max(0, math.Min(1, similarity))
}

// ApplyDiversityPenalties - Reduce scores for similar consecutive videos
func ApplyDiversityPenalties(
	videos []VideoWithScore,
	similarityThreshold float64,
	penaltyFactor float64,
) []VideoWithScore {
	if len(videos) < 3 {
		return videos
	}
	
	result := make([]VideoWithScore, len(videos))
	copy(result, videos)
	
	for i := 1; i < len(result); i++ {
		similarity := CalculateSimilarity(result[i-1].Video, result[i].Video)
		if similarity > similarityThreshold {
			result[i].Score *= penaltyFactor
		}
	}
	
	// Re-sort after penalties
	// (Use existing sort.Slice from Go)
	
	return result
}

// ============================================================================
// ROTATION SERVICE - Prevent repetition
// ============================================================================

// CheckRotationEligibility - Is video eligible to show (TTL not expired)?
func CheckRotationEligibility(
	videoID uint,
	userID uint,
	ttlHours int,
	currentTime time.Time,
) bool {
	// Query view history from database
	// (assuming ViewHistory table with: user_id, video_id, viewed_at)
	
	var lastView models.VideoView
	result := storage.DB.
		Where("user_id = ? AND video_id = ?", userID, videoID).
		Order("viewed_at DESC").
		First(&lastView)
	
	if result.Error != nil {
		return true // Never viewed = eligible
	}
	
	ageHours := currentTime.Sub(lastView.ViewedAt).Hours()
	return ageHours >= float64(ttlHours)
}

// FilterEligibleVideos - Remove recently viewed videos
func FilterEligibleVideos(
	videos []models.Video,
	userID uint,
	ttlHours int,
	currentTime time.Time,
) []models.Video {
	eligible := []models.Video{}
	
	for _, video := range videos {
		if CheckRotationEligibility(video.ID, userID, ttlHours, currentTime) {
			eligible = append(eligible, video)
		}
	}
	
	return eligible
}

// ============================================================================
// INTEGRATION INTO GetVideoFeed
// ============================================================================

/*
Modified GetVideoFeed() with scoring & rotation:

func GetVideoFeed(ctx iris.Context) {
	// ... existing code to get user, filters, pagination ...
	
	// Get videos from database
	var videos []models.Video
	query := storage.DB.Model(&models.Video{}).
		Joins("LEFT JOIN properties ON videos.property_id = properties.id").
		// ... filters ...
		Preload("Property").
		Preload("User")
	
	if err := query.Find(&videos).Error; err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.JSON(iris.Map{"error": "Failed to fetch videos"})
		return
	}
	
	// STEP 1: Score each video
	currentTime := time.Now()
	userPrefs := models.UserPreferences{} // Get from user profile
	
	scored := make([]VideoWithScore, 0, len(videos))
	for _, video := range videos {
		// Get last view time for this user
		var lastViewTime *time.Time
		// Query view history...
		
		score, breakdown := ScoreVideo(
			video,
			userPrefs,
			lastViewTime,
			DefaultWeights,
			currentTime,
		)
		
		scored = append(scored, VideoWithScore{
			Video: video,
			Score: score,
		})
	}
	
	// STEP 2: Sort by score descending
	sort.Slice(scored, func(i, j int) bool {
		return scored[i].Score > scored[j].Score
	})
	
	// STEP 3: Apply diversity penalties & re-rank
	diversified := ApplyDiversityPenalties(scored, 0.6, 0.7)
	
	// STEP 4: Apply rotation (filter out recently seen)
	rotated := make([]models.Video, 0, len(diversified))
	for _, vs := range diversified {
		if CheckRotationEligibility(vs.Video.ID, userID, 24, currentTime) {
			rotated = append(rotated, vs.Video)
		}
	}
	
	// If not enough eligible videos, include some recently seen
	if len(rotated) < limit {
		for _, vs := range diversified {
			if len(rotated) >= limit {
				break
			}
			if !CheckRotationEligibility(vs.Video.ID, userID, 24, currentTime) {
				rotated = append(rotated, vs.Video)
			}
		}
	}
	
	// STEP 5: Return final feed
	finalLimit := limit
	if len(rotated) < limit {
		finalLimit = len(rotated)
	}
	
	ctx.JSON(iris.Map{
		"success": true,
		"videos":  rotated[:finalLimit],
		"hasMore": hasMore,
	})
}
*/

// ============================================================================
// DATABASE MIGRATION - Add if needed
// ============================================================================

/*
Create VideoView table for tracking:

CREATE TABLE video_views (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  video_id INT NOT NULL REFERENCES videos(id),
  viewed_at TIMESTAMP DEFAULT NOW(),
  watch_duration_sec INT,
  completion_rate FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (video_id) REFERENCES videos(id),
  UNIQUE(user_id, video_id, viewed_at) -- Prevent duplicates in same second
);

CREATE INDEX idx_video_views_user_id ON video_views(user_id);
CREATE INDEX idx_video_views_viewed_at ON video_views(viewed_at);
*/

// ============================================================================
// MONITORING & LOGGING
// ============================================================================

/*
Add to scoring logic:

fmt.Printf(
	"[VideoScore] Video %d: Fresh=%.2f Engagement=%.2f Relevance=%.2f SeenPenalty=%.2f => Score=%.2f\n",
	video.ID,
	breakdown.Freshness,
	breakdown.Engagement,
	breakdown.Relevance,
	breakdown.SeenPenalty,
	breakdown.CompositeScore,
)

Add metrics:
- repeatRate: % of videos already seen (should be < 10%)
- avgSimilarity: avg consecutive video similarity (should be < 0.4)
- cycleCompletion: % of catalog seen (track per user)
*/

// ============================================================================
// CACHING OPTIMIZATION
// ============================================================================

/*
Use Redis to cache:
1. User view history (refresh daily)
2. User preferences (refresh on update)
3. Video scores (TTL=1h, cache by day+hour)

Cache key patterns:
- view_history:{userId}
- user_prefs:{userId}
- video_scores:{dateHour}:{videoId}

When user views video:
- Increment score in Redis cache (for next calculation)
- Schedule async write to database
*/

// End of file
