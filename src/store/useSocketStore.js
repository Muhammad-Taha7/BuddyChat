import { create } from "zustand";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: [],
  isConnected: false,

  // Connect to socket
  connect: (token) => {
    if (get().socket?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket connected");
      set({ isConnected: true });
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
      set({ isConnected: false });
    });

    socket.on("onlineUsers", (users) => {
      set({ onlineUsers: users });
    });

    socket.on("userOnline", ({ userId }) => {
      set((state) => ({
        onlineUsers: [...new Set([...state.onlineUsers, userId])],
      }));
    });

    socket.on("userOffline", ({ userId }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.filter((id) => id !== userId),
      }));
    });

    set({ socket });
  },

  // Disconnect socket
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, onlineUsers: [] });
    }
  },

  // Check if a user is online
  isUserOnline: (userId) => {
    return get().onlineUsers.includes(userId);
  },
}));

export default useSocketStore;
