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
} from '../config/tileServerConfig';

interface PlotData {
  plot_number: string;
  area_sqm?: number;
  status?: string;
  zone?: string;
  price_mru?: number;
}

interface OSMPlotMapScreenProps {
  onPlotSelect?: (plot: PlotData) => void;
}

export const OSMPlotMapScreen: React.FC<OSMPlotMapScreenProps> = ({
  onPlotSelect,
}) => {
  const { t } = useTranslation();
  const mapRef = useRef<MapLibreGL.MapView>(null);
  const cameraRef = useRef<MapLibreGL.Camera>(null);

  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(MAP_CENTER.zoom);
  const [filters, setFilters] = useState<{ status: string }>({ status: 'all' });

  const flyTo = useCallback((lng: number, lat: number, z: number = 14) => {
    if (cameraRef.current) {
      cameraRef.current.flyTo([lng, lat], 1000);
      cameraRef.current.zoomTo(z, 1000);
    }
  }, []);

  const handleMapReady = useCallback(() => {
    setIsLoading(false);
    flyTo(MAP_CENTER.lng, MAP_CENTER.lat, MAP_CENTER.zoom);
  }, [flyTo]);

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
        <MapLibreGL.ShapeSource
          id="plots-source"
          url={GEOJSON_URL}
        >
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
      {isLoading && (
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

      {/* DETAIL CARD */}
      {selectedPlot && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailTitle}>
                Parcelle #{selectedPlot.plot_number}
              </Text>
              {selectedPlot.zone && (
                <Text style={styles.detailZone}>{selectedPlot.zone}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedPlot(null)}>
              <X size={24} color="#666" weight="bold" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailContent}>
            {selectedPlot.area_sqm && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Superficie</Text>
                <Text style={styles.detailValue}>
                  {selectedPlot.area_sqm} m²
                </Text>
              </View>
            )}

            {selectedPlot.status && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Statut</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        MAP_COLORS[selectedPlot.status] || MAP_COLORS.available,
                    },
                  ]}
                >
                  {selectedPlot.status.toUpperCase()}
                </Text>
              </View>
            )}

            {selectedPlot.price_mru && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Prix</Text>
                <Text style={styles.detailValue}>
                  {selectedPlot.price_mru.toLocaleString('fr-FR')} MRU
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              onPlotSelect?.(selectedPlot);
            }}
          >
            <Text style={styles.actionBtnText}>Voir Détails →</Text>
          </TouchableOpacity>
        </View>
      )}
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
  detailCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  detailZone: {
    fontSize: 13,
    color: '#64748B',
  },
  detailContent: {
    gap: 10,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionBtn: {
    backgroundColor: MAP_COLORS.selected,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
