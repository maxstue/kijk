import { ConsumptionCurrentYearButton } from '@/app/consumptions/current-year-button';
import { ConsumptionTodayButton } from '@/app/consumptions/today-button';

/** Jumps to the current year or month, depending on the view. */
export function ConsumptionCurrentPeriodButton({ view }: { view: 'month' | 'year' }) {
  return view === 'year' ? <ConsumptionCurrentYearButton /> : <ConsumptionTodayButton />;
}
