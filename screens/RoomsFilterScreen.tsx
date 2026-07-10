import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';

type RouteParams = {
  initialBedrooms: number;
  initialBathrooms: number;
  onApply: (values: { bedrooms: number; bathrooms: number }) => void;
};

const Counter = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => (
  <View style={styles.roomRow}>
    <Text style={styles.roomLabel}>{label}</Text>
    <View style={styles.counter}>
      <TouchableOpacity onPress={() => onChange(Math.max(0, value - 1))} style={styles.counterBtn}>
        <MaterialIcons name="remove" size={20} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.counterValue}>{value === 0 ? 'Any' : value}</Text>
      <TouchableOpacity onPress={() => onChange(value + 1)} style={styles.counterBtn}>
        <MaterialIcons name="add" size={20} color="#111827" />
      </TouchableOpacity>
    </View>
  </View>
);

const RoomsFilterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { initialBedrooms = 0, initialBathrooms = 0, onApply } = route.params as RouteParams;

  const [bedrooms, setBedrooms] = useState<number>(initialBedrooms);
  const [bathrooms, setBathrooms] = useState<number>(initialBathrooms);

  useEffect(() => {
    setBedrooms(initialBedrooms);
    setBathrooms(initialBathrooms);
  }, [initialBedrooms, initialBathrooms]);

  const handleApply = () => {
    onApply({ bedrooms, bathrooms });
    navigation.goBack();
  };

  const handleReset = () => {
    setBedrooms(0);
    setBathrooms(0);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('filters.rooms') || 'Rooms'}</Text>
        <TouchableOpacity onPress={handleReset} style={styles.headerBtn}>
          <Text style={styles.clearText}>{t('filters.reset') || 'Reset'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Rooms</Text>
          <Counter label={t('filters.bedrooms')} value={bedrooms} onChange={setBedrooms} />
          <Counter label={t('filters.bathrooms')} value={bathrooms} onChange={setBedrooms} />
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 24 },
  roomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  roomLabel: { fontSize: 16, color: '#374151', fontWeight: '500' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  counterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  counterValue: { minWidth: 40, textAlign: 'center', fontSize: 18, fontWeight: '600', color: '#111827' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  applyBtn: { backgroundColor: theme["color-temporary-primary"], borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default RoomsFilterScreen;
