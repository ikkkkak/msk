import React from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "@ui-kitten/components";
import { useRoute, useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { PhosphorIcon } from "../components/PhosphorIcon";
import { usePropertyAmenitiesById, useAmenities } from "../hooks/queries/useCategories";
import { useSelectedPropertyQuery } from "../hooks/queries/useSelectedPropertyQuery";
import { useLanguage } from "../contexts/LanguageContext";

type RouteParams = { propertyID: number };

export const PropertyAmenitiesScreen = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute();
  const { propertyID } = (route.params || {}) as RouteParams;

  const { data: joined = [], isLoading: loadingJoined } = usePropertyAmenitiesById(propertyID);
  const { data: allAmenities = [], isLoading: loadingAll } = useAmenities();
  const property = useSelectedPropertyQuery(propertyID);

  // If the details payload still carries amenity IDs under params (optional), use them
  const amenityIdsParam: number[] = Array.isArray((route.params as any)?.amenityIds)
    ? ((route.params as any).amenityIds as any[])
        .map(v => (typeof v === 'string' ? parseInt(v, 10) : Number(v)))
        .filter(n => Number.isFinite(n))
    : [];
  const amenityIdsFromProperty: number[] = Array.isArray(property.data?.amenities)
    ? (property.data?.amenities as any[])
        .map(v => (typeof v === 'string' ? parseInt(v, 10) : Number(v)))
        .filter(n => Number.isFinite(n))
    : [];
  const amenityIds = amenityIdsParam.length > 0 ? amenityIdsParam : amenityIdsFromProperty;

  const fromJoin = Array.isArray(joined) ? joined : [];
  const fromIds = amenityIds.length > 0 && Array.isArray(allAmenities)
    ? (allAmenities as any[]).filter(a => amenityIds.includes(Number((a as any).id)))
    : [];

  const items = (fromJoin.length > 0 ? fromJoin : fromIds) as any[];

  const getLocalizedAmenityName = (amenity: any) => {
    if (!amenity) return '';
    const name = amenity.name ?? amenity.label ?? amenity.displayName ?? amenity.title;

    if (typeof name === 'string') {
      return name;
    }

    if (name && typeof name === 'object') {
      const normalized = (currentLanguage || '').split('-')[0];
      const priorityOrder = [currentLanguage, normalized, 'ar', 'en', 'fr'];

      for (const key of priorityOrder) {
        if (key && name[key]) {
          return name[key];
        }
      }

      const firstValue = Object.values(name).find((value) => typeof value === 'string' && value.length > 0);
      if (firstValue) {
        return firstValue as string;
      }
    }

    return '';
  };

  const isLoading = loadingJoined || loadingAll || property.isLoading;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EBEBEB' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EBEBEB' }}>
          <MaterialIcons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={{ marginLeft: 12, fontSize: 18, fontWeight: '600', color: '#222' }}>{t('amenities.allAmenities')}</Text>
      </View>

      {isLoading ? (
        <View style={{ padding: 16 }}>
          <Text>{t('common.loading')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {(!items || items.length === 0) ? (
            <Text style={{ color: '#717171' }}>{t('amenities.noAmenitiesFound')}</Text>
          ) : (
            items.map((amenity: any) => (
              <View key={String(amenity.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' }}>
                <PhosphorIcon name={amenity.icon} size={20} color="#222" />
                <Text style={{ marginLeft: 12, fontSize: 15, color: '#222' }}>
                  {getLocalizedAmenityName(amenity) || amenity.name?.en || amenity.name?.fr || ''}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};


