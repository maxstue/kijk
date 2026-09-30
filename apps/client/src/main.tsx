import React from 'react';
import ReactDOM from 'react-dom/client';

import { router } from '@/router';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';
import { ErrorService } from '@/shared/lib/error-tracking';
import { welcome } from '@/shared/utils/string';

import { App } from './app';

import '@kijk/ui/globals.css';

async function start() {
  if (import.meta.env.MODE === 'test' && import.meta.env.VITE_E2E_MOCK_API === 'true') {
    await import('./test/e2e/setup');
  }

  welcome();
  ErrorService.init(router);
  AnalyticsService.init();

  ReactDOM.createRoot(document.querySelector('#app')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void start();
