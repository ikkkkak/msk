/**
 * Meskeny AI Service
 *
 * Client-side service that communicates with the server for AI chat.
 * All AI processing, training, and conversation storage happens on the server.
 */

import { api, publicApi } from "./api";
import { endpoints } from "../constants";

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  isBlocked?: boolean;
  quickReplies?: QuickReply[];
  propertyRecommendations?: PropertyRecommendation[];
  interactionId?: number; // Used for thumbs up/down feedback
}

export interface PropertyRecommendation {
  id: number;
  title: string;
  price: number;
  currency: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  image: string;
  type: "rent" | "sale";
  source?: "landmark" | "property_sale" | string;
  // Optional extra fields for richer cards / maps
  size_m2?: number;
  location_label?: string;
  lat?: number;
  lng?: number;
  plot_number?: string;
  plot_corners?: { lat: number; lng: number }[];
  cadastre_linked?: boolean;
  quartier_label?: string;
  short_description?: string;
}

export interface QuickReply {
  id: string;
  text: string;
  action: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AIResponse {
  success: boolean;
  message?: ChatMessage;
  error?: string;
  blocked?: boolean;
  sessionId?: string;
  /** Anonymous session handle used to keep context when not logged in. */
  anonSessionId?: string;
  escalation?: {
    id: number;
    status: string;
    urgency: string;
    reason: string;
  };
}

// Minimal history item sent to the backend so it can
// reconstruct the conversation context for the LLM.
export interface AIHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SharedPropertyContext {
  id: number;
  title?: string;
  listing_price?: number;
  address?: string;
  city?: string;
  image?: string;
  type?: "sale" | "rent";
}

export interface SessionListResponse {
  success: boolean;
  sessions: ChatSession[];
}

// ============================================================================
// API Endpoints (Server-side)
// ============================================================================

// API paths (without baseURL - api instance already has it)
const AI_ENDPOINTS = {
  // Send message to AI - server handles Gemini API, stores in DB
  sendMessage: "/ai/chat",

  // Submit feedback (thumbs up/down, property click)
  feedback: "/ai/feedback",

  // Get chat sessions for current user
  getSessions: "/ai/sessions",

  // Get messages for a specific session
  getSession: (sessionId: string) => `/ai/sessions/${sessionId}`,

  // Create new chat session
  createSession: "/ai/sessions",

  // Delete a chat session
  deleteSession: (sessionId: string) => `/ai/sessions/${sessionId}`,

  // Get initial greeting (with quick replies)
  getGreeting: "/ai/greeting",
};

const isUnauthorized = (error: any) => error?.response?.status === 401;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Send a message to the AI and get a response
 * Server handles: Gemini API call, bad word detection, conversation storage
 */
export const sendMessageToAI = async (
  message: string,
  sessionId?: string,
  deepThink?: boolean,
  history?: AIHistoryMessage[],
  sharedProperty?: SharedPropertyContext,
  userPromptTemplate?: string,
  anonSessionId?: string,
): Promise<AIResponse> => {
  try {
    // AI calls can legitimately take longer than normal API calls.
    // Override the default 8s axios timeout for this request.
    const body = {
      message,
      session_id: sessionId ?? null,
      anon_session_id: anonSessionId ?? "",
      deep_think: !!deepThink,
      history: history ?? [],
      shared_property: sharedProperty ?? null,
      user_prompt_template: userPromptTemplate ?? "",
    };
    const cfg = {
      timeout: 1800000, // 180s for Ollama/LLM responses
    };
    let response;
    try {
      response = await api.post(AI_ENDPOINTS.sendMessage, body, cfg);
    } catch (error: any) {
      if (!isUnauthorized(error)) throw error;
      response = await publicApi.post(AI_ENDPOINTS.sendMessage, body, cfg);
    }

    const msg = response.data?.message;
    if (msg && typeof msg.interaction_id === "number") {
      msg.interactionId = msg.interaction_id;
    }
    // Backend uses snake_case: quick_replies / propertyRecommendations / interaction_id
    // Normalize to the app's camelCase fields.
    if (msg && Array.isArray((msg as any).quick_replies) && !msg.quickReplies) {
      msg.quickReplies = (msg as any).quick_replies;
    }
    if (
      msg &&
      Array.isArray((msg as any).propertyRecommendations) &&
      !msg.propertyRecommendations
    ) {
      msg.propertyRecommendations = (msg as any).propertyRecommendations;
    }
    return {
      success: true,
      message: msg,
      sessionId: response.data?.sessionId,
      anonSessionId: response.data?.anon_session_id,
      blocked: response.data?.blocked,
      escalation: response.data?.escalation,
    };
  } catch (error: any) {
    console.error("AI Service Error:", error?.response?.data || error.message);

    // Handle blocked content
    if (error?.response?.status === 403) {
      return {
        success: false,
        blocked: true,
        error:
          error?.response?.data?.message ||
          "Message blocked for inappropriate content",
      };
    }

    return {
      success: false,
      error: error?.response?.data?.message || "Failed to get AI response",
    };
  }
};

/**
 * Submit feedback for an AI message (thumbs up/down)
 */
export const submitAIFeedback = async (
  interactionId: number,
  signal: "thumbs_up" | "thumbs_down"
): Promise<boolean> => {
  console.log("[submitAIFeedback] called", { interactionId, signal });
  try {
    const res = await api.post(AI_ENDPOINTS.feedback, {
      interaction_id: interactionId,
      signal,
      value: signal === "thumbs_up" ? 1 : 0,
    });
    console.log("[submitAIFeedback] success", res.status);
    return true;
  } catch (e: any) {
    console.warn("[submitAIFeedback] failed:", e?.response?.status, e?.response?.data, e?.message);
    return false;
  }
};

/**
 * Get all chat sessions for the current user
 */
export const getChatSessions = async (): Promise<SessionListResponse> => {
  try {
    const response = await api.get(AI_ENDPOINTS.getSessions);
    return {
      success: true,
      sessions: response.data?.sessions || [],
    };
  } catch (error: any) {
    if (isUnauthorized(error)) {
      return { success: true, sessions: [] };
    }
    console.error(
      "Failed to get sessions:",
      error?.response?.data || error.message,
    );
    return {
      success: false,
      sessions: [],
    };
  }
};

/**
 * Get a specific chat session with all messages
 */
export const getChatSession = async (
  sessionId: string,
): Promise<ChatSession | null> => {
  try {
    const response = await api.get(AI_ENDPOINTS.getSession(sessionId));
    return response.data?.session || null;
  } catch (error: any) {
    console.error(
      "Failed to get session:",
      error?.response?.data || error.message,
    );
    return null;
  }
};

/**
 * Create a new chat session
 */
export const createChatSession = async (): Promise<{
  sessionId: string;
  greeting: ChatMessage;
} | null> => {
  try {
    let response;
    try {
      response = await api.post(AI_ENDPOINTS.createSession);
    } catch (error: any) {
      if (!isUnauthorized(error)) throw error;
      // Guest mode: no persisted session endpoint available.
      // Returning null lets UI fall back to greeting + anonymous /ai/chat turns.
      return null;
    }
    return {
      sessionId: response.data?.sessionId,
      greeting: response.data?.greeting,
    };
  } catch (error: any) {
    console.error(
      "Failed to create session:",
      error?.response?.data || error.message,
    );
    return null;
  }
};

/**
 * Delete a chat session
 */
export const deleteChatSession = async (
  sessionId: string,
): Promise<boolean> => {
  try {
    await api.delete(AI_ENDPOINTS.deleteSession(sessionId));
    return true;
  } catch (error: any) {
    console.error(
      "Failed to delete session:",
      error?.response?.data || error.message,
    );
    return false;
  }
};

/**
 * Get initial greeting message (for new conversations)
 * Server provides this with quick replies based on user context
 */
export const getInitialGreeting = async (): Promise<ChatMessage | null> => {
  try {
    let response;
    try {
      response = await api.get(AI_ENDPOINTS.getGreeting);
    } catch (error: any) {
      if (!isUnauthorized(error)) throw error;
      response = await publicApi.get(AI_ENDPOINTS.getGreeting);
    }
    return response.data?.greeting || null;
  } catch (error: any) {
    console.error(
      "Failed to get greeting:",
      error?.response?.data || error.message,
    );
    // Return fallback greeting
    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content:
        "Bonjour! 👋 Je suis **Meskeny AI**, votre assistant immobilier intelligent.\n\nComment puis-je vous aider aujourd'hui?",
      timestamp: Date.now(),
      quickReplies: [
        { id: "1", text: "🏠 Chercher à louer", action: "search_rent" },
        { id: "2", text: "🏷️ Chercher à acheter", action: "search_buy" },
        {
          id: "3",
          text: "📍 Explorer Nouakchott",
          action: "explore_nouakchott",
        },
        { id: "4", text: "❓ Comment ça marche?", action: "how_it_works" },
      ],
    };
  }
};

