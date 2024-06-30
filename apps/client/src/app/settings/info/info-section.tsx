import { AppVersion } from '@/shared/components/app-version';
import { Separator } from '@/shared/components/ui/separator';

export function InfoSection() {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Info</h3>
        <p className='text-sm text-muted-foreground'>Here are some informations about this app.</p>
      </div>
      <Separator />
      <div className='flex items-center gap-4'>
        <div>Version: </div>
        <AppVersion className='text-muted-foreground' />
      </div>
    </div>
  );
}
