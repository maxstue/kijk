import type { AuthGateway, AppSession } from '@/shared/runtime/auth';

/** Resolves the web session through the BFF, without exposing an API token to feature code. */
export const webAuth: AuthGateway = {
  async getSession() {
    const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) {
      return null;
    }
    if (!response.ok) {
      throw new Error('Could not verify the current session.');
    }
    return response.json() as Promise<AppSession>;
  },
};
