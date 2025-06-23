import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './app.tsx';
import _ from './index.css';
import { AnalyticsService } from '@/shared/lib/analytics-client.ts';
import { ErrorService } from '@/shared/lib/error-tracking.ts';
import { welcome } from '@/shared/utils/string.ts';

welcome();
ErrorService.init();
AnalyticsService.init();

ReactDOM.createRoot(document.querySelector('#app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
