import { Dimensions, Platform, StatusBar } from "react-native";

/** Match `expo.splash.backgroundColor` in app.json — prevents flash between native splash and JS UI */
export const SPLASH_BACKGROUND_COLOR = "#FAEFE9";

export const LISTMARGIN = 10;
export const WIDTH = Dimensions.get("screen").width - LISTMARGIN * 2;
export const PHOTOS_STR = "photos";
export const AMENITIES_STR = "amenities";
export const DESCRIPTION_STR = "description";

const baseHeight = 160;
const iosNotch = 40;
const iosHeight = baseHeight + iosNotch;
let androidHeight = baseHeight;
let androidNotch = 0;
if (StatusBar.currentHeight) androidNotch = StatusBar.currentHeight;
androidHeight += androidNotch;
export const HEADERHEIGHT = Platform.OS === "ios" ? iosHeight : androidHeight;

// IMPORTANT: Local development must use LAN IP (not Cloud Run), otherwise
// host suggestions and other in-progress routes can point to stale deployments.

const LOCAL_DEV_SERVER_URL = "https://api.meskeny.com/api";
const PROD_SERVER_URL = "https://api.meskeny.com/api";
export const serverUrl = __DEV__ ? LOCAL_DEV_SERVER_URL : PROD_SERVER_URL;

/** System account for official Meskeny Team admin messages (matches server MESKENY_TEAM_USER_ID). */
export const MESKENY_TEAM_USER_ID = 30;

/** Host root for /health (not under /api). */
export const apiOrigin = serverUrl.replace(/\/api\/?$/, "");
/** Ping before auth flows to detect unreachable dev server. */
export const healthUrl = `${apiOrigin}/health`;
const chatUrl = "https://apartmentsclone.tk";

// LibreTranslate endpoint for automatic translations
// Use the same network IP as the server, change port to your LibreTranslate port
// Default LibreTranslate port is 5000
// export const LIBRETRANSLATE_URL = "https://librerender.onrender.com/translate";
// const serverUrl = "http://192.168.30.24:4000/api";
// const chatUrl = "http://192.168.30.24:3000";

const location = "/location";
const user = "/user";
const property = "/property";
const apartment = "/apartment";
const review = "/review";
const conversation = "/conversation";
const messages = "/messages";
const notifications = "/notifications";
const collection = "/collection";
const experience = "/experience";
const refresh = "/refresh";
const availability = "/availability";
const organization = "/organization";
const refreshTokenEndpoint = serverUrl + refresh;
const locationEndpoint = serverUrl + location;
const userEndpoint = serverUrl + user;
const propertyEndpoint = serverUrl + property;
const apartmentEndpoint = serverUrl + apartment;
const reviewEndpoint = serverUrl + review;
const conversationEndpoint = serverUrl + conversation;
const messagesEndpoint = serverUrl + messages;
const notificationsEndpoint = serverUrl + notifications;
const collectionEndpoint = serverUrl + collection;
const experienceEndpoint = serverUrl + experience;
const availabilityEndpoint = serverUrl + availability;
const organizationEndpoint = serverUrl + organization;
const contactedEndpoint = (id: number) =>
  `${userEndpoint}/${id}/properties/contacted`;
const savedEndpoint = (id: number) => `${userEndpoint}/${id}/properties/saved`;
const pushTokenEndpoint = (id: number) => `${userEndpoint}/${id}/pushtoken`;
const allowsNotificationsEndpoint = (id: number) =>
  `${userEndpoint}/${id}/settings/notifications`;
const profileStatusEndpoint = () => `${userEndpoint}/profile/status`;
const userProfileEndpoint = () => `${userEndpoint}/profile`;

/** Query param for GET /property-sales/public — omits heavy columns + caps list media (backend). */
export const PROPERTY_SALE_FEED_FIELDS_CARD = "card";
/** Default page size for property sale infinite feed (3G-friendly). */
export const PROPERTY_SALE_FEED_PAGE_LIMIT = 8;

/** Optional OpenRouteService API key for in-app driving route preview on landmark map. */
export const OPENROUTESERVICE_API_KEY =
  typeof process !== "undefined" &&
  process.env?.EXPO_PUBLIC_OPENROUTESERVICE_API_KEY
    ? String(process.env.EXPO_PUBLIC_OPENROUTESERVICE_API_KEY).trim()
    : "";

