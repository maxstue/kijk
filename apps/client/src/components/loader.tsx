import { ComponentProps } from 'react';

import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export function Loader({ className }: ComponentProps<'div'>) {
  return (
    <div className='flex items-center justify-center'>
      <Icons.spinner className={cn('animate-spin', className)} />
    </div>
  );
}
