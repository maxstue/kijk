import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { cn } from 'cn';
import { ArrowDownIcon } from 'lucide-react';
import { useState } from 'react';

import { AppBrand } from '@/shared/components/app-brand';
import { ErrorImage } from '@/shared/components/errors/error-image';

interface Props {
  error?: unknown;
  onRetry?: () => void;
}

const handleGotToRoot = () => {
  globalThis.location.href = '/';
};

/** Presentational error fallback shared by route and React boundaries. */
export function AppError({ error, onRetry }: Props) {
  return (
    <div className='flex h-full w-full items-center justify-center'>
      <Card className='w-2/3 rounded border-none'>
        <CardHeader className='flex w-full flex-col items-center justify-center gap-2'>
          <AppBrand logoClassName='size-8' nameClassName='text-xl' />
          <ErrorImage className='h-44' />
          <CardTitle>Oups, something went wrong!</CardTitle>
        </CardHeader>
        <CardContent className='flex-col items-center justify-center gap-2'>
          <ErrorTitle error={error} />
        </CardContent>
        <CardFooter className='flex w-full items-center justify-around'>
          <Button onClick={handleGotToRoot}>Go to home</Button>
          {onRetry !== undefined && (
            <Button variant='secondary' onClick={onRetry}>
              Try again
            </Button>
          )}
        </CardFooter>
        <ShowMore error={error} />
      </Card>
    </div>
  );
}

interface ShowMoreProps {
  error?: unknown;
}

const ShowMore = (props: ShowMoreProps) => {
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
          <div className='h-50 overflow-auto rounded border border-gray-400 p-4'>{props.error.stack}</div>
        ) : (
          <div className='h-50 overflow-auto rounded border border-gray-400 p-4'>{JSON.stringify(props.error)}</div>
        ))}
    </div>
  );
};

interface ErrorTitleProps {
  error?: unknown;
}

const ErrorTitle = (props: ErrorTitleProps) => (
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
