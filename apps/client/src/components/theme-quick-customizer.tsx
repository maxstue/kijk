import { CSSProperties } from 'react';
import { CheckIcon } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { themes } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { useThemeStore, useThemeStoreActions } from '@/stores/theme-store';

interface Props {
  onSelect?: () => void;
}

const quickThemes = ['zinc', 'rose', 'blue', 'green', 'orange'] as const;

export function ThemeQuickCustomizer({ onSelect }: Props) {
  const { setTheme } = useThemeStoreActions();
  const { mode, theme: activeTheme } = useThemeStore();

  const handleSelectTheme = (theme: (typeof themes)[number]['name']) => {
    setTheme(theme);
    onSelect?.();
  };

  return (
    <div className='flex items-center gap-2'>
      {quickThemes.map((color) => {
        const theme = themes.find((theme) => theme.name === color);
        const isQuickThemeActive = activeTheme === color;

        return theme ? (
          <TooltipProvider key={theme.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleSelectTheme(theme.name)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs',
                    isQuickThemeActive ? 'border-[--theme-primary]' : 'border-transparent',
                  )}
                  style={
                    {
                      '--theme-primary': `hsl(${theme?.activeColor[mode === 'dark' ? 'dark' : 'light']})`,
                    } as CSSProperties
                  }
                >
                  <span className={cn('flex h-6 w-6 items-center justify-center rounded-full bg-[--theme-primary]')}>
                    {isQuickThemeActive && <CheckIcon className='h-4 w-4 text-white' />}
                  </span>
                  <span className='sr-only'>{theme.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent align='center' className='rounded bg-zinc-900 text-zinc-50'>
                {theme.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null;
      })}
      <div />
    </div>
  );
}
