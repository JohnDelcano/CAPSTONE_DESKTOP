// src/api/socket.js
import { io } from "socket.io-client";

// 🟢 Your backend URL
export const socket = io("https://api-backend-urlr.onrender.com", {
  transports: ["websocket"], // stable for React Native & browsers
  reconnection: true,
  reconnectionAttempts: 5,
});
