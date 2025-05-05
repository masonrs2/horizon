import { api } from './index';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  post_id?: string;
  parent_post_id?: string;
  type: 'like' | 'repost' | 'reply' | 'follow';
  read: boolean;
  created_at: string;
  updated_at: string;
  actor_username: string;
  actor_display_name: string | null;
  actor_avatar_url: string | null;
  post_content?: string;
  parent_post_content?: string;
}

interface UnreadCountResponse {
  count: number;
}

export const notificationApi = {
  // Get notifications
  getNotifications: async (limit: number = 20, offset: number = 0): Promise<Notification[]> => {
    try {
      const response = await api.get<Notification[]>('/notifications', {
        params: { limit, offset }
      });
      // If we get a 204 No Content, return an empty array
      if (response.status === 204) {
        return [];
      }
      return response.data;
    } catch (error) {
      // Let the global error handler handle 401s for token refresh
      throw error;
    }
  },

  // Get unread notification count
  getUnreadCount: async (): Promise<number> => {
    try {
      console.log('Fetching unread count...'); // Debug log
      const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
      console.log('Unread count response:', response.data); // Debug log
      const count = response.data.count;
      console.log('Extracted count:', count); // Debug log
      return count;
    } catch (error) {
      console.error('Error fetching unread count:', error); // Debug log
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      // Let the global error handler handle 401s for token refresh
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    try {
      await api.put('/notifications/mark-all-read');
    } catch (error) {
      // Let the global error handler handle 401s for token refresh
      throw error;
    }
  }
}; 