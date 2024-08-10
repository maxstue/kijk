import React from 'react';
import ReactDOM from 'react-dom/client';

import { createSentry } from '@/shared/lib/error-tracking.ts';
import { welcome } from '@/shared/utils/string.ts';

import App from './app.tsx';

import './index.css';

welcome();
createSentry();

ReactDOM.createRoot(document.querySelector('#app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
