import { api } from './index';
import { CreateUserRequest, LoginRequest, LoginResponse, User, FollowResponse } from '../types';

interface FollowUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  location?: string;
  website?: string;
  is_private: boolean;
  is_accepted: boolean;
  created_at: string;
}

export const userApi = {
  // Auth and user management
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response;
  },
  
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken
    });
    return response;
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
  
  getUserByUsername: async (username: string): Promise<User> => {
    const response = await api.get<User>(`/users/${username}`);
    return response.data;
  },
  
  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${userId}`, userData);
    return response.data;
  },

  // Get user profile
  getProfile: async (username: string): Promise<User> => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },

  // Get user's followers
  getFollowers: async (username: string, limit: number = 20, offset: number = 0): Promise<User[]> => {
    const response = await api.get<User[]>(`/users/${username}/followers`, {
      params: { limit, offset }
    });
    return response.data;
  },

  // Get users that a user is following
  getFollowing: async (username: string, limit: number = 20, offset: number = 0): Promise<User[]> => {
    const response = await api.get<User[]>(`/users/${username}/following`, {
      params: { limit, offset }
    });
    return response.data;
  },

  // Follow a user
  followUser: async (username: string): Promise<FollowResponse> => {
    const response = await api.post<FollowResponse>(`/users/${username}/follow`);
    return response.data;
  },

  // Unfollow a user
  unfollowUser: async (username: string): Promise<void> => {
    await api.delete(`/users/${username}/follow`);
  },

  // Get follow status
  getFollowStatus: async (username: string): Promise<FollowResponse> => {
    const response = await api.get<FollowResponse>(`/users/${username}/follow-status`);
    return response.data;
  },

  // Update user avatar
  updateAvatar: async (userId: string, formData: FormData): Promise<User> => {
    const response = await api.post<User>(`/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // User profile
  getUserProfile: async (username: string): Promise<User> => {
    const response = await api.get<User>(`/users/${username}`);
    return response.data;
  },

  updateProfile: async (displayName: string, bio: string, location: string, website: string): Promise<User> => {
    const response = await api.put<User>('/users/profile', {
      display_name: displayName,
      bio,
      location,
      website
    });
    return response.data;
  },

  acceptFollowRequest: async (username: string): Promise<void> => {
    await api.put(`/users/${username}/follow/accept`);
  },
}; 