import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView
} from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";

import { Collection } from "../types/collection";
import { useCollectionsQuery } from "../hooks/queries/useCollectionsQuery";
import {
  useCreateCollectionMutation,
  useAddPropertyToCollectionMutation
} from "../hooks/mutations/useCollectionMutations";
import { useUser } from "../hooks/useUser";
import { queryKeys } from "../constants";
import FormSheet from "./FormSheet";
import CustomToast from "./CustomToast";

interface CollectionModalProps {
  visible: boolean;
  onClose: () => void;
  propertyID: number;
  onSuccess?: () => void;
}

const COLLECTION_COLORS = [
  "#FF385C",
  "#00A699",
  "#FFB400",
  "#FC642D",
  "#484848",
  "#767676",
  "#00D1C1",
  "#FF5A5F",
  "#007A87",
  "#C13584",
  "#8CE071",
  "#7B0051"
];

export const CollectionModal: React.FC<CollectionModalProps> = ({
  visible,
  onClose,
  propertyID,
  onSuccess
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FF385C");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success"
  );

  const { data: collections, isLoading } = useCollectionsQuery();
  const createCollection = useCreateCollectionMutation();
  const addToCollection = useAddPropertyToCollectionMutation();
  const { user, setSavedProperties } = useUser();
  const queryClient = useQueryClient();

  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleAddToCollection = async (collectionID: number) => {
    if (addToCollection.isLoading) {
      return;
    }

    try {
      await addToCollection.mutateAsync({
        collectionID: Number(collectionID),
        propertyID: Number(propertyID)
      });

      if (user && !user.savedProperties?.includes(propertyID)) {
        const newSavedProperties = [
          ...(user.savedProperties || []),
          propertyID
        ];
        setSavedProperties(newSavedProperties);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.searchProperties });

      onSuccess?.();
      onClose();
      showToastMessage("Property added to collection", "success");
    } catch (error: any) {
      if (error?.response?.status === 409) {
        if (user && !user.savedProperties?.includes(propertyID)) {
          const newSavedProperties = [
            ...(user.savedProperties || []),
            propertyID
          ];
          setSavedProperties(newSavedProperties);
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.searchProperties });

        onSuccess?.();
        onClose();
        showToastMessage("This property is already in this collection", "info");
      } else {
        let errorMessage = "Unable to add property to collection";
        if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error?.response?.status === 400) {
          errorMessage = "Invalid data. Please check the information.";
        }
        showToastMessage(errorMessage, "error");
      }
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      showToastMessage("Collection name is required", "error");
      return;
    }

    if (createCollection.isLoading || addToCollection.isLoading) {
      return;
    }

    try {
      const newCollection = await createCollection.mutateAsync({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
        color: selectedColor
      });

      // Extract collection ID from response
      const newCollectionId = newCollection?.id || newCollection?.ID;

      if (!newCollectionId) {
        // Fallback: find the most recent collection by name and color
        const recentCollection = collections?.find(
          (c: any) =>
            c.name === newCollectionName.trim() && c.color === selectedColor
        );

        if (recentCollection) {
          const fallbackId = recentCollection.id || recentCollection.ID;
          if (fallbackId) {
            await addToCollection.mutateAsync({
              collectionID: Number(fallbackId),
              propertyID: Number(propertyID)
            });
          }
        }
      } else {
        // Add property to the new collection
        await addToCollection.mutateAsync({
          collectionID: Number(newCollectionId),
          propertyID: Number(propertyID)
        });
      }

      if (user && !user.savedProperties?.includes(propertyID)) {
        const newSavedProperties = [
          ...(user.savedProperties || []),
          propertyID
        ];
        setSavedProperties(newSavedProperties);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.searchProperties });

      setNewCollectionName("");
      setNewCollectionDescription("");
      setSelectedColor("#FF385C");
      setShowCreateForm(false);

      onSuccess?.();
      onClose();
      showToastMessage(
        "Collection created and property added successfully",
        "success"
      );
    } catch (error: any) {
      console.error("Collection creation error:", error);

      let errorMessage = "Unable to create collection";
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 400) {
        errorMessage = "Invalid data. Please check the information entered.";
      }
      showToastMessage(errorMessage, "error");
    }
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setNewCollectionName("");
    setNewCollectionDescription("");
    setSelectedColor("#FF385C");
    onClose();
  };

  return (
    <FormSheet
      visible={visible}
      onClose={handleClose}
      title={showCreateForm ? "Create Collection" : "Add to Collection"}
    >
      <View style={styles.content}>
        {showCreateForm ? (
          // Create Collection Form
          <View style={styles.createForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Collection Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                placeholder="e.g., My Favorites, Summer Trip..."
                placeholderTextColor="#999999"
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newCollectionDescription}
                onChangeText={setNewCollectionDescription}
                placeholder="Describe your collection..."
                placeholderTextColor="#999999"
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Color</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.colorScroll}
                contentContainerStyle={styles.colorScrollContent}
              >
                {COLLECTION_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColor
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <MaterialIcons name="check" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  (createCollection.isLoading || addToCollection.isLoading) &&
                    styles.disabledButton
                ]}
                onPress={handleCreateCollection}
                disabled={
                  createCollection.isLoading || addToCollection.isLoading
                }
              >
                <Text style={styles.createButtonText}>
                  {createCollection.isLoading || addToCollection.isLoading
                    ? "Creating..."
                    : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Collections List
          <View style={styles.collectionsList}>
            <TouchableOpacity
              style={styles.createNewButton}
              onPress={() => setShowCreateForm(true)}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createNewText}>Create New Collection</Text>
            </TouchableOpacity>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading collections...</Text>
              </View>
            ) : collections && collections.length > 0 ? (
              collections.map((collection) => (
                <TouchableOpacity
                  key={collection.id}
                  style={[
                    styles.collectionItem,
                    addToCollection.isLoading && styles.disabledItem
                  ]}
                  onPress={() => handleAddToCollection(collection.id || 0)}
                  disabled={addToCollection.isLoading}
                >
                  <View style={styles.collectionInfo}>
                    <View
                      style={[
                        styles.colorIndicator,
                        { backgroundColor: collection.color }
                      ]}
                    />
                    <View style={styles.collectionDetails}>
                      <Text style={styles.collectionName}>
                        {collection.name}
                      </Text>
                      {collection.description && (
                        <Text style={styles.collectionDescription}>
                          {collection.description}
                        </Text>
                      )}
                      <Text style={styles.collectionCount}>
                        {collection.properties?.length || 0} properties
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color="#717171"
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="folder" size={48} color="#717171" />
                <Text style={styles.emptyTitle}>No Collections</Text>
                <Text style={styles.emptyDescription}>
                  Create your first collection to organize your favorites
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Custom Toast */}
      {showToast && (
        <CustomToast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onHide={() => setShowToast(false)}
        />
      )}
    </FormSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    // flex: 1,
  },
  createForm: {
    paddingVertical: 20
  },
  inputGroup: {
    marginBottom: 24
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#222222",
    backgroundColor: "#FFFFFF"
  },
  textArea: {
    height: 80,
    textAlignVertical: "top"
  },
  colorScroll: {
    marginTop: 8
  },
  colorScrollContent: {
    paddingRight: 20
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
    marginRight: 12
  },
  selectedColor: {
    borderColor: "#222222"
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center"
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#717171"
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#222222",
    alignItems: "center"
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6
  },
  collectionsList: {
    paddingVertical: 20
  },
  createNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222222",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8
  },
  createNewText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40
  },
  loadingText: {
    fontSize: 16,
    color: "#717171"
  },
  collectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    marginBottom: 12
  },
  disabledItem: {
    opacity: 0.5
  },
  collectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16
  },
  collectionDetails: {
    flex: 1
  },
  collectionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4
  },
  collectionDescription: {
    fontSize: 14,
    color: "#717171",
    marginBottom: 4
  },
  collectionCount: {
    fontSize: 12,
    color: "#999999"
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginTop: 16,
    marginBottom: 8
  },
  emptyDescription: {
    fontSize: 14,
    color: "#717171",
    textAlign: "center",
    lineHeight: 20
  }
});
