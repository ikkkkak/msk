import { endpoints } from '../constants';

const BASE_URL = `${endpoints.baseURL}/experience-collection`;

export const experienceCollectionEndpoints = {
  // Collection management
  createCollection: () => `${BASE_URL}/`,
  getUserCollections: () => `${BASE_URL}/`,
  updateCollection: (id: number) => `${BASE_URL}/${id}`,
  deleteCollection: (id: number) => `${BASE_URL}/${id}`,
  
  // Experience management
  addExperienceToCollection: () => `${BASE_URL}/add-experience`,
  removeExperienceFromCollection: () => `${BASE_URL}/remove-experience`,
  removeExperienceFromAllCollections: () => `${BASE_URL}/remove-from-all`,
  getCollectionExperiences: (id: number) => `${BASE_URL}/${id}/experiences`,
  getUserSavedExperiences: () => `${BASE_URL}/saved`,
};
