import { Clerk } from '@clerk/clerk-js';

declare global {
  interface Window {
    Clerk?: Clerk;
  }
}

export interface AuthClient {
  getInstance(): Clerk | undefined;
  getToken(): Promise<string | null | undefined>;
}

/** A wrapper around the browser's window Clerk object. So you can use the clerk instance outside of the react context. */
const AuthService = {
  getInstance() {
    return window.Clerk;
  },
  async getToken() {
    return this.getInstance()?.session?.getToken();
  },
};

export { AuthService };
