import React from 'react';
import ReactDOM from 'react-dom/client';

import { AnalyticsService } from '@/shared/lib/analytics-tracking.ts';
import { ErrorService } from '@/shared/lib/error-tracking.ts';
import { welcome } from '@/shared/utils/string.ts';

import App from './app_1.tsx';

import './index.css';

welcome();
ErrorService.init();
AnalyticsService.init();

ReactDOM.createRoot(document.querySelector('#app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
