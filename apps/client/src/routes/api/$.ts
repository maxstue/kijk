import { createFileRoute } from '@tanstack/react-router';

async function relay({ request }: { request: Request }) {
  const { relayApiRequest } = await import('@/server/handlers');
  return relayApiRequest(request);
}

/**
 * Same-origin entry point, authenticated except for the public invitation preview; .NET remains the permission
 * boundary.
 */
export const Route = createFileRoute('/api/$')({
  server: { handlers: { GET: relay, POST: relay, PUT: relay, PATCH: relay, DELETE: relay } },
});
