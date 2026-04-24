import { cn } from '@kijk/core/utils/style';
import { Icons } from '@kijk/ui/components/icons';
import type { ComponentProps } from 'react';

export function Loader({ className }: ComponentProps<'div'>) {
  return (
    <div className='flex items-center justify-center'>
      <Icons.spinner className={cn('animate-spin', className)} />
    </div>
  );
}
