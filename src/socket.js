// src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // ou URL do seu servidor online

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});
