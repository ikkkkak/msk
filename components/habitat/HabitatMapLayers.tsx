/**
 * Zoom-level cadastre layers — thin consistent strokes, district color system.
 */
import React, { memo, useMemo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Polygon, Marker } from "react-native-maps";
import type {
  HabitatPlan,
  HabitatPlot,
  HabitatSector,
  HabitatMapViewLevel,
  LatLng,
} from "../../types/habitat";
import {
  extractSectorPolygons,
  plotLabelCoordinate,
  ringCentroid,
  sectorCenterCoordinate,
} from "../../utils/habitatGeometry";
import { getPlotRings } from "../../utils/habitatPlotGeometryCache";
import type { PlotShapeDescriptor } from "../../utils/habitatPlotGeometryCache";
import { resolvePlanBoundaryRings } from "../../utils/habitatPlanBoundaries";
import { displayPlotNumber } from "./cadastreFilterUtils";
import {
  habitatPlanColor,
  habitatPlanFill,
  habitatSectorFill,
  habitatSectorStroke,
  HABITAT_FOR_SALE,
  HABITAT_NEUTRAL,
  HABITAT_STROKE_WIDTH,
} from "../../utils/habitatMapTheme";
import {
  MAX_PLOT_NUMBER_LABELS,
  MAX_NATIVE_MAP_CHILDREN,
} from "../../utils/habitatMapLimits";
import {
  shouldShowPlotLabelsOnMap,
  mapZoomFromProps,
  PLAN_LAYER_MAX_ZOOM,
} from "../../utils/habitatGeo";

type DistrictFallback = { name: string; coordinates: LatLng[] };

const PLOT_SELECTED_STROKE = "#FF2D8B";
const PLOT_SELECTED_FILL = "rgba(255, 45, 139, 0.38)";

export type HabitatMapLayersProps = {
  plans: HabitatPlan[];
  sectors: HabitatSector[];
  plots?: HabitatPlot[];
  /** Pre-parsed plot polygons for pinned quartier — avoids re-parsing on every render. */
  plotShapes?: PlotShapeDescriptor[];
  viewLevel: HabitatMapViewLevel;
  selectedPlanId?: number | null;
  selectedSectorId?: number | null;
  selectedPlotId?: number | null;
  districtFallback?: DistrictFallback[];
  onPlanPress?: (planId: number) => void;
  onSectorPress?: (sectorId: number) => void;
  onPlotPress?: (plot: HabitatPlot) => void;
  selectedPlot?: HabitatPlot | null;
  mapZoom?: number;
  mapLongitudeDelta?: number;
};

function planCentroid(
  plan: HabitatPlan,
  districtFallback: DistrictFallback[],
): LatLng | null {
  const rings = resolvePlanBoundaryRings(plan, districtFallback);
  const flat = rings.flat();
  if (flat.length) return ringCentroid(flat);
  if (plan.centroid_lat != null && plan.centroid_lng != null) {
    return { latitude: plan.centroid_lat, longitude: plan.centroid_lng };
  }
  return null;
}

const NameLabel = memo(function NameLabel({
  title,
  coordinate,
  bold,
  tint,
}: {
  title: string;
  coordinate: LatLng;
  bold?: boolean;
  tint?: string;
}) {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      tappable={false}
    >
      <Text
        style={[
          styles.nameLabel,
          bold && styles.nameLabelBold,
          tint ? { color: tint } : null,
        ]}
      >
        {title}
      </Text>
    </Marker>
  );
});

const PlotLabel = memo(function PlotLabel({
  plot,
  coordinate,
  selected,
  onPress,
}: {
  plot: HabitatPlot;
  coordinate: LatLng;
  selected: boolean;
  onPress?: () => void;
}) {
  const area =
    plot.area_m2 != null
      ? Math.round(plot.area_m2)
      : plot.area_rounded != null
        ? plot.area_rounded
        : null;

  const isForSale = plot.is_for_sale === true;

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      tappable
      zIndex={selected ? 12 : 6}
      onPress={onPress}
    >
      <View
        style={[
          styles.plotLabelWrap,
          selected
            ? styles.plotLabelWrapSelected
            : isForSale
              ? styles.plotLabelWrapForSale
              : null,
        ]}
        pointerEvents="none"
      >
        <Text
          style={[
            styles.plotNumber,
            selected
              ? styles.plotNumberSelected
              : isForSale
                ? styles.plotNumberForSale
                : null,
          ]}
        >
          {displayPlotNumber(plot.plot_number)}
        </Text>
        {area != null ? (
          <Text
            style={[
              styles.plotArea,
              selected
                ? styles.plotAreaSelected
                : isForSale
                  ? styles.plotAreaForSale
                  : null,
            ]}
          >
            {area}
          </Text>
        ) : null}
      </View>
    </Marker>
  );
});