export const endpoints = {
  baseURL: serverUrl,
  chat: chatUrl,
  uploadImage: serverUrl + "/upload/image",
  uploadImageLegacy: serverUrl + "/upload-image",
  uploadVideo: serverUrl + "/upload/video",
  listingAiJobs: serverUrl + "/listing-ai/jobs",
  listingAiJob: (jobId: string) => `${serverUrl}/listing-ai/jobs/${jobId}`,
  propertySales: serverUrl + "/property-sales",
  // POST must not use a trailing slash — Iris 307 redirect drops the JSON body on mobile.
  propertySalesRoot: serverUrl + "/property-sales",
  propertySalesPublic: serverUrl + "/property-sales/public",
  landmarksRoot: serverUrl + "/landmarks",
  nearby: serverUrl + "/nearby",
  bootstrap: serverUrl + "/bootstrap",
  batchPropertySales: serverUrl + "/batch/property-sales",
  syncMutations: serverUrl + "/sync/mutations",
  whatsappShareEvents: serverUrl + "/whatsapp-share/events",
  autoComplete: locationEndpoint + "/autocomplete",
  search: locationEndpoint + "/search",
  checkUserExists: userEndpoint + "/check-exists",
  register: userEndpoint + "/register",
  login: userEndpoint + "/login",
  registerPhone: userEndpoint + "/register-phone",
  loginPhone: userEndpoint + "/login-phone",
  facebook: userEndpoint + "/facebook",
  facebookCode: userEndpoint + "/facebook/code",
  google: userEndpoint + "/google",
  apple: userEndpoint + "/apple",
  forgotPassword: userEndpoint + "/forgotpassword",
  resetPassword: userEndpoint + "/resetpassword",
  createProperty: propertyEndpoint,
  getPropertyByID: propertyEndpoint + "/",
  getContactedPropertiesByUserID: contactedEndpoint,
  getPropertiesByUserID: propertyEndpoint + "/userid/",
  getHostPropertiesByPropertyID: (propertyId: number, excludeId?: number) =>
    `${propertyEndpoint}/host-properties/${propertyId}${
      excludeId ? `?exclude=${excludeId}` : ""
    }`,
  getPropertiesByBoundingBox: propertyEndpoint + "/search",
  deleteProperty: propertyEndpoint + "/",
  updateProperty: propertyEndpoint + "/update/",
  getApartmentsByPropertyID: apartmentEndpoint + "/property/",
  updateApartments: apartmentEndpoint + "/property/",
  createReview: (propertyId: number) =>
    reviewEndpoint + "/property/" + propertyId,
  getPropertyReviews: (propertyId: number) =>
    reviewEndpoint + "/property/" + propertyId,
  getSavedPropertiesByUserID: savedEndpoint,
  alterSavedPropertiesByUserID: savedEndpoint,
  alterPushToken: pushTokenEndpoint,
  recordHostModeSwitch: userEndpoint + "/host-mode/switch",
  recordHostModeInteraction: userEndpoint + "/host-mode/interaction",
  hostShareConsent: userEndpoint + "/host-share-consent",
  allowsNotifications: allowsNotificationsEndpoint,
  createConversation: conversationEndpoint,
  getConversationByID: conversationEndpoint + "/",
  getConversationsByUserID: conversationEndpoint + "/user/",
  createMessage: messagesEndpoint,
  refreshTokens: refreshTokenEndpoint,
  tokenRefresh: serverUrl + "/token/refresh",
  submitVerification: userEndpoint + "/verification",
  notifications: notificationsEndpoint,
  markNotificationRead: (id: number) => `${notificationsEndpoint}/${id}/read`,
  markAllNotificationsRead: notificationsEndpoint + "/read-all",
  guideFeed: serverUrl + "/host/guide/feed",
  guideListingPreviews: (ids: number[]) =>
    `${serverUrl}/host/guide/listing-previews?ids=${ids.join(",")}`,
  guideGrouped: serverUrl + "/host/guide/grouped",
  guideUnreadCount: serverUrl + "/host/guide/unread-count",
  guideListingComments: (propertySaleId: number) =>
    `${serverUrl}/host/guide/listings/${propertySaleId}/comments`,
  guideImplement: (commentId: number) =>
    `${serverUrl}/host/guide/comments/${commentId}/implement`,
  guideDismiss: (commentId: number) =>
    `${serverUrl}/host/guide/comments/${commentId}/dismiss`,
  guideReply: (commentId: number) =>
    `${serverUrl}/host/guide/comments/${commentId}/reply`,
  guideComment: (commentId: number) =>
    `${serverUrl}/host/guide/comments/${commentId}`,
  updateUserProfile: (id: number) => `${userEndpoint}/${id}/profile`,
  getUser: (id: number) => `${userEndpoint}/${id}`,
  profileStatus: profileStatusEndpoint,
  userProfile: userProfileEndpoint,
  deleteAccount: userEndpoint + "/account",
  collections: collectionEndpoint,
  collectionProperties: (id: number) =>
    `${collectionEndpoint}/${id}/properties`,
  experiences: experienceEndpoint,
  experienceDetails: (id: number) => `${experienceEndpoint}/${id}`,
  publicExperiences: (page: number = 1, limit: number = 10, city?: string) =>
    `${experienceEndpoint}/public?page=${page}&limit=${limit}${
      city ? `&city=${city}` : ""
    }`,
  // Availability endpoints
  availability: availabilityEndpoint,
  propertyAvailability: (propertyID: number) =>
    `${availabilityEndpoint}/property/${propertyID}`,
  propertyPricing: (propertyID: number) =>
    `${availabilityEndpoint}/pricing/${propertyID}`,
  propertyDiscounts: (propertyID: number) =>
    `${availabilityEndpoint}/discounts/${propertyID}`,
  propertyBlocks: (propertyID: number) =>
    `${availabilityEndpoint}/blocks/${propertyID}`,
  // Organization endpoints
  organization: organizationEndpoint,
  // User endpoints
  user: userEndpoint,
  // Crash logs endpoints
  crashLogs: serverUrl + "/crash-logs",
  adminCrashLogs: serverUrl + "/admin/crash-logs",
};

