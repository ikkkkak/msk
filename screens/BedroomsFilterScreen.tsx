import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

type RouteParams = {
  initialBedrooms?: number;
  onApply?: (bedrooms: number) => void;
};

const BedroomsFilterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const params = (route.params || {}) as RouteParams;

  const [selectedBedrooms, setSelectedBedrooms] = useState<number>(params.initialBedrooms || 0);

  useEffect(() => {
    if (params.initialBedrooms !== undefined) {
      setSelectedBedrooms(params.initialBedrooms);
    }
  }, [params.initialBedrooms]);

  const handleApply = () => {
    params.onApply?.(selectedBedrooms);
    navigation.goBack();
  };

  const handleReset = () => {
    setSelectedBedrooms(0);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('filters.bedrooms', 'Bedrooms')}</Text>
        <TouchableOpacity onPress={handleReset} style={styles.headerBtn}>
          <Text style={styles.clearText}>{t('filters.reset') || 'Reset'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Bedrooms</Text>
          <View style={styles.chipGrid}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
              <TouchableOpacity
                key={count}
                style={[styles.chip, selectedBedrooms === count && styles.chipActive]}
                onPress={() => setSelectedBedrooms(count)}
              >
                <Text style={[styles.chipText, selectedBedrooms === count && styles.chipTextActive]}>
                  {count === 0 ? 'Any' : count.toString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyBtnText}>{t('filters.apply') || 'Apply'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  clearText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  content: { flex: 1 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 20 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', minWidth: 60, alignItems: 'center' },
  chipActive: { backgroundColor: '#F0F7FF', borderColor: '#006AFF', borderWidth: 2 },
  chipText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#006AFF', fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  applyBtn: { backgroundColor: '#006AFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default BedroomsFilterScreen;
