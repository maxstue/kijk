import type { Limit } from '@kijk/api/limits/types';
import { Badge } from '@kijk/ui/components/badge';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';

interface LimitHistoryContentProps {
  limit: Limit;
}

/** Shows recorded calendar periods using the limit's current settings. */
export function LimitHistoryContent({ limit }: LimitHistoryContentProps) {
  const history = limit.history ?? [];
  const completed = history.filter((period) => period.isComplete);
  const reached = completed.filter((period) => period.isExceeded).length;

  return (
    <DialogContent className='h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-4 sm:h-144 sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl sm:p-8 lg:h-160'>
      <DialogHeader className='pr-8'>
        <DialogTitle>{limit.name} history</DialogTitle>
        <DialogDescription>
          Limit reached in {reached} of {completed.length} completed recorded periods. Evaluated against the current
          limit of {Number(limit.limit).toLocaleString()} {limit.resource.unit} per {limit.period.toLowerCase()}.
          Periods without readings are omitted; later corrections update this history.
        </DialogDescription>
      </DialogHeader>
      {history.length === 0 ? (
        <p className='text-muted-foreground py-6 text-sm'>No consumption recorded for this limit yet.</p>
      ) : (
        <ul
          aria-label='Recorded periods'
          tabIndex={0}
          className='focus-visible:ring-ring min-h-0 divide-y overflow-y-auto overscroll-contain rounded-sm pr-2 focus-visible:ring-2 focus-visible:outline-none'
        >
          {history.map((period) => (
            <li key={period.periodStart} className='flex flex-wrap items-center justify-between gap-3 py-3'>
              <div className='flex flex-col gap-1'>
                <p className='text-sm font-medium'>
                  <time dateTime={period.periodStart}>
                    {new Date(period.periodStart).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </time>
                  {' – '}
                  {new Date(new Date(period.periodEnd).getTime() - 86_400_000).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC',
                  })}
                </p>
                <p className='text-muted-foreground text-sm'>
                  {Number(period.actualValue).toLocaleString()} / {Number(limit.limit).toLocaleString()}{' '}
                  {limit.resource.unit}
                  {!period.isComplete && ' · In progress'}
                </p>
              </div>
              <Badge variant={period.isExceeded ? 'destructive' : 'secondary'}>
                {period.isExceeded ? 'Limit reached' : 'Below limit'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </DialogContent>
  );
}
