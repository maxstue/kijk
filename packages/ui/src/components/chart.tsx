'use client';

import type { ChartValue } from '@tanstack/charts';
import { Chart as TanStackChart, type ChartProps } from '@tanstack/charts/react';
import { cn } from 'cn';

/** Responsive, keyboard-accessible TanStack chart with the application's tooltip styling. */
export function Chart<TDatum, TXValue extends ChartValue = ChartValue, TYValue extends ChartValue = ChartValue>({
  className,
  ...props
}: ChartProps<TDatum, TXValue, TYValue>) {
  return (
    <TanStackChart
      className={cn(
        'text-muted-foreground w-full min-w-0 text-xs',
        '[--ts-chart-tooltip-background:var(--popover)] [--ts-chart-tooltip-color:var(--popover-foreground)]',
        '[--ts-chart-tooltip-border-radius:0.625rem] [--ts-chart-tooltip-border:1px_solid_var(--border)]',
        '[--ts-chart-tooltip-shadow:0_4px_12px_color-mix(in_srgb,var(--foreground)_10%,transparent)]',
        className,
      )}
      {...props}
    />
  );
}
