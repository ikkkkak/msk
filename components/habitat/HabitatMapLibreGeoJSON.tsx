import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { X } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import {
  GEOJSON_URL,
  MAP_COLORS,
  MAP_CENTER,
} from '../../config/tileServerConfig';
import type { HabitatPlot } from '../../types/habitat';

interface HabitatMapLibreGeoJSONProps {
  mapRef?: React.RefObject<any>;
  initialRegion?: any;
  plots?: HabitatPlot[];
  selectedPlotId?: number | null;
  onPlotPress?: (plot: HabitatPlot) => void;
  loadingPlots?: boolean;
}

export const HabitatMapLibreGeoJSON: React.FC<HabitatMapLibreGeoJSONProps> = ({
  initialRegion,
  selectedPlotId,
  onPlotPress,
  loadingPlots,
}) => {
  const { t } = useTranslation();
  const mapRef = useRef<MapLibreGL.MapView>(null);
  const cameraRef = useRef<MapLibreGL.Camera>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(MAP_CENTER.zoom);
  const [selectedPlot, setSelectedPlot] = useState<HabitatPlot | null>(null);
  const [filters, setFilters] = useState<{ status: string }>({ status: 'all' });

  const handleMapReady = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleRegionChange = useCallback((region: any) => {
    if (region?.properties?.zoom) {
      setZoom(Math.round(region.properties.zoom));
    }
  }, []);

  const filterExpression = useMemo(() => {
    if (filters.status === 'all') {
      return ['all'];
    }
    return ['==', ['get', 'status'], filters.status];
  }, [filters.status]);

  return (
    <View style={styles.container}>
      {/* MAP */}
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="https://demotiles.maplibre.org/style.json"
        onDidFinishLoadingMap={handleMapReady}
        onRegionDidChange={handleRegionChange}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          centerCoordinate={[MAP_CENTER.lng, MAP_CENTER.lat]}
          zoomLevel={MAP_CENTER.zoom}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* GEOJSON SOURCE - client-side rendering */}
        <MapLibreGL.ShapeSource id="plots-source" url={GEOJSON_URL}>
          {/* PLOT FILLS (colored by status) */}
          <MapLibreGL.FillLayer
            id="plot-fills"
            sourceID="plots-source"
            filter={filterExpression}
            style={{
              fillColor: [
                'match',
                ['get', 'status'],
                'available',
                MAP_COLORS.available,
                'reserved',
                MAP_COLORS.reserved,
                'sold',
                MAP_COLORS.sold,
                '#D1D5DB',
              ],
              fillOpacity: 0.7,
            }}
          />

          {/* PLOT BOUNDARIES */}
          <MapLibreGL.LineLayer
            id="plot-lines"
            sourceID="plots-source"
            filter={filterExpression}
            style={{
              lineColor: MAP_COLORS.boundary,
              lineWidth: [
                'interpolate',
                ['linear'],
                ['zoom'],
                10,
                0.5,
                12,
                1,
                14,
                1.5,
                16,
                2.5,
              ],
              lineOpacity: 0.85,
            }}
          />

          {/* PLOT LABELS (high zoom only) */}
          <MapLibreGL.SymbolLayer
            id="plot-labels"
            sourceID="plots-source"
            filter={filterExpression}
            minZoomLevel={14}
            style={{
              textField: ['get', 'plot_number'],
              textSize: [
                'interpolate',
                ['linear'],
                ['zoom'],
                14,
                10,
                16,
                14,
              ],
              textColor: MAP_COLORS.text,
              textHaloColor: 'rgba(0,0,0,0.6)',
              textHaloWidth: 2,
            }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>

      {/* LOADING OVERLAY */}
      {(isLoading || loadingPlots) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={MAP_COLORS.selected} />
          <Text style={styles.loadingText}>
            {t('common.loading', 'Chargement...')}
          </Text>
        </View>
      )}

      {/* FILTER BAR */}
      <View style={styles.filterBar}>
        {['all', 'available', 'reserved', 'sold'].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilters({ status })}
            style={[
              styles.filterBtn,
              filters.status === status && styles.filterBtnActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filters.status === status && styles.filterTextActive,
              ]}
            >
              {status === 'all'
                ? 'Tous'
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ZOOM INDICATOR */}
      <View style={styles.zoomBadge}>
        <Text style={styles.zoomText}>z{zoom}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#475569',
  },
  filterBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  filterBtnActive: {
    backgroundColor: MAP_COLORS.selected,
    borderColor: MAP_COLORS.selected,
  },
  filterText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFF',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  zoomText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
