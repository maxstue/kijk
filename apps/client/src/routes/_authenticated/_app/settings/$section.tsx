import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AppearanceSection } from '@/app/settings/appearance/section';
import { InfoSection } from '@/app/settings/info/section';
import { ProfileSection } from '@/app/settings/profile/section';
import { UnitsSection } from '@/app/settings/units/section';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { settingsTo } from '@/shared/navigation/settings';
import { capitalizeFirstLetter } from '@/shared/utils/string';

const sectionSchema = z.enum(settingsTo);

/** `/settings/$section`: a personal settings section. */
export const Route = createFileRoute('/_authenticated/_app/settings/$section')({
  head: ({ params }) => ({ meta: [{ title: capitalizeFirstLetter(params.section) }] }),
  component: SettingsSectionPage,
  errorComponent: ({ info, error }) => <AppError error={error} info={info} />,
  parseParams: (parameters) => ({ section: sectionSchema.parse(parameters.section) }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function SettingsSectionPage() {
  const parameters = Route.useParams();
  return (
    <>
      <div className='space-y-6'>
        {parameters.section === 'profile' && <ProfileSection />}
        {parameters.section === 'appearance' && <AppearanceSection />}
        {parameters.section === 'units' && <UnitsSection scope='personal' />}
        {parameters.section === 'space-units' && <UnitsSection scope='space' />}
        {parameters.section === 'info' && <InfoSection />}
      </div>
    </>
  );
}
