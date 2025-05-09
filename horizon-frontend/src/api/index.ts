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
import { useAuthStore } from '../store/authStore';
import { API_CONFIG, API_TIMEOUT } from '../config/api';

export { userApi } from './userApi';

export const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to track if we're currently refreshing the token
let isRefreshing = false;
// Queue of requests waiting for token refresh
let refreshSubscribers: ((token: string) => void)[] = [];

// Function to add request to queue
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Function to notify all subscribers with new token
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    // Always get the latest token from localStorage for each request
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh`, {
          refresh_token: refreshToken
        });
        
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Post API
export const postApi = {
  createPost: async (postData: CreatePostRequest): Promise<Post> => {
    const response = await api.post<Post>('/posts', postData);
    const { username, display_name, avatar_url, ...postFields } = response.data;
    return {
      ...postFields,
      reply_count: response.data.reply_count || 0,
      has_liked: response.data.has_liked || false,
      has_bookmarked: response.data.has_bookmarked || false,
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
      has_bookmarked: response.data.has_bookmarked || false,
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
        has_bookmarked: post.has_bookmarked || false,
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
        has_bookmarked: post.has_bookmarked || false,
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
        has_bookmarked: post.has_bookmarked || false,
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
  
  getUserReplies: async (username: string): Promise<{ reply: Post; parentPost: Post }[]> => {
    const response = await api.get<{ reply: Post; parentPost: Post }[]>(`/users/${username}/replies`);
    return response.data.map(({ reply, parentPost }) => ({
      reply: {
        ...reply,
        reply_count: reply.reply_count || 0,
        has_liked: reply.has_liked || false,
        has_bookmarked: reply.has_bookmarked || false,
        user: {
          id: reply.user_id,
          username: reply.user?.username || 'unknown',
          display_name: reply.user?.display_name || reply.user?.username || 'Unknown User',
          avatar_url: reply.user?.avatar_url || '',
          email: '', // We don't get this from the post response
          is_private: false,
          created_at: reply.created_at,
          updated_at: reply.updated_at,
          email_verified: false
        }
      },
      parentPost: {
        ...parentPost,
        reply_count: parentPost.reply_count || 0,
        has_liked: parentPost.has_liked || false,
        has_bookmarked: parentPost.has_bookmarked || false,
        user: {
          id: parentPost.user_id,
          username: parentPost.user?.username || 'unknown',
          display_name: parentPost.user?.display_name || parentPost.user?.username || 'Unknown User',
          avatar_url: parentPost.user?.avatar_url || '',
          email: '', // We don't get this from the post response
          is_private: false,
          created_at: parentPost.created_at,
          updated_at: parentPost.updated_at,
          email_verified: false
        }
      }
    }));
  },
  
  getUserLikes: async (username: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/users/${username}/likes`);
    return response.data.map(post => {
      const { username, display_name, avatar_url, ...postData } = post;
      return {
        ...postData,
        reply_count: post.reply_count || 0,
        has_liked: true, // Since this is a liked post
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
      const response = await api.post(`/posts/${postId}/likes`);
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
      const response = await api.delete(`/posts/${postId}/likes`);
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

  bookmarkPost: async (postId: string): Promise<void> => {
    console.log('Sending bookmark request:', { postId });
    try {
      const response = await api.post(`/users/me/bookmarks/${postId}`);
      console.log('Bookmark response:', response.data);
    } catch (error: any) {
      if (error.response?.status === 409) {
        // If the user has already bookmarked the post, try to unbookmark it
        return postApi.unbookmarkPost(postId);
      }
      console.error('Bookmark request failed:', error);
      throw error;
    }
  },
  
  unbookmarkPost: async (postId: string): Promise<void> => {
    console.log('Sending unbookmark request:', { postId });
    try {
      const response = await api.delete(`/users/me/bookmarks/${postId}`);
      console.log('Unbookmark response:', response.data);
    } catch (error) {
      console.error('Unbookmark request failed:', error);
      throw error;
    }
  },

  getUserBookmarks: async (): Promise<Post[]> => {
    const response = await api.get<Post[]>('/users/me/bookmarks');
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
};

export default api; 