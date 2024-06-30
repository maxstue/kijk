import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AccountSection } from '@/app/settings/account/account-section';
import { AppearanceSection } from '@/app/settings/appearance/appearance-section';
import { CategoriesSection } from '@/app/settings/categories/categories-section';
import { InfoSection } from '@/app/settings/info/info-section';
import { NotificationsSection } from '@/app/settings/notifications/notifications-section';
import { ProfileSection } from '@/app/settings/profile/profile-section';
import { AppError } from '@/shared/components/errors/app-error';
import { Head } from '@/shared/components/head';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { settingsTo } from '@/shared/lib/constants';

const sectionSchema = z.enum(settingsTo);

export const Route = createFileRoute('/_protected/settings/$section')({
  parseParams: (params) => ({ section: sectionSchema.parse(params.section) }),
  component: SettingsSectionPage,
  errorComponent: ({ info, error }) => <AppError info={info} error={error} />,
  pendingComponent: () => <AsyncLoader className='h-6 w-6' />,
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
        {params.section === 'info' && <InfoSection />}
      </div>
    </>
  );
}
