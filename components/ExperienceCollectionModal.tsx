import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUserExperienceCollectionsQuery } from '../hooks/queries/useExperienceCollectionQueries';
import { 
  useAddExperienceToCollectionMutation, 
  useCreateExperienceCollectionMutation 
} from '../hooks/mutations/useExperienceCollectionMutations';
import { useUser } from '../hooks/useUser';
import { ExperienceCollection } from '../types/experienceCollection';

interface ExperienceCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  experienceID: number;
  onSuccess?: () => void;
}

const COLLECTION_COLORS = [
  '#00A699', '#FF385C', '#FFB400', '#C13584', 
  '#0084FF', '#00D4AA', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
];

export const ExperienceCollectionModal: React.FC<ExperienceCollectionModalProps> = ({
  visible,
  onClose,
  experienceID,
  onSuccess,
}) => {
  const { user, setSavedExperiences } = useUser();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[0]);

  const { data: collectionsData, isLoading, isFetching } = useUserExperienceCollectionsQuery();
  const collections = collectionsData?.collections || [];

  const addToCollection = useAddExperienceToCollectionMutation();
  const createCollection = useCreateExperienceCollectionMutation();
  
  const isCreating = createCollection.isLoading;
  const isAdding = addToCollection.isLoading;

  const handleAddToCollection = async (collectionID: number) => {
    if (isAdding) {
      return; // Prevent multiple submissions
    }

    try {
      await addToCollection.mutateAsync({
        collectionID,
        experienceID,
      });
      
      // Update user's saved experiences in frontend state
      if (user && !user.savedExperiences?.includes(experienceID)) {
        const newSavedExperiences = [...(user.savedExperiences || []), experienceID];
        setSavedExperiences(newSavedExperiences);
      }
      
      Alert.alert("Succès", "Expérience ajoutée à la collection");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Add to collection error:", error);
      
      // Handle 409 conflict - experience already in collection
      if (error.response?.status === 409) {
        // Still update frontend state since experience is already saved
        if (user && !user.savedExperiences?.includes(experienceID)) {
          const newSavedExperiences = [...(user.savedExperiences || []), experienceID];
          setSavedExperiences(newSavedExperiences);
        }
        
        Alert.alert("Info", "Cette expérience est déjà dans cette collection");
        onSuccess?.();
        onClose();
      } else {
        let errorMessage = "Impossible d'ajouter l'expérience à la collection";
        
        if (error.message) {
          errorMessage = error.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = "La requête a pris trop de temps. Veuillez réessayer.";
        } else if (error.response?.status === 500) {
          errorMessage = "Erreur du serveur. Veuillez réessayer plus tard.";
        } else if (error.response?.status === 401) {
          errorMessage = "Session expirée. Veuillez vous reconnecter.";
        }
        
        Alert.alert("Erreur", errorMessage);
      }
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert("Erreur", "Le nom de la collection est requis");
      return;
    }

    if (isCreating) {
      return; // Prevent multiple submissions
    }

    try {
      await createCollection.mutateAsync({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim(),
        color: selectedColor,
      });
      
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowCreateForm(false);
      Alert.alert("Succès", "Collection créée avec succès");
    } catch (error: any) {
      console.error("Collection creation error:", error);
      
      let errorMessage = "Impossible de créer la collection";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "La requête a pris trop de temps. Veuillez réessayer.";
      } else if (error.response?.status === 500) {
        errorMessage = "Erreur du serveur. Veuillez réessayer plus tard.";
      } else if (error.response?.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
      }
      
      Alert.alert("Erreur", errorMessage);
    }
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setNewCollectionName('');
    setNewCollectionDescription('');
    onClose();
  };

  // Show skeleton loader instead of blocking activity indicator
  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((index) => (
        <View key={index} style={styles.skeletonItem}>
          <View style={styles.skeletonColorIndicator} />
          <View style={styles.skeletonInfo}>
            <View style={styles.skeletonName} />
            <View style={styles.skeletonDescription} />
            <View style={styles.skeletonCount} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajouter à une collection</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#717171" />
            </TouchableOpacity>
          </View>

          {!showCreateForm ? (
            <ScrollView style={styles.content}>
              {isLoading ? (
                renderSkeletonLoader()
              ) : collections.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="collections" size={48} color="#E0E0E0" />
                  <Text style={styles.emptyTitle}>Aucune collection</Text>
                  <Text style={styles.emptyText}>
                    Créez votre première collection pour organiser vos expériences préférées.
                  </Text>
                </View>
              ) : (
                <View style={styles.collectionsList}>
                  {collections.map((collection) => (
                    <TouchableOpacity
                      key={collection.id}
                      style={[
                        styles.collectionItem,
                        isAdding && styles.collectionItemDisabled
                      ]}
                      onPress={() => handleAddToCollection(collection.id)}
                      disabled={isAdding}
                    >
                      <View style={[styles.colorIndicator, { backgroundColor: collection.color }]} />
                      <View style={styles.collectionInfo}>
                        <Text style={styles.collectionName}>{collection.name}</Text>
                        {collection.description && (
                          <Text style={styles.collectionDescription}>{collection.description}</Text>
                        )}
                        <Text style={styles.collectionCount}>
                          {collection.experiences?.length || 0} expérience{(collection.experiences?.length || 0) > 1 ? 's' : ''}
                        </Text>
                      </View>
                      {isAdding ? (
                        <ActivityIndicator size="small" color="#00A699" />
                      ) : (
                        <MaterialIcons name="add" size={24} color="#00A699" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.createButton,
                  isAdding && styles.createButtonDisabled
                ]}
                onPress={() => setShowCreateForm(true)}
                disabled={isAdding}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Créer une nouvelle collection</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.createForm}>
              <Text style={styles.formTitle}>Créer une collection</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Nom de la collection"
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                placeholderTextColor="#999999"
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optionnel)"
                value={newCollectionDescription}
                onChangeText={setNewCollectionDescription}
                placeholderTextColor="#999999"
                multiline
                numberOfLines={3}
              />
              
              <Text style={styles.colorLabel}>Couleur de la collection</Text>
              <View style={styles.colorPicker}>
                {COLLECTION_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColorOption,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <MaterialIcons name="check" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    isCreating && styles.saveButtonDisabled
                  ]}
                  onPress={handleCreateCollection}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Création...</Text>
                    </View>
                  ) : (
                    <Text style={styles.saveButtonText}>Créer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#717171',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#717171',
    textAlign: 'center',
    lineHeight: 20,
  },
  collectionsList: {
    marginBottom: 20,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  collectionDescription: {
    fontSize: 14,
    color: '#717171',
    marginBottom: 4,
  },
  collectionCount: {
    fontSize: 12,
    color: '#999999',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A699',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createForm: {
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#222222',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#222222',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#717171',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#00A699',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skeletonContainer: {
    marginBottom: 20,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
  },
  skeletonColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonName: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  skeletonDescription: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
    width: '80%',
  },
  skeletonCount: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '40%',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  collectionItemDisabled: {
    opacity: 0.6,
  },
  createButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

