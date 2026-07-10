import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StackActions, useNavigation } from "@react-navigation/native";

import { endpoints, queryKeys } from "../../constants";
import { CreateProperty, Property } from "../../types/property";
import { useUser } from "../useUser";
import { api } from "../../services/api";

const createProperty = (obj: CreateProperty, token?: string) =>
  axios.post<Property>(endpoints.createProperty, obj, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

export const useCreatePropertyMutation = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useNavigation();
  const { user } = useUser();

  return useMutation({
    mutationFn: (obj: CreateProperty) => createProperty(obj, user?.accessToken),
    onError() {
      alert("Unable to create property");
    },
    onSuccess(data) {
      queryClient.invalidateQueries({ queryKey: queryKeys.myProperties });

        // Track property creation interaction for host mode engagement
        if (user?.accessToken) {
          api
            .post(
              endpoints.recordHostModeInteraction,
              {
                interaction_type: "property_added",
                interaction_data: JSON.stringify({
                  property_id: data.data.ID,
                  property_type: data.data.propertyType
                })
              },
              {
                headers: { Authorization: `Bearer ${user.accessToken}` }
              }
            )
            .catch((error) => {
              console.error(
                "Failed to record property creation interaction:",
                error
              );
              // Don't block UI if this fails
            });
        }

        dispatch(StackActions.replace("MyProperties"));
      }
  });
};
