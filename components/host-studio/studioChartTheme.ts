import { studio } from "./studioTheme";

export type StudioChartVariant =
  | "views"
  | "saves"
  | "likes"
  | "reach"
  | "listing";

const tiktokChart = {
  line: studio.chartLine,
  lineEnd: studio.chartLineEnd,
  fillTop: studio.chartFillTop,
  fillBottom: studio.chartFillBottom,
  glow: studio.chartGlow,
  lineWidth: 2,
};

export function paletteForVariant(_variant: StudioChartVariant = "listing") {
  return {
    ...tiktokChart,
    bar: ["#E5E5E5", "#D4D4D4", studio.chartLine],
    accent: studio.trend,
    surface: studio.surface,
    label: studio.inkSecondary,
    axis: studio.muted,
    grid: "rgba(0,0,0,0.06)",
  };
}
