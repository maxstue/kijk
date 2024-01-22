import { ErrorRouteProps } from '@tanstack/react-router';

import { AppRouteError } from '@/components/app-route-error';

export const errorComponent = function SettingsErrorComponent({ error, info }: ErrorRouteProps) {
  return <AppRouteError info={info} error={error} />;
};
