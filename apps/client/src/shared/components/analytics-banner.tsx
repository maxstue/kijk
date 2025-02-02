import { useEffect, useState } from 'react';
import { CookieIcon, ExternalLink } from 'lucide-react';

import { Button, buttonVariants } from '@/shared/components/ui/button';
import { env } from '@/shared/env';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';
import { cn } from '@/shared/lib/helpers';

export function AnalyticsBanner() {
  const [consentGiven, setConsentGiven] = useState('');

  const [hide, setHide] = useState(false);

  useEffect(() => {
    setConsentGiven(AnalyticsService.getCookieConsent());
  }, []);

  useEffect(() => {
    if (consentGiven !== '') {
      AnalyticsService.getInstance().set_config({
        persistence: consentGiven === 'yes' ? 'localStorage+cookie' : 'memory',
      });
    }
  }, [consentGiven]);

  const accept = () => {
    setTimeout(() => {
      setHide(true);
    }, 700);
    AnalyticsService.setCookieConsent('yes');
    setConsentGiven('yes');
  };

  const decline = () => {
    setTimeout(() => {
      setHide(true);
    }, 700);
    AnalyticsService.setCookieConsent('no');
    setConsentGiven('no');
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[200] w-full duration-700 sm:bottom-4 sm:left-4 sm:max-w-md',
        consentGiven === 'yes'
          ? 'translate-y-8 opacity-0 transition-[opacity,transform]'
          : 'translate-y-0 opacity-100 transition-[opacity,transform]',
        hide && 'hidden',
      )}
    >
      <div className='m-3 rounded-md border border-border bg-background shadow-lg dark:bg-card'>
        <div className='grid gap-2'>
          <div className='flex h-14 items-center justify-between border-b border-border p-4'>
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
          <div className='flex gap-2 border-t border-border p-4 py-5 dark:bg-background/20'>
            <Button className='w-full' onClick={accept}>
              Accept
            </Button>
            <Button className='w-full' variant='secondary' onClick={decline}>
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
