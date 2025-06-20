import type { ComponentProps } from 'react';

import { Icons } from '@/shared/components/icons';
import { cn } from '@/shared/lib/helpers';

export function Loader({ className }: ComponentProps<'div'>) {
  return (
    <div className='flex items-center justify-center'>
      <Icons.spinner className={cn('animate-spin', className)} />
    </div>
  );
}