/**
 * Generate unique message ID (for optimistic updates)
 */
export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate unique session ID (for optimistic updates)
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/** Coerce DB / anon session ids to a non-empty string for API payloads. */
export function normalizeChatSessionId(...candidates: unknown[]): string {
  for (const value of candidates) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text && text !== "undefined" && text !== "null") return text;
  }
  return generateSessionId();
};

/**
 * Map quick reply action to user message
 */
export const getQuickReplyMessage = (action: string): string => {
  const trimmed = (action || "").trim();
  const budgetHigher = /^budget_higher_(\d+)$/i.exec(trimmed);
  if (budgetHigher) {
    const n = Number(budgetHigher[1]);
    if (Number.isFinite(n) && n > 0) {
      return `Increase my budget to ${formatQuickReplyMru(n)}`;
    }
  }
  const budgetLower = /^budget_lower_(\d+)$/i.exec(trimmed);
  if (budgetLower) {
    const n = Number(budgetLower[1]);
    if (Number.isFinite(n) && n > 0) {
      return `Lower my budget to ${formatQuickReplyMru(n)}`;
    }
  }

  const actionMessages: Record<string, string> = {
    search_rent: "Je cherche un logement à louer",
    search_buy: "Je cherche une propriété à acheter",
    search_apartment: "Je cherche un appartement",
    search_house: "Je cherche une maison",
    search_commercial: "Je cherche un local commercial",
    search_land: "Je cherche un terrain",
    location_nouakchott: "Je cherche à Nouakchott",
    location_nouadhibou: "Je cherche à Nouadhibou",
    explore_nouakchott: "Quels sont les meilleurs quartiers de Nouakchott?",
    how_it_works: "Comment fonctionne Meskeny AI?",
    budget_low: "Mon budget est inférieur à 100,000 MRU",
    budget_medium: "Mon budget est entre 100,000 et 300,000 MRU",
    budget_high: "Mon budget dépasse 300,000 MRU",
    purpose_rent: "Je cherche à louer",
    purpose_buy: "Je cherche à acheter",
    search_property: "Aide-moi à trouver une propriété",
    contact_support: "Je voudrais contacter le support",
    help: "Aide-moi à comprendre comment utiliser cette application",
  };

  return actionMessages[action] || action;
};

function formatQuickReplyMru(value: number): string {
  if (value >= 1_000_000 && value % 1_000_000 === 0) {
    return `${value / 1_000_000} M MRU`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} 000 MRU`;
  }
  return `${value} MRU`;
}

/** Prefer human chip label over internal action keys when sending to the AI. */
export const resolveQuickReplySendText = (reply: {
  text?: string;
  action?: string;
}): string => {
  const action = (reply.action || "").trim();
  const text = (reply.text || "").trim();
  if (/^budget_(higher|lower)_\d+$/i.test(action)) {
    return getQuickReplyMessage(action);
  }
  if (
    text &&
    (/^[a-z][a-z0-9_]*$/i.test(action) || action.startsWith("budget_"))
  ) {
    return text;
  }
  if (action.length >= 12 || /[\u0600-\u06FF]/.test(action)) {
    return action;
  }
  return text || action || getQuickReplyMessage(action);
};
