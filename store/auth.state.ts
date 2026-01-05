import { create } from 'zustand';
import { User, AuthState } from '@/type';

const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,

  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setUser: (user) => set({ user }),
  setLoading: (value) => set({ isLoading: value }),

  fetchAuthenticatedUser: async () => {
    set({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
    return null;
  },

  signOut: async () => {
    set({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
  },
}));

export default useAuthStore;
