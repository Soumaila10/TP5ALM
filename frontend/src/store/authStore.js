import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: '',
  isAuthenticated: false,
  
  setAuth: (user, token) => {
    set({ user, accessToken: token, isAuthenticated: !!token });
  },
  
  clearAuth: () => {
    set({ user: null, accessToken: '', isAuthenticated: false });
  },
}));

// Listen to global logout events from apiRequest helper
if (typeof window !== 'undefined') {
  window.addEventListener('auth-logout', () => {
    useAuthStore.getState().clearAuth();
  });
}
