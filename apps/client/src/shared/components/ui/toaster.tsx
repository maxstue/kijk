import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';
import { useThemeStore } from '@/shared/stores/theme-store';

export const AppToaster = ({ ...props }: ToasterProps) => {
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
