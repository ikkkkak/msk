/**
 * Zoom-level cadastre layers — thin consistent strokes, district color system.
 * Uses clustering + viewport filtering to handle 7,000+ plots without crashing.
 */
import React, { memo, useMemo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Polygon, Marker, type Region } from "react-native-maps";
import type {
  HabitatPlan,
  HabitatPlot,
  HabitatSector,
  HabitatSubSector,
  HabitatMapViewLevel,
  LatLng,
} from "../../types/habitat";
import {
  safeSectorDisplayPolygons,
  plotLabelCoordinate,
  ringCentroid,
  sectorCenterCoordinate,
} from "../../utils/habitatGeometry";
import { getPlotRings, type PlotShapeDescriptor } from "../../utils/habitatPlotGeometryCache";
import { capPlotShapesForSector } from "../../utils/habitatViewportPlots";
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
  MAX_SECTORS_DRAWN,
} from "../../utils/habitatMapLimits";
import {
  shouldShowPlotLabelsOnMap,
  mapZoomFromProps,
  PLAN_LAYER_MAX_ZOOM,
} from "../../utils/habitatGeo";
import {
  filterViewportPlots,
  simplifyRing,
  type PlotCluster,
} from "../../utils/habitatClusteringStrategy";
import { theme } from "../../theme";

const SUB_SECTOR_ACCENT = theme["color-temporary-primary"];

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
  /** Ilot subdivisions of the pinned quartier — only rendered when non-empty and none selected yet. */
  subSectors?: HabitatSubSector[];
  selectedSubSectorId?: number | null;
  districtFallback?: DistrictFallback[];
  onPlanPress?: (planId: number) => void;
  onSectorPress?: (sectorId: number) => void;
  onSubSectorPress?: (subSectorId: number) => void;
  onPlotPress?: (plot: HabitatPlot) => void;
  selectedPlot?: HabitatPlot | null;
  mapZoom?: number;
  mapLongitudeDelta?: number;
  mapRegion?: Region;
  mapNavigating?: boolean;
  loadingPlots?: boolean;
  plotsGeometryReady?: boolean;
  plotsRevealReady?: boolean;
  /** True when a raster/vector overlay already draws plot polygons — skip native <Polygon> plot rendering here (plan/sector layers still render). */
  plotsRenderedExternally?: boolean;
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

/**
 * Sub-sectors ("Ilot" subdivisions) have no polygon boundary of their own —
 * only a centroid — so they render as a tappable named pill (like a mini
 * quartier pin) rather than a filled region like plans/sectors.
 */
