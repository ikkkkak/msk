import React, { useMemo, useState } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { paletteForVariant, type StudioChartVariant } from "./studioChartTheme";

type Props = {
  values: number[];
  width?: number;
  height?: number;
  variant?: StudioChartVariant;
};

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

/** Tiny line chart for listing cards — no axes, no labels. */
export function StudioSparkline({
  values,
  width = 72,
  height = 36,
  variant = "views",
}: Props) {
  const palette = paletteForVariant(variant);
  const [w, setW] = useState(width);
  const h = height;
  const gradId = `spark-${variant}`;

  const { linePath, areaPath } = useMemo(() => {
    const data = values.length ? values : [0, 0];
    const max = Math.max(1, ...data);
    const pad = 2;
    const innerW = Math.max(1, w - pad * 2);
    const innerH = h - pad * 2;
    const pts = data.map((v, i) => ({
      x: pad + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
      y: pad + innerH - (v / max) * innerH,
    }));
    const line = smoothPath(pts);
    const area =
      pts.length > 0
        ? `${line} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`
        : "";
    return { linePath: line, areaPath: area };
  }, [values, w, h]);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    if (next > 0 && Math.abs(next - w) > 1) setW(next);
  };

  return (
    <View style={[styles.wrap, { width, height: h }]} onLayout={onLayout}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={palette.fillTop} />
            <Stop offset="100%" stopColor={palette.fillBottom} />
          </LinearGradient>
        </Defs>
        {areaPath ? (
          <Path d={areaPath} fill={`url(#${gradId})`} />
        ) : null}
        {linePath ? (
          <Path
            d={linePath}
            stroke={palette.line}
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
  },
});
