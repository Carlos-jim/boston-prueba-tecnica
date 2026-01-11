/**
 * Sales Controller
 * Maneja las peticiones HTTP relacionadas con estadísticas de ventas
 * Utiliza async/await con manejo centralizado de errores
 */

import * as bigQueryService from "../services/bigQueryService.js";
import * as simulatorService from "../services/simulatorService.js";
import {
  asyncHandler,
  successResponse,
  errorResponse,
} from "../utils/asyncHandler.js";

/**
 * GET /api/sales/stats
 * Obtiene estadísticas generales de ventas
 */
export const getStats = asyncHandler(async (req, res) => {
  const stats = await bigQueryService.getGeneralStats();
  const realtime = simulatorService.getRealtimeStats();

  successResponse(res, {
    ...stats,
    realtime: {
      lastMinuteSales: realtime.lastMinuteSales,
      lastMinuteTransactions: realtime.lastMinuteTransactions,
    },
  });
});

/**
 * GET /api/sales/by-category
 * Obtiene ventas agregadas por categoría
 */
export const getByCategory = asyncHandler(async (req, res) => {
  const data = await bigQueryService.getSalesByCategory();
  successResponse(res, data);
});

/**
 * GET /api/sales/by-region
 * Obtiene ventas agregadas por región
 */
export const getByRegion = asyncHandler(async (req, res) => {
  const data = await bigQueryService.getSalesByRegion();
  successResponse(res, data);
});

/**
 * GET /api/sales/daily
 * Obtiene ventas diarias para gráficos de líneas
 * Query params: from, to (formato YYYY-MM-DD)
 */
export const getDaily = asyncHandler(async (req, res) => {
  let data = await bigQueryService.getDailySales();

  // Filtrar por rango de fechas si se especifica
  const { from, to } = req.query;

  if (from) {
    data = data.filter((d) => d.date >= from);
  }
  if (to) {
    data = data.filter((d) => d.date <= to);
  }

  successResponse(res, {
    items: data,
    total: data.length,
    filters: { from, to },
  });
});

/**
 * GET /api/sales/realtime
 * Obtiene estadísticas en tiempo real del último minuto
 */
export const getRealtime = asyncHandler(async (req, res) => {
  const data = simulatorService.getRealtimeStats();
  successResponse(res, data);
});

export default {
  getStats,
  getByCategory,
  getByRegion,
  getDaily,
  getRealtime,
};
