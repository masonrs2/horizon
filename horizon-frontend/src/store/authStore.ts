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
      
      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Remove any existing hyphens first, then format correctly
      const cleanUserId = user_id.replace(/-/g, '');
      const formattedUserId = cleanUserId.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
      
      // Update state
      set({
        isAuthenticated: true,
        user: {
          id: formattedUserId,
          username,
          email,
          display_name,
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_verified: false
        },
        error: null,
        isLoading: false,
      });
    } catch (error: any) {
      // Handle the new error format
      let errorMessage = 'Login failed';
      if (error.response?.data?.errors?.length > 0) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw error; // Re-throw to let the component handle it
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ 
      user: null, 
      isAuthenticated: false 
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      // Fetch the current user data from the /auth/me endpoint
      const response = await userApi.getUserMe();
      
      // Format the user ID as a UUID by adding hyphens if it's not already formatted
      const userData = response.data;
      if (userData.id) {
        const cleanUserId = userData.id.replace(/-/g, '');
        userData.id = cleanUserId.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
      }
      
      set({ 
        isAuthenticated: true, 
        user: userData,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to validate auth:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },
})); 