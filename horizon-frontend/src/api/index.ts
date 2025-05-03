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
    const { username, display_name, avatar_url, ...postFields } = response.data;
    return {
      ...postFields,
      reply_count: response.data.reply_count || 0,
      has_liked: response.data.has_liked || false,
      user: {
        id: response.data.user_id,
        username: username || 'unknown',
        display_name: display_name || username || 'Unknown User',
        avatar_url: avatar_url || '',
        email: '', // We don't get this from the post response
        is_private: false,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        email_verified: false
      }
    };
  },
  
  getPostById: async (postId: string): Promise<Post> => {
    const response = await api.get<Post>(`/posts/${postId}`);
    const { username, display_name, avatar_url, ...postData } = response.data;
    return {
      ...postData,
      has_liked: response.data.has_liked || false,
      reply_count: response.data.reply_count || 0,
      user: {
        id: response.data.user_id,
        username: username || 'unknown',
        display_name: display_name || username || 'Unknown User',
        avatar_url: avatar_url || '',
        email: '', // We don't get this from the post response
        is_private: false,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        email_verified: false
      }
    };
  },
  
  getReplies: async (postId: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/posts/${postId}/replies`);
    return response.data.map(post => {
      const { username, display_name, avatar_url, ...postData } = post;
      return {
        ...postData,
        reply_count: post.reply_count || 0,
        has_liked: post.has_liked || false,
        user: {
          id: post.user_id,
          username: username || 'unknown',
          display_name: display_name || username || 'Unknown User',
          avatar_url: avatar_url || '',
          email: '', // We don't get this from the post response
          is_private: false,
          created_at: post.created_at,
          updated_at: post.updated_at,
          email_verified: false
        }
      };
    });
  },
  
  getFeedPosts: async (): Promise<Post[]> => {
    const response = await api.get<Post[]>('/posts');
    return response.data.map(post => {
      const { username, display_name, avatar_url, ...postData } = post;
      return {
        ...postData,
        has_liked: post.has_liked || false,
        reply_count: post.reply_count || 0,
        user: {
          id: post.user_id,
          username: username || 'unknown',
          display_name: display_name || username || 'Unknown User',
          avatar_url: avatar_url || '',
          email: '', // We don't get this from the post response
          is_private: false,
          created_at: post.created_at,
          updated_at: post.updated_at,
          email_verified: false
        }
      };
    });
  },
  
  getUserPosts: async (username: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/users/${username}/posts`);
    return response.data.map(post => {
      const { username, display_name, avatar_url, ...postData } = post;
      return {
        ...postData,
        reply_count: post.reply_count || 0,
        has_liked: post.has_liked || false,
        user: {
          id: post.user_id,
          username: username || 'unknown',
          display_name: display_name || username || 'Unknown User',
          avatar_url: avatar_url || '',
          email: '', // We don't get this from the post response
          is_private: false,
          created_at: post.created_at,
          updated_at: post.updated_at,
          email_verified: false
        }
      };
    });
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

  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}`);
  },
};

export default api; 