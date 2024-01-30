import { ErrorRouteProps } from '@tanstack/react-router';

import { AppRouteError } from '@/shared/components/app-route-error';

export const errorComponent = function SettingsSectionErrorComponent({ error, info }: ErrorRouteProps) {
  return <AppRouteError info={info} error={error} />;
};
