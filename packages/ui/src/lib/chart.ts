import type { ChartPoint, ChartTheme, ChartTooltipContentContext } from '@tanstack/charts';

/** Chart paints follow the same semantic tokens as the surrounding UI. */
export const chartTheme = {
  foreground: 'var(--foreground)',
  muted: 'var(--muted-foreground)',
  grid: 'var(--border)',
  background: 'transparent',
} satisfies Partial<ChartTheme>;

/** Keep series labels, swatches and raw values consistent across grouped chart tooltips. */
export function getChartTooltipContent(
  points: readonly ChartPoint[],
  context: ChartTooltipContentContext,
  formatValue: (value: number) => string = (value) => value.toLocaleString(),
) {
  return {
    title: points[0] ? context.formatX(points[0].xValue) : undefined,
    rows: points.map((point) => ({
      label: point.groupLabel,
      value: formatValue(Number(point.yValue)),
      color: point.color,
    })),
  };
}
