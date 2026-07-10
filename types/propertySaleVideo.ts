import { PropertySale } from "./propertySale";
import { User } from "./user";

export type PropertySaleVideo = {
  ID: number;
  propertySaleID: number;
  propertySale?: PropertySale;
  userID: number;
  user?: User;
  videoURL: string;
  thumbnailURL?: string;
  hlsURL?: string;
  mobileVideoURL?: string;
  mobile_video_url?: string;
  preview_blur_url?: string;
  previewBlurURL?: string;
  processingStatus?: string;
  durationSec?: number;
  caption?: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewCount: number;
  isFlagged: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  liked?: boolean;
  saved?: boolean;
};

export type CreatePropertySaleVideoInput = {
  propertySaleID: number;
  videoURL: string;
  thumbnailURL?: string;
  durationSec?: number;
  caption?: string;
};

export type CreatePropertySaleVideoCommentInput = {
  propertySaleVideoID: number;
  content: string;
  parentID?: number;
};

export type UpdatePropertySaleVideoCommentInput = {
  content: string;
};

export type LikePropertySaleVideoCommentInput = {
  commentID: number;
};

export interface PropertySaleVideoComment {
  ID: number;
  propertySaleVideoID: number;
  userID: number;
  content: string;
  edited: boolean;
  parentID?: number;
  parent?: PropertySaleVideoComment;
  replies?: PropertySaleVideoComment[];
  likesCount: number;
  postedAt: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  isLiked?: boolean;
}
