-- ============================================
-- BigQuery ML - Modelo de Predicción de Ventas
-- ============================================
-- Modelo ARIMA_PLUS para predecir el volumen 
-- de ventas de los próximos 7 días
-- ============================================

-- ============================================
-- PASO 1: Crear vista de ventas diarias agregadas
-- ============================================
-- ARIMA necesita datos de serie temporal agregados

CREATE OR REPLACE VIEW ecommerce_analytics.daily_sales_timeseries AS
SELECT 
  DATE(timestamp) as sale_date,
  SUM(amount) as total_sales,
  COUNT(*) as transaction_count
FROM ecommerce_analytics.sales_transactions
GROUP BY sale_date
ORDER BY sale_date;

-- ============================================
-- PASO 2: Crear modelo ARIMA_PLUS
-- ============================================
-- ARIMA_PLUS es ideal para series temporales
-- - Detecta automáticamente tendencias
-- - Maneja estacionalidad (semanal, mensual)
-- - Robusto ante datos faltantes

CREATE OR REPLACE MODEL ecommerce_analytics.sales_forecast_model
OPTIONS (
  model_type = 'ARIMA_PLUS',
  time_series_timestamp_col = 'sale_date',
  time_series_data_col = 'total_sales',
  auto_arima = TRUE,
  data_frequency = 'DAILY',
  horizon = 7,  -- Predecir 7 días hacia adelante
  holiday_region = 'US'  -- Ajustar por días festivos de EE.UU.
) AS
SELECT
  sale_date,
  total_sales
FROM ecommerce_analytics.daily_sales_timeseries;

-- ============================================
-- PASO 3: Generar predicciones
-- ============================================
-- Esta query devuelve las predicciones para los próximos 7 días

SELECT
  forecast_timestamp as predicted_date,
  forecast_value as predicted_sales,
  standard_error,
  confidence_level,
  prediction_interval_lower_bound as lower_bound,
  prediction_interval_upper_bound as upper_bound,
  confidence_interval_lower_bound,
  confidence_interval_upper_bound
FROM ML.FORECAST(
  MODEL ecommerce_analytics.sales_forecast_model,
  STRUCT(
    7 AS horizon,           -- 7 días de predicción
    0.95 AS confidence_level -- 95% de confianza
  )
)
ORDER BY forecast_timestamp;

-- ============================================
-- PASO 4: Evaluar el modelo (opcional)
-- ============================================
-- Métricas de evaluación del modelo

SELECT *
FROM ML.ARIMA_EVALUATE(MODEL ecommerce_analytics.sales_forecast_model);

-- Coeficientes del modelo
SELECT *
FROM ML.ARIMA_COEFFICIENTS(MODEL ecommerce_analytics.sales_forecast_model);

-- ============================================
-- ALTERNATIVA: Modelo por Categoría
-- ============================================
-- Si necesitas predicciones separadas por categoría

-- CREATE OR REPLACE MODEL ecommerce_analytics.sales_forecast_by_category
-- OPTIONS (
--   model_type = 'ARIMA_PLUS',
--   time_series_timestamp_col = 'sale_date',
--   time_series_data_col = 'total_sales',
--   time_series_id_col = 'category',  -- Modelo separado por categoría
--   auto_arima = TRUE,
--   data_frequency = 'DAILY',
--   horizon = 7
-- ) AS
-- SELECT
--   DATE(timestamp) as sale_date,
--   category,
--   SUM(amount) as total_sales
-- FROM ecommerce_analytics.sales_transactions
-- GROUP BY sale_date, category;

-- ============================================
-- CONSULTA PARA EL BACKEND (API)
-- ============================================
-- Query que usará el endpoint de Node.js para 
-- obtener predicciones formateadas para el frontend

-- SELECT
--   FORMAT_TIMESTAMP('%Y-%m-%d', forecast_timestamp) as date,
--   ROUND(forecast_value, 2) as predicted_sales,
--   ROUND(prediction_interval_lower_bound, 2) as min_sales,
--   ROUND(prediction_interval_upper_bound, 2) as max_sales
-- FROM ML.FORECAST(
--   MODEL ecommerce_analytics.sales_forecast_model,
--   STRUCT(7 AS horizon, 0.95 AS confidence_level)
-- )
-- ORDER BY forecast_timestamp;
