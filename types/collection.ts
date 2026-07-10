export type Collection = {
  ID?: number; // For backwards compatibility
  id?: number;  // Actual API response uses lowercase
  userID?: number;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  properties?: CollectionProperty[];
};

export type CollectionProperty = {
  ID: number;
  collectionID: number;
  propertyID: number;
  addedAt: string;
  collection?: Collection;
  property?: Property;
};

export type CreateCollectionInput = {
  name: string;
  description?: string;
  color?: string;
};

export type UpdateCollectionInput = {
  name?: string;
  description?: string;
  color?: string;
};

export type AddPropertyToCollectionInput = {
  collectionID: number;
  propertyID: number;
};

export type RemovePropertyFromCollectionInput = {
  collectionID: number;
  propertyID: number;
};

// Import Property type
import { Property } from './property';
