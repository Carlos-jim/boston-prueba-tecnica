/**
 * API Routes
 * Definición centralizada de todas las rutas de la API
 * Delega la lógica a los controllers correspondientes
 */

import { Router } from "express";
import * as salesController from "../controllers/salesController.js";
import * as predictionsController from "../controllers/predictionsController.js";

const router = Router();

// ============================================
// Health Check
// ============================================
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ecommerce-dashboard-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================
// Sales Routes
// ============================================
router.get("/sales/stats", salesController.getStats);
router.get("/sales/by-category", salesController.getByCategory);
router.get("/sales/by-region", salesController.getByRegion);
router.get("/sales/daily", salesController.getDaily);
router.get("/sales/realtime", salesController.getRealtime);

// ============================================
// Predictions Routes (BigQuery ML)
// ============================================
router.get("/predictions/forecast", predictionsController.getForecast);
router.get("/predictions/historical", predictionsController.getHistorical);

export default router;
