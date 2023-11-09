import { createBrowserRouter } from 'react-router-dom';

import { authRoute } from '@/routes/auth/auth-route';
import { rootRoute } from '@/routes/root-route';

export const router = createBrowserRouter([authRoute, rootRoute]);
