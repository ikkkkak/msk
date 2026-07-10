export interface Experience {
  ID: number;
  id?: number; // Backend sometimes returns lowercase
  HostID: number;
  hostID?: number; // Backend sometimes returns lowercase
  Host: {
    ID: number;
    FirstName: string;
    LastName: string;
    AvatarURL?: string;
    IdentityVerified: boolean;
  };
  host?: {
    ID: number;
    firstName?: string;
    lastName?: string;
    avatarURL?: string;
    isVerified?: boolean;
  }; // Backend sometimes returns lowercase
  
  // Basic Info
  Title: string;
  title?: string; // Backend sometimes returns lowercase
  City: string;
  city?: string; // Backend sometimes returns lowercase
  Language: string;
  language?: string; // Backend sometimes returns lowercase
  Focus: string;
  focus?: string; // Backend sometimes returns lowercase
  
  // Host Experience
  HasHostedBefore: boolean;
  HostedFor: string; // "friends", "family", "public"
  
  // Experience Details
  Description: string;
  Duration: number; // in minutes
  duration?: number; // Backend sometimes returns lowercase
  WhatWeDo: string;
  
  // Requirements
  WhatToBring: string;
  BringRequired: boolean;
  
  // Audience
  MinAge: number;
  MaxAge: number;
  ActivityLevel: string; // "light", "moderate", "extreme", "strenuous"
  activityLevel?: string; // Backend sometimes returns lowercase
  DifficultyLevel: string; // "beginner", "intermediate", "advanced", "expert"
  difficultyLevel?: string; // Backend sometimes returns lowercase
  
  // Logistics
  GroupSize: number;
  groupSize?: number; // Backend sometimes returns lowercase
  StartTime: string; // "09:00"
  EndTime: string; // "17:00"
  PricePerPerson: number;
  pricePerPerson?: number; // Backend sometimes returns lowercase
  
  // Group Discounts
  GroupDiscounts: Record<string, any>;
  
  // Timing
  ArrivalTime: number; // minutes before start
  
  // Policies
  CancellationPolicy: string;
  
  // Media
  VideoURL?: string;
  videoURL?: string; // Backend sometimes returns lowercase
  Photos?: Array<{url: string, caption: string, order: number}>; // JSON array of photos
  photos?: Array<{url: string, caption: string, order: number}>; // Backend sometimes returns lowercase
  
  // Status
  Status: string; // "draft", "pending", "approved", "rejected", "live"
  status?: string; // Backend sometimes returns lowercase
  IdentityVerified: boolean;
  ReviewStatus: string; // "pending", "approved", "rejected"
  ReviewNotes?: string;
  
  // Timestamps
  CreatedAt: string;
  UpdatedAt: string;
  ApprovedAt?: string;
  
  // Relationships
  Photos: ExperiencePhoto[];
  Bookings?: ExperienceBooking[];
}

export interface ExperiencePhoto {
  ID: number;
  ExperienceID: number;
  ImageURL: string;
  Caption?: string;
  Order: number;
  CreatedAt: string;
}

export interface ExperienceBooking {
  ID: number;
  ExperienceID: number;
  GuestID: number;
  Guest: {
    ID: number;
    FirstName: string;
    LastName: string;
    AvatarURL?: string;
  };
  
  // Booking Details
  BookingDate: string;
  GroupSize: number;
  TotalPrice: number;
  Discount: number;
  
  // Status
  Status: string; // "pending", "confirmed", "cancelled", "completed"
  
  // Timestamps
  CreatedAt: string;
  UpdatedAt: string;
}

// Input types for creating/updating experiences
export interface CreateExperienceInput {
  Title: string;
  City: string;
  Language: string;
  Focus: string;
  HasHostedBefore: boolean;
  HostedFor: string;
  Description: string;
  Duration: number;
  WhatWeDo: string;
  WhatToBring: string;
  BringRequired: boolean;
  MinAge: number;
  MaxAge: number;
  ActivityLevel: string;
  DifficultyLevel: string;
  GroupSize: number;
  StartTime: string;
  EndTime: string;
  PricePerPerson: number;
  GroupDiscounts: string; // JSON string
  ArrivalTime: number;
  CancellationPolicy: string;
  VideoURL?: string;
  Photos?: Array<{url: string, caption: string, order: number}>; // Photos array
}

