import { AppVersion } from '@/shared/components/app-version';

export function Footer() {
  return (
    <div className='container flex h-8 w-full items-center justify-start'>
      <AppVersion className='text-xs text-muted-foreground' />
    </div>
  );
}
