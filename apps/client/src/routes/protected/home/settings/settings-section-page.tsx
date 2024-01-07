import { AccountSection } from '@/app/settings/account/account-section';
import { AppearanceSection } from '@/app/settings/appearance/appearance-section';
import { CategoriesSection } from '@/app/settings/categories/categories-section';
import { NotificationsSection } from '@/app/settings/notifications/notifications-section';
import { ProfileSection } from '@/app/settings/profile/profile-section';
import { Head } from '@/components/head';
import { settingsSectionRoute } from '@/routes/protected/home/settings/settings-section-route';

export default function SettingsSectionPage() {
  const params = settingsSectionRoute.useParams();

  return (
    <>
      <Head title={params.section} />
      <div className='space-y-6'>
        {params.section === 'profile' && <ProfileSection />}
        {params.section === 'account' && <AccountSection />}
        {params.section === 'appearance' && <AppearanceSection />}
        {params.section === 'categories' && <CategoriesSection />}
        {params.section === 'notifications' && <NotificationsSection />}
      </div>
    </>
  );
}
