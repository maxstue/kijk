import { createBrowserRouter, redirect } from 'react-router-dom';

import { authRoute } from '@/routes/auth/auth-route';
import { privateRoute } from '@/routes/root-route';

export const router = createBrowserRouter([
  {
    path: '',
    loader: () => {
      return redirect('home');
    },
  },
  authRoute,
  privateRoute,
]);
