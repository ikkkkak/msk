/**
 * Professional Interactive Offer Price Chart Component
 * Visualizes property sale offers over time with smooth animations and interactions
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Svg, { G, Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_MARGIN = { top: 15, right: 15, bottom: 45, left: 58 }; // Increased left margin for price labels
const CHART_HEIGHT = 180; // Reduced from 280
const CHART_WIDTH = SCREEN_WIDTH - 32 - CHART_MARGIN.left - CHART_MARGIN.right;

interface Offer {
  id?: number;
  price?: number;
  amount?: number; // Server uses "amount" - this is the primary field
  offer_price?: number;
  submitted_at?: string; // ISO date string
  created_at?: string; // Server uses "created_at" - this is the primary field
  status?: string;
  date?: Date; // Added by processing
  [key: string]: any; // Allow other fields
}

interface OfferPriceChartProps {
  offers: Offer[];
  propertyId: number;
  /** Current listing ask price — shown as the baseline point on the chart */
  listingPrice?: number | null;
  /** When the property was listed (ISO) */
  listedAt?: string | null;
}

interface Point {
  x: number;
  y: number;
  offer: Offer;
  index: number;
}

export const OfferPriceChart: React.FC<OfferPriceChartProps> = ({
  offers,
  propertyId,
  listingPrice,
  listedAt,
}) => {
  const { t } = useTranslation();
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.95), []);
  const tooltipOpacity = useMemo(() => new Animated.Value(0), []);
  const tooltipScale = useMemo(() => new Animated.Value(0.8), []);

  // Parse and sort offers by date
  const processedData = useMemo(() => {
    if (!offers || offers.length === 0) {
      return {
        points: [] as Point[],
        chartMin: 0,
        chartMax: 0,
        minDate: null as Date | null,
        maxDate: null as Date | null,
        validOffers: [] as Array<Offer & { date: Date; price: number }>,
      };
    }

    const validOffers = offers
      .filter((offer: Offer) => {
        const price = offer.price || offer.amount || offer.offer_price;
        const date = offer.submitted_at || offer.created_at;
        return price && date && Number(price) > 0;
      })
      .map((offer: Offer) => ({
        ...offer,
        date: new Date(offer.submitted_at || offer.created_at || Date.now()),
        price: Number(offer.price || offer.amount || offer.offer_price || 0),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    type ChartRow = Offer & { date: Date; price: number; isListing?: boolean };
    const chartRows: ChartRow[] = [...validOffers];

    const ask = Number(listingPrice ?? 0);
    if (ask > 0) {
      const listedDate = listedAt ? new Date(listedAt) : validOffers[0]?.date;
      const hasListingPoint = chartRows.some(
        (row) => row.isListing || Math.abs(row.price - ask) < 0.01,
      );
      if (listedDate && !Number.isNaN(listedDate.getTime()) && !hasListingPoint) {
        chartRows.unshift({
          id: -propertyId,
          price: ask,
          amount: ask,
          date: listedDate,
          status: "listing",
          isListing: true,
        });
      }
    }

    chartRows.sort((a, b) => a.date.getTime() - b.date.getTime());

    if (chartRows.length === 0) {
      return {
        points: [] as Point[],
        chartMin: 0,
        chartMax: 0,
        minDate: null as Date | null,
        maxDate: null as Date | null,
        validOffers: [] as Array<Offer & { date: Date; price: number }>,
      };
    }

    const prices = chartRows.map((o) => o.price);
    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    const rawRange = rawMax - rawMin;
    const pad =
      rawRange > 0 ? rawRange * 0.12 : Math.max(rawMin * 0.05, 1000);
    const chartMin = rawMin - pad;
    const chartMax = rawMax + pad;
    const chartRange = chartMax - chartMin || 1;

    const dates = chartRows.map((o) => o.date);
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    const timeSpan = maxDate.getTime() - minDate.getTime();
    const useTimeScale = timeSpan > 0 && chartRows.length > 1;

    const points: Point[] = chartRows.map((offer, index) => {
      const x = useTimeScale
        ? CHART_MARGIN.left +
          ((offer.date.getTime() - minDate.getTime()) / timeSpan) * CHART_WIDTH
        : CHART_MARGIN.left +
          (index / Math.max(chartRows.length - 1, 1)) * CHART_WIDTH;
      const y =
        CHART_MARGIN.top +
        CHART_HEIGHT -
        ((offer.price - chartMin) / chartRange) * CHART_HEIGHT;

      return { x, y, offer, index };
    });

    return {
      points,
      chartMin,
      chartMax,
      minDate,
      maxDate,
      validOffers: chartRows,
    };
  }, [offers, listingPrice, listedAt, propertyId]);

  // Generate smooth line path
  const linePath = useMemo(() => {
    if (processedData.points.length === 0) return '';

    const points = processedData.points;
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    // Create smooth bezier curve
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      path += ` C ${current.x} ${current.y}, ${midX} ${current.y}, ${midX} ${(current.y + next.y) / 2}`;
      path += ` C ${midX} ${(current.y + next.y) / 2}, ${midX} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
  }, [processedData.points]);

  // Format date for display
  const formatDate = useCallback((date: Date) => {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }, []);

  // Format price for display (with MRU)
  const formatPrice = useCallback((price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M MRU`;
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K MRU`;
    return `${price.toLocaleString()} MRU`;
  }, []);

  // Format price for Y-axis labels (compact, no MRU)
  const formatPriceCompact = useCallback((price: number) => {
    if (price >= 1000000) {
      const value = price / 1000000;
      return value >= 1 ? `${value.toFixed(1)}M` : `${value.toFixed(2)}M`;
    }
    if (price >= 1000) {
      return `${Math.round(price / 1000)}K`;
    }
    return `${Math.round(price)}`;
  }, []);

  // Handle point tap
  const handlePointPress = useCallback(
    (point: Point) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setSelectedPoint(point);
      setTooltipVisible(true);

      Animated.parallel([
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(tooltipScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [tooltipOpacity, tooltipScale]
  );

  // Dismiss tooltip
  const dismissTooltip = useCallback(() => {
    Animated.parallel([
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTooltipVisible(false);
      setSelectedPoint(null);
    });
  }, [tooltipOpacity, tooltipScale]);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  // Generate Y-axis labels
  const yAxisLabels = useMemo(() => {
    if (processedData.points.length === 0) return [];
    const { chartMin, chartMax } = processedData;
    const steps = 5;
    const labels = [];

    for (let i = 0; i <= steps; i++) {
      const value = chartMin + ((chartMax - chartMin) / steps) * (steps - i);
      labels.push({
        value,
        y: CHART_MARGIN.top + (CHART_HEIGHT / steps) * i,
      });
    }

    return labels;
  }, [processedData]);

  // Generate X-axis labels
  const xAxisLabels = useMemo(() => {
    if (processedData.points.length === 0 || !processedData.minDate || !processedData.maxDate)
      return [];

    const steps = Math.min(5, processedData.points.length);
    const labels = [];

    if (steps <= 1) {
      const point = processedData.points[0];
      if (point) {
        labels.push({ date: point.offer.date, x: point.x });
      }
      return labels;
    }

    for (let i = 0; i < steps; i++) {
      const index = Math.floor((i / (steps - 1)) * (processedData.points.length - 1));
      const point = processedData.points[index];
      if (point) {
        labels.push({
          date: point.offer.date,
          x: point.x,
        });
      }
    }

    return labels;
  }, [processedData]);

  // Always show the chart container, even with 0 offers (chart will be empty but structure is visible)

  const chartWidth = SCREEN_WIDTH - 32;
  const chartHeight = CHART_HEIGHT + CHART_MARGIN.top + CHART_MARGIN.bottom;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('sale.priceTrendOverTime', 'Price Trend Over Time')}</Text>
        <Text style={styles.subtitle}>
          {t('sale.offersSubmitted', {
            count: processedData.points.length,
            defaultValue: `${processedData.points.length} offer${processedData.points.length !== 1 ? 's' : ''} submitted`
          })}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.chartContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Svg width={chartWidth} height={chartHeight}>
          <G>
            {/* Grid lines - horizontal */}
            {yAxisLabels.map((label, index) => (
              <Line
                key={`grid-h-${index}`}
                x1={CHART_MARGIN.left}
                y1={label.y}
                x2={chartWidth - CHART_MARGIN.right}
                y2={label.y}
                stroke="#F3F4F6"
                strokeWidth={1}
              />
            ))}

            {/* Grid lines - vertical */}
            {xAxisLabels.map((label, index) => (
              <Line
                key={`grid-v-${index}`}
                x1={label.x}
                y1={CHART_MARGIN.top}
                x2={label.x}
                y2={CHART_HEIGHT + CHART_MARGIN.top}
                stroke="#F3F4F6"
                strokeWidth={1}
              />
            ))}

            {/* Y-axis labels */}
            {yAxisLabels.map((label, index) => (
              <G key={`y-label-${index}`}>
                <SvgText
                  x={CHART_MARGIN.left - 12}
                  y={label.y + 4}
                  fontSize={9}
                  fill="#6B7280"
                  textAnchor="end"
                  fontWeight="500"
                >
                  {formatPriceCompact(label.value)}
                </SvgText>
              </G>
            ))}

            {/* X-axis labels */}
            {xAxisLabels.map((label, index) => (
              <G key={`x-label-${index}`}>
                <SvgText
                  x={label.x}
                  y={CHART_HEIGHT + CHART_MARGIN.top + 16}
                  fontSize={9}
                  fill="#6B7280"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {formatDate(label.date).split(',')[0]}
                </SvgText>
              </G>
            ))}

            {/* Trend line */}
            {processedData.points.length > 1 && (
              <Path
                d={linePath}
                fill="none"
                stroke={theme['color-temporary-primary']}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {processedData.points.map((point, index) => {
              const isSelected = selectedPoint?.index === point.index;
              const isListing = !!(point.offer as Offer & { isListing?: boolean }).isListing;
              const pointColor = isListing ? "#64748B" : theme['color-temporary-primary'];
              return (
                <G key={`point-${point.offer.id || index}`}>
                  {isSelected && (
                    <>
                      <Line
                        x1={point.x}
                        y1={point.y}
                        x2={point.x}
                        y2={CHART_HEIGHT + CHART_MARGIN.top}
                        stroke={pointColor}
                        strokeWidth={1.5}
                        strokeDasharray="4,4"
                        opacity={0.4}
                      />
                    </>
                  )}

                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r={isSelected ? 8 : isListing ? 6 : 5}
                    fill={isSelected ? pointColor : isListing ? "#64748B" : "#FFF"}
                    stroke={pointColor}
                    strokeWidth={isSelected ? 3 : 2.5}
                    onPress={() => handlePointPress(point)}
                  />

                  {/* Touch target (larger, invisible) */}
                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r={18}
                    fill="transparent"
                    onPress={() => handlePointPress(point)}
                  />
                </G>
              );
            })}
          </G>
        </Svg>

        {/* Tooltip */}
        {tooltipVisible && selectedPoint && (
          <TouchableOpacity
            activeOpacity={1}
            style={styles.tooltipOverlay}
            onPress={dismissTooltip}
          >
            <Animated.View
              style={[
                styles.tooltip,
                {
                  left: Math.max(
                    16,
                    Math.min(selectedPoint.x - 80, SCREEN_WIDTH - 192)
                  ),
                  top: Math.max(16, selectedPoint.y - 100),
                  opacity: tooltipOpacity,
                  transform: [{ scale: tooltipScale }],
                },
              ]}
            >
              <View style={styles.tooltipHeader}>
                <Text style={styles.tooltipTitle}>{t('sale.offerDetails', 'Offer Details')}</Text>
                <TouchableOpacity onPress={dismissTooltip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.tooltipClose}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tooltipContent}>
                <View style={styles.tooltipRow}>
                  <Text style={styles.tooltipLabel}>{t('sale.price', 'Price')}</Text>
                  <Text style={styles.tooltipValue}>{formatPrice(selectedPoint.offer.price)}</Text>
                </View>
                <View style={styles.tooltipRow}>
                  <Text style={styles.tooltipLabel}>{t('sale.date', 'Date')}</Text>
                  <Text style={styles.tooltipValue}>
                    {formatDate(selectedPoint.offer.date)}
                  </Text>
                </View>
                {selectedPoint.offer.status && (
                  <View style={styles.tooltipRow}>
                    <Text style={styles.tooltipLabel}>{t('sale.status', 'Status')}</Text>
                    <Text style={[styles.tooltipValue, styles.tooltipStatus]}>
                      {selectedPoint.offer.status}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Legend/Stats - More compact */}
      {processedData.points.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('sale.low', 'Low')}</Text>
            <Text style={styles.statValue}>
              {formatPrice(Math.min(...processedData.points.map((p) => p.offer.price)))}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('sale.avg', 'Avg')}</Text>
            <Text style={styles.statValue}>
              {formatPrice(
                Math.round(
                  processedData.points.reduce((sum, p) => sum + p.offer.price, 0) /
                    processedData.points.length
                )
              )}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('sale.high', 'High')}</Text>
            <Text style={styles.statValue}>
              {formatPrice(Math.max(...processedData.points.map((p) => p.offer.price)))}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  tooltipOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    minWidth: 160,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tooltipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  tooltipClose: {
    fontSize: 24,
    color: '#9CA3AF',
    lineHeight: 20,
    fontWeight: '300',
  },
  tooltipContent: {
    gap: 8,
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tooltipLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  tooltipStatus: {
    textTransform: 'capitalize',
    color: theme['color-temporary-primary'],
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});