export const queryKeys = {
  contactedProperties: ["contactedProperties"],
  searchProperties: ["searchProperties"],
  selectedProperty: ["selectedProperty"],
  savedProperties: ["savedProperties"],
  myProperties: ["myProperties"],
  editProperty: ["editProperty"],
  apartments: ["apartments"],
  conversations: ["conversations"],
  selectedConversation: ["selectedConversation"],
  featuredProperties: ["featuredProperties"],
  collections: ["collections"],
  experiences: ["experiences"],
  experienceDetails: (id: number) => ["experienceDetails", id],
  publicExperiences: (page: number = 1, city?: string) => [
    "publicExperiences",
    page,
    city,
  ],
  videoFeed: (page: number = 1) => ["videoFeed", page],
  videoComments: (videoID: number) => ["videoComments", videoID],
  propertySaleVideoFeed: (page: number = 1) => ["propertySaleVideoFeed", page],
  propertySaleVideoComments: (videoID: number) => [
    "propertySaleVideoComments",
    videoID,
  ],
};

// Enhanced video filtering types for TikTok-quality experience
export interface VideoFilters {
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  sort?:
    | "recent"
    | "most_liked"
    | "most_commented"
    | "most_viewed"
    | "most_saved"
    | "price_low"
    | "price_high"
    | "rating"
    | "bedrooms"
    | "bathrooms";
  sortOrder?: "ASC" | "DESC";
}
// ADD TRANSALTIONS PELASE TO THESE TEH LABEL ONLY
// TikTok-style filter options
// NOTE: Do NOT use hooks like useTranslation in constants files! Instead, use translation keys as the label, and translate them at the component level.

export const VIDEO_FILTER_OPTIONS = [
  { key: "recent", label: "videoFilter.mostRecent", icon: "schedule" },
  { key: "most_liked", label: "videoFilter.mostLiked", icon: "favorite" },
  {
    key: "most_commented",
    label: "videoFilter.mostCommented",
    icon: "comment",
  },
  { key: "most_viewed", label: "videoFilter.mostViewed", icon: "visibility" },
  { key: "most_saved", label: "videoFilter.mostSaved", icon: "bookmark" },
  {
    key: "price_low",
    label: "videoFilter.priceLowToHigh",
    icon: "trending-up",
  },
  {
    key: "price_high",
    label: "videoFilter.priceHighToLow",
    icon: "trending-down",
  },
  { key: "rating", label: "videoFilter.highestRated", icon: "star" },
  { key: "bedrooms", label: "videoFilter.mostBedrooms", icon: "bed" },
  { key: "bathrooms", label: "videoFilter.mostBathrooms", icon: "bathtub" },
] as const;

