import type { Clerk as CClerk } from '@clerk/types';

declare global {
  // eslint-disable-next-line no-var
  var Clerk: CClerk | undefined;
}
