import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "host_onboarding_v1";

export type HostListingType = "sale" | "rent" | "land";

export type HostOnboardingDraft = {
  listingType: HostListingType | null;
  isAgency: boolean | null;
  assignToAgency: boolean;
  termsAccepted: boolean;
  completedAt: string | null;
};

const DEFAULT: HostOnboardingDraft = {
  listingType: null,
  isAgency: null,
  assignToAgency: false,
  termsAccepted: false,
  completedAt: null,
};

export const hostOnboardingStorage = {
  async load(): Promise<HostOnboardingDraft> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT };
      return { ...DEFAULT, ...(JSON.parse(raw) as Partial<HostOnboardingDraft>) };
    } catch {
      return { ...DEFAULT };
    }
  },

  async save(patch: Partial<HostOnboardingDraft>): Promise<HostOnboardingDraft> {
    const next = { ...(await this.load()), ...patch };
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  },
};
