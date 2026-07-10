import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
  Alert
} from "react-native";
import { Text } from "@ui-kitten/components";
import { pickVideoNative } from "../utils/nativePhotoPicker";
import * as VideoThumbnails from "expo-video-thumbnails";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import Toast from "../components/CustomToast";
import { uploadRentVideoPipeline } from "../services/videoUploadPipeline";
import type { VideoUploadProgress } from "../services/videoUploadPipeline";
import { useUser } from "../hooks/useUser";
import { useMyPropertiesQuery } from "../hooks/queries/useMyPropertiesQuery";
import { Property } from "../types/property";
import { endpoints } from "../constants";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { theme } from "../theme";

const { width } = Dimensions.get("window");

export const VideoUploadScreen = ({
  route,
}: {
  route?: { params?: { propertyID?: number } };
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { data: properties = [], isLoading: isLoadingProps } =
    (useMyPropertiesQuery?.() as { data: Property[]; isLoading: boolean }) ||
    ({ data: [], isLoading: false } as any);

  const presetPropertyId = route?.params?.propertyID ?? null;
  const [selectedPropertyID, setSelectedPropertyID] = useState<number | null>(
    presetPropertyId,
  );
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadPhase, setUploadPhase] = useState<VideoUploadProgress["phase"]>("idle");
  const [isUploading, setIsUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [selectedMime, setSelectedMime] = useState<string>("video/mp4");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const navigation = useNavigation();

  const MAX_VIDEO_DURATION = 5 * 60; // 5 minutes in seconds

  const pickVideo = async () => {
    try {
      // Use native picker - no permissions needed
      const res = await pickVideoNative({
        quality: 1,
        allowsEditing: true
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];

        // Convert duration to seconds if it's in milliseconds (duration > 10000 likely means milliseconds)
        let durationInSeconds: number | null = null;
        if (asset.duration) {
          // If duration is suspiciously large (> 10000), it's probably in milliseconds
          if (asset.duration > 10000) {
            durationInSeconds = asset.duration / 1000;
            console.log(
              `🎥 Video selected! Raw duration: ${
                asset.duration
              }ms, converted to: ${durationInSeconds.toFixed(2)}s ⏱️`
            );
          } else {
            durationInSeconds = asset.duration;
            console.log(
              `🎥 Video selected! Duration: ${durationInSeconds}s ⏱️`
            );
          }

          // Log formatted duration
          const minutes = Math.floor(durationInSeconds / 60);
          const seconds = Math.floor(durationInSeconds % 60);
          console.log(
            `📹 Video duration: ${minutes}:${
              seconds < 10 ? "0" : ""
            }${seconds} (${durationInSeconds.toFixed(2)} seconds)`
          );
        } else {
          console.log(`🎥 Video selected! Duration: unknown ⚠️`);
        }

        // Validate video duration (5 minutes max)
        if (durationInSeconds && durationInSeconds > MAX_VIDEO_DURATION) {
          setToast({
            message:
              t("videoUpload.videoTooLong") ||
              "Please upload a video less than 5 minutes or 5 minutes",
            type: "error"
          });
          return;
        }

        setLocalUri(asset.uri);
        setDurationSec(durationInSeconds);
        setSelectedMime(asset.mimeType || "video/mp4");

        // Get file size
        try {
          const fileInfo = await getFileInfo(asset.uri);
          if (fileInfo?.exists && fileInfo.size) {
            setFileSize(fileInfo.size);
          }
        } catch {
          setFileSize(null);
        }

        // Generate thumbnail - use first frame for short videos
        try {
          const thumbnailTime =
            durationInSeconds && durationInSeconds < 5 ? 100 : 500; // 100ms for videos < 5s, 500ms for longer
          const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(
            asset.uri,
            {
              time: thumbnailTime,
              quality: 0.8
            }
          );
          setPreviewThumb(thumb);
        } catch (error) {
          console.error(
            "[VideoUploadScreen] Error generating thumbnail:",
            error
          );
          setPreviewThumb(null);
        }
      }
    } catch (error) {
      console.error("[VideoUploadScreen] Error picking video", error);
      setToast({
        message:
          t("videoUpload.errorPickingVideo") ||
          "Failed to pick video. Please try again.",
        type: "error"
      });
    }
  };

  const getFileInfo = async (uri: string) => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info;
    } catch (err) {
      console.error("[VideoUploadScreen] Failed to get file info", err);
      return null;
    }
  };

  const onUpload = async () => {
    if (isUploading) return;
    if (!selectedPropertyID || !localUri) return;
    setIsUploading(true);
    try {
      let thumbUri = previewThumb;
      if (!thumbUri) {
        try {
          const thumbnailTime = durationSec && durationSec < 5 ? 100 : 500;
          const { uri } = await VideoThumbnails.getThumbnailAsync(localUri, {
            time: thumbnailTime,
            quality: 0.8,
          });
          thumbUri = uri;
        } catch {
          /* optional */
        }
      }
      await uploadRentVideoPipeline(
        {
          localVideoUri: localUri,
          mime: selectedMime,
          propertyID: selectedPropertyID,
          durationSec: durationSec || undefined,
          thumbnailUri: thumbUri || undefined,
          waitForHls: false,
        },
        {
          accessToken: user!.accessToken,
          onProgress: (p) => {
            setUploadProgress(p.percent);
            setUploadPhase(p.phase);
          },
        },
      );
      queryClient.invalidateQueries({ queryKey: ["my-videos"] });
      void import("../hooks/queries/useHostStudioQuery").then((m) =>
        m.invalidateHostStudio(queryClient),
      );
      queryClient.invalidateQueries({ queryKey: ["cursorVideoFeed"] });
      setLocalUri(null);
      setPreviewThumb(null);
      setDurationSec(null);
      setFileSize(null);
      setUploadProgress(0);

      setToast({
        message:
          t("videoUpload.uploadedOptimizingInBackground") ||
          "Video uploaded! We're optimizing it for the feed — you can leave this screen.",
        type: "success"
      });
    } catch (e) {
      // Show a lightweight alert since we are not mounting a toast here
      console.error("[VideoUploadScreen] Upload failed", e);
      const message = e instanceof Error ? e.message : "Something went wrong";
      try {
        (Alert as any).alert?.(t("common.error") || "Error", message);
      } catch {}
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderProperty = ({ item }: { item: Property }) => {
    const isSelected = selectedPropertyID === item.ID;
    const img =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images[0]
        : undefined;

    return (
      <TouchableOpacity
        style={[styles.propertyCard, isSelected && styles.propertyCardSelected]}
        onPress={() => setSelectedPropertyID(item.ID)}
        activeOpacity={0.7}
      >
        <View style={styles.propertyImageContainer}>
          {img ? (
            <Image source={{ uri: img }} style={styles.propertyImage} />
          ) : (
            <View style={styles.propertyImagePlaceholder}>
              <Ionicons name="home-outline" size={20} color="#717171" />
            </View>
          )}

          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme["color-temporary-primary"]}
              />
            </View>
          )}
        </View>

        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.propertyLocation} numberOfLines={1}>
            {item.city}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Compact Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (typeof navigation !== "undefined" && navigation?.goBack) {
              navigation.goBack();
            }
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("videoUpload.addVideo")}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Property Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("videoUpload.chooseProperty")}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {t("videoUpload.showGuestsWhatMakesYourPlaceSpecial")}
          </Text>

          {isLoadingProps ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={theme["color-temporary-primary"]}
              />
            </View>
          ) : properties.length > 0 ? (
            <FlatList
              data={properties}
              keyExtractor={(item) => item.ID.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.propertiesList}
              renderItem={renderProperty}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {t("videoUpload.noPropertiesFound")}
              </Text>
              <Text style={styles.emptySubtext}>
                {t("videoUpload.youllNeedToAddAPropertyFirst")}
              </Text>
            </View>
          )}
        </View>

        {/* Video Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("videoUpload.video")}</Text>

          <TouchableOpacity
            style={styles.uploadArea}
            onPress={isUploading ? undefined : pickVideo}
            activeOpacity={0.7}
          >
            {localUri ? (
              <View style={styles.videoSelected}>
                <View style={styles.previewWrapper}>
                  {previewThumb ? (
                    <Image
                      source={{ uri: previewThumb }}
                      style={styles.previewThumb}
                    />
                  ) : (
                    <View style={styles.videoIcon}>
                      <Ionicons
                        name="play-circle"
                        size={32}
                        color={theme["color-temporary-primary"]}
                      />
                    </View>
                  )}
                  <View style={styles.previewOverlay}>
                    <Ionicons name="play" size={14} color="#fff" />
                    {typeof durationSec === "number" && (
                      <Text style={styles.durationText}>
                        {formatDuration(durationSec)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.videoInfo}>
                  <View style={styles.videoInfoRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#00A699"
                    />
                    <Text style={styles.videoInfoText}>
                      {t("videoUpload.videoSelected")}
                    </Text>
                  </View>
                  <View style={styles.videoMeta}>
                    {typeof durationSec === "number" && (
                      <View style={styles.videoMetaItem}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color="#717171"
                        />
                        <Text style={styles.videoMetaText}>
                          {formatDuration(durationSec)}
                        </Text>
                      </View>
                    )}
                    {fileSize && (
                      <View style={styles.videoMetaItem}>
                        <Ionicons
                          name="document-outline"
                          size={12}
                          color="#717171"
                        />
                        <Text style={styles.videoMetaText}>
                          {formatFileSize(fileSize)}
                        </Text>
                      </View>
                    )}
                    {selectedMime && (
                      <View style={styles.videoMetaItem}>
                        <Ionicons
                          name="film-outline"
                          size={12}
                          color="#717171"
                        />
                        <Text style={styles.videoMetaText}>
                          {selectedMime.split("/")[1].toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tapToChangeText}>
                    {t("videoUpload.tapToChange")}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPrompt}>
                <View style={styles.uploadIconContainer}>
                  <Ionicons
                    name="add-circle-outline"
                    size={32}
                    color="#717171"
                  />
                </View>
                <Text style={styles.uploadText}>
                  {t("videoUpload.addVideo")}
                </Text>
                <Text style={styles.uploadSubtext}>
                  {t("videoUpload.chooseAVideoFromYourDevice")} (
                  {t("videoUpload.max5Minutes") || "Max 5 minutes"})
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Upload Progress */}
          {isUploading && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  {t("videoUpload.uploading")}
                </Text>
                <Text style={styles.progressPercent}>
                  {Math.round(uploadProgress)}%
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[styles.progressBar, { width: `${uploadProgress}%` }]}
                />
              </View>
            </View>
          )}

          {/* Success Message */}
          {uploadProgress === 100 && !isUploading && (
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={20} color="#00A699" />
              <Text style={styles.successText}>
                {t("videoUpload.videoUploadedSuccessfully")}
              </Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!localUri || !selectedPropertyID || isUploading) &&
                styles.uploadButtonDisabled
            ]}
            disabled={!localUri || !selectedPropertyID || isUploading}
            onPress={onUpload}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.uploadButtonText,
                (!localUri || !selectedPropertyID || isUploading) &&
                  styles.uploadButtonTextDisabled
              ]}
            >
              {isUploading ? t("videoUpload.uploading") : t("videoUpload.save")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>{t("videoUpload.videoTips")}</Text>

          <View style={styles.tipsList}>
            <View style={styles.tip}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>
                {t("videoUpload.keepItShortAndEngaging")}
              </Text>
            </View>
            <View style={styles.tip}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>
                {t("videoUpload.showYourSpacesBestFeaturesAndUniqueDetails")}
              </Text>
            </View>
            <View style={styles.tip}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>
                {t("videoUpload.filmInGoodLightingPreferablyNaturalLight")}
              </Text>
            </View>
            <View style={styles.tip}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>
                {t("videoUpload.keepTheCameraSteadyAndAvoidQuickMovements")}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
};

