import { useEffect, useState } from 'react';
import { CookieIcon, ExternalLink } from 'lucide-react';

import type { CookieConsent } from '@/shared/types/app';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { env } from '@/shared/env';
import { AnalyticsService } from '@/shared/lib/analytics-client';
import { cn } from '@/shared/lib/helpers';

export function AnalyticsBanner() {
  const [consentGiven, setConsentGiven] = useState<CookieConsent>('undecided');

  useEffect(() => {
    setConsentGiven(AnalyticsService.getCookieConsent());
  }, []);

  useEffect(() => {
    if (consentGiven !== 'undecided') {
      AnalyticsService.getInstance().set_config({
        persistence: consentGiven === 'accepted' ? 'localStorage+cookie' : 'memory',
      });
    }
  }, [consentGiven]);

  const accept = () => {
    AnalyticsService.setCookieConsent('accepted');
    setConsentGiven('accepted');
  };

  const decline = () => {
    AnalyticsService.setCookieConsent('declined');
    setConsentGiven('declined');
  };

  return (
    <div
      className={cn(
        'fixed right-0 bottom-0 left-0 z-[200] w-full duration-700 sm:bottom-4 sm:left-4 sm:max-w-md',
        consentGiven !== 'undecided'
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
              🍪 We use cookies to enhance your experience and analyze site traffic. Rest assured, all data collected is
              completely anonymous.
              <span className='text-xs'>
                By clicking &quot;<span className='font-medium opacity-80'>Accept</span>&quot;, you agree to our use of
                cookies.
              </span>
              <a
                className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
                href={`${env.WebUrl}/privacy`}
                rel='noopener noreferrer'
                target='_blank'
              >
                Learn more
                <ExternalLink className='h-4 w-4' />
              </a>
            </p>
          </div>
          <div className='border-border dark:bg-background/20 relative flex flex-col justify-between gap-6 border-t p-4 py-5 sm:flex-row sm:gap-2'>
            <Button className='w-full sm:w-1/2' variant='secondary' onClick={decline}>
              Decline
            </Button>
            <Button className='w-full sm:w-1/2' onClick={accept}>
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
