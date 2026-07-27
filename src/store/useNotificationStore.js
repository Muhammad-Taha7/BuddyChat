import { create } from "zustand";
import axios from "../lib/axios";

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get("/api/notifications");
      if (res.data.success) {
        const notifs = res.data.data.notifications;
        set({
          notifications: notifs,
          unreadCount: notifs.filter((n) => !n.isRead).length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const res = await axios.put(`/api/notifications/${notificationId}/read`);
      if (res.data.success) {
        const updated = get().notifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        );
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.isRead).length,
        });
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await axios.put("/api/notifications/mark-all-read");
      if (res.data.success) {
        set({
          notifications: get().notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        });
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  },

  addNotification: (notification) => {
    set((state) => {
      const newNotifications = [notification, ...state.notifications];
      return {
        notifications: newNotifications,
        unreadCount: state.unreadCount + 1,
      };
    });
  },
}));

export default useNotificationStore;
