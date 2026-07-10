import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Line,
} from "react-native-svg";
import { paletteForVariant, type StudioChartVariant } from "./studioChartTheme";
import { studio } from "./studioTheme";
import {
  buildDefaultDays,
  formatAxisDay,
  formatDateRange,
  formatYTick,
  pickXLabelIndices,
  yTickValues,
} from "./chartDateUtils";

type Props = {
  values: number[];
  /** YYYY-MM-DD per point (14 days from API). */
  days?: string[];
  variant?: StudioChartVariant;
  /** Plot area height (excluding axis labels). */
  plotHeight?: number;
  showArea?: boolean;
  showLastDot?: boolean;
  /** Show date + value axes (recommended for property charts). */
  showAxes?: boolean;
  xLabelCount?: number;
  /** Caption under x-axis, e.g. "Daily views". */
  metricLabel?: string;
};

const Y_AXIS_W = 36;
const PLOT_PAD_TOP = 8;
const PLOT_PAD_RIGHT = 8;

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const mx = (p0.x + p1.x) / 2;
    d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function StudioChart({
  values,
  days: daysProp,
  variant = "views",
  plotHeight = 52,
  showArea = true,
  showLastDot = false,
  showAxes = false,
  xLabelCount = 4,
  metricLabel,
}: Props) {
  const palette = paletteForVariant(variant);
  const [plotWidth, setPlotWidth] = useState(0);
  const gradId = `studio-fill-${variant}`;
  const lineGradId = `studio-line-${variant}`;

  const days = useMemo(() => {
    const d = daysProp?.length ? daysProp : buildDefaultDays(values.length || 14);
    if (values.length && d.length !== values.length) {
      return buildDefaultDays(values.length);
    }
    return d;
  }, [daysProp, values.length]);

  const maxVal = Math.max(0, ...values);
  const yTicks = yTickValues(maxVal);
  const yMax = Math.max(1, maxVal);
  const xIndices = pickXLabelIndices(values.length, xLabelCount);
  const dateRange = formatDateRange(days);

  const geometry = useMemo(() => {
    if (plotWidth <= 0 || values.length === 0) return null;
    const padL = 2;
    const innerW = plotWidth - padL - PLOT_PAD_RIGHT;
    const innerH = plotHeight - PLOT_PAD_TOP - 4;
    const min = Math.min(...values);
    const range = Math.max(yMax - min, yMax * 0.08, 1);

    const pts = values.map((v, i) => {
      const x =
        values.length === 1
          ? padL + innerW / 2
          : padL + (i / (values.length - 1)) * innerW;
      const norm = (v - min) / range;
      const y = PLOT_PAD_TOP + innerH - norm * innerH;
      return { x, y, v, i };
    });

    const baseline = PLOT_PAD_TOP + innerH;
    const lineD = smoothPath(pts);
    const areaD =
      lineD +
      ` L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z`;

    const gridLines = [0.25, 0.5, 0.75].map((t) => ({
      y: PLOT_PAD_TOP + innerH * (1 - t),
    }));

    return { pts, lineD, areaD, last: pts[pts.length - 1], gridLines, innerH, padL, innerW };
  }, [values, plotWidth, plotHeight, yMax]);

  const hasActivity = values.some((v) => v > 0);

  const onPlotLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== plotWidth) setPlotWidth(w);
  };

  const xLabels = xIndices.map((idx) => ({
    idx,
    label: formatAxisDay(days[idx] ?? ""),
  }));

  if (!showAxes) {
    return (
      <View style={[styles.legacyWrap, { height: plotHeight }]} onLayout={onPlotLayout}>
        {plotWidth > 0 && geometry ? (
          <Svg width={plotWidth} height={plotHeight}>
            <ChartSvgContent
              geometry={geometry}
              palette={palette}
              gradId={gradId}
              lineGradId={lineGradId}
              showArea={showArea}
              hasActivity={hasActivity}
              showLastDot={showLastDot}
              showGrid={false}
              yTicks={[]}
              yMax={yMax}
              plotHeight={plotHeight}
            />
          </Svg>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.proWrap}>
      {metricLabel || dateRange ? (
        <View style={styles.captionRow}>
          {metricLabel ? (
            <Text style={styles.metricCaption}>{metricLabel}</Text>
          ) : (
            <View />
          )}
          {dateRange ? (
            <Text style={styles.rangeCaption}>{dateRange}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.plotRow, { height: plotHeight }]}>
        <View style={[styles.yAxis, { width: Y_AXIS_W, height: plotHeight }]}>
          {yTicks
            .slice()
            .reverse()
            .map((tick) => {
              const norm = tick / yMax;
              const top =
                PLOT_PAD_TOP + (plotHeight - PLOT_PAD_TOP - 4) * (1 - norm) - 6;
              return (
                <Text
                  key={`y-${tick}`}
                  style={[styles.yLabel, { top: Math.max(0, top) }]}
                >
                  {formatYTick(tick)}
                </Text>
              );
            })}
        </View>

        <View style={styles.plotFlex} onLayout={onPlotLayout}>
          {plotWidth > 0 && geometry ? (
            <Svg width={plotWidth} height={plotHeight}>
              <ChartSvgContent
                geometry={geometry}
                palette={palette}
                gradId={gradId}
                lineGradId={lineGradId}
                showArea={showArea}
                hasActivity={hasActivity}
                showLastDot={showLastDot}
                showGrid
                yTicks={yTicks}
                yMax={yMax}
                plotHeight={plotHeight}
              />
            </Svg>
          ) : null}
        </View>
      </View>

      <View style={[styles.xAxis, { marginLeft: Y_AXIS_W }]}>
        {xLabels.map(({ idx, label }) => (
          <Text key={`x-${idx}`} style={styles.xLabel} numberOfLines={1}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

type PlotGeometry = {
  lineD: string;
  areaD: string;
  last: { x: number; y: number };
  gridLines: { y: number }[];
  padL: number;
  innerW: number;
};

function ChartSvgContent({
  geometry,
  palette,
  gradId,
  lineGradId,
  showArea,
  hasActivity,
  showLastDot,
  showGrid,
  plotHeight,
}: {
  geometry: PlotGeometry;
  palette: ReturnType<typeof paletteForVariant>;
  gradId: string;
  lineGradId: string;
  showArea: boolean;
  hasActivity: boolean;
  showLastDot: boolean;
  showGrid: boolean;
  yTicks: number[];
  yMax: number;
  plotHeight: number;
}) {
  const g = geometry;

  return (
    <>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={palette.fillTop} />
          <Stop offset="100%" stopColor={palette.fillBottom} />
        </LinearGradient>
        <LinearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={palette.line} />
          <Stop offset="100%" stopColor={palette.lineEnd} />
        </LinearGradient>
      </Defs>

      {showGrid
        ? g.gridLines.map((line, i) => (
            <Line
              key={`grid-${i}`}
              x1={g.padL}
              y1={line.y}
              x2={g.padL + g.innerW}
              y2={line.y}
              stroke={palette.grid ?? "rgba(255,255,255,0.06)"}
              strokeWidth={1}
            />
          ))
        : null}

      {showArea && hasActivity ? (
        <Path d={g.areaD} fill={`url(#${gradId})`} />
      ) : null}

      {hasActivity ? (
        <Path
          d={g.lineD}
          fill="none"
          stroke={`url(#${lineGradId})`}
          strokeWidth={palette.lineWidth ?? 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <Line
          x1={g.padL}
          y1={plotHeight / 2}
          x2={g.padL + g.innerW}
          y2={plotHeight / 2}
          stroke={palette.line}
          strokeOpacity={0.15}
          strokeWidth={1}
          strokeDasharray="4 6"
        />
      )}

      {showLastDot && hasActivity && g.last ? (
        <>
          <Circle cx={g.last.x} cy={g.last.y} r={5} fill={palette.glow} />
          <Circle
            cx={g.last.x}
            cy={g.last.y}
            r={3.5}
            fill={palette.lineEnd}
            stroke="#fff"
            strokeWidth={1.5}
          />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  legacyWrap: {
    width: "100%",
    overflow: "hidden",
  },
  proWrap: {
    width: "100%",
  },
  captionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricCaption: {
    fontSize: 11,
    fontWeight: "600",
    color: studio.inkSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  rangeCaption: {
    fontSize: 11,
    color: studio.muted,
    fontVariant: ["tabular-nums"],
  },
  plotRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  yAxis: {
    position: "relative",
  },
  yLabel: {
    position: "absolute",
    right: 4,
    fontSize: 10,
    color: studio.muted,
    fontVariant: ["tabular-nums"],
    width: Y_AXIS_W - 4,
    textAlign: "right",
  },
  plotFlex: {
    flex: 1,
    overflow: "hidden",
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 6,
    paddingRight: 4,
  },
  xLabel: {
    fontSize: 10,
    color: studio.muted,
    fontVariant: ["tabular-nums"],
    maxWidth: 72,
  },
});
