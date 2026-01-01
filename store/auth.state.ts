import { create } from 'zustand';
import { User } from '@/type';

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
  isLoading: false, // Start as false - don't block app access

  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setUser: (user) => set({ user }),
  setLoading: (value) => set({ isLoading: value }),

  fetchAuthenticatedUser: async () => {
    // Authentication functionality has been removed (Supabase dependency removed)
    // TODO: Implement user fetching with your new backend
    set({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
    return null;
  },

  signOut: async () => {
    // Sign out functionality has been removed (Supabase dependency removed)
    // TODO: Implement sign out with your new backend
    set({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
  },
}));

// Auth state change listener removed (Supabase dependency removed)

export default useAuthStore;
