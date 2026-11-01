import type { ReactNode } from 'react';

/** Component tests isolate the web SDK; the real provider and cookies are covered by Playwright server tests. */
export function WebAuthProvider({ children }: { children: ReactNode }) {
  return children;
}