const PlanGroup = memo(function PlanGroup({
  plan,
  rings,
  center,
  selectedPlanId,
  onPlanPress,
}: {
  plan: HabitatPlan;
  rings: LatLng[][];
  center: LatLng | null;
  selectedPlanId?: number | null;
  onPlanPress?: (id: number) => void;
}) {
  const selected = selectedPlanId === plan.id;
  const stroke = habitatPlanColor(plan);
  return (
    <>
      {rings.map((ring, idx) => (
        <Polygon
          key={`habitat-plan-${plan.id}-${idx}`}
          coordinates={ring}
          strokeColor={stroke}
          strokeWidth={
            selected
              ? HABITAT_STROKE_WIDTH.planSelected
              : HABITAT_STROKE_WIDTH.plan
          }
          fillColor={habitatPlanFill(plan, selected)}
          lineJoin="round"
          lineCap="round"
          tappable
          onPress={() => onPlanPress?.(plan.id)}
        />
      ))}
      {center ? (
        <NameLabel
          title={plan.name_ar || plan.name}
          coordinate={center}
          bold
          tint={habitatPlanColor(plan)}
        />
      ) : null}
    </>
  );
});

const PlotGroup = memo(
  function PlotGroup({
    plot,
    rings,
    labelAt,
    showLabel,
    selectedPlotId,
    onPlotPress,
  }: {
    plot: HabitatPlot;
    rings: LatLng[][];
    labelAt: LatLng | null;
    showLabel: boolean;
    selectedPlotId?: number | null;
    onPlotPress?: (p: HabitatPlot) => void;
  }) {
    const selected = selectedPlotId === plot.id;
    const isForSale = plot.is_for_sale === true;
    return (
      <>
        {rings.map((ring, idx) => (
          <Polygon
            key={`habitat-plot-poly-${plot.id}-${idx}`}
            coordinates={ring}
            strokeColor={
              selected
                ? PLOT_SELECTED_STROKE
                : isForSale
                  ? HABITAT_FOR_SALE.plotStroke
                  : HABITAT_NEUTRAL.plotStroke
            }
            strokeWidth={
              selected
                ? HABITAT_STROKE_WIDTH.plotSelected
                : HABITAT_STROKE_WIDTH.plot
            }
            fillColor={
              selected
                ? PLOT_SELECTED_FILL
                : isForSale
                  ? HABITAT_FOR_SALE.plotFill
                  : HABITAT_NEUTRAL.plotFill
            }
            lineJoin="miter"
            lineCap="butt"
            tappable
            onPress={() => onPlotPress?.(plot)}
          />
        ))}
        {labelAt && showLabel ? (
          <PlotLabel
            plot={plot}
            coordinate={labelAt}
            selected={selected}
            onPress={() => onPlotPress?.(plot)}
          />
        ) : null}
      </>
    );
  },
  (prev, next) =>
    prev.plot.id === next.plot.id &&
    prev.rings === next.rings &&
    prev.labelAt === next.labelAt &&
    prev.showLabel === next.showLabel &&
    prev.selectedPlotId === next.selectedPlotId,
);

