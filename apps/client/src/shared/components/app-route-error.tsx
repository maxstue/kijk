import { useCallback, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { ErrorRouteProps, useNavigate } from '@tanstack/react-router';
import { ArrowDownIcon, InfoIcon } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

export function AppRouteError({ error, info }: ErrorRouteProps) {
  const navigate = useNavigate();

  const handleGotToRoot = useCallback(() => {
    void navigate({ to: '/', replace: true });
  }, [navigate]);

  useEffect(() => {
    Sentry.captureException(error, { extra: { info } });
  }, [error, info]);

  return (
    <div className='flex h-[90dvh] w-full items-center justify-center'>
      <Card className='w-2/3 rounded'>
        <CardHeader className='flex w-full flex-col items-center justify-center gap-2'>
          <InfoIcon className='h-24 w-24 text-orange-400' />
          <CardTitle>Oups, something went wrong!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-2'>
            <PrettyError error={error} />
          </div>
        </CardContent>
        <CardFooter>
          <div className='flex w-full items-center justify-center'>
            <div className='flex w-1/2 flex-col gap-4'>
              <Button color='primary' onClick={handleGotToRoot}>
                Go to home
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

const PrettyError = (props: { error?: unknown }) => {
  const [showMore, setShowMore] = useState(false);

  const handleToggleMore = useCallback(() => setShowMore((c) => !c), []);

  return (
    <div className='flex flex-col justify-center gap-2'>
      <div className='flex gap-2'>
        {props.error instanceof Error ? (
          <>
            <div className='font-bold'>{props.error.name}:</div>
            <div>{props.error.message}</div>
          </>
        ) : (
          <div className='font-bold'>Unknown error:</div>
        )}
      </div>
      <div
        className='flex cursor-pointer items-center gap-1 text-xs text-gray-400'
        role='button'
        tabIndex={0}
        onClick={handleToggleMore}
      >
        {showMore ? 'Hide' : 'Show'}{' '}
        <ArrowDownIcon className={cn('h-3 w-3 text-orange-400', showMore ? 'rotate-180' : '')} />
      </div>
      {showMore &&
        (props.error instanceof Error ? (
          <div className='h-[200px] overflow-auto rounded border border-gray-400 p-4'>{props.error.stack}</div>
        ) : (
          <div className='h-[200px] overflow-auto rounded border border-gray-400 p-4'>
            {JSON.stringify(props.error)}
          </div>
        ))}
    </div>
  );
};
