import { AuthResponse, AuthTokenResponse, OAuthResponse, Session, SupabaseClient } from '@supabase/supabase-js';
import { StoreApi, UseBoundStore } from 'zustand';

import { env } from '@/shared/env';
import { supabase } from '@/shared/lib/supabase-client';
import { createStoreFactory } from '@/shared/lib/utils';
import { AllowedProviders, AppUser, Optional } from '@/shared/types/app';
import { AppError } from '@/shared/types/errors';

interface State {
  session: Optional<Session>;
  user: Optional<AppUser>;
  isAuthenticated: boolean;
  supabase?: SupabaseClient;
  actions: {
    setSupabase: (client: SupabaseClient) => void;
    getSupabase: () => SupabaseClient;
    setSession: (session: Optional<Session>) => void;
    setUser: (user: AppUser) => void;
    login: (email: string, password: string) => Promise<AuthTokenResponse>;
    register: (email: string, password: string) => Promise<AuthResponse>;
    signInWith: (provider: AllowedProviders, from?: string) => Promise<OAuthResponse>;
    logout: () => Promise<void>;
  };
}

const authStore = createStoreFactory<State>('auth-store', (set, get) => ({
  session: undefined,
  user: undefined,
  isAuthenticated: false,
  actions: {
    setSupabase(client) {
      set((state) => {
        // TODO fix this type error
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        state.supabase = client;
      });
    },
    getSupabase() {
      const client = get().supabase;
      if (client != null) {
        return client;
      }
      throw new AppError({ type: 'AUTHENTICATION', message: 'The ‘supabase‘ instance is not defined' });
    },
    setSession(session) {
      set((state) => {
        state.session = session;
        state.isAuthenticated = !!session?.access_token;
      });
    },
    setUser(user) {
      set((state) => {
        state.user = user;
      });
    },
    async login(email: string, password: string) {
      return await supabase.auth.signInWithPassword({ email, password });
    },
    async register(email: string, password: string) {
      return await supabase.auth.signUp({ email, password });
    },
    async signInWith(provider, from?: string) {
      return await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${env.SiteUrl}${from ? `${from}/` : '/home/'}`,
        },
      });
    },
    async logout() {
      await supabase.auth.signOut();
    },
  },
}));

export const useAuthStore = authStore as UseBoundStore<StoreApi<Omit<State, 'actions'>>>;
export const useAuthStoreActions = () => authStore((state) => state.actions);
