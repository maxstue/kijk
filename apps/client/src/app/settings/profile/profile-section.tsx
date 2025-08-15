import { ProfileForm } from '@/app/settings/profile/profile-form';
import { Separator } from '@/shared/components/ui/separator';

export function ProfileSection() {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Profile</h3>
        <p className='text-muted-foreground text-sm'>This is how others will see you on the site.</p>
      </div>
      <Separator />
      <ProfileForm />
    </div>
  );
}
