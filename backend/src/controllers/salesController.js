/**
 * Sales Controller
 * Maneja las peticiones HTTP relacionadas con estadísticas de ventas
 * Utiliza async/await con manejo centralizado de errores
 */

import { z } from "zod";
import * as bigQueryService from "../services/bigQueryService.js";
import * as simulatorService from "../services/simulatorService.js";
import {
  asyncHandler,
  successResponse,
  errorResponse,
} from "../utils/asyncHandler.js";

// ============================================
// Validation Schemas
// ============================================
const periodSchema = z.enum(["today", "week", "month"]).optional();
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .optional();

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
 * Query params: period (today, week, month)
 */
export const getByCategory = asyncHandler(async (req, res) => {
  // Validate period parameter
  const periodResult = periodSchema.safeParse(req.query.period);
  if (!periodResult.success) {
    return errorResponse(
      res,
      "Invalid period. Must be: today, week, or month",
      400
    );
  }

  const period = periodResult.data;
  let startDate = null;

  if (period) {
    const now = new Date();
    // Normalize to start of day for consistent filtering
    now.setHours(0, 0, 0, 0);

    if (period === "today") {
      startDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    } else if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      startDate = weekAgo.toISOString().split("T")[0];
    } else if (period === "month") {
      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 30);
      startDate = monthAgo.toISOString().split("T")[0];
    }
  }

  const data = await bigQueryService.getSalesByCategory(startDate);
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
  // Validate date parameters
  const fromResult = dateSchema.safeParse(req.query.from);
  const toResult = dateSchema.safeParse(req.query.to);

  if (!fromResult.success) {
    return errorResponse(
      res,
      "Invalid 'from' date. Must be in YYYY-MM-DD format",
      400
    );
  }
  if (!toResult.success) {
    return errorResponse(
      res,
      "Invalid 'to' date. Must be in YYYY-MM-DD format",
      400
    );
  }

  const from = fromResult.data;
  const to = toResult.data;

  let data = await bigQueryService.getDailySales();

  // Filtrar por rango de fechas si se especifica
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
