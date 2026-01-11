/**
 * Socket Handler
 * Maneja las conexiones WebSocket con Socket.io
 * Implementa tracking de clientes, middleware y manejo robusto de errores
 */

import * as simulatorService from "../services/simulatorService.js";

// ============================================
// Estado de conexiones
// ============================================
const connectionState = {
  clients: new Map(), // socketId -> { connectedAt, lastActivity }
  totalConnections: 0,
  peakConnections: 0,
};

/**
 * Obtiene estadísticas de conexiones activas
 */
export const getConnectionStats = () => ({
  activeClients: connectionState.clients.size,
  totalConnections: connectionState.totalConnections,
  peakConnections: connectionState.peakConnections,
  clients: Array.from(connectionState.clients.entries()).map(([id, data]) => ({
    socketId: id,
    connectedAt: data.connectedAt,
    lastActivity: data.lastActivity,
  })),
});

/**
 * Middleware de conexión
 * Valida y registra nuevas conexiones
 */
const connectionMiddleware = (socket, next) => {
  // Registrar información de conexión
  const clientInfo = {
    ip: socket.handshake.address,
    userAgent: socket.handshake.headers["user-agent"],
    origin: socket.handshake.headers.origin,
  };

  // Log de conexión entrante
  console.log(
    `🔌 [SocketHandler] Nueva conexión desde ${clientInfo.origin || "unknown"}`
  );

  // Adjuntar info al socket para uso posterior
  socket.clientInfo = clientInfo;

  // Continuar con la conexión
  next();
};

/**
 * Registra un cliente conectado
 */
const registerClient = (socket) => {
  const clientData = {
    connectedAt: new Date().toISOString(),
    lastActivity: Date.now(),
    info: socket.clientInfo,
  };

  connectionState.clients.set(socket.id, clientData);
  connectionState.totalConnections++;

  // Actualizar peak
  if (connectionState.clients.size > connectionState.peakConnections) {
    connectionState.peakConnections = connectionState.clients.size;
  }
};

/**
 * Elimina un cliente desconectado
 */
const unregisterClient = (socketId) => {
  connectionState.clients.delete(socketId);
};

/**
 * Actualiza última actividad de un cliente
 */
const updateClientActivity = (socketId) => {
  const client = connectionState.clients.get(socketId);
  if (client) {
    client.lastActivity = Date.now();
  }
};

/**
 * Configura los eventos de WebSocket
 * @param {Server} io - Instancia de Socket.io
 */
export const setupSocketHandlers = (io) => {
  // Aplicar middleware de conexión
  io.use(connectionMiddleware);

  io.on("connection", (socket) => {
    // Registrar cliente
    registerClient(socket);

    console.log(
      `🔌 [SocketHandler] Cliente conectado: ${socket.id} ` +
        `(${connectionState.clients.size} activos)`
    );

    // Enviar estado inicial al conectarse
    socket.emit("connected", {
      message: "Conectado al servidor de tiempo real",
      socketId: socket.id,
      stats: simulatorService.getRealtimeStats(),
      serverStats: {
        activeClients: connectionState.clients.size,
      },
      timestamp: new Date().toISOString(),
    });

    // Manejar solicitud de estadísticas
    socket.on("get-stats", () => {
      updateClientActivity(socket.id);
      socket.emit("stats-update", {
        realtime: simulatorService.getRealtimeStats(),
        connections: getConnectionStats(),
      });
    });

    // Ping/Pong para mantener conexión activa
    socket.on("ping", () => {
      updateClientActivity(socket.id);
      socket.emit("pong", {
        timestamp: Date.now(),
        activeClients: connectionState.clients.size,
      });
    });

    // Suscribirse a categoría específica (ejemplo de rooms)
    socket.on("subscribe-category", (category) => {
      updateClientActivity(socket.id);
      socket.join(`category:${category}`);
      socket.emit("subscribed", { category, room: `category:${category}` });
      console.log(`📢 [SocketHandler] ${socket.id} suscrito a ${category}`);
    });

    // Desuscribirse de categoría
    socket.on("unsubscribe-category", (category) => {
      updateClientActivity(socket.id);
      socket.leave(`category:${category}`);
      socket.emit("unsubscribed", { category });
    });

    // Manejar desconexión
    socket.on("disconnect", (reason) => {
      unregisterClient(socket.id);
      console.log(
        `🔌 [SocketHandler] Cliente desconectado: ${socket.id} ` +
          `(${reason}) - ${connectionState.clients.size} activos`
      );
    });

    // Manejar errores de socket
    socket.on("error", (error) => {
      console.error(
        `❌ [SocketHandler] Error en socket ${socket.id}:`,
        error.message
      );
    });
  });

  // Manejar errores del servidor Socket.io
  io.engine.on("connection_error", (err) => {
    console.error("❌ [SocketHandler] Error de conexión:", err.message);
  });

  console.log("🔌 [SocketHandler] WebSocket configurado y listo");
};

/**
 * Cierra todas las conexiones de forma limpia
 * @param {Server} io - Instancia de Socket.io
 */
export const closeAllConnections = async (io) => {
  console.log("🔌 [SocketHandler] Cerrando todas las conexiones...");

  // Notificar a todos los clientes
  io.emit("server-shutdown", {
    message: "El servidor se está reiniciando",
    timestamp: new Date().toISOString(),
  });

  // Esperar un momento para que los clientes reciban el mensaje
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Desconectar todos los sockets
  const sockets = await io.fetchSockets();
  for (const socket of sockets) {
    socket.disconnect(true);
  }

  connectionState.clients.clear();
  console.log("🔌 [SocketHandler] Todas las conexiones cerradas");
};

export default {
  setupSocketHandlers,
  getConnectionStats,
  closeAllConnections,
};
