import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Notification, UUID } from '@/types';

interface NotificationState {
  notifications:  Notification[];
  unreadCount:    number;
  isLoading:      boolean;
  hasMore:        boolean;
  page:           number;

  addNotification:      (notification: Notification) => void;
  addNotifications:     (notifications: Notification[], replace?: boolean) => void;
  markAsRead:           (id: UUID) => void;
  markAllAsRead:        () => void;
  removeNotification:   (id: UUID) => void;
  clearAll:             () => void;
  setLoading:           (loading: boolean) => void;
  setHasMore:           (hasMore: boolean) => void;
  incrementPage:        () => void;
  resetPagination:      () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    immer((set) => ({
      notifications: [],
      unreadCount:   0,
      isLoading:     false,
      hasMore:       true,
      page:          1,

      addNotification: (notification) => {
        set((s) => {
          // Prevent duplicates
          if (!s.notifications.find((n) => n.id === notification.id)) {
            s.notifications.unshift(notification);
            if (!notification.read) {
              s.unreadCount++;
            }
            // Cap at 100
            if (s.notifications.length > 100) {
              s.notifications.pop();
            }
          }
        });
      },

      addNotifications: (notifications, replace = false) => {
        set((s) => {
          if (replace) {
            s.notifications = notifications;
          } else {
            const existingIds = new Set(s.notifications.map((n) => n.id));
            const newOnes = notifications.filter((n) => !existingIds.has(n.id));
            s.notifications.push(...newOnes);
          }
          s.unreadCount = s.notifications.filter((n) => !n.read).length;
        });
      },

      markAsRead: (id) => {
        set((s) => {
          const notification = s.notifications.find((n) => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            s.unreadCount = Math.max(0, s.unreadCount - 1);
          }
        });
      },

      markAllAsRead: () => {
        set((s) => {
          s.notifications.forEach((n) => { n.read = true; });
          s.unreadCount = 0;
        });
      },

      removeNotification: (id) => {
        set((s) => {
          const notification = s.notifications.find((n) => n.id === id);
          if (notification && !notification.read) {
            s.unreadCount = Math.max(0, s.unreadCount - 1);
          }
          s.notifications = s.notifications.filter((n) => n.id !== id);
        });
      },

      clearAll: () => {
        set((s) => {
          s.notifications = [];
          s.unreadCount   = 0;
          s.page          = 1;
          s.hasMore       = true;
        });
      },

      setLoading: (loading) => {
        set((s) => { s.isLoading = loading; });
      },

      setHasMore: (hasMore) => {
        set((s) => { s.hasMore = hasMore; });
      },

      incrementPage: () => {
        set((s) => { s.page++; });
      },

      resetPagination: () => {
        set((s) => { s.page = 1; s.hasMore = true; });
      },
    })),
    { name: 'NotificationStore' }
  )
);

export const useUnreadCount    = () => useNotificationStore((s) => s.unreadCount);
export const useNotifications  = () => useNotificationStore((s) => s.notifications);
