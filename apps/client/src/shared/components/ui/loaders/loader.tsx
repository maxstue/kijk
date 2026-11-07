import { SpinnerIcon } from '@kijk/ui/components/icons';
import { cn } from 'cn';
import type { ComponentProps } from 'react';

interface LoaderProps extends ComponentProps<'div'> {}

/** Small spinning loader. */
export function Loader({ className }: LoaderProps) {
  return (
    <div className='flex items-center justify-center'>
      <SpinnerIcon className={cn('animate-spin', className)} />
    </div>
  );
}
