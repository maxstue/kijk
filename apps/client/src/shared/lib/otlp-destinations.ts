export interface OtlpDestination {
  headers: Record<string, string>;
  url: string;
}

/** Derives the OTLP traces endpoint and its public key header from a Sentry DSN. */
export function sentryDestination(dsn: string): OtlpDestination | undefined {
  try {
    const { host, password: _secret, pathname, protocol, username } = new URL(dsn);
    const projectId = pathname.split('/').findLast(Boolean);
    if (!username || !projectId) {
      return undefined;
    }
    return {
      headers: { 'x-sentry-auth': `sentry sentry_key=${username}` },
      url: `${protocol}//${host}/api/${projectId}/integration/otlp/v1/traces`,
    };
  } catch {
    return undefined;
  }
}

/** Derives the OTLP traces endpoint from the PostHog ingestion host and authenticates with the public project token. */
export function posthogDestination(key: string, url: string): OtlpDestination {
  return { headers: { Authorization: `Bearer ${key}` }, url: `${url.replace(/\/+$/, '')}/i/v1/traces` };
}
