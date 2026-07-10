import { Property } from "./property";
import { User } from "./user";

export type Video = {
  ID: number;
  propertyID?: number | null; // Nullable for promotional videos
  property?: Property;
  userID: number;
  user?: User;
  videoURL: string;
  hlsURL?: string;
  mobile_video_url?: string;
  processingStatus?: "pending" | "processing" | "ready" | "failed";
  processingError?: string;
  thumbnailURL?: string;
  durationSec?: number;
  caption?: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewCount?: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  // Promotional video fields
  isPromotional?: boolean;
  title?: string;
  description?: string;
};

export type CreateVideoInput = {
  propertyID: number;
  videoURL: string;
  thumbnailURL?: string;
  durationSec?: number;
  caption?: string;
};

export type CreateCommentInput = {
  videoID: number;
  content: string;
  parentID?: number;
};

export type UpdateCommentInput = {
  content: string;
};

export type LikeCommentInput = {
  commentID: number;
};

export interface VideoComment {
  ID: number;
  videoID: number;
  userID: number;
  content: string;
  edited: boolean;
  parentID?: number;
  parent?: VideoComment;
  replies?: VideoComment[];
  likesCount: number;
  postedAt: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  isLiked?: boolean;
}

