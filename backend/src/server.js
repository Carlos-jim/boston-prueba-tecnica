/**
 * Server Entry Point
 * Configura y arranca el servidor Express con Socket.io
 * Incluye graceful shutdown y manejo robusto de errores
 */

import "dotenv/config"; // Cargar variables de entorno
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

// Routes
import apiRoutes from "./routes/api.js";

// Sockets
import {
  setupSocketHandlers,
  closeAllConnections,
} from "./sockets/socketHandler.js";

// Services
import { startSimulator, stopSimulator } from "./services/simulatorService.js";

// ============================================
// Configuración del servidor
// ============================================
const PORT = process.env.PORT || 3001;
const CORS_ORIGINS = (
  process.env.WEBSOCKET_CORS_ORIGIN ||
  "http://localhost:5173,http://localhost:3000"
).split(",");

const app = express();
const httpServer = createServer(app);

// ============================================
// Configurar Socket.io
// ============================================
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ["GET", "POST"],
  },
  // Configuración de reconexión
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json());

// Middleware de logging para requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(
        `📥 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
      );
    }
  });
  next();
});

// ============================================
// Rutas API
// ============================================
app.use("/api", apiRoutes);

// ============================================
// Manejo de errores global
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ [Server] Error no manejado:", err.message);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============================================
// Inicializar WebSocket y Simulador
// ============================================
setupSocketHandlers(io);
startSimulator(io);

// ============================================
// Graceful Shutdown
// ============================================
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(
    `\n🛑 [Server] Señal ${signal} recibida. Iniciando shutdown graceful...`
  );

  try {
    // 1. Detener el simulador
    stopSimulator();
    console.log("✓ Simulador detenido");

    // 2. Cerrar conexiones WebSocket
    await closeAllConnections(io);
    console.log("✓ Conexiones WebSocket cerradas");

    // 3. Cerrar servidor HTTP
    await new Promise((resolve, reject) => {
      httpServer.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log("✓ Servidor HTTP cerrado");

    console.log("🛑 [Server] Shutdown completado");
    process.exit(0);
  } catch (error) {
    console.error("❌ [Server] Error durante shutdown:", error.message);
    process.exit(1);
  }
};

// Manejar señales de terminación
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Manejar errores no capturados
process.on("uncaughtException", (error) => {
  console.error("❌ [Server] Excepción no capturada:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ [Server] Promise rejection no manejada:", reason);
});

// ============================================
// Iniciar servidor
// ============================================
httpServer.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 E-COMMERCE DASHBOARD BACKEND");
  console.log("=".repeat(50));
  console.log(`\n📡 Servidor iniciado en puerto ${PORT}`);
  console.log(`   API REST:    http://localhost:${PORT}/api`);
  console.log(`   WebSocket:   ws://localhost:${PORT}`);
  console.log(`   Health:      http://localhost:${PORT}/api/health`);
  console.log("\n📊 Endpoints disponibles:");
  console.log("   GET /api/sales/stats          - Estadísticas generales");
  console.log("   GET /api/sales/by-category    - Ventas por categoría");
  console.log("   GET /api/sales/by-region      - Ventas por región");
  console.log("   GET /api/sales/daily          - Ventas diarias");
  console.log("   GET /api/sales/realtime       - Estadísticas tiempo real");
  console.log("   GET /api/predictions/forecast - Predicción 7 días");
  console.log("   GET /api/predictions/historical - Histórico + predicción");
  console.log("\n" + "=".repeat(50) + "\n");
});

// Exportar para testing
export { app, io, httpServer };
