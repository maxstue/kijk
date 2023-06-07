import { Metadata } from 'next';

import { WalletSideNav } from '@/app/(home)/wallet/_components/wallet-side-nav';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Forms',
  description: 'Advanced form example using react-hook-form and Zod.',
};

interface Props {
  children: React.ReactNode;
}

export default function WalletLayout({ children }: Props) {
  return (
    <>
      <div className='space-y-6  pt-10'>
        <div className='space-y-0.5'>
          <h2 className='text-2xl font-bold tracking-tight'>Income / Expenses</h2>
          <p className='text-muted-foreground'>Manage your Revenues and Expenses.</p>
        </div>
        <Separator className='my-6' />
        <div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <aside className='space-y-6 lg:w-1/5'>
            <WalletSideNav />
          </aside>
          <div className='flex-1 pb-12'>{children}</div>
        </div>
      </div>
    </>
  );
}
