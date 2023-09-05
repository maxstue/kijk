import { AppearanceForm } from '@/app/settings/appearance/appearance-form';
import { Separator } from '@/components/ui/separator';

export function AppearancePage() {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Appearance</h3>
        <p className='text-sm text-muted-foreground'>
          Customize the appearance of the app. Automatically switch between day and night themes.
        </p>
      </div>
      <Separator />
      <AppearanceForm />
    </div>
  );
}
