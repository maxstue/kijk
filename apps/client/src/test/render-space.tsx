import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { createContext, useContext, type ReactNode } from 'react';
import { render as browserRender } from 'vitest-browser-react';

const Content = createContext<ReactNode>(null);
function SpaceContent() {
  return useContext(Content);
}

/** Renders a component inside a space route, preserving context across rerenders. */
export const render: typeof browserRender = (ui, options) => {
  const root = createRootRoute({ component: Outlet });
  const authenticated = createRoute({ getParentRoute: () => root, id: '_authenticated', component: Outlet });
  const app = createRoute({ getParentRoute: () => authenticated, id: '_app', component: Outlet });
  const space = createRoute({ getParentRoute: () => app, path: '$spaceId', component: SpaceContent });
  const router = createRouter({
    routeTree: root.addChildren([authenticated.addChildren([app.addChildren([space])])]),
    history: createMemoryHistory({ initialEntries: ['/space'] }),
  });
  const Wrapper = options?.wrapper;
  return browserRender(ui, {
    ...options,
    wrapper: ({ children }) => (
      <Content value={Wrapper ? <Wrapper>{children}</Wrapper> : children}>
        <RouterProvider router={router} />
      </Content>
    ),
  });
};
