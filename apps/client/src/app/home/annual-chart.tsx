import { Chart } from '@kijk/ui/components/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { chartTheme } from '@kijk/ui/lib/chart';
import { areaY, defineChart, dot, d3Curve, lineY, ruleX } from '@tanstack/charts';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { tooltip } from '@tanstack/charts/tooltip';
import { curveMonotoneX } from 'd3-shape';
import { useMemo, useState } from 'react';

import { months } from './constants';

export interface AnnualSeries {
  label: string;
  color: string;
  values: Array<number | null>;
}
interface Props {
  values?: Array<number | null>;
  series?: AnnualSeries[];
  year: number;
  month: number;
  unit: string;
}
const curve = d3Curve(curveMonotoneX);

/** Calendar-year area chart. Missing readings split the series instead of inventing a connecting curve. */
export function AnnualChart({ values, series, year, month, unit }: Props) {
  const [now] = useState(() => new Date());
  const definition = useMemo(() => {
    const groups = series ?? [{ label: unit, color: 'var(--color-teal-500)', values: values ?? [] }];
    const data = groups.flatMap((group) => {
      return months.flatMap((_, index) => {
        const future = year > now.getFullYear() || (year === now.getFullYear() && index > now.getMonth());
        const value = group.values[index];
        if (future || value == null) {
          return [];
        }
        return [
          {
            id: `${group.label}-${index}`,
            month: index + 1,
            value,
            series: group.label,
            color: group.color,
            segment: `${group.label}-${group.values.slice(0, index).filter((value) => value == null).length}`,
          },
        ];
      });
    });
    return defineChart({
      gradients: groups.map((group, index) => ({
        id: `consumption-fill-${index}`,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 1,
        stops: [
          { offset: 0, color: group.color, opacity: 0.55 },
          { offset: 1, color: group.color, opacity: 0.05 },
        ],
      })),
      marks: [
        ruleX([month], { id: 'selected-month', stroke: 'var(--foreground)', strokeOpacity: 0.06, strokeWidth: 28 }),
        ...groups.flatMap((group, index) => {
          const points = data.filter((row) => row.series === group.label);
          const isolated = points.filter(
            (row) => group.values[row.month - 2] == null && group.values[row.month] == null,
          );
          const isolatedSet = new Set(isolated);
          const connected = points.filter((row) => !isolatedSet.has(row));
          return [
            areaY(connected, {
              x: 'month',
              y: 'value',
              z: 'segment',
              color: 'series',
              fill: `url(#consumption-fill-${index})`,
              stroke: 'none',
              curve,
            }),
            lineY(connected, {
              x: 'month',
              y: 'value',
              z: 'segment',
              color: 'series',
              stroke: group.color,
              strokeWidth: 2,
              curve,
            }),
            dot(isolated, { x: 'month', y: 'value', color: 'series', r: 3 }),
          ];
        }),
      ],
      scales: {
        x: {
          scale: scaleLinear,
          domain: [1, 12],
          axis: {
            line: false,
            ticks: {
              size: 0,
              padding: 12,
              spacing: 42,
              format: (value) => (Number.isInteger(Number(value)) ? (months[Number(value) - 1] ?? '') : ''),
            },
          },
        },
        y: { scale: scaleLinear, nice: true, grid: true, axis: { line: false, ticks: { size: 0, padding: 8 } } },
      },
      color: { domain: groups.map((group) => group.label), range: groups.map((group) => group.color) },
      theme: chartTheme,
      focus: 'group-x',
      tooltip: {
        use: tooltip,
        content: (points) => ({
          title: points[0] ? `${months[points[0].datum.month - 1]} ${year}` : undefined,
          rows: points
            .filter(
              (point, index, items) => items.findIndex((candidate) => candidate.datum.id === point.datum.id) === index,
            )
            .map((point) => ({
              label: point.datum.series,
              value: `${point.datum.value.toLocaleString()} ${unit}`,
              color: point.datum.color,
            })),
        }),
      },
    });
  }, [series, values, year, month, unit, now]);
  const groups = series ?? [{ label: unit, color: 'var(--color-teal-500)', values: values ?? [] }];
  return (
    <figure className='flex min-w-0 flex-col gap-4' aria-label={`${months[month - 1]} ${year} highlighted in ${unit}`}>
      <Chart ariaLabel={`January to December ${year}, ${unit}`} definition={definition} height={300} />
      <div className='sr-only'>
        <Table className='mt-3 text-xs'>
          <caption>Monthly values · {year}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              {groups.map((group) => (
                <TableHead key={group.label} className='text-right'>
                  {group.label} ({unit})
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {months.map((label, index) => (
              <TableRow key={label} className={index + 1 === month ? 'bg-muted/60' : ''}>
                <TableHead scope='row'>{label}</TableHead>
                {groups.map((group) => {
                  const future = year > now.getFullYear() || (year === now.getFullYear() && index > now.getMonth());
                  return (
                    <TableCell key={group.label} className='text-right tabular-nums'>
                      {future
                        ? 'Upcoming'
                        : group.values[index] == null
                          ? 'No data'
                          : group.values[index]?.toLocaleString()}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </figure>
  );
}
