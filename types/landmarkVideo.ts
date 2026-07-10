/** Landmark video - compatible with VideoFeedScreen (PropertySaleVideo-like shape) */
export type LandmarkVideo = {
  ID: number;
  landmarkID: number;
  landmark?: any;
  videoURL: string;
  thumbnailURL?: string;
  caption?: string;
  title?: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewCount: number;
  liked?: boolean;
  saved?: boolean;
  organization?: { name?: string; logoURL?: string };
  CreatedAt?: string;
  UpdatedAt?: string;
};
