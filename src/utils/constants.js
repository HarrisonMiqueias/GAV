// src/constants.js

// 🔹 URL do servidor Socket.IO
export const SOCKET_SERVER = process.env.REACT_APP_SOCKET_SERVER || "http://localhost:5000";

// 🔹 Raio de colisão dos usuários
export const USER_RADIUS = 60;

// 🔹 Dimensões do mapa (exemplo)
export const MAP_WIDTH = 1400;
export const MAP_HEIGHT = 800;

// 🔹 Velocidade de movimento
export const MOVE_SPEED = 10;

// 🔹 Cores ou estilos padrões (se quiser centralizar)
export const PLAYER_COLORS = ["#ff4d4d", "#4dff4d", "#4d4dff", "#ffff4d"];
