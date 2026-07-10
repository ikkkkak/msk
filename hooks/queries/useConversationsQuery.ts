import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { endpoints, queryKeys } from "../../constants";
import { TransformedConversation } from "../../types/conversation";
import { Message } from "../../types/message";
import { getStateAbbreviation } from "../../utils/getStateAbbreviation";
import { useUser } from "../useUser";

export const fetchConversations = async (
  userID?: number,
  token?: string
): Promise<TransformedConversation[]> => {
  if (!userID) return [];

  try {
    const response = await axios.get(
      `${endpoints.getConversationsByUserID}${userID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Handle both array and object responses, and empty responses
    const conversations: ConversationsRes[] = Array.isArray(response.data)
      ? response.data
      : response.data?.conversations || response.data || [];
    const data: TransformedConversation[] = [];
    for (let i of conversations) {
      // recipientName represents the person other than curr user in the conversation
      let recipientName = "";
      let recipientAvatar: string | undefined = undefined;
      if (userID === i.tenantID)
        // could alternatively display the owner's name here
        recipientName = i.propertyName
          ? i.propertyName
          : `${i.street}, ${i.city}, ${getStateAbbreviation(i.state)}`;
      else
        recipientName =
          i.tenantFirstName && i.tenantLastName
            ? `${i.tenantFirstName} ${i.tenantLastName}`
            : i.tenantEmail;

      // choose avatar: if current user is tenant, show owner avatar; else show tenant avatar
      recipientAvatar =
        userID === i.tenantID
          ? (i as any).ownerAvatarURL
          : (i as any).tenantAvatarURL;

      data.push({
        ID: i.ID,
        propertyID: i.propertyID,
        recipientName,
        recipientAvatar,
        messages: i.messages
      });
    }

    return data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return [];
    }
    console.error("Error fetching conversations:", error);
    throw error;
  }
};

export const useConversationsQuery = () => {
  const { user } = useUser();
  const isAuthenticated = !!user?.ID && !!user?.accessToken;

  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: () => fetchConversations(user!.ID, user!.accessToken),
    enabled: isAuthenticated,
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) =>
      isAuthenticated ? previousData || [] : [],
    refetchOnMount: isAuthenticated ? "always" : false,
    refetchOnReconnect: isAuthenticated,
    retry: 1,
    retryDelay: 1000,
  });
};

type ConversationsRes = {
  ID: number;
  CreatedAt: string;
  tenantID: number;
  ownerID: number;
  propertyID: number;
  propertyName: string;
  street: string;
  city: string;
  state: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  tenantFirstName: string;
  tenantLastName: string;
  tenantEmail: string;
  messages: Message[];
};
