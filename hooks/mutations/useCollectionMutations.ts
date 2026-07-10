import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput,
  AddPropertyToCollectionInput,
  RemovePropertyFromCollectionInput
} from "../../types/collection";
import { endpoints } from "../../constants";
import { useUser } from "../useUser";
import axios from "axios";

export const useCreateCollectionMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (input: CreateCollectionInput) => {
      const response = await axios.post(endpoints.collections, input, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`
        }
      });
      return response.data.collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    }
  });
};

export const useUpdateCollectionMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: UpdateCollectionInput }) => {
      const response = await axios.put(
        `${endpoints.collections}/${id}`,
        input,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`
          }
        }
      );
      return response.data.collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    }
  });
};

export const useDeleteCollectionMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`${endpoints.collections}/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    }
  });
};

export const useAddPropertyToCollectionMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (input: AddPropertyToCollectionInput) => {
      const response = await axios.post(
        `${endpoints.collections}/add-property`,
        input,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["savedProperties"] });
    }
  });
};

export const useRemovePropertyFromCollectionMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (input: RemovePropertyFromCollectionInput) => {
      const response = await axios.post(
        `${endpoints.collections}/remove-property`,
        input,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["savedProperties"] });
    }
  });
};

export const useRemovePropertyFromAllCollectionsMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (propertyID: number) => {
      const response = await axios.post(
        `${endpoints.collections}/remove-from-all`,
        { propertyID },
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["savedProperties"] });
      queryClient.invalidateQueries({ queryKey: ["searchProperties"] });
    }
  });
};
