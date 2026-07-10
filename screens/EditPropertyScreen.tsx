import { StyleSheet, View, TouchableOpacity, ScrollView, SafeAreaView, Image } from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, CaretRight, Images, MapPin, CurrencyDollar, Users, Star, House, Calendar, Check, VideoCamera } from "phosphor-react-native";

import { Loading } from "../components/Loading";
import { Screen } from "../components/Screen";
import { ProfessionalAvailabilityManager } from "../components/ProfessionalAvailabilityManager";
import { useEditPropertyQuery } from "../hooks/queries/useEditPropertyQuery";

export const EditPropertyScreen = ({
  route,
}: {
  route: { params: { propertyID: number } };
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);
  const property = useEditPropertyQuery(route.params.propertyID);
  const propertyData = property.data;

  if (property.isFetching || property.isLoading) return <Loading />;

  const photoCount = propertyData?.images?.length || 0;
  const needsMorePhotos = photoCount < 5;
  const firstPhoto = propertyData?.images?.[0];

  const handleStepPress = (stepKey: string) => {
    if (stepKey === "availability") {
      setShowAvailabilityManager(true);
    } else if (stepKey === "video") {
      (navigation as any).navigate("VideoUpload", {
        propertyID: route.params.propertyID,
      });
    } else {
      navigation.navigate("EditPropertyStep", { 
        propertyID: route.params.propertyID, 
        step: stepKey 
      });
    }
  };

  const editSections = [
    {
      title: t('editProperty.basicInfo', 'Basics'),
      items: [
        { key: "title", label: t('editProperty.steps.title', 'Title'), icon: House },
        { key: "description", label: t('editProperty.steps.description', 'Description'), icon: House },
        { key: "photos", label: t('editProperty.steps.photos', 'Photos'), icon: Images, badge: needsMorePhotos },
        { key: "video", label: t('editProperty.steps.video', 'Video'), icon: VideoCamera },
      ],
    },
    {
      title: t('editProperty.location', 'Location'),
      items: [
        { key: "location", label: t('editProperty.steps.location', 'Address'), icon: MapPin },
        { key: "type", label: t('editProperty.steps.type', 'Property type'), icon: House },
      ],
    },
    {
      title: t('editProperty.pricing', 'Pricing'),
      items: [
        { key: "pricing", label: t('editProperty.steps.pricing', 'Price per night'), icon: CurrencyDollar },
        { key: "availability", label: t('editProperty.steps.availability', 'Availability'), icon: Calendar },
        { key: "booking_mode", label: t('editProperty.steps.bookingMode', 'Booking settings'), icon: Calendar },
      ],
    },
    {
      title: t('editProperty.details', 'Details'),
      items: [
        { key: "capacity", label: t('editProperty.steps.capacity', 'Guests & rooms'), icon: Users },
        { key: "amenities", label: t('editProperty.steps.amenities', 'Amenities'), icon: Star },
        { key: "rules", label: t('editProperty.steps.rules', 'House rules'), icon: House },
        { key: "cancellation", label: t('editProperty.steps.cancellation', 'Cancellation policy'), icon: House },
      ],
    },
  ];

  return (
    <Screen style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.6}
          >
            <X size={24} color="#222" weight="regular" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('editProperty.title', 'Edit listing')}</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Property Preview */}
          <View style={styles.previewSection}>
            {firstPhoto ? (
              <Image source={{ uri: firstPhoto }} style={styles.previewImage} />
            ) : (
              <View style={styles.previewImagePlaceholder}>
                <Images size={32} color="#ccc" weight="light" />
              </View>
            )}
            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle} numberOfLines={2}>
                {propertyData?.title || t('editProperty.noTitle', 'Your listing')}
              </Text>
              <Text style={styles.previewLocation} numberOfLines={1}>
                {propertyData?.city}{propertyData?.state ? `, ${propertyData.state}` : ''}
              </Text>
              <Text style={styles.previewPrice}>
                {propertyData?.nightlyPrice || 0} MRU <Text style={styles.previewPriceUnit}>/ night</Text>
              </Text>
            </View>
          </View>

          {/* Photo Status */}
          {needsMorePhotos ? (
            <TouchableOpacity 
              style={styles.photoNotice}
              onPress={() => handleStepPress('photos')}
              activeOpacity={0.6}
            >
              <View style={styles.photoNoticeContent}>
                <Text style={styles.photoNoticeTitle}>Add more photos</Text>
                <Text style={styles.photoNoticeText}>
                  Listings with 5+ photos get more bookings
                </Text>
              </View>
              <CaretRight size={20} color="#888" weight="bold" />
            </TouchableOpacity>
          ) : (
            <View style={styles.photoSuccess}>
              <Check size={18} color="#222" weight="bold" />
              <Text style={styles.photoSuccessText}>{photoCount} photos added</Text>
            </View>
          )}

          {/* Edit Sections */}
          {editSections.map((section, sectionIndex) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              
              {section.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                const isLast = itemIndex === section.items.length - 1;
                
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.editRow, !isLast && styles.editRowBorder]}
                    onPress={() => handleStepPress(item.key)}
                    activeOpacity={0.5}
                  >
                    <IconComponent size={22} color="#222" weight="light" />
                    <Text style={styles.editLabel}>{item.label}</Text>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>!</Text>
                      </View>
                    )}
                    <CaretRight size={18} color="#ccc" weight="bold" />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View style={styles.bottomSpace} />
        </ScrollView>

        <ProfessionalAvailabilityManager
          propertyID={route.params.propertyID}
          visible={showAvailabilityManager}
          onClose={() => setShowAvailabilityManager(false)}
        />
      </SafeAreaView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
  },
  headerRight: {
    width: 40,
  },
  
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Preview
  previewSection: {
    flexDirection: "row",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  previewImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  previewInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
    lineHeight: 22,
  },
  previewLocation: {
    fontSize: 14,
    color: "#888",
    marginBottom: 6,
  },
  previewPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  previewPriceUnit: {
    fontWeight: "400",
    color: "#888",
  },
  
  // Photo Notice
  photoNotice: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fafafa",
    borderRadius: 12,
  },
  photoNoticeContent: {
    flex: 1,
  },
  photoNoticeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  photoNoticeText: {
    fontSize: 13,
    color: "#888",
  },
  photoSuccess: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  photoSuccessText: {
    fontSize: 14,
    color: "#444",
  },
  
  // Sections
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  
  // Edit Rows
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    gap: 14,
  },
  editRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  editLabel: {
    flex: 1,
    fontSize: 16,
    color: "#111",
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  
  bottomSpace: {
    height: 40,
  },
});
