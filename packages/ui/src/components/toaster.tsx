import { useThemeStore } from '@kijk/ui/stores/theme-store';
import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';

export const Toaster = ({ ...props }: ToasterProps) => {
  const { mode } = useThemeStore();

  return (
    <Sonner
      className='toaster group'
      theme={mode}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};
