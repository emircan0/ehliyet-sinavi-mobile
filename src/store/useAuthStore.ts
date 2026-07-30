import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';
import { signOutAndClearUserData } from '../services/auth-session';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  initialized: false,

  initializeAuth: async () => {
    if (get().initialized) return;

    // Set initialized flag first to prevent double-init
    set({ initialized: true });

    // Get initial session
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          await signOutAndClearUserData();
          set({ session: null, user: null, loading: false });
          return;
        }
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        });
      })
      .catch(async () => {
        await signOutAndClearUserData();
        set({ session: null, user: null, loading: false });
      });

    // Single global auth listener — manages all auth events including SIGNED_OUT.
    // Navigation on SIGNED_OUT is handled reactively in _layout.tsx via user state change.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    });

    // Store the unsubscribe so it lives for the lifetime of the app (singleton store)
    // We do NOT return it here since create() doesn't support cleanup,
    // but attaching to window object ensures GC doesn't collect it prematurely.
    (globalThis as any).__authStoreSubscription = subscription;
  },

  signOut: async () => {
    await signOutAndClearUserData();
    set({ session: null, user: null, loading: false });
  },
}));
