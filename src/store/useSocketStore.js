import { create } from "zustand";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: [],
  isConnected: false,

  // Connect to socket
  connect: (token) => {
    const existing = get().socket;
    // If socket already exists (even if disconnected due to reconnection), don't create a new one
    if (existing) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);
      set({ isConnected: true });
    });

    socket.on("reconnect", (attempt) => {
      console.log(`🔁 Socket reconnected after ${attempt} attempt(s)`);
      set({ isConnected: true });
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
      set({ isConnected: false });
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection error:", err.message);
    });

    socket.on("onlineUsers", (users) => {
      console.log("📋 Online users list received:", users);
      set({ onlineUsers: users });
    });

    socket.on("userOnline", ({ userId }) => {
      console.log("🟢 User came online:", userId);
      set((state) => ({
        onlineUsers: [...new Set([...state.onlineUsers, userId])],
      }));
    });

    socket.on("userOffline", ({ userId }) => {
      console.log("🔴 User went offline:", userId);
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
}));

export default useSocketStore;
