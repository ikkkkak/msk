export type User = {
  ID: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  avatarURL?: string;
  avatarUrl?: string;
  savedProperties?: number[];
  savedExperiences?: number[];
  allowsNotifications: boolean;
  pushToken?: string;
  sessionID?: string;
  accessToken: string;
  refreshToken: string;
  role?: string; // user, host, admin, super_admin
};
