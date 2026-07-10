-- Like system: single source of truth per (user_id, video_id).
-- Like count must always be: SELECT COUNT(*) FROM video_likes WHERE video_id = ?

-- Example for "rent" videos (adjust table name and FKs to match your schema)
CREATE TABLE IF NOT EXISTS video_likes (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id   BIGINT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes (video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes (user_id);

-- If you previously had a denormalized likes_count on videos, stop updating it.
-- Count must always be derived: COUNT(*) FROM video_likes WHERE video_id = ?
