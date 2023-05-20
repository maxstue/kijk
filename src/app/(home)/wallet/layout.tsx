import { Suspense } from 'react';
import { Metadata } from 'next';

import { Separator } from '@/components/ui/separator';
import { SidebarNav } from '@/app/(home)/wallet/(components)/sidebar-nav';
import { YearSwitcher } from '@/app/(home)/wallet/(components)/year-switcher';

export const metadata: Metadata = {
  title: 'Forms',
  description: 'Advanced form example using react-hook-form and Zod.',
};

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function WalletLayout({ children }: SettingsLayoutProps) {
  return (
    <>
      <div className='hidden space-y-6 p-10 pb-16 md:block'>
        <div className='space-y-0.5'>
          <h2 className='text-2xl font-bold tracking-tight'>Wallet</h2>
          <p className='text-muted-foreground'>Manage your expenses for each month.</p>
        </div>
        <Separator className='my-6' />
        <div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <aside className='-mx-4 space-y-6 lg:w-1/5'>
            <Suspense fallback={<Fallback />}>
              <YearSwitcher />
              <SidebarNav />
            </Suspense>
          </aside>
          <div className='flex-1 lg:max-w-2xl'>{children}</div>
        </div>
      </div>
    </>
  );
}

function Fallback() {
  return <div>Loading ...</div>;
}
