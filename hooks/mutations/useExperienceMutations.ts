import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from '../useUser';
import { endpoints, experienceEndpoints } from '../../constants';
import { CreateExperienceInput, Experience } from '../../types/experience';

export const useCreateExperienceMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExperienceInput) => {
      const response = await axios.post(
        experienceEndpoints.create,
        data,
        {
          headers: {
            'Authorization': `Bearer ${user?.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      queryClient.invalidateQueries({ queryKey: ['userExperiences'] });
    },
  });
};

export const useUpdateExperienceMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateExperienceInput> }) => {
      const response = await axios.put(
        experienceEndpoints.update(id),
        data,
        {
          headers: {
            'Authorization': `Bearer ${user?.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      queryClient.invalidateQueries({ queryKey: ['userExperiences'] });
    },
  });
};

export const useSubmitExperienceForReviewMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.post(
        experienceEndpoints.submit(id),
        {},
        {
          headers: {
            'Authorization': `Bearer ${user?.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      queryClient.invalidateQueries({ queryKey: ['userExperiences'] });
    },
  });
};

