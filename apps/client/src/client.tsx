import { StartClient } from '@tanstack/react-start/client';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

if (import.meta.env.MODE === 'test' && import.meta.env.VITE_E2E_MOCK_API === 'true') {
  await import('./test/e2e/setup');
}

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
);
