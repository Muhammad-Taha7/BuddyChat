import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socket;

export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn("Socket is not initialized yet. Call initSocket first.");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
