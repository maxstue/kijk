import { AsyncLoader } from '@/shared/components/async-loader';

export const pendingComponent = function SettingsSectionPendingComponent() {
  return <AsyncLoader className='h-6 w-6' />;
};
