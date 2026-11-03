import { buttonVariants } from '@kijk/ui/components/button';
import { cn } from 'cn';
import { ExternalLink } from 'lucide-react';

import { DeleteAccount } from '@/app/settings/info/delete-account';
import { AppVersion } from '@/shared/components/app-version';
import { PageHeader, PageHeaderContent, PageHeaderTitle, PageHeaderDescription } from '@/shared/components/page-header';

import { PrivacyForm } from './privacy-form';

/** Info and privacy settings, including the analytics consent. */
export function InfoSection() {
  return (
    <div className='space-y-6'>
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Info</PageHeaderTitle>
          <PageHeaderDescription>App information and privacy settings.</PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>
      <div className='flex flex-col gap-12'>
        <div className='flex items-center gap-4'>
          <div>Version: </div>
          <AppVersion className='text-muted-foreground' />
        </div>
        <PrivacyForm />
        <div className='flex gap-4'>
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
            href='/terms'
            rel='noopener noreferrer'
            target='_blank'
          >
            Terms of service
            <ExternalLink className='h-4 w-4' />
          </a>
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
            href='/privacy'
            rel='noopener noreferrer'
            target='_blank'
          >
            Privacy Policy
            <ExternalLink className='h-4 w-4' />
          </a>
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
            href='/imprint'
            rel='noopener noreferrer'
            target='_blank'
          >
            Imprint
            <ExternalLink className='h-4 w-4' />
          </a>
        </div>
        <DeleteAccount />
      </div>
    </div>
  );
}
