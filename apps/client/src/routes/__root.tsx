import { Suspense, lazy } from "react";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { LoadedClerk } from "@clerk/react/types";
import type { QueryClient } from "@tanstack/react-query";

import { Favicon } from "@/app/root/favicon";
import { AnalyticsBanner } from "@/shared/components/analytics-banner";
import { AnalyticsTracker } from "@/shared/components/analytics-tracker";
import { config } from "@/shared/config";
import { InitLoader } from "@/shared/components/ui/loaders/init-loader";

interface RootRouteContext {
  queryClient: QueryClient;
  authClient: LoadedClerk | undefined;
  // TODO add posthog and sentry clients here
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: RootPage,
  pendingComponent: InitLoader,
});

function RootPage() {
  return (
    <>
      <Favicon />
      <div className="flex h-screen flex-1 flex-col gap-4">
        <Suspense fallback={<InitLoader />}>
          <Outlet />
        </Suspense>
      </div>
      <Suspense>
        <AnalyticsBanner />
      </Suspense>
      <Suspense>
        <DevModeIndicator />
      </Suspense>
      <Suspense>
        <AnalyticsTracker />
      </Suspense>
      <Suspense>
        <TanStackDevtools
          plugins={[
            {
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      </Suspense>
    </>
  );
}

function DevModeIndicator() {
  return config.Mode === "production" ? undefined : <LazyDevModeIndicator />;
}

const LazyDevModeIndicator = lazy(() =>
  import("@/shared/components/dev-mode-indicator").then(({ DevModeIndicator: Component }) => ({
    default: Component,
  })),
);
