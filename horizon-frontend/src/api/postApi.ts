import { api } from './index';
import { Post, CreatePostRequest } from '@/types';

interface PresignedURLResponse {
  uploadURL: string;
  fileURL: string;
}

export const postApi = {
  getPosts: async (limit: number = 20, offset: number = 0): Promise<Post[]> => {
    const response = await api.get<Post[]>('/posts', {
      params: { limit, offset }
    });
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
  },

  getUploadURL: async (fileType: string): Promise<PresignedURLResponse> => {
    const response = await api.get<PresignedURLResponse>('/posts/upload-url', {
      params: { fileType }
    });
    return response.data;
  },

  uploadFile: async (uploadURL: string, file: File): Promise<void> => {
    await fetch(uploadURL, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  }
}; 