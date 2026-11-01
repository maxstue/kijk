import type { ReactNode } from 'react';

interface WebAuthProviderProps {
  children: ReactNode;
}

/** Component tests isolate the web SDK; the real provider and cookies are covered by Playwright server tests. */
export function WebAuthProvider({ children }: WebAuthProviderProps) {
  return children;
}
