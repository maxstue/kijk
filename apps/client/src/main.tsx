import React from 'react';
import ReactDOM from 'react-dom/client';

import { AnalyticsService } from '@/shared/lib/analytics-client';
import { ErrorService } from '@/shared/lib/error-tracking';
import { welcome } from '@/shared/utils/string';

import { App } from './app';

import '@kijk/ui/globals.css';

welcome();
ErrorService.init();
AnalyticsService.init();

ReactDOM.createRoot(document.querySelector('#app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