// Property type options
export const PROPERTY_TYPE_OPTIONS = [
  { key: "apartment", label: "propertyType.apartment" },
  { key: "house", label: "propertyType.house" },
  { key: "condo", label: "propertyType.condo" },
  { key: "studio", label: "propertyType.studio" },
  { key: "private_room", label: "propertyType.privateRoom" },
  { key: "shared_room", label: "propertyType.sharedRoom" },
] as const;

// Video endpoints
const video = "/video";
const videoEndpoint = serverUrl + video;

export const videoEndpoints = {
  streamingStatus: (videoId: number) => `${videoEndpoint}/${videoId}/streaming`,
  streamingEvents: (videoId: number) =>
    `${videoEndpoint}/${videoId}/streaming/events`,
  recordView: (videoID: number) => `/video/${videoID}/view`,
  getViewers: (videoID: number) => `/video/${videoID}/viewers`,
  getUnseenVideos: `/video/unseen`,
  markAllViewed: `/video/mark-all-viewed`,
  getTotalCount: `/video/count`,
  create: videoEndpoint,
  feed: (page: number = 1, limit: number = 10, filters?: VideoFilters) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      if (filters.city) params.append("city", filters.city);
      if (filters.propertyType)
        params.append("propertyType", filters.propertyType);
      if (filters.minPrice)
        params.append("minPrice", filters.minPrice.toString());
      if (filters.maxPrice)
        params.append("maxPrice", filters.maxPrice.toString());
      if (filters.minBedrooms)
        params.append("minBedrooms", filters.minBedrooms.toString());
      if (filters.maxBedrooms)
        params.append("maxBedrooms", filters.maxBedrooms.toString());
      if (filters.minBathrooms)
        params.append("minBathrooms", filters.minBathrooms.toString());
      if (filters.maxBathrooms)
        params.append("maxBathrooms", filters.maxBathrooms.toString());
      if (filters.sort) params.append("sort", filters.sort);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    }

    return `${videoEndpoint}/feed?${params.toString()}`;
  },
  like: `${videoEndpoint}/like`,
  unlike: `${videoEndpoint}/unlike`,
  save: `${videoEndpoint}/save`,
  unsave: `${videoEndpoint}/unsave`,
  comment: `${videoEndpoint}/comment`,
  getComments: (videoID: number) => `${videoEndpoint}/comment/${videoID}`,
  updateComment: (id: number) => `${videoEndpoint}/comment/${id}`,
  deleteComment: (id: number) => `${videoEndpoint}/comment/${id}`,
  likeComment: `${videoEndpoint}/comment/like`,
  unlikeComment: `${videoEndpoint}/comment/unlike`,
  deleteVideo: (id: number) => `${videoEndpoint}/${id}`,
  liked: `${videoEndpoint}/liked`,
  saved: `${videoEndpoint}/saved`,
};

// Cloudinary (replace with your values or move to secure config)
export const CLOUDINARY_CLOUD_NAME = "drozmoh2m";
export const CLOUDINARY_UPLOAD_PRESET = "unsigned-preset"; // unsigned preset

