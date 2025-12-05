import { create } from 'zustand';
import { getCurrentUser, signOut as supabaseSignOut } from '@/lib/supabase-auth';
import { User } from '@/type';
import { supabase } from '@/lib/supabase';

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  setIsAuthenticated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  setLoading: (value: boolean) => void;
  fetchAuthenticatedUser: () => Promise<User | null>;
  signOut: () => Promise<void>;
};

const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,

  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setUser: (user) => set({ user }),
  setLoading: (value) => set({ isLoading: value }),

  fetchAuthenticatedUser: async () => {
    set({ isLoading: true });

    try {
      const user = await getCurrentUser();

      if (user) {
        set({
          isAuthenticated: true,
          user: user,
          isLoading: false,
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      }
      return user;
    } catch (e) {
      console.log('fetchAuthenticatedUser error', e);
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
      return null;
    }
  },

  signOut: async () => {
    try {
      await supabaseSignOut();
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    } catch (e) {
      console.error('Sign out error:', e);
      throw e;
    }
  },
}));

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    useAuthStore.getState().setIsAuthenticated(false);
    useAuthStore.getState().setUser(null);
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    useAuthStore.getState().fetchAuthenticatedUser();
  }
});

export default useAuthStore;
