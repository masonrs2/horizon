import { api } from './index';
import { Post, CreatePostRequest } from '@/types';

export const postApi = {
  getPosts: async (limit: number = 20, offset: number = 0): Promise<Post[]> => {
    const response = await api.get<Post[]>('/posts', {
      params: { limit, offset }
    });
    return response.data;
  },

  getPost: async (postId: string): Promise<Post> => {
    const response = await api.get<Post>(`/posts/${postId}`);
    return response.data;
  },

  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await api.post<Post>('/posts', data);
    return response.data;
  },

  likePost: async (postId: string, userId: string): Promise<void> => {
    await api.post(`/posts/${postId}/likes`, { user_id: userId });
  },

  unlikePost: async (postId: string, userId: string): Promise<void> => {
    await api.delete(`/posts/${postId}/likes/${userId}`);
  },

  repostPost: async (postId: string, userId: string): Promise<void> => {
    await api.post(`/posts/${postId}/reposts`, { user_id: userId });
  },

  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}`);
  },

  getReplies: async (postId: string, limit: number = 20, offset: number = 0): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/posts/${postId}/replies`, {
      params: { limit, offset }
    });
    return response.data;
  },

  getUserReplies: async (username: string, limit: number = 20, offset: number = 0): Promise<{ reply: Post, parentPost: Post }[]> => {
    const response = await api.get<{ reply: Post, parentPost: Post }[]>(`/users/${username}/replies`, {
      params: { limit, offset }
    });
    return response.data;
  }
}; 