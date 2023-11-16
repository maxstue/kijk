import { useParams } from 'react-router-dom';

import { AccountSection } from '@/app/settings/account/account-section';
import { AppearanceSection } from '@/app/settings/appearance/appearance-section';
import { CategoriesSection } from '@/app/settings/categories/categories-section';
import { NotificationsSection } from '@/app/settings/notifications/notifications-section';
import { ProfileSection } from '@/app/settings/profile/profile-section';
import { settingsNav } from '@/lib/constants';

export function SettingsSectionPage() {
  const params = useParams<{ section: (typeof settingsNav)[number]['to'] }>();

  return (
    <div className='space-y-6'>
      {params.section === 'profile' && <ProfileSection />}
      {params.section === 'account' && <AccountSection />}
      {params.section === 'appearance' && <AppearanceSection />}
      {params.section === 'categories' && <CategoriesSection />}
      {params.section === 'notifications' && <NotificationsSection />}
    </div>
  );
}
