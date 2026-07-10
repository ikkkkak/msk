import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { endpoints } from "../../constants";
import { useUser } from "../useUser";

type VerificationInput = {
  idType: string;
  idNumber: string;
  idFrontImage: string;
  idBackImage: string;
  selfieImage: string;
};

export const useSubmitVerificationMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: VerificationInput) => {
      const response = await axios.post(
        `${endpoints.submitVerification}`,
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
      // Invalidate user queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  });
};
