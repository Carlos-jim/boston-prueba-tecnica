/**
 * Simulator Service
 * Genera transacciones simuladas en tiempo real
 * Emite eventos via WebSocket cada 2-5 segundos
 */

import { v4 as uuidv4 } from "uuid";
import { insertTransaction } from "./bigQueryService.js";
import bigQueryConfig from "../config/bigquery.js";

// Constantes de configuración
const CATEGORIES = ["Electronics", "Clothing", "Home", "Books"];
const REGIONS = [
  "US-East",
  "US-West",
  "EU-West",
  "EU-Central",
  "APAC",
  "LATAM",
];

const PRICE_RANGES = {
  Electronics: { min: 50, max: 2000 },
  Clothing: { min: 15, max: 300 },
  Home: { min: 20, max: 500 },
  Books: { min: 5, max: 80 },
};

// Intervalos configurables (ms)
const MIN_INTERVAL = parseInt(process.env.SIMULATOR_MIN_INTERVAL_MS) || 2000;
const MAX_INTERVAL = parseInt(process.env.SIMULATOR_MAX_INTERVAL_MS) || 5000;
// BATCH_SIZE ahora se lee desde config/bigquery.js
let transactionBuffer = [];

// Estado del simulador
let simulatorState = {
  isRunning: false,
  timeoutId: null,
  startedAt: null,
  transactionsGenerated: 0,
};

let realtimeStats = {
  lastMinuteSales: 0,
  lastMinuteTransactions: 0,
  transactionsBuffer: [],
};

/**
 * Genera una transacción aleatoria con datos realistas
 */
export const generateTransaction = () => {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const priceRange = PRICE_RANGES[category];

  const amount =
    Math.round(
      (priceRange.min + Math.random() * (priceRange.max - priceRange.min)) * 100
    ) / 100;

  return {
    transaction_id: uuidv4(),
    timestamp: new Date().toISOString(),
    amount,
    category,
    region,
    user_id: `user_${String(Math.floor(Math.random() * 2000) + 1).padStart(
      4,
      "0"
    )}`,
  };
};

/**
 * Actualiza las estadísticas en tiempo real
 */
const updateRealtimeStats = (transaction) => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Añadir transacción al buffer
  realtimeStats.transactionsBuffer.push({
    ...transaction,
    receivedAt: now,
  });

  // Limpiar transacciones antiguas (más de 1 minuto)
  realtimeStats.transactionsBuffer = realtimeStats.transactionsBuffer.filter(
    (t) => t.receivedAt > oneMinuteAgo
  );

  // Recalcular estadísticas del último minuto
  realtimeStats.lastMinuteTransactions =
    realtimeStats.transactionsBuffer.length;
  realtimeStats.lastMinuteSales = realtimeStats.transactionsBuffer.reduce(
    (sum, t) => sum + t.amount,
    0
  );
};

/**
 * Obtiene las estadísticas en tiempo real actuales
 */
export const getRealtimeStats = () => ({
  lastMinuteSales: Math.round(realtimeStats.lastMinuteSales * 100) / 100,
  lastMinuteTransactions: realtimeStats.lastMinuteTransactions,
  recentTransactions: realtimeStats.transactionsBuffer.slice(-10).reverse(),
  simulator: {
    isRunning: simulatorState.isRunning,
    startedAt: simulatorState.startedAt,
    transactionsGenerated: simulatorState.transactionsGenerated,
  },
});

/**
 * Inicia el simulador de transacciones
 * Emite un evento 'new-transaction' cada 2-5 segundos
 */
export const startSimulator = (io) => {
  if (simulatorState.isRunning) {
    console.log("⚠️ [SimulatorService] El simulador ya está corriendo");
    return;
  }

  console.log("⚡ [SimulatorService] Iniciando simulador de transacciones...");
  console.log(`   Intervalo: ${MIN_INTERVAL}-${MAX_INTERVAL}ms`);

  simulatorState.isRunning = true;
  simulatorState.startedAt = new Date().toISOString();
  simulatorState.transactionsGenerated = 0;

  const emitTransaction = async () => {
    if (!simulatorState.isRunning) return;

    const transaction = generateTransaction();

    // Actualizar estadísticas
    updateRealtimeStats(transaction);
    simulatorState.transactionsGenerated++;

    // Emitir a todos los clientes conectados
    io.emit("new-transaction", {
      transaction,
      stats: getRealtimeStats(),
    });

    // 🔥 BONUS: Insertar en BigQuery (Batch Buffer)
    // Acumulamos en buffer para enviar en lotes y ahorrar cuota
    transactionBuffer.push(transaction);

    if (transactionBuffer.length >= bigQueryConfig.batchSize) {
      const batch = [...transactionBuffer];
      transactionBuffer = []; // Limpiamos buffer

      insertTransaction(batch).catch((err) => {
        console.error("Error insertando Batch:", err.message);
      });
    }

    // Emitir a room de categoría específica
    io.to(`category:${transaction.category}`).emit("category-transaction", {
      transaction,
      category: transaction.category,
    });

    // Log para monitoreo
    console.log(
      `💰 [Venta] $${transaction.amount.toFixed(2)} - ${
        transaction.category
      } (${transaction.region})`
    );

    // Programar siguiente transacción
    const nextDelay =
      MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    simulatorState.timeoutId = setTimeout(emitTransaction, nextDelay);
  };

  // Iniciar después de 2 segundos de arranque del servidor
  simulatorState.timeoutId = setTimeout(emitTransaction, 2000);
};

/**
 * Detiene el simulador de transacciones
 */
export const stopSimulator = () => {
  if (!simulatorState.isRunning) {
    console.log("⚠️ [SimulatorService] El simulador no está corriendo");
    return;
  }

  console.log("🛑 [SimulatorService] Deteniendo simulador...");

  if (simulatorState.timeoutId) {
    clearTimeout(simulatorState.timeoutId);
    simulatorState.timeoutId = null;
  }

  simulatorState.isRunning = false;
  console.log(
    `✓ [SimulatorService] Simulador detenido. ` +
      `Transacciones generadas: ${simulatorState.transactionsGenerated}`
  );
};

/**
 * Reinicia el simulador
 */
export const restartSimulator = (io) => {
  stopSimulator();
  startSimulator(io);
};

export default {
  generateTransaction,
  getRealtimeStats,
  startSimulator,
  stopSimulator,
  restartSimulator,
};
