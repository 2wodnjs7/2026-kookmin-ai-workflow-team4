import { create } from 'zustand';
import { clearToken, hasAuth, setToken } from '@/utils/auth';

interface AuthState {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  refresh: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: hasAuth(),

  login: (token: string) => {
    setToken(token);
    set({ isAuthenticated: true });
  },

  logout: () => {
    clearToken();
    set({ isAuthenticated: false });
  },

  refresh: () => {
    set({ isAuthenticated: hasAuth() });
  },
}));
