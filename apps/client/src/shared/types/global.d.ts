import type { Clerk as CClerk } from '@clerk/types';

declare global {
  var Clerk: CClerk | undefined;
}
