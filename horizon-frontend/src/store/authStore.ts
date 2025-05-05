import { create } from 'zustand';
import { User, LoginRequest } from '../types';
import { userApi } from '../api';
import { useNotificationStore } from './notificationStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: true,
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

      // Load initial notification count after successful login
      useNotificationStore.getState().loadUnreadCount();
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

    // Reset notification count
    useNotificationStore.getState().resetCount();

    // Update state
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });

    // Dispatch an event to notify components about logout
    window.dispatchEvent(new Event('user-logged-out'));
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Check if we have a token
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ isLoading: false });
        useNotificationStore.getState().resetCount();
        return;
      }

      // Get user info
      const user = await userApi.getCurrentUser();
      set({
        isAuthenticated: true,
        user,
        isLoading: false,
      });

      // Load notification count after successful auth check
      useNotificationStore.getState().loadUnreadCount();
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
            // Load notification count after successful token refresh
            useNotificationStore.getState().loadUnreadCount();
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
      useNotificationStore.getState().resetCount();
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        set({ isAuthenticated: false, user: null });
        useNotificationStore.getState().resetCount();
        return false;
      }

      const response = await userApi.refreshToken(refreshToken);
      if (!response.data.access_token || !response.data.refresh_token) {
        set({ isAuthenticated: false, user: null });
        useNotificationStore.getState().resetCount();
        return false;
      }

      // Update tokens in localStorage
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      set({ isAuthenticated: true });
      return true;
    } catch (error) {
      set({ isAuthenticated: false, user: null });
      useNotificationStore.getState().resetCount();
      return false;
    }
  },

  // Helper function to update user info
  setUser: (user: User) => {
    useAuthStore.setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },
}));