const SubSectorMarker = memo(function SubSectorMarker({
  subSector,
  coordinate,
  onPress,
}: {
  subSector: HabitatSubSector;
  coordinate: LatLng;
  onPress?: (subSectorId: number) => void;
}) {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      tappable
      zIndex={8}
      onPress={() => onPress?.(subSector.id)}
    >
      <View style={styles.subSectorPill} pointerEvents="none">
        <Text style={styles.subSectorName} numberOfLines={1}>
          {subSector.name}
        </Text>
        {subSector.plot_count != null ? (
          <Text style={styles.subSectorCount}>{subSector.plot_count}</Text>
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

const SectorGroup = memo(function SectorGroup({
  sector,
  plan,
  selected,
  onSectorPress,
}: {
  sector: HabitatSector;
  plan?: HabitatPlan;
  selected?: boolean;
  onSectorPress?: (sectorId: number) => void;
}) {
  const rings = safeSectorDisplayPolygons(sector);
  const center = sectorCenterCoordinate(sector);
  if (rings.length === 0) return null;
  return (
    <>
      {rings.map((ring, idx) => (
        <Polygon
          key={`habitat-sector-${sector.id}-${idx}`}
          coordinates={ring}
          strokeColor={habitatSectorStroke(plan, selected)}
          strokeWidth={selected ? 2.4 : 1.6}
          fillColor={habitatSectorFill(plan, selected)}
          lineJoin="round"
          lineCap="round"
          tappable={!!onSectorPress}
          onPress={() => onSectorPress?.(sector.id)}
        />
      ))}
      {center ? (
        <NameLabel
          title={sector.name_ar || sector.name}
          coordinate={center}
          bold={selected}
        />
      ) : null}
    </>
  );
});

function HabitatMapLayersInner({
  plans,
  sectors,
  plots = [],
  plotShapes,
  viewLevel: _viewLevel,
  selectedPlanId = null,
  selectedSectorId = null,
  selectedPlotId = null,
  subSectors = [],
  selectedSubSectorId = null,
  districtFallback = [],
  onPlanPress,
  onSectorPress,
  onSubSectorPress,
  onPlotPress,
  selectedPlot = null,
  mapZoom = 10,
  mapLongitudeDelta,
  mapRegion,
  mapNavigating = false,
  loadingPlots = false,
  plotsGeometryReady = true,
  plotsRevealReady = true,
  plotsRenderedExternally = false,
}: HabitatMapLayersProps) {
  const z = mapZoomFromProps(mapZoom, mapLongitudeDelta);
  const quartierPinned = selectedSectorId != null;
  const zoneSelected = selectedPlanId != null;
  const mapSettled = !mapNavigating;

  // District (plan) polygons at city zoom — Tevragh Zeina / Teyarett / Ksar
  // etc. as colored shapes with name labels — are intentionally never shown:
  // the map stays clean until the user picks a zone via filter or search.
  const showCityPlans = false;
  const showZoneContext =
    zoneSelected && !quartierPinned && z <= PLAN_LAYER_MAX_ZOOM + 2;
  const showPlots =
    !plotsRenderedExternally &&
    quartierPinned &&
    mapSettled &&
    !loadingPlots &&
    plotsGeometryReady &&
    plotsRevealReady;
  const showSubSectors =
    quartierPinned && selectedSubSectorId == null && subSectors.length > 0;

  const labelsZoomOk = shouldShowPlotLabelsOnMap(mapZoom, mapLongitudeDelta);
  const plotCount = plotShapes?.length ?? plots.length;
  const showPlotLabels =
    showPlots && labelsZoomOk && plotCount <= MAX_PLOT_NUMBER_LABELS;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? undefined;

  const planPolygons = useMemo(() => {
    if (showCityPlans) {
      return plans
        .map((plan) => ({
          plan,
          rings: resolvePlanBoundaryRings(plan, districtFallback),
          center: planCentroid(plan, districtFallback),
        }))
        .filter((x) => x.rings.length > 0);
    }
    if (showZoneContext && selectedPlanId != null) {
      const plan = plans.find((p) => p.id === selectedPlanId);
      if (!plan) return [];
      const rings = resolvePlanBoundaryRings(plan, districtFallback);
      if (!rings.length) return [];
      return [
        {
          plan,
          rings,
          center: planCentroid(plan, districtFallback),
        },
      ];
    }
    return [];
  }, [plans, districtFallback, showCityPlans, showZoneContext, selectedPlanId]);

  const zoneSectorPolygons = useMemo(() => {
    if (!showZoneContext) return [];
    return sectors
      .slice(0, MAX_SECTORS_DRAWN)
      .map((sector) => ({
        sector,
        rings: safeSectorDisplayPolygons(sector),
      }))
      .filter((x) => x.rings.length > 0);
  }, [showZoneContext, sectors]);

  const highlightedSector = useMemo(() => {
    if (!quartierPinned || selectedSectorId == null || loadingPlots) return null;
    const sector = sectors.find((s) => s.id === selectedSectorId);
    if (!sector) return null;
    const rings = safeSectorDisplayPolygons(sector);
    return rings.length ? { sector, rings } : null;
  }, [quartierPinned, selectedSectorId, sectors, loadingPlots]);

  const plotShapesResolved = useMemo(() => {
    if (!showPlots || !mapRegion) return [];
    if (plotShapes != null) return plotShapes;

    // Smart viewport filtering: cluster at low zoom, filter to visible at high zoom
    const filtered = filterViewportPlots(plots, mapRegion, z);

    const out: PlotShapeDescriptor[] = [];

    // Render individual plots (high zoom)
    for (const plot of filtered.individual) {
      let rings = getPlotRings(plot);
      // Simplify geometry to reduce native render cost
      rings = rings.map((ring) => simplifyRing(ring));
      const labelAt = plotLabelCoordinate(plot);
      if (rings.length) out.push({ plot, rings, labelAt });
      else if (labelAt) out.push({ plot, rings: [], labelAt });
    }

    // Render cluster markers (low zoom)
    for (const cluster of filtered.clusters) {
      const clusterPlot: HabitatPlot = {
        ...(cluster.plots[0] || {
          id: 0,
          plan_id: 0,
          sector_id: 0,
          centroid_lat: cluster.center.latitude,
          centroid_lng: cluster.center.longitude,
          plot_number: "",
        }),
        centroid_lat: cluster.center.latitude,
        centroid_lng: cluster.center.longitude,
        plot_number: `${cluster.count} plots`,
      };
      const labelAt = cluster.center;
      out.push({ plot: clusterPlot, rings: [], labelAt });
    }

    return capPlotShapesForSector(out);
  }, [plotShapes, plots, showPlots, mapRegion, z]);

  const plotShapesDrawn = useMemo(() => {
    const source =
      quartierPinned && plotShapes != null ? plotShapes : plotShapesResolved;
    return capPlotShapesForSector(source);
  }, [plotShapesResolved, quartierPinned, plotShapes]);

  const subSectorMarkers = useMemo(() => {
    if (!showSubSectors) return [];
    return subSectors
      .map((s) => {
        const coordinate =
          s.centroid_lat != null && s.centroid_lng != null
            ? { latitude: s.centroid_lat, longitude: s.centroid_lng }
            : null;
        return coordinate ? { subSector: s, coordinate } : null;
      })
      .filter(
        (x): x is { subSector: HabitatSubSector; coordinate: LatLng } =>
          x != null,
      );
  }, [showSubSectors, subSectors]);

  const renderSubSectors = useCallback(() => {
    return subSectorMarkers.map(({ subSector, coordinate }) => (
      <SubSectorMarker
        key={`sub-sector-${subSector.id}`}
        subSector={subSector}
        coordinate={coordinate}
        onPress={onSubSectorPress}
      />
    ));
  }, [subSectorMarkers, onSubSectorPress]);

  const renderZoneSectors = useCallback(() => {
    return zoneSectorPolygons.map(({ sector }) => (
      <SectorGroup
        key={`sector-group-${sector.id}`}
        sector={sector}
        plan={selectedPlan}
        onSectorPress={onSectorPress}
      />
    ));
  }, [zoneSectorPolygons, selectedPlan, onSectorPress]);

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

  if (
    !showCityPlans &&
    !showZoneContext &&
    !showPlots &&
    !showSubSectors &&
    !highlightedSector
  ) {
    return null;
  }

  return (
    <>
      {renderPlanGroups()}
      {renderZoneSectors()}
      {renderHighlighted()}
      {renderPlotGroups()}
      {renderSubSectors()}
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
  subSectorPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: SUB_SECTOR_ACCENT,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 140,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  subSectorName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    flexShrink: 1,
  },
  subSectorCount: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
});
