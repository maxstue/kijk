import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AccountSection } from '@/app/settings/account/account-section';
import { AppearanceSection } from '@/app/settings/appearance/appearance-section';
import { InfoSection } from '@/app/settings/info/info-section';
import { ProfileSection } from '@/app/settings/profile/profile-section';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
import { settingsTo } from '@/shared/lib/constants';

const sectionSchema = z.enum(settingsTo);

export const Route = createFileRoute('/_protected/settings/$section')({
  parseParams: (parameters) => ({ section: sectionSchema.parse(parameters.section) }),
  component: SettingsSectionPage,
  errorComponent: ({ info, error }) => <AppError error={error} info={info} />,
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function SettingsSectionPage() {
  const parameters = Route.useParams();
  useSetSiteHeader(parameters.section);
  return (
    <>
      <div className='space-y-6'>
        {parameters.section === 'profile' && <ProfileSection />}
        {parameters.section === 'account' && <AccountSection />}
        {parameters.section === 'appearance' && <AppearanceSection />}
        {parameters.section === 'info' && <InfoSection />}
      </div>
    </>
  );
}