export const cloudinary = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  uploadPreset: CLOUDINARY_UPLOAD_PRESET,
  uploadUrl: (resource: "image" | "video" | "auto" = "auto") =>
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resource}/upload`,
};

// Experience endpoints
export const experienceEndpoints = {
  create: experienceEndpoint,
  getUserExperiences: experienceEndpoint,
  update: (id: number) => `${experienceEndpoint}/${id}`,
  submit: (id: number) => `${experienceEndpoint}/${id}/submit`,
  details: (id: number) => `${experienceEndpoint}/${id}`,
  public: (page: number = 1, limit: number = 10, city?: string) =>
    `${experienceEndpoint}/public?page=${page}&limit=${limit}${
      city ? `&city=${city}` : ""
    }`,
};

// Experience Invites endpoints
export const experienceInviteEndpoints = {
  createInvites: (experienceId: number) =>
    `/experience/${experienceId}/invites`,
  listInvites: () => `/invites`,
  acceptInvite: (inviteId: number) => `/invites/${inviteId}/accept`,
  declineInvite: (inviteId: number) => `/invites/${inviteId}/decline`,
  cancelInvite: (inviteId: number) => `/invites/${inviteId}/cancel`,
  listParticipants: (experienceId: number) =>
    `/experience/${experienceId}/participants`,
};

// Groups endpoints
export const groupEndpoints = {
  createOrOpen: (experienceId: number) => `/experience/${experienceId}/groups`,
  myGroups: () => `/groups/mine`,
  members: (groupId: number) => `/groups/${groupId}/members`,
  updateMemberRole: (groupId: number, memberId: number) =>
    `/groups/${groupId}/members/${memberId}/role`,
  removeMember: (groupId: number, memberId: number) =>
    `/groups/${groupId}/members/${memberId}/remove`,
  leave: (groupId: number) => `/groups/${groupId}/leave`,
  finalize: (groupId: number) => `/groups/${groupId}/finalize`,
  update: (groupId: number) => `/groups/${groupId}`,
  delete: (groupId: number) => `/groups/${groupId}`,
  listMessages: (groupId: number) => `/groups/${groupId}/messages`,
  sendMessage: (groupId: number) => `/groups/${groupId}/messages`,
  typing: (groupId: number) => `/groups/${groupId}/typing`,
  // Invite system
  generateInviteCode: (groupId: number) => `/groups/${groupId}/invite-code`,
  getGroupByInviteCode: (code: string) => `/groups/invite/${code}`,
  joinWithCode: () => `/groups/invite/join`,

  // Wishlist
  wishlist: (groupId: number) => `/groups/${groupId}/wishlist`,
  wishlistLike: (groupId: number, wishlistId: number) =>
    `/groups/${groupId}/wishlist/${wishlistId}/like`,
  shareProperty: (groupId: number) => `/groups/${groupId}/share/property`,
  // Discovery
  discoverGroups: () => `/groups/discover`,
  requestJoinGroup: () => `/groups/request-join`,
  myJoinRequests: () => `/groups/my-requests`,
  groupJoinRequests: (groupId: number) => `/groups/${groupId}/requests`,
  respondToJoinRequest: (requestId: number) =>
    `/groups/requests/${requestId}/respond`,
  // Group quit and blocking functionality
  quitGroup: (groupId: number) => `/groups/${groupId}/quit`,
  blockUserInGroup: (groupId: number, userId: number) =>
    `/groups/${groupId}/block/${userId}`,
  unblockUserInGroup: (groupId: number, userId: number) =>
    `/groups/${groupId}/unblock/${userId}`,
  getGroupQuitHistory: (groupId: number) => `/groups/${groupId}/quit-history`,
  getBlockedUsersInGroup: (groupId: number) =>
    `/groups/${groupId}/blocked-users`,
  getLastMessage: (groupId: number) => `/groups/${groupId}/last-message`,
  markAsRead: (groupId: number) => `/groups/${groupId}/mark-read`,
};

export const directMessageEndpoints = {
  sendMessage: () => `/direct-messages`,
  listConversations: () => `/direct-messages`,
  getMessages: (userId: number) => `/direct-messages/${userId}`,
  markAsRead: (messageId: number) => `/direct-messages/${messageId}/read`,
  markThreadRead: (otherUserId: number) =>
    `/direct-messages/with/${otherUserId}/read`,
  addReaction: (messageId: number) => `/direct-messages/${messageId}/reactions`,
  removeReaction: (messageId: number) =>
    `/direct-messages/${messageId}/reactions`,
};

export const userBlockEndpoints = {
  blockUser: (userId: number) => `/user-blocks/${userId}`,
  unblockUser: (userId: number) => `/user-blocks/${userId}`,
  getBlockedUsers: () => `/user-blocks`,
};

export const availabilityEndpoints = {
  listAvailability: (experienceId: number) =>
    `/experience/${experienceId}/availability`,
  setAvailability: (experienceId: number) =>
    `/experience/${experienceId}/availability`,
};

export const experienceBookingEndpoints = {
  createBooking: `${experienceEndpoint}/book`,
  getUserBookings: `${experienceEndpoint}/bookings`,
  cancelBooking: (bookingId: number) =>
    `${experienceEndpoint}/bookings/${bookingId}`,
};

export const userEndpoints = {
  search: (q: string, limit: number = 20) =>
    `${serverUrl}/user/search?q=${encodeURIComponent(q)}&limit=${limit}`,
};
