import * as Sentry from '@sentry/react';
import { createBrowserRouter, redirect } from 'react-router-dom';

import { authRoute } from '@/routes/auth/auth-route';
import { privateRoute } from '@/routes/root-route';

const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(createBrowserRouter);

export const router = sentryCreateBrowserRouter([
  {
    path: '',
    loader: () => {
      return redirect('home');
    },
  },
  authRoute,
  privateRoute,
]);
