import { AuthResponse, AuthTokenResponse, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { StoreApi, UseBoundStore } from 'zustand';

import { supabase } from '@/lib/supabase-client';
import { createStoreFactory } from '@/lib/utils';
import { Optional } from '@/types/app';
import { AppError } from '@/types/errors';

interface State {
  session: Optional<Session>;
  user: Optional<User>;
  isAuthenticated: boolean;
  supabase?: SupabaseClient;
  actions: {
    setSupabase: (client: SupabaseClient) => void;
    getSupabase: () => SupabaseClient;
    setSession: (session: Optional<Session>) => void;
    login: (email: string, password: string) => Promise<AuthTokenResponse>;
    register: (email: string, password: string) => Promise<AuthResponse>;
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
        state.user = session?.user;
        state.isAuthenticated = !!session?.access_token;
      });
    },
    async login(email: string, password: string) {
      return await supabase.auth.signInWithPassword({ email, password });
    },
    async register(email: string, password: string) {
      return await supabase.auth.signUp({ email, password });
    },
    async logout() {
      await supabase.auth.signOut();
    },
  },
}));

export const useAuthStore = authStore as UseBoundStore<StoreApi<Omit<State, 'actions'>>>;
export const useAuthStoreActions = () => authStore((state) => state.actions);
