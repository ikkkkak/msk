import { StudioChart } from "./StudioChart";
import type { StudioChartVariant } from "./studioChartTheme";

type Props = {
  values: number[];
  days?: string[];
  color?: string;
  height?: number;
  barWidth?: number;
  variant?: StudioChartVariant;
  showAxes?: boolean;
};

export function MiniSparkline({
  values,
  days,
  variant = "views",
  height = 36,
  showAxes = false,
}: Props) {
  const plotHeight = showAxes ? Math.max(40, height - 32) : height;
  return (
    <StudioChart
      values={values}
      days={days}
      variant={variant}
      plotHeight={plotHeight}
      showArea
      showAxes={showAxes}
      showLastDot={!showAxes && height >= 44}
    />
  );
}
