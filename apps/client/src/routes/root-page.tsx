import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export default function RootPage() {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools position='bottom-left' />
      <ReactQueryDevtools buttonPosition='bottom-right' />
    </>
  );
}
