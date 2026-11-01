import { createFileRoute } from '@tanstack/react-router';

async function relay({ request }: { request: Request }) {
  const { relayApiRequest } = await import('@/server/handlers');
  return relayApiRequest(request);
}

/** Authenticated same-origin entry point; .NET remains the permission boundary. */
export const Route = createFileRoute('/api/$')({
  server: { handlers: { GET: relay, POST: relay, PUT: relay, PATCH: relay, DELETE: relay } },
});
