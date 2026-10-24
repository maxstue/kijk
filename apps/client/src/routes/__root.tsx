import type { QueryClient } from '@tanstack/react-query';
import { ClientOnly, HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { App } from '@/app';
import { RootDevtools } from '@/app/root/devtools';
import { Favicon } from '@/app/root/favicon';
import { themeScript } from '@/platform/web/theme-script';
import { AnalyticsTracker } from '@/shared/components/analytics-tracker';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import type { AuthGateway } from '@/shared/runtime/auth';

import appCss from '@kijk/ui/globals.css?url';

interface RootRouteContext {
  queryClient: QueryClient;
  auth: AuthGateway;
}

/** One web app: an SSR document around public routes and the client-rendered private application. */
export const Route = createRootRouteWithContext<RootRouteContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Kijk – resources and budgets' },
      { name: 'description', content: 'Track resources and plan budgets, privately or together in shared spaces.' },
      { name: 'color-scheme', content: 'light dark' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/app.webmanifest' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/light/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootPage,
  pendingComponent: InitLoader,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootPage() {
  const { queryClient } = Route.useRouteContext();
  return (
    <App queryClient={queryClient}>
      <div className='flex min-h-svh flex-1 flex-col'>
        <Outlet />
      </div>
      <ClientOnly>
        <Favicon />
        <Suspense>
          <RootDevtools />
        </Suspense>
        <AnalyticsTracker />
      </ClientOnly>
    </App>
  );
}
