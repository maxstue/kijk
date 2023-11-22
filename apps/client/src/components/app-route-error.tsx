import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { ArrowDownIcon, InfoIcon } from 'lucide-react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AppRouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  const handleGotToRoot = () => {
    void navigate('/', { replace: true });
  };

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className='flex h-[100dvh] w-full items-center justify-center'>
      <Card className='rounded'>
        <CardHeader className='flex w-full flex-col items-center justify-center gap-2'>
          <InfoIcon className='h-24 w-24 text-orange-400' />
          <CardTitle>Oups, something went wrong!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-2'>
            {error instanceof Error ? <AuthError error={error} /> : <BasicError error={error} />}
          </div>
        </CardContent>
        <CardFooter>
          <div className='flex w-full items-center justify-center'>
            <div className='flex w-1/2 flex-col gap-4'>
              <Button color='primary' onClick={handleGotToRoot}>
                Zur Startseite
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

const BasicError = ({ error }: { error: unknown }) => {
  if (isRouteErrorResponse(error)) {
    return (
      <div className='flex flex-col gap-2'>
        <div className='text-bold text-muted-foreground'>{error.statusText}:</div>
        {error.status === 404 && <div>This page doesn&apos;t exist!</div>}
        {error.status === 503 && <div>Looks like our API is down</div>}
        {error.status === 418 && <div>🫖</div>}
      </div>
    );
  }

  return <div>Something unexpected happened. {JSON.stringify(error)}</div>;
};

const AuthError = (props: { error: Error }) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        <div className='font-bold'>{props.error.name}:</div>
        <div>{props.error.message}</div>
      </div>
      <div
        className='flex cursor-pointer items-center gap-1 text-xs text-gray-400'
        role='button'
        tabIndex={0}
        onClick={() => setShowMore((c) => !c)}
      >
        Mehr anzeigen <ArrowDownIcon className={cn('h-3 w-3 text-orange-400', showMore ? 'rotate-180' : '')} />
      </div>
      {showMore && (
        <div className='h-[300px] overflow-auto rounded border border-gray-400 p-4'>{props.error.stack}</div>
      )}
    </div>
  );
};
