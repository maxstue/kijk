import * as React from 'react';
import { CheckIcon, MoonIcon, SunIcon, Undo2 } from 'lucide-react';

import { ThemeWrapper } from '@/components/theme-wrapper';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { themes } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { useThemeStore, useThemeStoreActions } from '@/stores/theme-store';

export function ThemeCustomizer() {
  const { theme: activeTheme, mode } = useThemeStore();
  const { setMode, setTheme } = useThemeStoreActions();

  return (
    <ThemeWrapper className='flex flex-col space-y-4 md:space-y-6'>
      <div className='flex items-start'>
        <div className='space-y-1 pr-2'>
          <div className='font-semibold leading-none tracking-tight'>Customize</div>
          <div className='text-xs text-muted-foreground'>Pick a style and color for your components.</div>
        </div>
        <Button variant='ghost' size='icon' className='ml-auto border-primary' onClick={() => setTheme('zinc', 0.5)}>
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
                  variant={'outline'}
                  size='sm'
                  key={theme.name}
                  onClick={() => setTheme(theme.name)}
                  className={cn('justify-start', isActive && 'border-2 border-primary')}
                  style={
                    {
                      '--theme-primary': `hsl(${theme?.activeColor[mode === 'dark' ? 'dark' : 'light']})`,
                    } as React.CSSProperties
                  }
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
            <>
              <Button
                variant={'outline'}
                size='sm'
                onClick={() => setMode('light')}
                className={cn(mode === 'light' && 'border-2 border-primary')}
              >
                <SunIcon className='mr-1 -translate-x-1' />
                Light
              </Button>
              <Button
                variant={'outline'}
                size='sm'
                onClick={() => setMode('dark')}
                className={cn(mode === 'dark' && 'border-2 border-primary')}
              >
                <MoonIcon className='mr-1 -translate-x-1' />
                Dark
              </Button>
            </>
          </div>
        </div>
      </div>
    </ThemeWrapper>
  );
}
