/** Listing types supported by Add with AI */
export type ListingAiKind = "rent" | "sale" | "land";

export type ListingAiJobStatus = "pending" | "processing" | "completed" | "failed";

export interface ListingAiGenerateInput {
  kind: ListingAiKind;
  details: string;
  price: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  area_unit?: string;
  city_hint?: string;
  zone_hint?: string;
  quartier_hint?: string;
  latitude?: number;
  longitude?: number;
  image_urls?: string[];
  video_urls?: string[];
  land_type?: string;
  property_type?: string;
  language?: string;
  plot_number?: string;
  amenity_ids?: number[];
  amenity_names?: string[];
}

export interface ListingAiDraft {
  title: string;
  description: string;
  city_id?: number;
  city_name?: string;
  zone_id?: number;
  zone_name?: string;
  quartier_id?: number;
  quartier_name?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  area_unit?: string;
  price?: number;
  nightly_price?: number;
  property_type?: string;
  property_category_id?: number;
  year_built?: number;
  amenity_ids?: number[];
  land_type?: string;
  latitude?: number;
  longitude?: number;
  neighborhood_description?: string;
  indoor_features?: string[];
  outdoor_features?: string[];
  image_urls?: string[];
  video_urls?: string[];
  location_match_confidence?: string;
  paper_types?: string[];
  plot_number?: string;
  habitat_plot_id?: number;
}

export interface ListingAiJob {
  id: string;
  status: ListingAiJobStatus;
  progress: string;
  result?: ListingAiDraft;
  error?: string;
}
