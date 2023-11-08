import { RouteObject } from 'react-router-dom';

import { DashboardPage } from '@/routes/dashboard/dashboard-page';

export const dashboardRoute = { index: true, element: <DashboardPage /> } as RouteObject;
