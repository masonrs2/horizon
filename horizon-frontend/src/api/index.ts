import axios from 'axios';
import { 
  User, 
  Post, 
  CreatePostRequest, 
  LikePostRequest, 
  CreateUserRequest,
  LoginRequest,
  LoginResponse
} from '../types';

// Create an axios instance with base URL and default headers
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// User API
export const userApi = {
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/users', userData);
    return response.data;
  },
  
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response;
  },
  
  getUserMe: async () => {
    const response = await api.get('/auth/me');
    return response;
  },
  
  getUserByUsername: async (username: string): Promise<User> => {
    const response = await api.get<User>(`/users/${username}`);
    return response.data;
  },
  
  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${userId}`, userData);
    return response.data;
  },
};

// Post API
export const postApi = {
  createPost: async (postData: CreatePostRequest): Promise<Post> => {
    const response = await api.post<Post>('/posts', postData);
    return response.data;
  },
  
  getPostById: async (postId: string): Promise<Post> => {
    const response = await api.get<Post>(`/posts/${postId}`);
    // Ensure the post has the has_liked field
    return {
      ...response.data,
      has_liked: response.data.has_liked || false
    };
  },
  
  getReplies: async (postId: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/posts/${postId}/replies`);
    return response.data;
  },
  
  getFeedPosts: async (): Promise<Post[]> => {
    const response = await api.get<Post[]>('/posts');
    // Ensure each post has the has_liked field
    return response.data.map(post => ({
      ...post,
      has_liked: post.has_liked || false
    }));
  },
  
  getUserPosts: async (username: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/users/${username}/posts`);
    return response.data;
  },
  
  likePost: async (postId: string): Promise<void> => {
    console.log('Sending like request:', { postId });
    try {
      const response = await api.post(`/posts/${postId}/like`);
      console.log('Like response:', response.data);
    } catch (error: any) {
      if (error.response?.status === 409) {
        // If the user has already liked the post, try to unlike it
        return postApi.unlikePost(postId);
      }
      console.error('Like request failed:', error);
      throw error;
    }
  },
  
  unlikePost: async (postId: string): Promise<void> => {
    console.log('Sending unlike request:', { postId });
    try {
      const response = await api.delete(`/posts/${postId}/like`);
      console.log('Unlike response:', response.data);
    } catch (error) {
      console.error('Unlike request failed:', error);
      throw error;
    }
  },
  
  repostPost: async (postId: string, userId: string): Promise<void> => {
    await api.post(`/posts/${postId}/repost`, { user_id: userId });
  },
  
  replyToPost: async (postData: CreatePostRequest): Promise<Post> => {
    const response = await api.post<Post>('/posts', postData);
    return response.data;
  },
};

export default api; 