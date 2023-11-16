import { useState } from 'react';
import { ArrowDownIcon, InfoIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  error: unknown;
  resetErrorBoundary?: () => void;
}

export function AppError({ error, resetErrorBoundary }: Props) {
  // const navigate = useNavigate();

  const handleReset = () => {
    resetErrorBoundary?.();
  };

  const handleGotToRoot = () => {
    window.location.href = '/';
    // void navigate({ to: '/', replace: true });
  };

  return (
    <div className='flex h-[100dvh] w-full items-center justify-center'>
      <Card className='rounded'>
        <CardHeader className='flex w-full flex-col items-center justify-center gap-2'>
          <InfoIcon className='h-24 w-24 text-orange-400' />
          <CardTitle>Etwas ist schief gelaufen !</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className='flex flex-col gap-2'>
            <div>Oups, es scheint als wäre ein fehler aufgetreten.</div>
            {error instanceof Error ? (
              <AuthError error={error} />
            ) : (
              <BasicError message={JSON.stringify(error?.toString())} />
            )}
          </CardDescription>
        </CardContent>
        <CardFooter>
          <div className='flex w-full items-center justify-center'>
            <div className='flex w-1/2 flex-col gap-4'>
              <Button color='primary' onClick={handleGotToRoot}>
                Zur Startseite
              </Button>
              {typeof resetErrorBoundary === 'undefined' && (
                <Button color='secondary' onClick={handleReset}>
                  Nochmal versuchen
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

const BasicError = (props: { message: string }) => {
  return <div>{props.message}</div>;
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
