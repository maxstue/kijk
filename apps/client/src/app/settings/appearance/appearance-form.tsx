import { ThemeCustomizer } from '@/app/settings/appearance/theme-customizer';

export function AppearanceForm() {
  return (
    <div className='flex flex-col gap-6'>
      <ThemeCustomizer />
    </div>
  );
}
