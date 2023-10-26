import { ThemeCustomizer } from '@/app/settings/appearance/theme-customizer';
import { ThemeQuickCustomizer } from '@/components/theme-quick-customizer';

export function AppearanceForm() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <div className='space-y-1 pr-2'>
          <div className='font-semibold leading-none tracking-tight'>Quick Customize</div>
          <div className='text-xs text-muted-foreground'>Pick a style and color from a preset.</div>
        </div>
        <ThemeQuickCustomizer />
      </div>
      <ThemeCustomizer />
    </div>
  );
}
