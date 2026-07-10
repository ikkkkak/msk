import { api } from "./api";
import { endpoints } from "../constants";

export type HostShareConsentResponse = {
  success: boolean;
  share_profile_with_hosts: boolean;
  has_decided: boolean;
  locked_host_id?: number | null;
  max_hosts_per_buyer?: number;
  max_buyers_per_property?: number;
};

export async function fetchHostShareConsent(): Promise<HostShareConsentResponse> {
  const res = await api.get(endpoints.hostShareConsent);
  return res.data;
}

export async function updateHostShareConsent(
  shareProfileWithHosts: boolean
): Promise<HostShareConsentResponse> {
  const res = await api.put(endpoints.hostShareConsent, {
    shareProfileWithHosts
  });
  return res.data;
}
