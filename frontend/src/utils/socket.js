import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
  if (!socket) {
    const baseURL = import.meta.env.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
      : "http://localhost:3000";
      
    socket = io(baseURL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3, // Prevent infinite retry loops on Vercel
      reconnectionDelay: 5000,
      transports: ["websocket"], // Force websocket to prevent Vercel Serverless polling Session ID mismatches
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err.message);
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
