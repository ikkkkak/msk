/**
 * Meskeny Agent Run — SSE streaming from POST /api/ai/agent/run
 */
import { Platform } from "react-native";
import { serverUrl } from "../constants";
import { tokenStorage } from "./tokenStorage";
import type {
  AIHistoryMessage,
  ChatMessage,
  PropertyRecommendation,
  QuickReply,
  SharedPropertyContext,
} from "./aiService";
import { generateMessageId } from "./aiService";

export type AgentStepState = "pending" | "running" | "done" | "error" | "skipped";

export type AgentStep = {
  id: string;
  label: string;
  state: AgentStepState;
  ms?: number;
  detail?: unknown;
  error?: string;
};

export type AgentVerification = {
  matchesIntent: boolean;
  confidence: number;
  assumptions: string[];
  gaps: string[];
};

export type AgentStreamMeta = {
  role: string;
  lang: string;
  rtl: boolean;
  persona: string;
};

export type AgentRunCallbacks = {
  onRunStarted?: (runId: string) => void;
  onStreamStart?: (meta: AgentStreamMeta) => void;
  onFollowUps?: (questions: string[]) => void;
  onStepsChange?: (steps: AgentStep[]) => void;
  onTextDelta?: (delta: string, fullText: string) => void;
  onVerification?: (v: AgentVerification) => void;
  onFinal?: (payload: {
    message: ChatMessage;
    sessionId?: string;
    verification?: AgentVerification;
    totalMs?: number;
  }) => void;
  onError?: (message: string) => void;
};

export type AgentRunOptions = {
  message: string;
  sessionId?: string;
  anonSessionId?: string;
  deepThink?: boolean;
  persona?: "buyer" | "broker";
  tier?: "free" | "pro" | "broker" | "anon";
  history?: AIHistoryMessage[];
  sharedProperty?: SharedPropertyContext;
  userPromptTemplate?: string;
  signal?: AbortSignal;
};

const AGENT_RUN_URL = `${serverUrl.replace(/\/+$/, "")}/ai/agent/run`;

function parseSSEChunk(
  buffer: string,
  onEvent: (data: Record<string, unknown>) => void,
): string {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const block of parts) {
    for (const line of block.split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          onEvent(JSON.parse(line.slice(6)) as Record<string, unknown>);
        } catch {
          /* ignore partial json */
        }
      }
    }
  }
  return rest;
}

function upsertStep(steps: AgentStep[], step: AgentStep): AgentStep[] {
  const i = steps.findIndex((s) => s.id === step.id);
  if (i >= 0) {
    const next = [...steps];
    next[i] = { ...next[i], ...step };
    return next;
  }
  return [...steps, step];
}

function sealRunningSteps(steps: AgentStep[]): AgentStep[] {
  return steps.map((s) =>
    s.state === "running" ? { ...s, state: "done" as const } : s,
  );
}

function finalizeSteps(steps: AgentStep[]): AgentStep[] {
  return steps.map((s) => {
    if (s.state === "done" || s.state === "error") return s;
    if (s.state === "running") return { ...s, state: "done" as const };
    return { ...s, state: "skipped" as const };
  });
}

function applyStepPlan(
  steps: AgentStep[],
  plan: { id: string; label: string }[],
): AgentStep[] {
  const byId = new Map(steps.map((s) => [s.id, s]));
  return plan.map((p) => {
    const existing = byId.get(p.id);
    return {
      id: p.id,
      label: p.label,
      state: existing?.state ?? ("pending" as const),
      ms: existing?.ms,
      detail: existing?.detail,
      error: existing?.error,
    };
  });
}

