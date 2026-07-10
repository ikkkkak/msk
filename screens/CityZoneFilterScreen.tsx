import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { endpoints } from '../constants';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

type RouteParams = {
  initialCityId?: number | null;
  initialZoneId?: number | null;
  onApply: (values: {
    cityId: number | null;
    cityName?: string;
    zoneId: number | null;
    zoneName?: string;
  }) => void;
};

const CityZoneFilterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const {
    initialCityId = null,
    initialZoneId = null,
    onApply,
  } = route.params as RouteParams;

  const [cities, setCities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [cityId, setCityId] = useState<number | null>(initialCityId);
  const [zoneId, setZoneId] = useState<number | null>(initialZoneId);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await axios.get(`${endpoints.baseURL}/cities`);
        setCities(res.data?.data || []);
      } catch (e) {
        setCities([]);
      }
      setLoadingCities(false);
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchZones = async () => {
      if (!cityId) {
        setZones([]);
        return;
      }
      setLoadingZones(true);
      try {
        const res = await axios.get(`${endpoints.baseURL}/cities/${cityId}/zones`);
        setZones(res.data?.data || []);
      } catch (e) {
        setZones([]);
      }
      setLoadingZones(false);
    };
    if (cityId) fetchZones();
  }, [cityId]);

  const handleApply = () => {
    const city = cities.find((c: any) => c.id === cityId);
    const zone = zones.find((z: any) => z.id === zoneId);
    onApply({
      cityId: cityId ?? null,
      cityName: city?.name,
      zoneId: zoneId ?? null,
      zoneName: zone?.name,
    });
    navigation.goBack();
  };

  const handleReset = () => {
    setCityId(null);
    setZoneId(null);
    setZones([]);
  };

  const renderCityItem = ({ item }: { item: any }) => {
    const selected = cityId === item.id;
    return (
      <TouchableOpacity
        style={[styles.listItem, selected && styles.listItemActive]}
        onPress={() => {
          setCityId(item.id);
          setZoneId(null);
        }}
      >
        <Text style={[styles.itemText, selected && styles.itemTextActive]}>{item.name}</Text>
        {selected && <MaterialIcons name="check" size={20} color="#006AFF" />}
      </TouchableOpacity>
    );
  };

  const renderZoneItem = ({ item }: { item: any }) => {
    const selected = zoneId === item.id;
    return (
      <TouchableOpacity
        style={[styles.listItem, selected && styles.listItemActive]}
        onPress={() => setZoneId(item.id)}
      >
        <Text style={[styles.itemText, selected && styles.itemTextActive]}>{item.name}</Text>
        {selected && <MaterialIcons name="check" size={20} color="#006AFF" />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('filters.cityZone') || 'Location'}</Text>
        <TouchableOpacity onPress={handleReset} style={styles.headerBtn}>
          <Text style={styles.clearText}>{t('filters.reset') || 'Reset'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>{t('filters.city') || 'City'}</Text>
          {loadingCities ? (
            <ActivityIndicator color="#006AFF" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={cities}
              keyExtractor={item => String(item.id)}
              renderItem={renderCityItem}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
        <View style={[styles.column, { borderLeftWidth: 1, borderLeftColor: '#F3F4F6' }]}>
          <Text style={styles.columnTitle}>{t('filters.zones') || 'Zone'}</Text>
          {!cityId ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Select a city</Text>
            </View>
          ) : loadingZones ? (
            <ActivityIndicator color="#006AFF" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={zones}
              keyExtractor={item => String(item.id)}
              renderItem={renderZoneItem}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.applyBtn, (!cityId || loadingCities) && styles.applyBtnDisabled]} 
          onPress={handleApply}
          disabled={!cityId || loadingCities}
        >
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
  content: { flex: 1, flexDirection: 'row' },
  column: { flex: 1 },
  columnTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', padding: 16, backgroundColor: '#F9FAFB', textTransform: 'uppercase', letterSpacing: 0.5 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  listItemActive: { backgroundColor: '#F0F7FF' },
  itemText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  itemTextActive: { color: '#006AFF', fontWeight: '700' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyText: { color: '#9CA3AF', fontSize: 14, fontStyle: 'italic' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  applyBtn: { backgroundColor: theme["color-temporary-primary"], borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  applyBtnDisabled: { backgroundColor: '#E5E7EB' },
  applyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default CityZoneFilterScreen;
