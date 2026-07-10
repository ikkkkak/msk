import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { endpoints } from "../constants";
import { tokenStorage } from "../services/tokenStorage";
import { invalidateHostStudio } from "./queries/useHostStudioQuery";

export type BrokerVerificationStatus = {
  status: "none" | "pending" | "approved" | "rejected";
  broker_id?: string;
  is_verified?: boolean;
  show_profile_on_listings?: boolean;
  broker_profile_visible?: boolean;
  submitted_at?: string;
  verified_at?: string;
  rejection_notes?: string;
  spoken_languages?: string[];
  expected_views_boost_pct?: number;
  expected_inquiry_boost_pct?: number;
  estimated_monthly_leads_mru?: number;
};

export type BrokerIdDocType = "passport" | "national_id";

export type BrokerVerificationSubmit = {
  profile_photo_url: string;
  id_type: BrokerIdDocType;
  id_front_image: string;
  id_back_image?: string;
  selfie_image?: string;
  license_url?: string;
  spoken_languages: string[];
};

function authHeaders() {
  const token = tokenStorage.getAccess();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function parseStatus(data: unknown): BrokerVerificationStatus {
  const d = (data && typeof data === "object" ? data : {}) as Record<
    string,
    unknown
  >;
  const inner = (d.data && typeof d.data === "object" ? d.data : d) as Record<
    string,
    unknown
  >;
  return {
    status: (inner.status as BrokerVerificationStatus["status"]) ?? "none",
    broker_id: String(inner.broker_id ?? ""),
    is_verified: !!inner.is_verified,
    show_profile_on_listings: inner.show_profile_on_listings !== false,
    broker_profile_visible: inner.broker_profile_visible !== false,
    submitted_at: inner.submitted_at as string | undefined,
    verified_at: inner.verified_at as string | undefined,
    rejection_notes: String(inner.rejection_notes ?? ""),
    spoken_languages: Array.isArray(inner.spoken_languages)
      ? inner.spoken_languages.map(String)
      : [],
    expected_views_boost_pct: Number(inner.expected_views_boost_pct) || undefined,
    expected_inquiry_boost_pct:
      Number(inner.expected_inquiry_boost_pct) || undefined,
    estimated_monthly_leads_mru:
      Number(inner.estimated_monthly_leads_mru) || undefined,
  };
}

export function useBrokerVerificationStatus(enabled = true) {
  return useQuery({
    queryKey: ["broker-verification"],
    queryFn: async () => {
      const res = await axios.get(`${endpoints.baseURL}/user/broker-verification`, {
        headers: authHeaders(),
        timeout: 15000,
      });
      return parseStatus(res.data);
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdateBrokerProfileVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (showProfileOnListings: boolean) => {
      const res = await axios.patch(
        `${endpoints.baseURL}/user/broker-verification/settings`,
        { show_profile_on_listings: showProfileOnListings },
        { headers: authHeaders(), timeout: 15000 },
      );
      return parseStatus(res.data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["broker-verification"] });
      void invalidateHostStudio(qc);
    },
  });
}

export function useSubmitBrokerVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BrokerVerificationSubmit) => {
      const res = await axios.post(
        `${endpoints.baseURL}/user/broker-verification`,
        payload,
        { headers: authHeaders(), timeout: 120000 },
      );
      return parseStatus(res.data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["broker-verification"] });
      void invalidateHostStudio(qc);
    },
  });
}

export async function uploadBrokerImage(dataUrl: string): Promise<string> {
  const res = await axios.post(
    endpoints.uploadImage,
    { data: dataUrl },
    { headers: authHeaders(), timeout: 120000 },
  );
  const url = res.data?.url;
  if (!url) throw new Error("Upload failed");
  return url;
}

export function brokerVerificationErrorMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { error?: string; message?: string; code?: string } };
    message?: string;
  };
  const code = e.response?.data?.error ?? e.response?.data?.code;
  const map: Record<string, string> = {
    profile_required: "Please add a clear profile photo of yourself.",
    id_type_required: "Choose passport or national ID card.",
    passport_required: "Upload a clear photo of your passport.",
    id_card_required: "Upload the front and back of your national ID card.",
    id_required: "Identity document photos are required.",
    languages_required: "Select at least one language you speak with clients.",
    already_verified: "Your broker identity is already verified.",
    already_pending: "Your application is already under review.",
    invalid_payload: "Something was missing. Please check all steps.",
  };
  if (code && map[code]) return map[code];
  return (
    e.response?.data?.message ||
    e.message ||
    "Could not submit. Please try again."
  );
}
