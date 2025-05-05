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

export { userApi } from './userApi';

// Create an axios instance with base URL and default headers
export const api = axios.create({
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

// Flag to track if we're currently refreshing the token
let isRefreshing = false;
// Store of waiting requests
let waitingRequests: Array<{
  resolve: (value: unknown) => void;
  reject: (error: any) => void;
  config: any;
}> = [];

// Function to process waiting requests
const processWaitingRequests = (error: any, token: string | null = null) => {
  waitingRequests.forEach(({ resolve, reject, config }) => {
    if (!token) {
      reject(error);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
      resolve(api(config));
    }
  });
  waitingRequests = [];
};

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already refreshing, add this request to the waiting queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waitingRequests.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token available, force logout
          useAuthStore.getState().logout();
          processWaitingRequests(error);
          return Promise.reject(error);
        }

        // Make the refresh token request using a new axios instance
        // to avoid interceptors and potential infinite loops
        const refreshResponse = await axios.post<LoginResponse>(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/refresh`,
          { refresh_token: refreshToken },
          { 
            headers: { 'Content-Type': 'application/json' },
            // Add a longer timeout for refresh requests
            timeout: 10000
          }
        );

        const { access_token, refresh_token } = refreshResponse.data;

        // Update tokens in localStorage
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // Update the Authorization header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        // Process any requests that were waiting
        processWaitingRequests(null, access_token);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, logout the user and reject all waiting requests
        useAuthStore.getState().logout();
        processWaitingRequests(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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