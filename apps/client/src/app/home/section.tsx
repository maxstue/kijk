import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@kijk/ui/components/card';
import { Skeleton } from '@kijk/ui/components/skeleton';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  pending: boolean;
  error: boolean;
  retry: () => void;
  children: ReactNode;
  size?: 'overview' | 'finance';
}

/** Reserve space while loading and let content grow without an inner scroll area. */
export function Section({ title, description, pending, error, retry, children, size = 'overview' }: Props) {
  return (
    <Card role='region' aria-label={title} className='min-w-0 gap-4 self-start shadow-xs'>
      <CardHeader className='min-h-16'>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={size === 'finance' ? 'min-h-36' : 'min-h-[540px]'}>
        <div className='flex min-w-0 flex-col gap-5'>
          {pending ? (
            <div role='status' className='flex flex-col gap-5'>
              <span className='sr-only'>Loading…</span>
              <div className='grid grid-cols-3 gap-4'>
                {[0, 1, 2].map((index) => (
                  <div key={index} className='flex flex-col gap-2'>
                    <Skeleton className='h-4 w-16' />
                    <Skeleton className='h-8 w-20' />
                  </div>
                ))}
              </div>
              {size !== 'finance' && <Skeleton className='h-60 w-full' />}
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
