// When using headless no UI components or functions which opens them can be used !
import { Clerk } from '@clerk/clerk-js/headless';

import { env } from '@/shared/env';

const authClient = new Clerk(env.AuthPublishableKey);

export { authClient };
