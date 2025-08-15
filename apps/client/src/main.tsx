import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './app.tsx';
import { AnalyticsService } from '@/shared/lib/analytics-client.ts';
import { ErrorService } from '@/shared/lib/error-tracking.ts';
import { welcome } from '@/shared/utils/string.ts';
import './index.css';

welcome();
ErrorService.init();
AnalyticsService.init();

ReactDOM.createRoot(document.querySelector('#app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
