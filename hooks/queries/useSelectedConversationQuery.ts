import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { MessageType } from "@flyerhq/react-native-chat-ui";

import { endpoints, queryKeys } from "../../constants";
import { Message } from "../../types/message";
import { useUser } from "../useUser";
import { getStateAbbreviation } from "../../utils/getStateAbbreviation";
import { SelectedConversation } from "../../types/conversation";

const fetchConversation = async (
  conversationID: number,
  userID?: number,
  token?: string
): Promise<SelectedConversation> => {
  const response = await axios.get(
    `${endpoints.getConversationByID}${conversationID}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data: ConversationRes = response.data;
  const tenantAuthor = {
    id: data.tenantID.toString(),
    firstName: data.tenantFirstName ? data.tenantFirstName : data.tenantEmail,
    lastName:
      data.tenantFirstName && data.tenantLastName ? data.tenantLastName : ""
  };

  const ownerAuthor = {
    id: data.ownerID.toString(),
    firstName: data.propertyName
      ? data.propertyName
      : `${data.street}, ${data.city}, ${getStateAbbreviation(data.state)}`,
    lastName: ""
  };

  const messages: MessageType.Any[] = [];
  for (let m of data.messages) {
    if ((m as any).Type === "property_card") {
      messages.push({
        id: m.ID.toString(),
        author:
          m.senderID.toString() === ownerAuthor.id ? ownerAuthor : tenantAuthor,
        createdAt: new Date(m.CreatedAt).getTime(),
        type: "text",
        text: ""
        // Keep raw for UI to render custom card in DirectMessage screen
      } as any);
      continue;
    }
    const message: MessageType.Any = {
      id: m.ID.toString(),
      author:
        m.senderID.toString() === ownerAuthor.id ? ownerAuthor : tenantAuthor,
      createdAt: new Date(m.CreatedAt).getTime(),
      text: m.text,
      type: "text"
    };
    messages.push(message);
  }

  const conversation: SelectedConversation = {
    ID: data.ID,
    receiverID: userID === data.ownerID ? data.tenantID : data.ownerID,
    messages,
    author: userID === data.ownerID ? ownerAuthor : tenantAuthor
  };

  return conversation;
};

export const useSelectedConversationQuery = (conversationID: number) => {
  const { user } = useUser();

  return useQuery({
    queryKey: [...queryKeys.selectedConversation, conversationID],
    queryFn: () => fetchConversation(conversationID, user?.ID, user?.accessToken),
    enabled: conversationID > 0 && !!user?.accessToken,
    staleTime: 0,
    refetchOnMount: "always",
  });
};

type ConversationRes = {
  ID: number;
  CreatedAt: string;
  tenantID: number;
  ownerID: number;
  propertyID: number;
  propertyName?: string;
  street: string;
  city: string;
  state: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  tenantFirstName?: string;
  tenantLastName?: string;
  tenantEmail: string;
  messages: Message[];
};
