import { createClient } from '@supabase/supabase-js';

import { env } from '@/shared/env';

export const supabase = createClient(env.AuthUrl, env.AuthKey);
