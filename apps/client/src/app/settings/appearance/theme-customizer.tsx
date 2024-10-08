import { CSSProperties, useCallback } from 'react';
import { CheckIcon, MoonIcon, SunIcon, Undo2 } from 'lucide-react';

import { ThemeWrapper } from '@/shared/components/theme-wrapper';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { cn } from '@/shared/lib/helpers';
import { themes } from '@/shared/lib/themes';
import { useThemeStore, useThemeStoreActions } from '@/shared/stores/theme-store';

export function ThemeCustomizer() {
  const { theme: activeTheme, mode } = useThemeStore();
  const { setMode, setTheme } = useThemeStoreActions();

  const handleClicked = useCallback(() => {
    setTheme('zinc', 0.5);
  }, [setTheme]);

  return (
    <ThemeWrapper className='flex flex-col space-y-4 md:space-y-6'>
      <div className='flex items-start'>
        <div className='space-y-1 pr-2'>
          <div className='font-semibold leading-none tracking-tight'>Customize</div>
          <div className='text-xs text-muted-foreground'>Pick a style and color for your components.</div>
        </div>
        <Button className='ml-auto border-primary' size='icon' variant='ghost' onClick={handleClicked}>
          <Undo2 />
          <span className='sr-only'>Reset</span>
        </Button>
      </div>
      <div className='flex flex-1 flex-col space-y-4 md:space-y-6'>
        <div className='space-y-1.5'>
          <Label className='text-xs'>Color</Label>
          <div className='grid grid-cols-3 gap-2'>
            {themes.map((theme) => {
              const isActive = activeTheme === theme.name;

              return (
                <Button
                  key={theme.name}
                  className={cn('justify-start', isActive && 'border-2 border-primary')}
                  size='sm'
                  variant={'outline'}
                  style={
                    {
                      '--theme-primary': `hsl(${theme.activeColor[mode === 'dark' ? 'dark' : 'light']})`,
                    } as CSSProperties
                  }
                  onClick={() => {
                    setTheme(theme.name);
                  }}
                >
                  <span
                    className={cn(
                      'mr-1 flex h-5 w-5 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-[--theme-primary]',
                    )}
                  >
                    {isActive && <CheckIcon className='h-4 w-4 text-white' />}
                  </span>
                  {theme.label}
                </Button>
              );
            })}
          </div>
        </div>
        {/* <div className='space-y-1.5'>
          <Label className='text-xs'>Radius</Label>
          <div className='grid grid-cols-5 gap-2'>
            {['0', '0.3', '0.5', '0.75', '1.0'].map((value) => {
              return (
                <Button
                  variant={'outline'}
                  size='sm'
                  key={value}
                  onClick={() => setTheme(activeTheme, parseFloat(value))}
                  className={cn(radius === parseFloat(value) && 'border-2 border-primary')}
                >
                  {value}
                </Button>
              );
            })}
          </div>
        </div> */}
        <div className='space-y-1.5'>
          <Label className='text-xs'>Mode</Label>
          <div className='grid grid-cols-3 gap-2'>
            {/* TODO add system auto Button like in themeswitcher */}
            <Button
              className={cn(mode === 'light' && 'border-2 border-primary')}
              size='sm'
              variant={'outline'}
              onClick={() => {
                setMode('light');
              }}
            >
              <SunIcon className='mr-1 -translate-x-1' />
              Light
            </Button>
            <Button
              className={cn(mode === 'dark' && 'border-2 border-primary')}
              size='sm'
              variant={'outline'}
              onClick={() => {
                setMode('dark');
              }}
            >
              <MoonIcon className='mr-1 -translate-x-1' />
              Dark
            </Button>
          </div>
        </div>
      </div>
    </ThemeWrapper>
  );
}