export interface UpdateExperienceInput {
  Title?: string;
  City?: string;
  Language?: string;
  Focus?: string;
  HasHostedBefore?: boolean;
  HostedFor?: string;
  Description?: string;
  Duration?: number;
  WhatWeDo?: string;
  WhatToBring?: string;
  BringRequired?: boolean;
  MinAge?: number;
  MaxAge?: number;
  ActivityLevel?: string;
  DifficultyLevel?: string;
  GroupSize?: number;
  StartTime?: string;
  EndTime?: string;
  PricePerPerson?: number;
  GroupDiscounts?: string; // JSON string
  ArrivalTime?: number;
  CancellationPolicy?: string;
  VideoURL?: string;
}

export interface AddExperiencePhotoInput {
  ExperienceID: number;
  ImageURL: string;
  Caption?: string;
  Order: number;
}

// Experience creation steps
export interface ExperienceStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
}

export const EXPERIENCE_STEPS: ExperienceStep[] = [
  { step: 1, title: "City & Language", description: "Where will you host and in which language?", completed: false },
  { step: 2, title: "Experience Focus", description: "What will your experience focus on?", completed: false },
  { step: 3, title: "Hosting Experience", description: "Have you hosted experiences before?", completed: false },
  { step: 4, title: "Experience Description", description: "Describe your experience", completed: false },
  { step: 5, title: "What We'll Do", description: "Plan from start to finish", completed: false },
  { step: 6, title: "Duration", description: "How long is your experience?", completed: false },
  { step: 7, title: "Host Profile", description: "Show your profile to guests", completed: false },
  { step: 8, title: "What to Bring", description: "Do guests need to bring anything?", completed: false },
  { step: 9, title: "Who Can Attend", description: "Age and activity requirements", completed: false },
  { step: 10, title: "Activity Level", description: "What activity level to expect?", completed: false },
  { step: 11, title: "Difficulty Level", description: "Beginner, intermediate, advanced, or expert?", completed: false },
  { step: 12, title: "Experience Name", description: "Give your experience a name", completed: false },
  { step: 13, title: "Photos", description: "Add at least 5 photos", completed: false },
  { step: 14, title: "Group Size & Timing", description: "Group size and start/end times", completed: false },
  { step: 15, title: "Pricing", description: "Set your price in MRU", completed: false },
  { step: 16, title: "Group Discounts", description: "Discounts based on group size", completed: false },
  { step: 17, title: "Arrival Time", description: "How early should guests arrive?", completed: false },
  { step: 18, title: "Cancellation Policy", description: "Choose your cancellation policy", completed: false },
  { step: 19, title: "Video Demo", description: "Submit a video demonstration", completed: false },
  { step: 20, title: "Identity Verification", description: "Confirm your identity", completed: false },
  { step: 21, title: "Review & Submit", description: "Review and submit for approval", completed: false },
];

// Activity levels
export const ACTIVITY_LEVELS = [
  { value: "light", label: "Light", description: "Easy walking, minimal physical activity" },
  { value: "moderate", label: "Moderate", description: "Some walking, light physical activity" },
  { value: "extreme", label: "Extreme", description: "Intense physical activity, challenging terrain" },
  { value: "strenuous", label: "Strenuous", description: "Very demanding physical activity" },
];

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner", description: "No prior experience needed" },
  { value: "intermediate", label: "Intermediate", description: "Some experience helpful" },
  { value: "advanced", label: "Advanced", description: "Significant experience required" },
  { value: "expert", label: "Expert", description: "Expert level skills needed" },
];

// Cancellation policies
export const CANCELLATION_POLICIES = [
  { value: "flexible", label: "Flexible", description: "Full refund 24 hours before start" },
  { value: "moderate", label: "Moderate", description: "Full refund 5 days before start" },
  { value: "strict", label: "Strict", description: "50% refund 7 days before start" },
];

// Languages
export const LANGUAGES = [
  "Arabic", "French", "English", "Spanish", "Portuguese", "Italian", "German", "Chinese", "Japanese", "Korean"
];

// Mauritanian cities
export const MAURITANIAN_CITIES = [
  "Nouakchott", "Nouadhibou", "Kaédi", "Kiffa", "Rosso", "Atar", "Zouérat", "Boutilimit", "Aleg", "Sélibaby"
];
