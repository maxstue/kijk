const titles = {
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  413: 'Content Too Large',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
} as const;

/** RFC 9457 response; query strings and internal error details are never included. */
export function apiProblem(request: Request, status: keyof typeof titles, detail: string) {
  return Response.json(
    { type: 'about:blank', title: titles[status], status, detail, instance: new URL(request.url).pathname },
    { status, headers: { 'Content-Type': 'application/problem+json', 'Cache-Control': 'no-store' } },
  );
}