/** Human-readable agent role from stream_start.role */
export function formatAgentRole(role: string): string {
  switch (role) {
    case "PropertySearcher":
      return "Property Search";
    case "PropertyAdvisor":
      return "Property Advisor";
    case "MarketAnalyst":
      return "Market Analyst";
    default:
      return role.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
}

const DEFAULT_STEPS: AgentStep[] = [
  { id: "understand", label: "Understanding", state: "pending" },
  { id: "plan", label: "Planning", state: "pending" },
  { id: "gather", label: "Gathering data", state: "pending" },
  { id: "analyze", label: "Analyzing", state: "pending" },
  { id: "verify", label: "Verifying", state: "pending" },
  { id: "deliver", label: "Delivering", state: "pending" },
];

export async function streamAgentRun(
  opts: AgentRunOptions,
  callbacks: AgentRunCallbacks,
): Promise<boolean> {
  const token = tokenStorage.getAccess();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.tier) headers["X-Agent-Tier"] = opts.tier;
  if (opts.persona) headers["X-Agent-Persona"] = opts.persona;

  const body = JSON.stringify({
    message: opts.message,
    session_id: opts.sessionId ? Number(opts.sessionId) || null : null,
    anon_session_id: opts.anonSessionId ?? "",
    deep_think: !!opts.deepThink,
    persona: opts.persona ?? "buyer",
    tier: opts.tier ?? "free",
    history: opts.history ?? [],
    shared_property: opts.sharedProperty ?? null,
    user_prompt_template: opts.userPromptTemplate ?? "",
  });

  let steps: AgentStep[] = DEFAULT_STEPS.map((s) => ({ ...s }));
  let lastVerification: AgentVerification | undefined;
  let lastTotalMs: number | undefined;
  let lastFollowUps: string[] = [];
  let streamText = "";
  let completed = false;

  const handleEvent = (ev: Record<string, unknown>) => {
    const type = String(ev.type ?? "");
    if (type === "run_started") {
      callbacks.onRunStarted?.(String(ev.run_id ?? ""));
    }
    if (type === "stream_start") {
      callbacks.onStreamStart?.({
        role: String(ev.role ?? ""),
        lang: String(ev.lang ?? ""),
        rtl: !!ev.rtl,
        persona: String(ev.persona ?? ""),
      });
    }
    if (type === "step_plan" && Array.isArray(ev.steps)) {
      const plan = (ev.steps as { id?: string; label?: string }[])
        .filter((s) => s && typeof s.id === "string")
        .map((s) => ({
          id: String(s.id),
          label: String(s.label ?? s.id),
        }));
      if (plan.length > 0) {
        steps = applyStepPlan(steps, plan);
        callbacks.onStepsChange?.([...steps]);
      }
    }
    if (type === "step_start") {
      steps = sealRunningSteps(steps);
      const id = String(ev.step_id ?? "");
      steps = upsertStep(steps, {
        id,
        label: String(ev.label ?? id),
        state: "running",
      });
      callbacks.onStepsChange?.([...steps]);
    }
    if (type === "step_done") {
      const id = String(ev.step_id ?? "");
      steps = upsertStep(steps, {
        id,
        label: String(ev.label ?? id),
        state: "done",
        ms: typeof ev.ms === "number" ? ev.ms : undefined,
        detail: ev.detail,
      });
      callbacks.onStepsChange?.([...steps]);
    }
    if (type === "step_error") {
      const id = String(ev.step_id ?? "analyze");
      steps = upsertStep(steps, {
        id,
        label: id,
        state: "error",
        error: String(ev.error ?? "Error"),
      });
      callbacks.onStepsChange?.([...steps]);
    }
    if (type === "verification") {
      lastVerification = {
        matchesIntent: !!ev.matches_intent,
        confidence: Number(ev.confidence ?? 0),
        assumptions: Array.isArray(ev.assumptions)
          ? (ev.assumptions as string[])
          : [],
        gaps: Array.isArray(ev.gaps) ? (ev.gaps as string[]) : [],
      };
      callbacks.onVerification?.(lastVerification);
    }
    if (type === "text_delta") {
      const delta = String(ev.delta ?? "");
      if (delta) {
        streamText += delta;
        callbacks.onTextDelta?.(delta, streamText);
      }
    }
    if (type === "follow_ups" && Array.isArray(ev.follow_ups)) {
      lastFollowUps = (ev.follow_ups as string[]).filter(
        (q) => typeof q === "string" && q.trim() !== "",
      );
      if (lastFollowUps.length > 0) {
        callbacks.onFollowUps?.(lastFollowUps);
      }
    }
    if (type === "run_complete" && typeof ev.total_ms === "number") {
      lastTotalMs = ev.total_ms;
    }
    if (type === "final") {
      steps = finalizeSteps(steps);
      callbacks.onStepsChange?.([...steps]);

      const raw = ev.message as Record<string, unknown> | undefined;
      const content = String(raw?.content ?? "");
      const msg: ChatMessage = {
        id: String(raw?.id ?? generateMessageId()),
        role: "assistant",
        content,
        timestamp: Date.now(),
        quickReplies: normalizeQuickReplies(ev.quick_replies),
        propertyRecommendations: normalizeCards(ev.propertyRecommendations),
        interactionId:
          typeof ev.interaction_id === "number"
            ? ev.interaction_id
            : undefined,
      };
      if ((!msg.quickReplies || msg.quickReplies.length === 0) && lastFollowUps.length > 0) {
        msg.quickReplies = lastFollowUps.map((action, i) => ({
          id: String(i + 1),
          text: action.length > 48 ? `${action.slice(0, 45)}…` : action,
          action,
        }));
      }
      completed = true;
      callbacks.onFinal?.({
        message: msg,
        sessionId: ev.session_id ? String(ev.session_id) : undefined,
        verification: lastVerification,
        totalMs: lastTotalMs,
      });
    }
    if (type === "blocked") {
      callbacks.onError?.("Message blocked.");
    }
  };

  callbacks.onStepsChange?.(steps);

  try {
    // React Native fetch often buffers the full body — XHR streams incrementally.
    if (Platform.OS !== "web") {
      return await streamAgentRunXHR(
        AGENT_RUN_URL,
        headers,
        body,
        opts.signal,
        handleEvent,
        callbacks,
        () => completed,
      );
    }
    return await streamAgentRunFetch(
      AGENT_RUN_URL,
      headers,
      body,
      opts.signal,
      handleEvent,
      callbacks,
      () => completed,
    );
  } catch (e: unknown) {
    if ((e as { name?: string })?.name === "AbortError") return false;
    callbacks.onError?.("Connection issue");
    return false;
  }
}

