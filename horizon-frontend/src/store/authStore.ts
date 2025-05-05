import { create } from 'zustand';
import { User, LoginRequest } from '../types';
import { userApi } from '../api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userApi.login(credentials);
      const { access_token, refresh_token, user_id, username, email, display_name } = response.data;
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Get full user info
      const user = await userApi.getCurrentUser();

      // Update state
      set({
        isAuthenticated: true,
        user,
        isLoading: false,
      });
    } catch (error) {
      set({
        isAuthenticated: false,
        user: null,
        error: 'Invalid username or password',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Update state
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Check if we have a token
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      // Get user info
      const user = await userApi.getCurrentUser();
      set({
        isAuthenticated: true,
        user,
        isLoading: false,
      });
    } catch (error) {
      // If the error is 401, try to refresh the token
      if (error.response?.status === 401) {
        const refreshed = await useAuthStore.getState().refreshToken();
        if (refreshed) {
          // Try to get user info again
          try {
            const user = await userApi.getCurrentUser();
            set({
              isAuthenticated: true,
              user,
              isLoading: false,
            });
            return;
          } catch (error) {
            console.error('Failed to get user info after token refresh:', error);
          }
        }
      }

      // If we get here, either the refresh failed or getting user info failed
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }

      const response = await userApi.refreshToken(refreshToken);
      const { access_token, refresh_token } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      useAuthStore.getState().logout();
      return false;
    }
  },
}));