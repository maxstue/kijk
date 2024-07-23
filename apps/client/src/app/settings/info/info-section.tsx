import { ExternalLink } from 'lucide-react';

import { AppVersion } from '@/shared/components/app-version';
import { buttonVariants } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { env } from '@/shared/env';
import { cn } from '@/shared/lib/helpers';

export function InfoSection() {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Info</h3>
        <p className='text-sm text-muted-foreground'>Here are some informations about this app.</p>
      </div>
      <Separator />
      <div className='flex flex-col gap-12'>
        <div className='flex items-center gap-4'>
          <div>Version: </div>
          <AppVersion className='text-muted-foreground' />
        </div>
        <div className='flex gap-4'>
          <a
            href={`${env.WebUrl}/terms`}
            rel='noopener noreferrer'
            target='_blank'
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
          >
            Terms of service
            <ExternalLink className='h-4 w-4' />
          </a>
          <a
            href={`${env.WebUrl}/privacy`}
            rel='noopener noreferrer'
            target='_blank'
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
          >
            Privacy Policy
            <ExternalLink className='h-4 w-4' />
          </a>
        </div>
      </div>
    </div>
  );
}
