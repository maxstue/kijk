import { ConsumptionCurrentYearButton } from '@/app/consumptions/current-year-button';
import { ConsumptionTodayButton } from '@/app/consumptions/today-button';

export function ConsumptionCurrentPeriodButton({ view }: { view: 'month' | 'year' }) {
  return view === 'year' ? <ConsumptionCurrentYearButton /> : <ConsumptionTodayButton />;
}
