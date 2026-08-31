import { cn } from '@kijk/core/utils/style';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import type { ComponentProps } from 'react';

export function Loader({ className }: ComponentProps<'div'>) {
  return (
    <div className='flex items-center justify-center'>
      <SpinnerIcon className={cn('animate-spin', className)} />
    </div>
  );
}
