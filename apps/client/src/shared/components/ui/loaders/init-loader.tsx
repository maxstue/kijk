import { AppBrand } from '@/shared/components/app-brand';

/** Full-screen loader for app start. */
export function InitLoader() {
  return (
    <div className='bg-background text-foreground flex h-screen w-screen items-center justify-center'>
      <div className='flex flex-col items-center justify-center gap-3 text-center'>
        <AppBrand className='flex-col gap-4' logoClassName='animate-logo-spin size-24' nameClassName='text-2xl' />
        <output className='text-muted-foreground text-sm'>Getting your space in order…</output>
      </div>
    </div>
  );
}
