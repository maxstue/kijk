import { createBrowserRouter } from 'react-router-dom';

import { authRoute } from '@/routes/auth/auth-route';
import { authenticatedRoute } from '@/routes/root-route';

export const router = createBrowserRouter([authRoute, authenticatedRoute]);
