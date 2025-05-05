import { create } from 'zustand';
import { notificationApi } from '../api/notificationApi';

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  loadUnreadCount: () => Promise<void>;
  resetCount: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  loadUnreadCount: async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      console.log('Raw count from API:', count); // Debug log
      set({ unreadCount: count });
      console.log('Updated store count:', count); // Debug log
    } catch (error) {
      console.error('Failed to load unread notification count:', error);
      set({ unreadCount: 0 });
    }
  },
  resetCount: () => set({ unreadCount: 0 }),
})); 