import { ProfileForm } from '@/app/settings/profile/form';
import { PageHeader } from '@/shared/components/page-header';

/** Profile settings section. */
export function ProfileSection() {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Profile'
        description={
          <>
            {' '}
            Manage your profile and see which sign-in methods are linked to your account. You can choose whether your
            sign-in profile name and photo appear in Kijk.{' '}
          </>
        }
      />
      <ProfileForm />
    </div>
  );
}
