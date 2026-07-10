export interface ExperienceCollection {
  id: number;
  userID: number;
  name: string;
  description: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  experiences?: ExperienceCollectionItem[];
}

export interface ExperienceCollectionItem {
  id: number;
  collectionID: number;
  experienceID: number;
  addedAt: string;
  collection?: ExperienceCollection;
  experience?: Experience;
}

export interface CreateExperienceCollectionRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateExperienceCollectionRequest {
  name?: string;
  description?: string;
  color?: string;
}

export interface AddExperienceToCollectionRequest {
  collectionID: number;
  experienceID: number;
}

export interface RemoveExperienceFromCollectionRequest {
  collectionID: number;
  experienceID: number;
}

export interface RemoveExperienceFromAllCollectionsRequest {
  experienceID: number;
}
