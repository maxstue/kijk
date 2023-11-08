import { RouteObject } from 'react-router-dom';

import { AuthPage } from '@/routes/auth/auth-page';

export const authRoute = { path: 'auth', element: <AuthPage /> } as RouteObject;
