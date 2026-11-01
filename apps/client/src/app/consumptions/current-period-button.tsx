import { ConsumptionCurrentYearButton } from '@/app/consumptions/current-year-button';
import { ConsumptionTodayButton } from '@/app/consumptions/today-button';

interface ConsumptionCurrentPeriodButtonProps {
  view: 'month' | 'year';
}

/** Jumps to the current year or month, depending on the view. */
export function ConsumptionCurrentPeriodButton({ view }: ConsumptionCurrentPeriodButtonProps) {
  return view === 'year' ? <ConsumptionCurrentYearButton /> : <ConsumptionTodayButton />;
}
