import type { CaptureResult } from 'posthog-js';

/**
 * Prefix of the query parameters Clerk adds to its links. `__clerk_ticket` in the link of an invitation e-mail is a
 * sign-up credential and must never be sent to analytics.
 */
const providerParameterPrefix = '__clerk';

/** Event and person properties in which PostHog records a URL. */
const urlProperties = ['$current_url', '$referrer', '$initial_current_url', '$initial_referrer'];

/** Removes the authentication provider's query parameters from a URL and leaves everything else unchanged. */
export function removeProviderParameters(value: string) {
  if (!value.includes(providerParameterPrefix)) {
    return value;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    // Not a URL PostHog would send; drop it rather than risk forwarding a ticket.
    return '';
  }
  for (const name of [...url.searchParams.keys()]) {
    if (name.startsWith(providerParameterPrefix)) {
      url.searchParams.delete(name);
    }
  }
  url.hash = url.hash.includes(providerParameterPrefix) ? '' : url.hash;
  return url.toString();
}

function scrubProperties(properties: Record<string, unknown> | undefined) {
  if (!properties) {
    return properties;
  }
  const scrubbed = { ...properties };
  for (const key of urlProperties) {
    const value = scrubbed[key];
    if (typeof value === 'string') {
      scrubbed[key] = removeProviderParameters(value);
    }
  }
  return scrubbed;
}

/** Removes the authentication provider's link parameters from every URL of an analytics event. */
export function scrubAnalyticsEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event) {
    return event;
  }
  return {
    ...event,
    properties: scrubProperties(event.properties)!,
    $set: scrubProperties(event.$set),
    $set_once: scrubProperties(event.$set_once),
  };
}
