import { cn } from '@kijk/core/utils/style';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { ArrowDownIcon } from 'lucide-react';
import { useState } from 'react';

import { ErrorImage } from '@/shared/components/errors/error-image';
import { ErrorService } from '@/shared/lib/error-tracking';

type Props = { resetErrorBoundary?: () => void } & Partial<ErrorComponentProps>;

const handleGotToRoot = () => {
  globalThis.location.href = '/';
};

export function AppError({ error, info, resetErrorBoundary }: Props) {
  ErrorService.captureException(error, { info });

  const handleReset = () => {
    resetErrorBoundary?.();
  };

  return (
    <div className='flex h-full w-full items-center justify-center'>
      <Card className='w-2/3 rounded border-none'>
        <CardHeader className='flex w-full flex-col items-center justify-center gap-2'>
          <ErrorImage className='h-44' />
          <CardTitle>Oups, something went wrong!</CardTitle>
        </CardHeader>
        <CardContent className='flex-col items-center justify-center gap-2'>
          <ErrorTitle error={error} />
        </CardContent>
        <CardFooter className='flex w-full items-center justify-around'>
          <Button onClick={handleGotToRoot}>Go to home</Button>
          {resetErrorBoundary !== undefined && (
            <Button variant='secondary' onClick={handleReset}>
              Try again
            </Button>
          )}
        </CardFooter>
        <ShowMore error={error} />
      </Card>
    </div>
  );
}

const ShowMore = (props: { error?: unknown }) => {
  const [showMore, setShowMore] = useState(false);

  const handleToggleMore = () => {
    setShowMore((c) => !c);
  };

  return (
    <div className='mt-3'>
      <button
        className='flex cursor-pointer items-center justify-center gap-1 text-xs text-gray-400'
        tabIndex={0}
        onClick={handleToggleMore}
      >
        <div>{showMore ? 'Hide' : 'Show'} more advanced information:</div>

        <ArrowDownIcon className={cn('h-3 w-3 text-orange-400', showMore ? 'rotate-180' : '')} />
      </button>
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

const ErrorTitle = (props: { error?: unknown }) => (
  <div className='flex flex-col justify-center gap-2'>
    <div className='flex justify-center gap-2'>
      {props.error instanceof Error ? (
        <>
          <div className='font-bold'>{props.error.name}:</div>
          <div>{props.error.message}</div>
        </>
      ) : (
        <div className='font-bold'>Unknown error</div>
      )}
    </div>
  </div>
);
