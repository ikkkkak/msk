import AsyncStorage from "@react-native-async-storage/async-storage";

export type OnboardingIntent = "rent" | "buy" | "land" | "explore";

const KEYS = {
  SEEN: "hasSeenOnboarding",
  INTENT: "onboardingIntent",
  CITY_ID: "onboardingCityId",
  ZONE_ID: "onboardingZoneId",
  QUARTIER_ID: "onboardingQuartierId",
  CITY_NAME: "onboardingCityName",
  ZONE_NAME: "onboardingZoneName",
  QUARTIER_NAME: "onboardingQuartierName",
  PROPERTY_TYPE: "onboardingPropertyType",
} as const;

export const onboardingStorage = {
  async setSeen() {
    await AsyncStorage.setItem(KEYS.SEEN, "true");
  },

  async getSeen(): Promise<boolean> {
    const v = await AsyncStorage.getItem(KEYS.SEEN);
    return v === "true";
  },

  async setPreferences(params: {
    intent: OnboardingIntent;
    cityId: number | null;
    zoneId: number | null;
    quartierId?: number | null;
    cityName?: string;
    zoneName?: string;
    quartierName?: string;
    propertyType?: string;
  }) {
    await AsyncStorage.multiSet([
      [KEYS.INTENT, params.intent],
      [KEYS.CITY_ID, params.cityId != null ? String(params.cityId) : ""],
      [KEYS.ZONE_ID, params.zoneId != null ? String(params.zoneId) : ""],
      [
        KEYS.QUARTIER_ID,
        params.quartierId != null ? String(params.quartierId) : "",
      ],
      [KEYS.CITY_NAME, params.cityName ?? ""],
      [KEYS.ZONE_NAME, params.zoneName ?? ""],
      [KEYS.QUARTIER_NAME, params.quartierName ?? ""],
      [KEYS.PROPERTY_TYPE, params.propertyType ?? ""],
    ]);
  },

  async getPreferences(): Promise<{
    intent: OnboardingIntent;
    cityId: number | null;
    zoneId: number | null;
    quartierId: number | null;
    cityName: string;
    zoneName: string;
    quartierName: string;
    propertyType: string;
  } | null> {
    const entries = await AsyncStorage.multiGet([
      KEYS.INTENT,
      KEYS.CITY_ID,
      KEYS.ZONE_ID,
      KEYS.QUARTIER_ID,
      KEYS.CITY_NAME,
      KEYS.ZONE_NAME,
      KEYS.QUARTIER_NAME,
      KEYS.PROPERTY_TYPE,
    ]);
    const intent = entries[0]?.[1] as OnboardingIntent | null;
    if (!intent) return null;
    const cid = entries[1]?.[1];
    const zid = entries[2]?.[1];
    const qid = entries[3]?.[1];
    return {
      intent,
      cityId: cid ? parseInt(String(cid), 10) : null,
      zoneId: zid ? parseInt(String(zid), 10) : null,
      quartierId: qid ? parseInt(String(qid), 10) : null,
      cityName: entries[4]?.[1] ?? "",
      zoneName: entries[5]?.[1] ?? "",
      quartierName: entries[6]?.[1] ?? "",
      propertyType: entries[7]?.[1] ?? "",
    };
  },

  async clearPreferences() {
    await AsyncStorage.multiRemove([
      KEYS.INTENT,
      KEYS.CITY_ID,
      KEYS.ZONE_ID,
      KEYS.QUARTIER_ID,
      KEYS.CITY_NAME,
      KEYS.ZONE_NAME,
      KEYS.QUARTIER_NAME,
      KEYS.PROPERTY_TYPE,
    ]);
  },
};
