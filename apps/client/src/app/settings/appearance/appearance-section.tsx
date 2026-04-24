import { useThemeStore, useThemeStoreActions } from '@kijk/core/stores/theme-store';
import { cn } from '@kijk/core/utils/style';
import { Button } from '@kijk/ui/components/button';
import { Label } from '@kijk/ui/components/label';
import { Separator } from '@kijk/ui/components/separator';
import { MoonIcon, SunIcon, SunMoonIcon } from 'lucide-react';

export function AppearanceSection() {
  const { mode } = useThemeStore();
  const { setMode } = useThemeStoreActions();

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Appearance</h3>
        <p className='text-muted-foreground text-sm'>
          Customize the appearance of the app. Automatically switch between light and dark themes.
        </p>
      </div>
      <Separator />
      <div className='flex flex-col gap-6'>
        <div className='flex flex-1 flex-col space-y-4 md:space-y-6'>
          <div className='space-y-1.5'>
            <Label className='text-xs'>Mode</Label>
            <div className='grid grid-cols-3 gap-2'>
              <Button
                className={cn('py-8', mode === 'light' && 'border-primary border-2')}
                variant='outline'
                onClick={() => setMode('light')}
              >
                <SunIcon className='size-6 -translate-x-1' />
                Light
              </Button>
              <Button
                className={cn('py-8', mode === 'dark' && 'border-primary border-2')}
                variant='outline'
                onClick={() => setMode('dark')}
              >
                <MoonIcon className='size-6 -translate-x-1' />
                Dark
              </Button>
              <Button
                className={cn('py-8', mode === 'system' && 'border-primary border-2')}
                variant='outline'
                onClick={() => setMode('system')}
              >
                <SunMoonIcon className='size-6 -translate-x-1' />
                System
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
