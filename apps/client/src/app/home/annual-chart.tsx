import { useState } from 'react';

import { months } from './constants';

interface Props {
  values: Array<number | null>;
  year: number;
  month: number;
  unit: string;
}

/** Twelve calendar months. Missing and future values remain gaps rather than zero bars. */
export function AnnualChart({ values, year, month, unit }: Props) {
  const maximum = Math.max(1, ...values.map((value) => Math.abs(value ?? 0)));
  const [now] = useState(() => new Date());
  return (
    <div className='overflow-x-auto'>
      <svg
        viewBox='0 0 600 160'
        className='w-full min-w-96'
        role='img'
        aria-label={`January to December ${year}, ${unit}`}
      >
        <line x1='0' y1='75' x2='600' y2='75' stroke='currentColor' opacity='.2' />
        {months.map((label, index) => {
          const future = year > now.getFullYear() || (year === now.getFullYear() && index > now.getMonth());
          const value = future ? null : (values[index] ?? null);
          const height = (Math.abs(value ?? 0) / maximum) * 60;
          return (
            <g key={label} opacity={index + 1 === month ? 1 : 0.6}>
              <title>
                {label}: {future ? 'Upcoming' : value === null ? 'No data' : `${value.toLocaleString()} ${unit}`}
              </title>
              {value !== null && (
                <rect
                  x={index * 50 + 12}
                  y={value >= 0 ? 75 - height : 75}
                  width='26'
                  height={Math.max(1, height)}
                  fill='currentColor'
                  className='text-primary'
                />
              )}
              <text x={index * 50 + 25} y='150' textAnchor='middle' fill='currentColor' fontSize='11'>
                {label}
              </text>
              {value === null && (
                <text x={index * 50 + 25} y='80' textAnchor='middle' fill='currentColor' fontSize='12'>
                  –
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <details>
        <summary className='cursor-pointer text-sm underline'>Monthly values · {year}</summary>
        <table className='w-full text-sm'>
          <caption className='sr-only'>
            January to December {year}, {unit}
          </caption>
          <thead>
            <tr>
              <th scope='col' className='text-left'>
                Month
              </th>
              <th scope='col' className='text-right'>
                Value ({unit})
              </th>
            </tr>
          </thead>
          <tbody>
            {months.map((label, index) => {
              const future = year > now.getFullYear() || (year === now.getFullYear() && index > now.getMonth());
              const value = values[index];
              return (
                <tr key={label}>
                  <th scope='row' className='text-left'>
                    {label}
                  </th>
                  <td className='text-right'>
                    {future ? 'Upcoming' : value == null ? 'No data' : value.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
      <p className='text-muted-foreground text-xs'>
        Dashes indicate missing or upcoming months. Values are available on each bar.
      </p>
    </div>
  );
}
