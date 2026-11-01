import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Skeleton } from '@kijk/ui/components/skeleton';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  pending: boolean;
  error: boolean;
  retry: () => void;
  children: ReactNode;
}
export function Section({ title, description, pending, error, retry, children }: Props) {
  return (
    <Card role='region' aria-label={title} className='min-w-0 gap-5 shadow-xs'>
      <CardHeader>
        <CardTitle className='text-base'>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className='flex min-w-0 flex-col gap-6'>
        {pending ? (
          <div role='status' className='flex flex-col gap-4'>
            <span className='sr-only'>Loading…</span>
            <Skeleton className='h-9 w-36' />
            <Skeleton className='h-52 w-full' />
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
      </CardContent>
    </Card>
  );
}
