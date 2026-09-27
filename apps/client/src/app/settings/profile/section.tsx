import { Separator } from '@kijk/ui/components/separator';

import { ProfileForm } from '@/app/settings/profile/form';

export function ProfileSection() {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Profile</h3>
        <p className='text-muted-foreground text-sm'>
          Manage your profile and see which sign-in methods are linked to your account. You can choose whether your
          sign-in profile name and photo appear in Kijk.
        </p>
      </div>
      <Separator />
      <ProfileForm />
    </div>
  );
}
