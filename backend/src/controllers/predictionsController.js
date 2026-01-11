/**
 * Predictions Controller
 * Maneja las peticiones HTTP relacionadas con predicciones ML
 * Utiliza async/await para preparación futura con BigQuery real
 */

import * as bigQueryService from "../services/bigQueryService.js";
import { asyncHandler, successResponse } from "../utils/asyncHandler.js";

/**
 * GET /api/predictions/forecast
 * Obtiene predicción de ventas para los próximos 7 días
 * Simula: ML.FORECAST(MODEL sales_forecast_model)
 */
export const getForecast = asyncHandler(async (req, res) => {
  const forecast = await bigQueryService.getForecastPrediction();
  successResponse(res, forecast);
});

/**
 * GET /api/predictions/historical
 * Obtiene datos históricos combinados con predicción
 * Útil para gráficos que muestran tendencia + forecast
 */
export const getHistorical = asyncHandler(async (req, res) => {
  const data = await bigQueryService.getHistoricalWithForecast();
  successResponse(res, data);
});

export default {
  getForecast,
  getHistorical,
};
