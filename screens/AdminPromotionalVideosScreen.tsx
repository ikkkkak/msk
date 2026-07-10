import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { pickVideoNative } from "../utils/nativePhotoPicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { cloudinary } from "../constants";
import { api } from "../services/api";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Video } from "../types/video";
import * as VideoThumbnails from "expo-video-thumbnails";

const { width } = Dimensions.get("window");

export const AdminPromotionalVideosScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  // Form state
  const [videoURL, setVideoURL] = useState<string>("");
  const [thumbnailURL, setThumbnailURL] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [localVideoUri, setLocalVideoUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Fetch promotional videos
  const { data: promotionalVideos = [], isLoading } = useQuery<Video[]>(
    ["admin-promotional-videos"],
    async () => {
      const res = await api.get("/admin/videos/promotional");
      return res.data.data || res.data || [];
    },
    {
      refetchOnWindowFocus: true
    }
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      videoURL: string;
      thumbnailURL?: string;
      title: string;
      description?: string;
      caption?: string;
    }) => {
      const res = await api.post("/admin/videos/promotional", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotional-videos"] });
      Alert.alert("Success", "Promotional video created successfully!");
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create promotional video"
      );
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await api.patch(`/admin/videos/promotional/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotional-videos"] });
      Alert.alert("Success", "Promotional video updated successfully!");
      setEditingVideo(null);
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update promotional video"
      );
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/videos/promotional/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotional-videos"] });
      Alert.alert("Success", "Promotional video deleted successfully!");
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to delete promotional video"
      );
    }
  });

  const pickVideo = async () => {
    // Use native picker - no permissions needed
    const result = await pickVideoNative({
      allowsEditing: true,
      quality: 1
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setLocalVideoUri(asset.uri);
      setVideoURL(""); // Clear existing URL when picking new video

      // Generate thumbnail
      try {
        const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(
          asset.uri,
          {
            time: 1000
          }
        );

        // Upload thumbnail to Cloudinary
        const thumbForm = new FormData();
        // @ts-ignore
        thumbForm.append("file", {
          uri: thumbUri,
          name: `thumb_${Date.now()}.jpg`,
          type: "image/jpeg"
        });
        thumbForm.append("upload_preset", cloudinary.uploadPreset);
        thumbForm.append("folder", "promotional-thumbnails");

        const thumbRes = await fetch(cloudinary.uploadUrl("image"), {
          method: "POST",
          body: thumbForm as any
        });
        const thumbData = await thumbRes.json();
        if (thumbData.secure_url) {
          setThumbnailURL(thumbData.secure_url);
        }
      } catch (error) {
        console.warn("Failed to generate thumbnail:", error);
      }
    }
  };

  const uploadVideoToCloudinary = async (uri: string): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);

    const fileName = uri.split("/").pop() || `promo_video_${Date.now()}.mp4`;
    const form = new FormData();
    // @ts-ignore
    form.append("file", {
      uri,
      name: fileName,
      type: "video/mp4"
    });
    form.append("upload_preset", cloudinary.uploadPreset);
    form.append("folder", "promotional-videos");

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const uploadUrl = cloudinary.uploadUrl("video");

      xhr.open("POST", uploadUrl);
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (json.secure_url) {
            resolve(json.secure_url);
          } else {
            reject(new Error("Upload failed"));
          }
        } catch (e) {
          reject(e);
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      // @ts-ignore
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(pct);
        }
      };
      xhr.send(form);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a title");
      return;
    }

    if (!videoURL && !localVideoUri) {
      Alert.alert("Validation Error", "Please select or upload a video");
      return;
    }

    try {
      let finalVideoURL = videoURL;

      // Upload video if local URI exists
      if (localVideoUri && !videoURL) {
        finalVideoURL = await uploadVideoToCloudinary(localVideoUri);
      }

      const data = {
        videoURL: finalVideoURL,
        thumbnailURL: thumbnailURL || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        caption: caption.trim() || undefined
      };

      if (editingVideo) {
        await updateMutation.mutateAsync({ id: editingVideo.ID, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save promotional video");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setVideoURL("");
    setThumbnailURL("");
    setTitle("");
    setDescription("");
    setCaption("");
    setLocalVideoUri(null);
    setEditingVideo(null);
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setVideoURL(video.videoURL || "");
    setThumbnailURL(video.thumbnailURL || "");
    setTitle(video.title || "");
    setDescription(video.description || "");
    setCaption(video.caption || "");
    setLocalVideoUri(null);
  };

  const handleDelete = (video: Video) => {
    Alert.alert(
      "Delete Video",
      "Are you sure you want to delete this promotional video?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(video.ID)
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotional Videos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            {editingVideo
              ? "Edit Promotional Video"
              : "Create Promotional Video"}
          </Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., How to Book a Property"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the video"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={caption}
            onChangeText={setCaption}
            placeholder="Video caption"
            placeholderTextColor="#999"
            multiline
            numberOfLines={2}
          />

          <Text style={styles.label}>Video</Text>
          {localVideoUri ? (
            <View style={styles.videoPreview}>
              <Text style={styles.videoPreviewText}>
                Video selected (local)
              </Text>
              <TouchableOpacity onPress={pickVideo} style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Change Video</Text>
              </TouchableOpacity>
            </View>
          ) : videoURL ? (
            <View style={styles.videoPreview}>
              <Text style={styles.videoPreviewText} numberOfLines={1}>
                {videoURL}
              </Text>
              <TouchableOpacity onPress={pickVideo} style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Change Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={pickVideo} style={styles.uploadButton}>
              <MaterialCommunityIcons
                name="video-plus"
                size={24}
                color="#FF5A5F"
              />
              <Text style={styles.uploadButtonText}>
                Pick Video from Library
              </Text>
            </TouchableOpacity>
          )}

          {isUploading && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color="#FF5A5F" />
              <Text style={styles.progressText}>
                Uploading: {uploadProgress}%
              </Text>
            </View>
          )}

          {thumbnailURL ? (
            <View style={styles.thumbnailContainer}>
              <Text style={styles.label}>Thumbnail</Text>
              <Image source={{ uri: thumbnailURL }} style={styles.thumbnail} />
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            {editingVideo && (
              <TouchableOpacity
                onPress={resetForm}
                style={[styles.button, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.button, styles.submitButton]}
              disabled={
                isUploading ||
                createMutation.isLoading ||
                updateMutation.isLoading
              }
            >
              {isUploading ||
              createMutation.isLoading ||
              updateMutation.isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingVideo ? "Update" : "Create"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* List Section */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Existing Promotional Videos</Text>
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#FF5A5F"
              style={styles.loader}
            />
          ) : promotionalVideos.length === 0 ? (
            <Text style={styles.emptyText}>No promotional videos yet</Text>
          ) : (
            promotionalVideos.map((video) => (
              <View key={video.ID} style={styles.videoCard}>
                {video.thumbnailURL ? (
                  <Image
                    source={{ uri: video.thumbnailURL }}
                    style={styles.videoCardThumbnail}
                  />
                ) : (
                  <View
                    style={[
                      styles.videoCardThumbnail,
                      styles.videoCardPlaceholder
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="video"
                      size={32}
                      color="#999"
                    />
                  </View>
                )}
                <View style={styles.videoCardInfo}>
                  <Text style={styles.videoCardTitle}>
                    {video.title || "Untitled"}
                  </Text>
                  {video.description ? (
                    <Text style={styles.videoCardDescription} numberOfLines={2}>
                      {video.description}
                    </Text>
                  ) : null}
                  <Text style={styles.videoCardDate}>
                    Created: {new Date(video.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.videoCardActions}>
                  <TouchableOpacity
                    onPress={() => handleEdit(video)}
                    style={styles.iconButton}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={20}
                      color="#007AFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(video)}
                    style={styles.iconButton}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={20}
                      color="#FF3B30"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0"
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000"
  },
  placeholder: {
    width: 40
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16
  },
  formSection: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#FFF"
  },
  textArea: {
    height: 80,
    textAlignVertical: "top"
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FF5A5F",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 20,
    marginTop: 8
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#FF5A5F",
    fontWeight: "600"
  },
  videoPreview: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginTop: 8
  },
  videoPreviewText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8
  },
  changeButton: {
    alignSelf: "flex-start"
  },
  changeButtonText: {
    color: "#FF5A5F",
    fontSize: 14,
    fontWeight: "600"
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12
  },
  progressText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666"
  },
  thumbnailContainer: {
    marginTop: 16
  },
  thumbnail: {
    width: width - 64,
    height: (width - 64) * 0.5625,
    borderRadius: 8,
    marginTop: 8
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  submitButton: {
    backgroundColor: "#FF5A5F"
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700"
  },
  cancelButton: {
    backgroundColor: "#F0F0F0"
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600"
  },
  listSection: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  loader: {
    marginVertical: 40
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginVertical: 40
  },
  videoCard: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 12
  },
  videoCardThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F0F0F0"
  },
  videoCardPlaceholder: {
    alignItems: "center",
    justifyContent: "center"
  },
  videoCardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center"
  },
  videoCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4
  },
  videoCardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4
  },
  videoCardDate: {
    fontSize: 12,
    color: "#999"
  },
  videoCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  iconButton: {
    padding: 8
  }
});
