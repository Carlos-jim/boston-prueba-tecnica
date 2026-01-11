-- ============================================
-- DDL para BigQuery - Tabla de Transacciones
-- ============================================
-- Tabla particionada por fecha (timestamp) y 
-- clusterizada por category y region para 
-- optimizar consultas del dashboard
-- ============================================

-- Crear el dataset (si no existe)
CREATE SCHEMA IF NOT EXISTS ecommerce_analytics
OPTIONS (
  location = 'US',
  description = 'Dataset para análisis de ventas e-commerce'
);

-- ============================================
-- TABLA PRINCIPAL: sales_transactions
-- ============================================
-- Particionamiento: Por día (campo timestamp)
--   - Reduce costos al escanear solo particiones necesarias
--   - Ideal para consultas de rangos de fechas (históricos, reportes mensuales)
--
-- Clustering: Por category y region
--   - Optimiza filtros frecuentes del dashboard
--   - Mejora performance en agregaciones por categoría/región
-- ============================================

CREATE TABLE IF NOT EXISTS ecommerce_analytics.sales_transactions (
  -- Identificador único de la transacción
  transaction_id STRING NOT NULL,
  
  -- Timestamp de la venta (usado para particionamiento)
  timestamp TIMESTAMP NOT NULL,
  
  -- Monto de la transacción
  amount NUMERIC(10, 2) NOT NULL,
  
  -- Categoría del producto: Electronics, Clothing, Home, Books
  category STRING NOT NULL,
  
  -- Región geográfica: US-East, US-West, EU-West, EU-Central, APAC, LATAM
  region STRING NOT NULL,
  
  -- Identificador del usuario
  user_id STRING NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY category, region
OPTIONS (
  description = 'Transacciones de ventas históricas y en tiempo real',
  labels = [('env', 'production'), ('team', 'analytics')],
  require_partition_filter = false  -- Cambiar a true en producción para forzar filtros
);

-- ============================================
-- CARGAR DATOS DESDE ARCHIVO NDJSON
-- ============================================
-- Opción 1: Usando bq command line tool
-- bq load --source_format=NEWLINE_DELIMITED_JSON \
--   ecommerce_analytics.sales_transactions \
--   gs://your-bucket/sales_data.ndjson \
--   transaction_id:STRING,timestamp:TIMESTAMP,amount:NUMERIC,category:STRING,region:STRING,user_id:STRING

-- Opción 2: Cargar desde archivo local usando BigQuery Console
-- 1. Ir a BigQuery Console
-- 2. Seleccionar la tabla sales_transactions
-- 3. Click en "Add Data" > "Upload"
-- 4. Seleccionar sales_data.ndjson
-- 5. Formato: JSONL (Newline delimited JSON)

-- ============================================
-- CONSULTAS DE EJEMPLO PARA EL DASHBOARD
-- ============================================

-- Ventas totales por categoría
-- SELECT 
--   category,
--   COUNT(*) as total_transactions,
--   SUM(amount) as total_sales,
--   AVG(amount) as avg_ticket
-- FROM ecommerce_analytics.sales_transactions
-- WHERE DATE(timestamp) BETWEEN '2024-01-01' AND '2024-12-31'
-- GROUP BY category
-- ORDER BY total_sales DESC;

-- Ventas por región y mes
-- SELECT 
--   region,
--   FORMAT_TIMESTAMP('%Y-%m', timestamp) as month,
--   SUM(amount) as monthly_sales
-- FROM ecommerce_analytics.sales_transactions
-- GROUP BY region, month
-- ORDER BY month, region;

-- Ventas diarias (para gráfico de líneas)
-- SELECT 
--   DATE(timestamp) as sale_date,
--   COUNT(*) as transactions,
--   SUM(amount) as daily_sales
-- FROM ecommerce_analytics.sales_transactions
-- GROUP BY sale_date
-- ORDER BY sale_date;
