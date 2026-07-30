import { useLayoutEffect } from 'react';

import { AppBrand } from '@/shared/components/app-brand';
import { isBootstrapLoaderPresent, registerBootstrapLoader } from '@/shared/lib/bootstrap-loader';

export function InitLoader() {
  const bootstrapLoaderIsPresent = isBootstrapLoaderPresent();

  useLayoutEffect(() => {
    if (bootstrapLoaderIsPresent) {
      return registerBootstrapLoader();
    }
  }, [bootstrapLoaderIsPresent]);

  if (bootstrapLoaderIsPresent) {
    return;
  }

  return (
    <div className='bg-background text-foreground flex h-screen w-screen items-center justify-center'>
      <div className='flex flex-col items-center justify-center gap-3 text-center' role='status'>
        <AppBrand className='flex-col gap-4' logoClassName='animate-logo-spin size-24' nameClassName='text-2xl' />
        <p className='text-muted-foreground text-sm'>Getting your household in order…</p>
      </div>
    </div>
  );
}
