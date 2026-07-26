import { cn } from '@kijk/core/utils/style';
import { Button, buttonVariants } from '@kijk/ui/components/button';
import { useLocation } from '@tanstack/react-router';
import { CookieIcon, ExternalLink } from 'lucide-react';

import { config } from '@/shared/config';
import { useAnalyticsConsent } from '@/shared/hooks/use-analytics-consent';

export function AnalyticsBanner() {
  const location = useLocation();
  const { consent, isPending, isReady, updateConsent } = useAnalyticsConsent();

  if (!isReady || location.pathname === '/welcome') {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed right-0 bottom-0 left-0 z-200 w-full duration-700 sm:bottom-4 sm:left-4 sm:max-w-md',
        consent !== 'undecided'
          ? 'hidden translate-y-8 opacity-0 transition-[opacity,transform]'
          : 'translate-y-0 opacity-100 transition-[opacity,transform]',
      )}
    >
      <div className='border-border bg-background dark:bg-card m-3 rounded-md border shadow-lg'>
        <div className='grid gap-2'>
          <div className='border-border flex h-14 items-center justify-between border-b p-4'>
            <h1 className='text-lg font-medium'>We love cookies</h1>
            <CookieIcon className='h-5 w-5' />
          </div>
          <div className='p-4'>
            <p className='flex flex-col gap-2 text-start text-sm font-normal'>
              Optional usage data helps us understand which features are useful and where Kijk can be improved.
              Technical error reports remain active so we can detect and fix problems. These reports do not include
              user-specific information.
              <span className='text-xs'>
                Choose whether you want to share optional usage data. You can change this later in the privacy settings.
              </span>
              <a
                className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
                href={`${config.WebUrl}/privacy`}
                rel='noopener noreferrer'
                target='_blank'
              >
                Learn more
                <ExternalLink className='h-4 w-4' />
              </a>
            </p>
          </div>
          <div className='border-border dark:bg-background/20 relative flex flex-col justify-between gap-6 border-t p-4 py-5 sm:flex-row sm:gap-2'>
            <Button
              className='w-full sm:w-1/2'
              disabled={isPending}
              variant='secondary'
              onClick={() => updateConsent('declined')}
            >
              Decline
            </Button>
            <Button className='w-full sm:w-1/2' disabled={isPending} onClick={() => updateConsent('accepted')}>
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
