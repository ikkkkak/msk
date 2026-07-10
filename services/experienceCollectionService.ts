import axios from "axios";
import { experienceCollectionEndpoints } from "../constants/experienceCollectionEndpoints";
import {
  CreateExperienceCollectionRequest,
  UpdateExperienceCollectionRequest,
  AddExperienceToCollectionRequest,
  RemoveExperienceFromCollectionRequest,
  RemoveExperienceFromAllCollectionsRequest,
} from "../types/experienceCollection";

export const experienceCollectionService = {
  createCollection: async (
    data: CreateExperienceCollectionRequest,
    accessToken: string,
  ) => {
    console.log("Creating experience collection with data:", data);
    console.log(
      "Using endpoint:",
      experienceCollectionEndpoints.createCollection(),
    );
    console.log("Access token:", accessToken ? "Present" : "Missing");

    try {
      // Test server connectivity first
      console.log("Testing server connectivity...");
      const testResponse = await axios.get(
        "http://192.168.100.15:4000/api/user/1",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000,
        },
      );
      console.log("Server connectivity test successful:", testResponse.status);
    } catch (testError) {
      console.error("Server connectivity test failed:", testError.message);
      console.error("Full error:", testError);
    }

    const response = await axios.post(
      experienceCollectionEndpoints.createCollection(),
      data,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      },
    );
    console.log("Collection creation response:", response.data);
    return response.data;
  },

  getUserCollections: async (accessToken: string) => {
    const response = await axios.get(
      experienceCollectionEndpoints.getUserCollections(),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return response.data;
  },

  updateCollection: async (
    id: number,
    data: UpdateExperienceCollectionRequest,
    accessToken: string,
  ) => {
    const response = await axios.put(
      experienceCollectionEndpoints.updateCollection(id),
      data,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return response.data;
  },

  deleteCollection: async (id: number, accessToken: string) => {
    const response = await axios.delete(
      experienceCollectionEndpoints.deleteCollection(id),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return response.data;
  },

  addExperienceToCollection: async (
    data: AddExperienceToCollectionRequest,
    accessToken: string,
  ) => {
    const response = await axios.post(
      experienceCollectionEndpoints.addExperienceToCollection(),
      data,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return response.data;
  },

  removeExperienceFromCollection: async (
    data: RemoveExperienceFromCollectionRequest,
    accessToken: string,
  ) => {
    const response = await axios.post(
      experienceCollectionEndpoints.removeExperienceFromCollection(),
      data,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return response.data;
  },

  removeExperienceFromAllCollections: async (
    data: RemoveExperienceFromAllCollectionsRequest,
    accessToken: string,
  ) => {
    const response = await axios.post(
      experienceCollectionEndpoints.removeExperienceFromAllCollections(),
      data,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return response.data;
  },

  getCollectionExperiences: async (id: number, accessToken: string) => {
    const response = await axios.get(
      experienceCollectionEndpoints.getCollectionExperiences(id),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return response.data;
  },

  getUserSavedExperiences: async (accessToken: string) => {
    const response = await axios.get(
      experienceCollectionEndpoints.getUserSavedExperiences(),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return response.data;
  },
};
