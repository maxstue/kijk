import { ProfileForm } from '@/app/settings/profile/form';
import { PageHeader, PageHeaderContent, PageHeaderTitle, PageHeaderDescription } from '@/shared/components/page-header';

/** Profile settings section. */
export function ProfileSection() {
  return (
    <div className='space-y-6'>
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Profile</PageHeaderTitle>
          <PageHeaderDescription>
            {
              <>
                {' '}
                Manage your profile and see which sign-in methods are linked to your account. You can choose whether
                your sign-in profile name and photo appear in Kijk.{' '}
              </>
            }
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>
      <ProfileForm />
    </div>
  );
}
