import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@kijk/ui/components/card';
import { Skeleton } from '@kijk/ui/components/skeleton';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  pending: boolean;
  error: boolean;
  retry: () => void;
  children: ReactNode;
  updating?: boolean;
  size?: 'overview' | 'list' | 'finance';
}

/** Reserve space while loading and let content grow without an inner scroll area. */
export function Section({
  title,
  description,
  action,
  pending,
  error,
  retry,
  children,
  updating = false,
  size = 'overview',
}: Props) {
  return (
    <Card role='region' aria-label={title} aria-busy={updating} className='min-w-0 gap-4 shadow-xs'>
      <CardHeader className='min-h-16 has-data-[slot=card-action]:grid-cols-1 @3xl/home:has-data-[slot=card-action]:grid-cols-[1fr_auto]'>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && (
          <CardAction className='col-start-1 row-start-3 justify-self-start @3xl/home:col-start-2 @3xl/home:row-start-1 @3xl/home:justify-self-end'>
            {action}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className={size === 'finance' ? 'min-h-28' : size === 'list' ? 'min-h-0' : 'min-h-[360px]'}>
        <div className='flex min-w-0 flex-col gap-5'>
          {pending ? (
            <div key='loading' role='status' className='flex flex-col gap-5'>
              <span className='sr-only'>Loading…</span>
              <div className='grid grid-cols-3 gap-4'>
                {[0, 1, 2].map((index) => (
                  <div key={index} className='flex flex-col gap-2'>
                    <Skeleton className='h-4 w-16' />
                    <Skeleton className='h-8 w-20' />
                  </div>
                ))}
              </div>
              {size !== 'finance' && <Skeleton className={size === 'list' ? 'h-48 w-full' : 'h-[280px] w-full'} />}
            </div>
          ) : error ? (
            <Alert variant='destructive'>
              <AlertTitle>Could not load this section.</AlertTitle>
              <AlertDescription>
                <Button variant='outline' size='sm' onClick={retry}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}
