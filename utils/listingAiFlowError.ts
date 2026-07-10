import axios from "axios";
import { logApiError } from "./apiError";

type ValidationRow = {
  namespace?: string;
  tag?: string;
  param?: string;
  value?: string;
};

/** Turn API / axios errors into a short user message + log details to Metro. */
export function describeListingFlowError(
  scope: string,
  error: unknown,
): string {
  const parsed = logApiError(scope, error);

  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    const errors = data.errors as ValidationRow[] | undefined;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      const field = String(first.namespace || "")
        .replace(/^CreateListingInput\./, "")
        .replace(/^UpdateListingInput\./, "");
      if (first.tag === "oneof" && field) {
        const label =
          field === "PropertyType"
            ? "property type"
            : field.replace(/([A-Z])/g, " $1").trim().toLowerCase();
        return `Invalid ${label}. Please go back and fix property details, then try again.`;
      }
      if (field && first.tag) {
        return `${field}: ${first.tag}${first.param ? ` (${first.param})` : ""}`;
      }
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
    if (typeof data.detail === "string" && data.detail.trim()) {
      return data.detail.trim();
    }
  }

  if (parsed.status === 404) {
    return "Session expired — tap Try again to regenerate your listing.";
  }

  if (parsed.message && !parsed.message.startsWith("Request failed with status")) {
    return parsed.message;
  }

  return parsed.userMessage || "Something went wrong. Please try again.";
}

export function logListingFlowDebug(scope: string, detail: Record<string, unknown>) {
  console.log(`[ListingAI · ${scope}]`, detail);
}
