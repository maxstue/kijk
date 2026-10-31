import { createFileRoute } from '@tanstack/react-router';

/** Railway readiness endpoint; never redirects to sign-in. */
export const Route = createFileRoute('/health')({
  server: { handlers: { GET: () => Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } }) } },
});