async function streamAgentRunFetch(
  url: string,
  headers: Record<string, string>,
  body: string,
  signal: AbortSignal | undefined,
  handleEvent: (ev: Record<string, unknown>) => void,
  callbacks: AgentRunCallbacks,
  getCompleted: () => boolean,
): Promise<boolean> {
  const res = await fetch(url, { method: "POST", headers, body, signal });

  if (res.status === 429) {
    callbacks.onError?.("Too many agent requests. Please wait a moment.");
    return false;
  }
  if (res.status === 403) {
    callbacks.onError?.("Message blocked.");
    return false;
  }
  if (!res.ok) {
    callbacks.onError?.(`Agent error (${res.status})`);
    return false;
  }

  const reader = res.body?.getReader?.();
  if (!reader) {
    return false;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = parseSSEChunk(buffer, handleEvent);
  }
  if (buffer.trim()) {
    parseSSEChunk(buffer + "\n\n", handleEvent);
  }
  return getCompleted();
}

function streamAgentRunXHR(
  url: string,
  headers: Record<string, string>,
  body: string,
  signal: AbortSignal | undefined,
  handleEvent: (ev: Record<string, unknown>) => void,
  callbacks: AgentRunCallbacks,
  getCompleted: () => boolean,
): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    let buffer = "";
    let lastLen = 0;

    const abort = () => {
      try {
        xhr.abort();
      } catch {
        /* noop */
      }
    };
    signal?.addEventListener("abort", abort);

    xhr.open("POST", url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    xhr.onprogress = () => {
      const text = xhr.responseText ?? "";
      if (text.length <= lastLen) return;
      buffer += text.slice(lastLen);
      lastLen = text.length;
      buffer = parseSSEChunk(buffer, handleEvent);
    };

    xhr.onloadend = () => {
      signal?.removeEventListener("abort", abort);
      const tail = (xhr.responseText ?? "").slice(lastLen);
      if (tail) buffer += tail;
      if (buffer.trim()) {
        parseSSEChunk(buffer + "\n\n", handleEvent);
      }
      if (xhr.status === 429) {
        callbacks.onError?.("Too many agent requests. Please wait a moment.");
        resolve(false);
        return;
      }
      if (xhr.status === 403) {
        callbacks.onError?.("Message blocked.");
        resolve(false);
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        callbacks.onError?.(`Agent error (${xhr.status})`);
        resolve(false);
        return;
      }
      resolve(getCompleted());
    };

    xhr.onerror = () => {
      signal?.removeEventListener("abort", abort);
      callbacks.onError?.("Connection issue");
      resolve(false);
    };

    xhr.send(body);
  });
}

function normalizeQuickReplies(raw: unknown): QuickReply[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((q: any) => ({
    id: String(q.id ?? ""),
    text: String(q.text ?? ""),
    action: String(q.action ?? ""),
  }));
}

function normalizeCards(raw: unknown): PropertyRecommendation[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((c: any) => ({
    id: Number(c.id ?? c.ID ?? 0),
    title: String(c.title ?? ""),
    price: Number(c.price ?? 0),
    currency: String(c.currency ?? "MRU"),
    city: String(c.city ?? ""),
    bedrooms: Number(c.bedrooms ?? 0),
    bathrooms: Number(c.bathrooms ?? 0),
    image: String(c.image ?? ""),
    type: (c.type === "rent" ? "rent" : "sale") as "rent" | "sale",
    source: c.source,
  }));
}