function HabitatMapLayersInner({
  plans,
  sectors,
  plots = [],
  plotShapes,
  viewLevel: _viewLevel,
  selectedPlanId = null,
  selectedSectorId = null,
  selectedPlotId = null,
  districtFallback = [],
  onPlanPress,
  onSectorPress,
  onPlotPress,
  selectedPlot = null,
  mapZoom = 10,
  mapLongitudeDelta,
}: HabitatMapLayersProps) {
  const z = mapZoomFromProps(mapZoom, mapLongitudeDelta);
  const quartierPinned = selectedSectorId != null;

  const showPlanLayer =
    !quartierPinned && selectedPlanId == null && z <= PLAN_LAYER_MAX_ZOOM;
  const showPlots = quartierPinned || z >= 17;

  const labelsZoomOk = shouldShowPlotLabelsOnMap(mapZoom, mapLongitudeDelta);
  const plotCount = plotShapes?.length ?? plots.length;
  const showPlotLabels =
    showPlots && labelsZoomOk && plotCount <= MAX_PLOT_NUMBER_LABELS;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? undefined;

  const planPolygons = useMemo(() => {
    if (!showPlanLayer) return [];
    return plans
      .map((plan) => ({
        plan,
        rings: resolvePlanBoundaryRings(plan, districtFallback),
        center: planCentroid(plan, districtFallback),
      }))
      .filter((x) => x.rings.length > 0);
  }, [plans, districtFallback, showPlanLayer]);

  const highlightedSector = useMemo(() => {
    if (!quartierPinned || selectedSectorId == null) return null;
    const sector = sectors.find((s) => s.id === selectedSectorId);
    if (!sector) return null;
    const rings = extractSectorPolygons(sector);
    return rings.length ? { sector, rings } : null;
  }, [quartierPinned, selectedSectorId, sectors]);

  const plotShapesResolved = useMemo(() => {
    if (!showPlots) return [];
    // Empty array is intentional — never fall back to rendering every loaded plot.
    if (plotShapes != null) return plotShapes;
    const out: PlotShapeDescriptor[] = [];
    const cap = Math.min(plots.length, MAX_NATIVE_MAP_CHILDREN);
    for (let i = 0; i < cap; i++) {
      const plot = plots[i]!;
      const rings = getPlotRings(plot);
      const labelAt = plotLabelCoordinate(plot);
      if (rings.length) out.push({ plot, rings, labelAt });
      else if (labelAt) out.push({ plot, rings: [], labelAt });
    }
    return out;
  }, [plotShapes, plots, showPlots]);

  const totalNativeChildren = useMemo(() => {
    let n = 0;
    for (const shape of plotShapesResolved) {
      n += Math.max(1, shape.rings.length);
      if (shape.labelAt) n += 1;
    }
    return n;
  }, [plotShapesResolved]);

  const plotShapesDrawn = useMemo(() => {
    if (quartierPinned && plotShapes != null) {
      return plotShapes;
    }
    if (totalNativeChildren <= MAX_NATIVE_MAP_CHILDREN) {
      return plotShapesResolved;
    }
    const out: PlotShapeDescriptor[] = [];
    let n = 0;
    for (const shape of plotShapesResolved) {
      const cost = Math.max(1, shape.rings.length) + (shape.labelAt ? 1 : 0);
      if (n + cost > MAX_NATIVE_MAP_CHILDREN) break;
      out.push(shape);
      n += cost;
    }
    return out;
  }, [plotShapesResolved, totalNativeChildren, quartierPinned, plotShapes]);

  const renderPlanGroups = useCallback(() => {
    return planPolygons.map(({ plan, rings, center }) => (
      <PlanGroup
        key={`plan-group-${plan.id}`}
        plan={plan}
        rings={rings}
        center={center}
        selectedPlanId={selectedPlanId}
        onPlanPress={onPlanPress}
      />
    ));
  }, [planPolygons, selectedPlanId, onPlanPress]);

  const renderHighlighted = useCallback(() => {
    if (!highlightedSector) return null;
    const { sector, rings } = highlightedSector;
    return (
      <>
        {rings.map((ring, idx) => (
          <Polygon
            key={`habitat-sector-highlight-${sector.id}-${idx}`}
            coordinates={ring}
            strokeColor={habitatSectorStroke(selectedPlan, true)}
            strokeWidth={2.4}
            fillColor="rgba(37, 99, 235, 0.08)"
            lineJoin="round"
          />
        ))}
      </>
    );
  }, [highlightedSector, selectedPlan]);

  const renderPlotGroups = useCallback(() => {
    return plotShapesDrawn.map(({ plot, rings, labelAt }) => (
      <PlotGroup
        key={`habitat-plot-${plot.id}`}
        plot={plot}
        rings={rings}
        labelAt={labelAt}
        showLabel={
          showPlotLabels &&
          plot.id !== selectedPlotId &&
          plot.id !== selectedPlot?.id
        }
        selectedPlotId={selectedPlotId}
        onPlotPress={onPlotPress}
      />
    ));
  }, [
    plotShapesDrawn,
    selectedPlotId,
    selectedPlot?.id,
    showPlotLabels,
    onPlotPress,
  ]);

  if (!showPlanLayer && !showPlots && !highlightedSector) {
    return null;
  }

  return (
    <>
      {renderPlanGroups()}
      {renderHighlighted()}
      {renderPlotGroups()}
    </>
  );
}

export const HabitatMapLayers = memo(HabitatMapLayersInner);

const styles = StyleSheet.create({
  nameLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: HABITAT_NEUTRAL.label,
    textAlign: "center",
    maxWidth: 120,
    textShadowColor: "rgba(255,255,255,0.98)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  nameLabelBold: {
    fontSize: 12,
    fontWeight: "800",
  },
  plotLabelWrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.15)",
    minWidth: 28,
  },
  plotLabelWrapSelected: {
    backgroundColor: "#FF2D8B",
    borderColor: "#FF2D8B",
  },
  plotLabelWrapForSale: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  plotNumber: {
    fontSize: 8,
    fontWeight: "800",
    color: "#374151",
  },
  plotNumberSelected: {
    color: "#FFFFFF",
  },
  plotNumberForSale: {
    color: "#FFFFFF",
  },
  plotArea: {
    fontSize: 6,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 1,
  },
  plotAreaSelected: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  plotAreaForSale: {
    color: "rgba(255, 255, 255, 0.9)",
  },
});
