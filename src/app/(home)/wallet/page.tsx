import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Download } from 'lucide-react';

import { authOptions } from '@/lib/auth';
import { getCurrentUser } from '@/lib/session';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Wallet',
  description: 'kijk wallet',
};

export default async function WalletPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(authOptions?.pages?.signIn || '/login');
  }

  return (
    <div className='flex flex-col'>
      <div className='flex-1 space-y-4 pt-6'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-3xl font-bold tracking-tight'>Wallet</h2>
          <div className='flex items-center space-x-2'>
            <Button size='sm'>
              <Download className='mr-2 h-4 w-4' />
              Export
            </Button>
          </div>
        </div>
        <div>hier dann Wallet eingaben</div>
      </div>
    </div>
  );
}
