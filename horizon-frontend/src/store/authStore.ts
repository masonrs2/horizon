import { create } from 'zustand';
import api from '@/api';
import { LoginResponse, User } from '@/types';
import { AxiosError } from 'axios';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,

  login: async (username: string, password: string) => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        username,
        password,
      });

      const { access_token, refresh_token, user } = response.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      set({ isAuthenticated: true, isLoading: false, user });
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Login failed:', error.response?.data || error.message);
      }
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ isAuthenticated: false, user: null });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      const response = await api.get<User>('/auth/me');
      set({ isAuthenticated: true, isLoading: false, user: response.data });
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Auth check failed:', error.response?.data || error.message);
      }
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<LoginResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token, user } = response.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      set({ isAuthenticated: true, user });
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Token refresh failed:', error.response?.data || error.message);
      }
      set({ isAuthenticated: false });
      throw error;
    }
  },
}));