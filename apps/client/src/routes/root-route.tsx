import { RouterContext } from '@tanstack/react-router';

import { ErrorSimple } from '@/components/error-simple';
import { queryClient } from '@/lib/query-client';

import { RootPage } from './root-page';

const routerContext = new RouterContext<{ queryClient: typeof queryClient }>();

// TODO hier dann auth check ,siehe https://twitter.com/tannerlinsley/status/1697819346578579930
export const rootRoute = routerContext.createRootRoute({
  component: RootPage,
  errorComponent: ({ error }) => <ErrorSimple error={error as Error} />,
});
