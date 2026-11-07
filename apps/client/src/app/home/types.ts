export type ConsumptionView = 'meter' | 'consumption';

export interface AnnualSeries {
  label: string;
  color: string;
  values: Array<number | null>;
}

export interface AnnualChartProps {
  values?: Array<number | null>;
  series?: AnnualSeries[];
  year: number;
  month: number;
  unit: string;
}
