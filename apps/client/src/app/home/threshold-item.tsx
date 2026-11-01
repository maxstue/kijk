import { Badge } from '@kijk/ui/components/badge';
import { Progress } from '@kijk/ui/components/progress';

interface Props {
  name: string;
  actual: number;
  threshold: number;
  unit: string;
  percentage: number | null;
  remaining: number;
  overrun: number;
}

/** Compact monthly usage row shared by consumption limits and financial budgets. */
export function ThresholdItem({ name, actual, threshold, unit, percentage, remaining, overrun }: Props) {
  return (
    <article className='flex min-w-0 flex-col gap-2 border-b pb-4 last:border-0 last:pb-0'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-sm font-medium'>{name}</h3>
        {overrun > 0 && <Badge variant='destructive'>Over limit</Badge>}
      </div>
      <p className='text-base font-semibold tabular-nums'>
        {actual.toLocaleString()} / {threshold.toLocaleString()} {unit}
      </p>
      {percentage != null && (
        <Progress
          className={overrun > 0 ? '[&_[data-slot=progress-indicator]]:bg-destructive w-full' : 'w-full'}
          value={Math.max(0, Math.min(100, percentage))}
          max={100}
          aria-label={`${name} utilization`}
        />
      )}
      <div className='text-muted-foreground flex flex-wrap justify-between gap-2 text-xs'>
        <p>
          {overrun > 0
            ? `Exceeded by ${overrun.toLocaleString()} ${unit}`
            : remaining === 0
              ? 'Limit reached'
              : `${remaining.toLocaleString()} ${unit} remaining`}
        </p>
        {percentage != null && <p className='font-medium tabular-nums'>{percentage.toLocaleString()} %</p>}
      </div>
    </article>
  );
}
