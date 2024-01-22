import { FileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AccountSection } from '@/app/settings/account/account-section';
import { AppearanceSection } from '@/app/settings/appearance/appearance-section';
import { CategoriesSection } from '@/app/settings/categories/categories-section';
import { NotificationsSection } from '@/app/settings/notifications/notifications-section';
import { ProfileSection } from '@/app/settings/profile/profile-section';
import { Head } from '@/components/head';
import { settingsTo } from '@/lib/constants';

const sectionSchema = z.enum(settingsTo);

export const Route = new FileRoute('/_protected/home/settings/$section').createRoute({
  parseParams: (params) => {
    return { section: sectionSchema.parse(params.section) };
  },
  component: SettingsSectionPage,
});

function SettingsSectionPage() {
  const params = Route.useParams();

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
