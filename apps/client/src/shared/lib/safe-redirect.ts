/** Allows only internal navigation targets, including search parameters, after authentication. */
export function safeRedirect(value: string | undefined) {
  if (!value?.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) {
    return '/';
  }
  try {
    const target = new URL(value, 'https://kijk.invalid');
    return target.origin === 'https://kijk.invalid' ? target.pathname + target.search + target.hash : '/';
  } catch {
    return '/';
  }
}