// Format seconds to mm:ss
const formatDuration = (totalSeconds: number) => {
  if (!Number.isFinite(totalSeconds)) return "";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${mm}:${ss}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  header: {
    paddingTop: (StatusBar.currentHeight || 0) + 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222222",
    flex: 1
  },
  content: {
    flex: 1
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#717171",
    lineHeight: 20,
    marginBottom: 12
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: "center"
  },
  propertiesList: {
    paddingRight: 16
  },
  propertyCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden"
  },
  propertyCardSelected: {
    borderColor: theme["color-temporary-primary"],
    borderWidth: 2
  },
  propertyImageContainer: {
    position: "relative"
  },
  propertyImage: {
    width: "100%",
    height: 100
  },
  propertyImagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center"
  },
  selectedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 10
  },
  propertyInfo: {
    padding: 12
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4
  },
  propertyLocation: {
    fontSize: 12,
    color: "#717171"
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center"
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 14,
    color: "#717171",
    textAlign: "center"
  },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#FAFAFA"
  },
  uploadPrompt: {
    alignItems: "center",
    paddingVertical: 8
  },
  uploadIconContainer: {
    marginBottom: 8
  },
  uploadText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#717171",
    textAlign: "center"
  },
  videoSelected: {
    width: "100%"
  },
  previewWrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  previewThumb: {
    width: "100%",
    height: "100%"
  },
  previewOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  durationText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 11
  },
  videoIcon: {
    marginBottom: 8
  },
  videoInfo: {
    width: "100%"
  },
  videoInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8
  },
  videoInfoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222"
  },
  videoMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8
  },
  videoMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  videoMetaText: {
    fontSize: 12,
    color: "#717171"
  },
  tapToChangeText: {
    fontSize: 12,
    color: "#717171",
    fontStyle: "italic"
  },
  progressSection: {
    marginTop: 16
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  progressText: {
    fontSize: 14,
    color: "#717171"
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "600",
    color: theme["color-temporary-primary"]
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: "#EBEBEB",
    borderRadius: 2
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme["color-temporary-primary"],
    borderRadius: 2
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 8
  },
  successText: {
    fontSize: 14,
    color: "#00A699",
    marginLeft: 6,
    fontWeight: "500"
  },
  buttonSection: {
    paddingHorizontal: 16,
    marginBottom: 24
  },
  uploadButton: {
    backgroundColor: theme["color-temporary-primary"],
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  uploadButtonDisabled: {
    backgroundColor: "#EBEBEB"
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF"
  },
  uploadButtonTextDisabled: {
    color: "#ABABAB"
  },
  tipsSection: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 12
  },
  tipsList: {
    gap: 8
  },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  tipBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#717171",
    marginTop: 6,
    marginRight: 8
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#717171",
    lineHeight: 20
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center"
  }
});
