import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Single shared socket for the whole app. Created lazily (autoConnect:false)
// so pages that don't need real-time features never open a connection.
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});
