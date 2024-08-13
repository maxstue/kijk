import { useEffect, useState } from 'react';
import { CookieIcon, ExternalLink } from 'lucide-react';

import { Button, buttonVariants } from '@/shared/components/ui/button';
import { env } from '@/shared/env';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';
import { browserStorage } from '@/shared/lib/browser-storage';
import { cn } from '@/shared/lib/helpers';
import { COOKIE_CONSENT_KEY, CookieConsent } from '@/shared/types/app';

function cookieConsentGiven() {
  if (browserStorage.hasItem(COOKIE_CONSENT_KEY)) {
    return browserStorage.getItem<CookieConsent>(COOKIE_CONSENT_KEY)!;
  }
  return 'undecided';
}

export function AnalyticsBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const cookieConsent = cookieConsentGiven();
    if (cookieConsent === 'yes') {
      AnalyticsService.getInstance().opt_in_capturing();
      setIsOpen(false);
      setTimeout(() => {
        setHide(true);
      }, 700);
    }
    if (cookieConsent === 'no') {
      AnalyticsService.getInstance().opt_out_capturing();
      setIsOpen(false);
      setTimeout(() => {
        setHide(true);
      }, 700);
    }
    if (cookieConsent === 'undecided') {
      AnalyticsService.getInstance().opt_out_capturing();
      setIsOpen(cookieConsent === 'undecided');
    }
  }, []);

  const handleAcceptCookies = () => {
    browserStorage.setItem(COOKIE_CONSENT_KEY, 'yes');
    AnalyticsService.getInstance().opt_in_capturing();
    setIsOpen(false);
  };

  const handleDeclineCookies = () => {
    browserStorage.setItem(COOKIE_CONSENT_KEY, 'no');
    AnalyticsService.getInstance().opt_out_capturing();
    setIsOpen(false);
  };

  const accept = () => {
    setIsOpen(false);
    setTimeout(() => {
      setHide(true);
    }, 700);
    handleAcceptCookies();
  };

  const decline = () => {
    setIsOpen(false);
    setTimeout(() => {
      setHide(true);
    }, 700);
    handleDeclineCookies();
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[200] w-full duration-700 sm:bottom-4 sm:left-4 sm:max-w-md',
        isOpen
          ? 'translate-y-0 opacity-100 transition-[opacity,transform]'
          : 'translate-y-8 opacity-0 transition-[opacity,transform]',
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
