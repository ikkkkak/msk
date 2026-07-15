import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import MapView, { Marker, Polyline, Polygon } from 'react-native-maps';
import { getMapProvider } from '../utils/mapProvider';
import { getPlatformMapViewConfig } from '../utils/mapTilerAndroid';
import { PlatformMapTileLayer } from '../components/map/PlatformMapTileLayer';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type LandmarkGuidanceParams = {
  landmark: any;
};

export const LandmarkGuidanceScreen = ({ route, navigation }: { route: { params: LandmarkGuidanceParams }; navigation: any }) => {
  const { landmark } = route.params;
  const { t } = useTranslation();

  const mapRef = useRef<MapView | null>(null);
  const [followingUser, setFollowingUser] = useState(true);
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [offroad, setOffroad] = useState<{ start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number } } | null>(null);
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [durationS, setDurationS] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState<'satellite' | 'standard'>('satellite');
  const [isDirectPath, setIsDirectPath] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const latitudes = [landmark.point1_lat, landmark.point2_lat, landmark.point3_lat, landmark.point4_lat];
  const longitudes = [landmark.point1_lng, landmark.point2_lng, landmark.point3_lng, landmark.point4_lng];
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const center = useMemo(() => ({ latitude: (minLat + maxLat) / 2, longitude: (minLng + maxLng) / 2 }), [minLat, maxLat, minLng, maxLng]);
  const polyCoords = useMemo(() => ([
    { latitude: landmark.point1_lat, longitude: landmark.point1_lng },
    { latitude: landmark.point2_lat, longitude: landmark.point2_lng },
    { latitude: landmark.point3_lat, longitude: landmark.point3_lng },
    { latitude: landmark.point4_lat, longitude: landmark.point4_lng },
  ]), [landmark]);

  const haversine = useCallback((a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const s = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    return R * c;
  }, []);

  // Smart route planning algorithm that tries multiple approaches
  const findBestRoute = useCallback(async (start: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) => {
    console.log('🧭 Smart route planning from:', start, 'to:', destination);
    
    const strategies = [
      // Strategy 1: Direct route
      { name: 'direct', start, end: destination, profile: 'driving-car' },
      
      // Strategy 2: Try nearby points around destination (in a grid pattern)
      ...Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45) * Math.PI / 180; // 45-degree increments
        const radius = 0.001; // ~100m radius
        return {
          name: `nearby_${i}`,
          start,
          end: {
            latitude: destination.latitude + radius * Math.cos(angle),
            longitude: destination.longitude + radius * Math.sin(angle)
          },
          profile: 'driving-car'
        };
      }),
      
      // Strategy 3: Try points along the perimeter of the landmark
      ...Array.from({ length: 4 }, (_, i) => {
        const angle = (i * 90) * Math.PI / 180; // 90-degree increments
        const radius = 0.002; // ~200m radius
        return {
          name: `perimeter_${i}`,
          start,
          end: {
            latitude: destination.latitude + radius * Math.cos(angle),
            longitude: destination.longitude + radius * Math.sin(angle)
          },
          profile: 'driving-car'
        };
      }),
      
      // Strategy 4: Try walking routes as fallback
      { name: 'walking_direct', start, end: destination, profile: 'foot-walking' },
      ...Array.from({ length: 4 }, (_, i) => {
        const angle = (i * 90) * Math.PI / 180;
        const radius = 0.001; // ~100m radius
        return {
          name: `walking_${i}`,
          start,
          end: {
            latitude: destination.latitude + radius * Math.cos(angle),
            longitude: destination.longitude + radius * Math.sin(angle)
          },
          profile: 'foot-walking'
        };
      })
    ];

    for (const strategy of strategies) {
      try {
        console.log(`🔍 Trying strategy: ${strategy.name}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // Shorter timeout for each attempt
        
        const slat = encodeURIComponent(String(strategy.start.latitude));
        const slng = encodeURIComponent(String(strategy.start.longitude));
        const dlat = encodeURIComponent(String(strategy.end.latitude));
        const dlng = encodeURIComponent(String(strategy.end.longitude));
        const url = `https://api.openrouteservice.org/v2/directions/${strategy.profile}?start=${slng},${slat}&end=${dlng},${dlat}`;
        
        const res = await fetch(url, { 
          headers: { 
            'Authorization': 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFmNTJkOGY3OWI4OTQ0MmRhZjY3OGZjZjNkZjliYWJkIiwiaCI6Im11cm11cjY0In0=', 
            'Accept': 'application/geo+json;charset=UTF-8' 
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const body = await res.json();
          const feat = body?.features?.[0];
          
          if (feat?.geometry?.coordinates) {
            const coords: number[][] = feat.geometry.coordinates;
            const summary = feat?.properties?.summary || {};
            const poly = coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
            
            console.log(`✅ Route found with strategy: ${strategy.name}`, {
              points: poly.length,
              distance: summary.distance,
              duration: summary.duration,
              profile: strategy.profile
            });
            
            setRouteCoords(poly);
            setDistanceM(typeof summary.distance === 'number' ? summary.distance : null);
            setDurationS(typeof summary.duration === 'number' ? summary.duration : null);
            setIsDirectPath(false);
            
            // Calculate final approach to actual destination
            const last = poly[poly.length - 1];
            if (last) {
              const d = haversine(last, destination);
              console.log('🚶 Final approach distance:', d, 'meters');
              setOffroad(d > 120 ? { start: last, end: destination } : null);
            } else {
              setOffroad(null);
            }
            
            return true; // Success!
          }
        }
      } catch (e) {
        console.log(`❌ Strategy ${strategy.name} failed:`, e);
        // Continue to next strategy
      }
    }
    
    return false; // All strategies failed
  }, []);

  // Create a smart fallback route with intermediate waypoints
  const createSmartFallbackRoute = useCallback((start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }) => {
    const waypoints = [];
    
    // Add intermediate waypoints to make the route more realistic
    const steps = 8;
    for (let i = 1; i < steps; i++) {
      const ratio = i / steps;
      const lat = start.latitude + (end.latitude - start.latitude) * ratio;
      const lng = start.longitude + (end.longitude - start.longitude) * ratio;
      
      // Add some variation to make it look more like a real route
      const variation = 0.0002 * Math.sin(i * Math.PI / 2) * (i % 2 === 0 ? 1 : -1);
      waypoints.push({
        latitude: lat + variation,
        longitude: lng + variation * 0.7
      });
    }
    
    return [start, ...waypoints, end];
  }, []);

  const fetchRoute = useCallback(async (start: { latitude: number; longitude: number }) => {
    console.log('🌍 Starting smart route planning from:', start, 'to:', center);
    
    setLoading(true);
    
    try {
      const success = await findBestRoute(start, center);
      
      if (!success) {
        console.log('🚶 All routing strategies failed, creating smart fallback...');
        
        // Create a smart fallback route with waypoints
        const fallbackRoute = createSmartFallbackRoute(start, center);
        
        setRouteCoords(fallbackRoute);
        setIsDirectPath(true);
        
        // Calculate approximate distance and duration
        const distance = haversine(start, center);
        setDistanceM(distance);
        setDurationS(distance / 5 * 60); // Walking speed estimate
        
        Alert.alert(
          t('guidance.noRouteFound', 'No Route Available'), 
          t('guidance.noRouteFoundFallback', 'No accessible route found. Using approximate path with waypoints.')
        );
      }
      
    } catch (e) {
      console.log('❌ Route planning error:', e);
      
      // Create a smart fallback route with waypoints
      const fallbackRoute = createSmartFallbackRoute(start, center);
      
      setRouteCoords(fallbackRoute);
      setIsDirectPath(true);
      
      // Calculate approximate distance and duration
      const distance = haversine(start, center);
      setDistanceM(distance);
      setDurationS(distance / 5 * 60); // Walking speed estimate
      
      // Handle different error types
      if (e instanceof Error) {
        if (e.name === 'AbortError') {
          Alert.alert(
            t('guidance.timeoutError', 'Request Timeout'), 
            t('guidance.timeoutErrorFallback', 'Request took too long. Using approximate route.')
          );
        } else if (e.message.includes('Network') || e.message.includes('fetch')) {
          Alert.alert(
            t('guidance.networkError', 'Network Error'), 
            t('guidance.networkErrorFallback', 'No internet connection. Using approximate route.')
          );
        } else {
          Alert.alert(
            t('guidance.routeError', 'Route Error'), 
            t('guidance.routeErrorFallback', 'Unable to get detailed route. Using approximate path.')
          );
        }
      } else {
        Alert.alert(
          t('guidance.routeError', 'Route Error'), 
          t('guidance.routeErrorFallback', 'Unable to get detailed route. Using approximate path.')
        );
      }
    } finally {
      setLoading(false);
    }
  }, [center, haversine, t, findBestRoute, createSmartFallbackRoute]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('search.networkError'));
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const start = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setUserLoc(start);
      fetchRoute(start);

      watchRef.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 5, timeInterval: 2000 }, (pos) => {
        const p = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLoc(p);
        if (followingUser && mapRef.current) {
          mapRef.current.animateCamera({ center: p, zoom: 16 }, { duration: 500 });
        }
      });
    })();

    return () => {
      watchRef.current?.remove();
    };
  }, [followingUser, fetchRoute, t]);

  const latDelta = Math.max(0.0012, (maxLat - minLat) * 2.2);
  const lngDelta = Math.max(0.0012, (maxLng - minLng) * 2.2);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('guidance.title', 'التوجيه')}</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          provider={getMapProvider()}
          style={{ flex: 1 }}
          mapType={getPlatformMapViewConfig(mapType).mapType}
          initialRegion={{ latitude: center.latitude, longitude: center.longitude, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
          showsPointsOfInterest={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          showsCompass={false}
          showsScale={false}
          toolbarEnabled={false}
          cacheEnabled={true}
          loadingEnabled={true}
          loadingIndicatorColor="#00A699"
          loadingBackgroundColor="#FFF"
          liteMode={false}
          maxZoomLevel={20}
          minZoomLevel={3}
          moveOnMarkerPress={true}
        >
          <PlatformMapTileLayer mapStyle={mapType} />
          <Polygon coordinates={polyCoords} fillColor="rgba(0, 166, 153, 0.3)" strokeColor="#00A699" strokeWidth={2} />
          {routeCoords.length > 1 && (
            <Polyline 
              coordinates={routeCoords} 
              strokeColor={isDirectPath ? "#FF8C00" : "#0078FF"} 
              strokeWidth={isDirectPath ? 3 : 4}
              // strokePattern not supported in react-native-maps - using color differentiation instead
            />
          )}
          {offroad && (
            <Polyline coordinates={[offroad.start, offroad.end]} strokeColor="#FF8C00" strokeWidth={4} />
          )}
          {userLoc && (
            <Marker 
              coordinate={userLoc} 
              title={t('guidance.youAreHere', 'أنت هنا')}
              tracksViewChanges={false}
            >
              <View style={styles.userDot} />
            </Marker>
          )}
        </MapView>
        {loading && (
          <View style={styles.loadingOverlay}><ActivityIndicator color="#FFFFFF" /></View>
        )}
      </View>

      <View style={styles.infoPanel}>
        <View style={styles.infoRow}>
          <Text style={styles.infoPrimary}>
            {distanceM !== null ? `${Math.round((distanceM || 0) / 100) / 10} km` : t('guidance.calculating', 'جاري الحساب...')}
          </Text>
          <Text style={styles.infoSecondary}>
            {durationS !== null ? `${Math.round((durationS || 0) / 60)} ${t('guidance.min', 'دقيقة')}` : ''}
          </Text>
        </View>
        {isDirectPath && (
          <View style={styles.directPathIndicator}>
            <MaterialIcons name="warning" size={16} color="#FF8C00" />
            <Text style={styles.directPathText}>
              {t('guidance.directPathWarning', 'Direct path - not following roads')}
            </Text>
          </View>
        )}
        {/* Controls Row 2: Map type + Recalculate + Recenter */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => setMapType(mapType === 'satellite' ? 'standard' : 'satellite')}>
            <MaterialIcons name={mapType === 'satellite' ? 'map' : 'satellite'} size={18} color="#111827" />
            <Text style={styles.controlText}>{mapType === 'satellite' ? t('guidance.standard', 'افتراضي') : t('guidance.satellite', 'قمر صناعي')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => userLoc && fetchRoute(userLoc)}>
            <MaterialIcons name="refresh" size={18} color="#111827" />
            <Text style={styles.controlText}>{t('guidance.recalculate', 'إعادة حساب')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => {
            if (mapRef.current) mapRef.current.animateCamera({ center: userLoc || center, zoom: 16 }, { duration: 400 });
          }}>
            <MaterialIcons name="center-focus-strong" size={18} color="#111827" />
            <Text style={styles.controlText}>{t('guidance.recenter', 'إعادة تمركز')}</Text>
          </TouchableOpacity>
        </View>
        {offroad && (
          <Text style={styles.infoHint}>
            {t('guidance.offroadHint', 'قد ينتهي الطريق قبل الوصول، امشِ المسافة المتبقية')}: {Math.round(haversine(offroad.start, offroad.end))} m
          </Text>
        )}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => {
            if (mapRef.current) mapRef.current.animateToRegion({ latitude: center.latitude, longitude: center.longitude, latitudeDelta: latDelta, longitudeDelta: lngDelta }, 400);
            setFollowingUser(false);
          }}>
            <MaterialIcons name="flag" size={18} color="#111827" />
            <Text style={styles.controlText}>{t('guidance.plot', 'القطعة')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => setFollowingUser((v) => !v)}>
            <MaterialIcons name={followingUser ? 'gps-fixed' : 'gps-not-fixed'} size={18} color="#111827" />
            <Text style={styles.controlText}>{followingUser ? t('guidance.following', 'تتبع') : t('guidance.follow', 'اتبع')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => userLoc && mapRef.current?.animateCamera({ center: userLoc, zoom: 16 }, { duration: 400 })}>
            <MaterialIcons name="my-location" size={18} color="#111827" />
            <Text style={styles.controlText}>{t('guidance.myLocation', 'موقعي')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',marginTop: "15%" },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  mapWrap: { height: '62%', backgroundColor: '#000' },
  loadingOverlay: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8 },
  userDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2DD4BF', borderWidth: 2, borderColor: '#FFFFFF' },
  infoPanel: { flex: 1, paddingHorizontal: 16, paddingTop: 8, },
  infoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10,  },
  infoPrimary: { fontSize: 20, fontWeight: '800', color: '#111827',  },
  infoSecondary: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  infoHint: { marginTop: 6, color: '#9CA3AF' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  controlBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, backgroundColor: '#FAFAFA' },
  controlText: { color: '#111827', fontWeight: '700' },
  directPathIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8C00',
  },
  directPathText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
});

export default LandmarkGuidanceScreen;


