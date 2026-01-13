/**
 * BigQuery Service
 * Maneja todas las operaciones de datos y consultas
 * Usa BigQuery real en producción, datos locales en desarrollo
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bigQueryConfig from "../config/bigquery.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(
  __dirname,
  "../../..",
  "database",
  "data",
  "sales_data.json"
);

// Verificar si estamos en producción
const isProduction = process.env.NODE_ENV === "production";

// Cliente de BigQuery (solo en producción)
let bigQueryClient = null;

if (isProduction) {
  try {
    const { BigQuery } = await import("@google-cloud/bigquery");
    bigQueryClient = new BigQuery({
      projectId: bigQueryConfig.projectId,
      keyFilename: bigQueryConfig.keyFilename,
    });
    console.log("✅ [BigQueryService] Conectado a BigQuery real");
  } catch (error) {
    console.error(
      "❌ [BigQueryService] Error conectando a BigQuery:",
      error.message
    );
  }
}

// Cache de datos en memoria (para desarrollo)
let salesDataCache = null;

/**
 * Cargar datos del dataset local (desarrollo)
 */
export const loadSalesData = () => {
  if (salesDataCache) return salesDataCache;

  try {
    const rawData = fs.readFileSync(DATA_PATH, "utf-8");
    let data = JSON.parse(rawData);

    // Shift dates to "now" for realistic dev experience
    if (data.length > 0) {
      // Find latest date in dataset
      const timestamps = data.map((d) => new Date(d.timestamp).getTime());
      const maxTime = Math.max(...timestamps);
      const now = Date.now();
      const diff = now - maxTime;

      // Only shift if latest data is older than 24 hours
      if (diff > 86400000) {
        console.log(
          `🕒 [BigQueryService] Time-shifting data by ${Math.round(
            diff / 86400000
          )} days`
        );
        data = data.map((d) => ({
          ...d,
          timestamp: new Date(
            new Date(d.timestamp).getTime() + diff
          ).toISOString(),
        }));
      }
    }

    salesDataCache = data;
    console.log(
      `📦 [BigQueryService] Datos locales cargados: ${salesDataCache.length} transacciones`
    );
    return salesDataCache;
  } catch (error) {
    console.error("[BigQueryService] Error cargando datos:", error.message);
    return [];
  }
};

/**
 * Ejecutar query en BigQuery (producción)
 * @param {string} query - SQL query
 * @param {Object} params - Query parameters for parameterized queries
 */
const runQuery = async (query, params = {}) => {
  if (!bigQueryClient) {
    throw new Error("BigQuery client not initialized");
  }
  const options = { query };
  if (Object.keys(params).length > 0) {
    options.params = params;
  }
  const [rows] = await bigQueryClient.query(options);
  return rows;
};

/**
 * Normaliza los datos de BigQuery:
 * - Convierte fechas { value: "..." } a string plano
 * - Convierte strings numéricas a números
 * - Maneja BigInt y otros tipos especiales de BigQuery
 */
const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return value;
  }
  // BigQuery DATE/TIMESTAMP/BigInt returns { value: "..." }
  if (typeof value === "object" && "value" in value) {
    const innerValue = value.value;
    // Check if the inner value is numeric
    if (
      typeof innerValue === "string" &&
      !isNaN(parseFloat(innerValue)) &&
      isFinite(innerValue)
    ) {
      return parseFloat(innerValue);
    }
    return innerValue;
  }
  // Convert numeric strings to numbers
  if (
    typeof value === "string" &&
    !isNaN(parseFloat(value)) &&
    isFinite(value)
  ) {
    return parseFloat(value);
  }
  // Handle BigInt
  if (typeof value === "bigint") {
    return Number(value);
  }
  return value;
};

const normalizeRow = (row) => {
  if (!row) return row;
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key] = normalizeValue(value);
  }
  return normalized;
};

const normalizeRows = (rows) => rows.map(normalizeRow);

/**
 * Obtener estadísticas generales con variación mensual
 */
export const getGeneralStats = async () => {
  // PRODUCCIÓN: Ejecutar query real a BigQuery
  if (isProduction && bigQueryClient) {
    // Query para obtener stats totales y comparar último mes vs mes anterior del dataset
    const query = `
      WITH totals AS (
        SELECT 
          SUM(amount) as totalSales,
          COUNT(*) as totalTransactions,
          AVG(amount) as avgTicket,
          COUNT(DISTINCT user_id) as uniqueUsers
        FROM \`${bigQueryConfig.projectId}.${bigQueryConfig.dataset}.${bigQueryConfig.tables.salesTransactions}\`
      ),
      dec_2024 AS (
        SELECT 
          SUM(amount) as totalSales,
          COUNT(*) as totalTransactions,
          COUNT(DISTINCT user_id) as uniqueUsers
        FROM \`${bigQueryConfig.projectId}.${bigQueryConfig.dataset}.${bigQueryConfig.tables.salesTransactions}\`
        WHERE EXTRACT(YEAR FROM timestamp) = 2024 AND EXTRACT(MONTH FROM timestamp) = 12
      ),
      nov_2024 AS (
        SELECT 
          SUM(amount) as totalSales,
          COUNT(*) as totalTransactions,
          COUNT(DISTINCT user_id) as uniqueUsers
        FROM \`${bigQueryConfig.projectId}.${bigQueryConfig.dataset}.${bigQueryConfig.tables.salesTransactions}\`
        WHERE EXTRACT(YEAR FROM timestamp) = 2024 AND EXTRACT(MONTH FROM timestamp) = 11
      )
      SELECT 
        t.totalSales,
        t.totalTransactions,
        t.avgTicket,
        t.uniqueUsers,
        d.totalSales as currSales,
        d.totalTransactions as currTx,
        d.uniqueUsers as currUsers,
        n.totalSales as prevSales,
        n.totalTransactions as prevTx,
        n.uniqueUsers as prevUsers
      FROM totals t, dec_2024 d, nov_2024 n
    `;
    const rows = await runQuery(query);
    const data = normalizeRow(rows[0]) || {};

    // Calcular variaciones porcentuales
    const calcTrend = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return Math.round(((current - previous) / previous) * 10000) / 100;
    };

    return {
      totalSales: data.totalSales || 0,
      totalTransactions: data.totalTransactions || 0,
      avgTicket: data.avgTicket || 0,
      uniqueUsers: data.uniqueUsers || 0,
      trends: {
        salesTrend: calcTrend(data.currSales, data.prevSales),
        transactionsTrend: calcTrend(data.currTx, data.prevTx),
        usersTrend: calcTrend(data.currUsers, data.prevUsers),
      },
    };
  }

  // DESARROLLO: Usar datos locales
  const data = loadSalesData();
  if (data.length === 0) {
    return {
      totalSales: 0,
      totalTransactions: 0,
      avgTicket: 0,
      uniqueUsers: 0,
      trends: { salesTrend: 0, transactionsTrend: 0, usersTrend: 0 },
    };
  }

  // Calcular fechas para comparación
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Datos del mes actual
  const currentData = data.filter(
    (t) => new Date(t.timestamp) >= thirtyDaysAgo
  );
  const currentSales = currentData.reduce((sum, t) => sum + t.amount, 0);
  const currentTransactions = currentData.length;
  const currentUsers = new Set(currentData.map((t) => t.user_id)).size;

  // Datos del mes anterior
  const prevData = data.filter((t) => {
    const d = new Date(t.timestamp);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });
  const prevSales = prevData.reduce((sum, t) => sum + t.amount, 0);
  const prevTransactions = prevData.length;
  const prevUsers = new Set(prevData.map((t) => t.user_id)).size;

  // Calcular variaciones
  const calcTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  };

  const totalSales = data.reduce((sum, t) => sum + t.amount, 0);
  const totalTransactions = data.length;
  const avgTicket = totalSales / totalTransactions;
  const uniqueUsers = new Set(data.map((t) => t.user_id)).size;

  return {
    totalSales: Math.round(totalSales * 100) / 100,
    totalTransactions,
    avgTicket: Math.round(avgTicket * 100) / 100,
    uniqueUsers,
    trends: {
      salesTrend: calcTrend(currentSales, prevSales),
      transactionsTrend: calcTrend(currentTransactions, prevTransactions),
      usersTrend: calcTrend(currentUsers, prevUsers),
    },
  };
};

/**
 * Obtener ventas agrupadas por categoría
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD) - ignorado si se usa period
 * @param {string} period - Período: 'today', 'week', 'month'
 */
export const getSalesByCategory = async (startDate = null, period = null) => {
  // PRODUCCIÓN
  if (isProduction && bigQueryClient) {
    let dateFilter = "";

    // Si hay period, usar filtro dinámico basado en MAX(timestamp)
    if (period) {
      let intervalDays = 1;
      if (period === "today") intervalDays = 1;
      else if (period === "week") intervalDays = 7;
      else if (period === "month") intervalDays = 30;

      dateFilter = `WHERE timestamp >= (
        SELECT TIMESTAMP_SUB(MAX(timestamp), INTERVAL ${intervalDays} DAY)
        FROM \`${bigQueryConfig.projectId}.${bigQueryConfig.dataset}.${bigQueryConfig.tables.salesTransactions}\`
      )`;
    }

    const query = `
      SELECT 
        category,
        SUM(amount) as totalSales,
        COUNT(*) as transactions,
        AVG(amount) as avgTicket
      FROM \`${bigQueryConfig.projectId}.${bigQueryConfig.dataset}.${bigQueryConfig.tables.salesTransactions}\`
      ${dateFilter}
      GROUP BY category
      ORDER BY totalSales DESC
    `;
    return normalizeRows(await runQuery(query));
  }

  // DESARROLLO
  let data = loadSalesData();

  // Si hay period, calcular fecha basada en max timestamp del dataset
  if (period && data.length > 0) {
    const maxTimestamp = Math.max(
      ...data.map((t) => new Date(t.timestamp).getTime())
    );
    const maxDate = new Date(maxTimestamp);

    let filterDate;
    if (period === "today") {
      filterDate = new Date(maxDate);
      filterDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      filterDate = new Date(maxTimestamp - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      filterDate = new Date(maxTimestamp - 30 * 24 * 60 * 60 * 1000);
    }

    if (filterDate) {
      data = data.filter((t) => new Date(t.timestamp) >= filterDate);
    }
  } else if (startDate) {
    const start = new Date(startDate);
    data = data.filter((t) => new Date(t.timestamp) >= start);
  }

  const categories = {};

  data.forEach((transaction) => {
    const { category, amount } = transaction;
    if (!categories[category]) {
      categories[category] = { category, totalSales: 0, transactions: 0 };
    }
    categories[category].totalSales += amount;
    categories[category].transactions++;
  });

  return Object.values(categories)
    .map((cat) => ({
      ...cat,
      totalSales: Math.round(cat.totalSales * 100) / 100,
      avgTicket: Math.round((cat.totalSales / cat.transactions) * 100) / 100,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
};

/**
 * Obtener ventas agrupadas por región
 */
export const getSalesByRegion = async () => {
  // PRODUCCIÓN
  if (isProduction && bigQueryClient) {
    const query = `
      SELECT 
        region,
        SUM(amount) as totalSales,
        COUNT(*) as transactions
      FROM \`${bigQueryConfig.projectId}.${bigQueryConfig.dataset}.${bigQueryConfig.tables.salesTransactions}\`
      GROUP BY region
      ORDER BY totalSales DESC
    `;
    return normalizeRows(await runQuery(query));
  }

  // DESARROLLO
  const data = loadSalesData();
  const regions = {};

  data.forEach((transaction) => {
    const { region, amount } = transaction;
    if (!regions[region]) {
      regions[region] = { region, totalSales: 0, transactions: 0 };
    }
    regions[region].totalSales += amount;
    regions[region].transactions++;
  });

  return Object.values(regions)
    .map((reg) => ({
      ...reg,
      totalSales: Math.round(reg.totalSales * 100) / 100,
      percentage: Math.round((reg.transactions / data.length) * 1000) / 10,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
};

/**
 * Obtener ventas diarias para gráficos
 */
export const getDailySales = async () => {
  // PRODUCCIÓN
  if (isProduction && bigQueryClient) {
    const query = `
      SELECT 
        DATE(timestamp) as date,
        SUM(amount) as totalSales,
        COUNT(*) as transactions
      FROM \`${bigQueryConfig.projectId}.${bigQueryConfig.dataset}.${bigQueryConfig.tables.salesTransactions}\`
      GROUP BY date
      ORDER BY date
    `;
    return normalizeRows(await runQuery(query));
  }

  // DESARROLLO
  const data = loadSalesData();
  const dailyMap = {};

  data.forEach((transaction) => {
    const date = transaction.timestamp.split("T")[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { date, totalSales: 0, transactions: 0 };
    }
    dailyMap[date].totalSales += transaction.amount;
    dailyMap[date].transactions++;
  });

  return Object.values(dailyMap)
    .map((day) => ({
      ...day,
      totalSales: Math.round(day.totalSales * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Obtener predicción de ventas desde BigQuery ML
 */
export const getForecastPrediction = async () => {
  // PRODUCCIÓN: Usar modelo ARIMA_PLUS real
  if (isProduction && bigQueryClient) {
    try {
      console.log(
        "🤖 [BigQuery Real] Ejecutando ML.FORECAST en Google Cloud..."
      );
      const query = `
        SELECT
          FORMAT_TIMESTAMP('%Y-%m-%d', forecast_timestamp) as date,
          ROUND(forecast_value, 2) as predictedSales,
          ROUND(prediction_interval_lower_bound, 2) as lowerBound,
          ROUND(prediction_interval_upper_bound, 2) as upperBound,
          0.95 as confidence
        FROM ML.FORECAST(
          MODEL \`${bigQueryConfig.projectId}.${bigQueryConfig.dataset}.sales_forecast_model\`,
          STRUCT(7 AS horizon, 0.95 AS confidence_level)
        )
        ORDER BY forecast_timestamp
      `;

      const predictions = normalizeRows(await runQuery(query));
      console.log("✅ [BigQuery Real] Predicciones recibidas correctamente");

      return {
        model: "ARIMA_PLUS",
        generatedAt: new Date().toISOString(),
        horizon: 7,
        predictions,
      };
    } catch (error) {
      console.error(
        "❌ [BigQuery Error] Falló la predicción real:",
        error.message
      );
      // Lanzamos el error para que el frontend sepa que falló
      throw new Error(`BigQuery ML Error: ${error.message}`);
    }
  }

  console.log(
    "⚠️ [BigQuery Simulado] Usando datos locales. Razón:",
    !isProduction
      ? "NODE_ENV != production"
      : "Cliente BQ no inicializado (faltan credenciales)"
  );

  // DESARROLLO: Simular predicción
  const dailySales = await getDailySales();
  if (dailySales.length === 0) {
    return {
      model: "ARIMA_PLUS (simulated)",
      generatedAt: new Date().toISOString(),
      horizon: 7,
      predictions: [],
    };
  }

  const lastDays = dailySales.slice(-30);
  const avgSales =
    lastDays.reduce((sum, d) => sum + d.totalSales, 0) / lastDays.length;
  const trend =
    (lastDays[lastDays.length - 1].totalSales - lastDays[0].totalSales) /
    lastDays.length;

  const lastDate = new Date(dailySales[dailySales.length - 1].date);
  const predictions = [];

  for (let i = 1; i <= 7; i++) {
    const predDate = new Date(lastDate);
    predDate.setDate(predDate.getDate() + i);
    const basePrediction = avgSales + trend * i;
    const variance = avgSales * 0.15;

    predictions.push({
      date: predDate.toISOString().split("T")[0],
      predictedSales: Math.round(basePrediction * 100) / 100,
      lowerBound: Math.round((basePrediction - variance) * 100) / 100,
      upperBound: Math.round((basePrediction + variance) * 100) / 100,
      confidence: 0.95,
    });
  }

  return {
    model: "ARIMA_PLUS (simulated)",
    generatedAt: new Date().toISOString(),
    horizon: 7,
    predictions,
  };
};

/**
 * Obtener datos históricos combinados con predicción
 */
export const getHistoricalWithForecast = async () => {
  const dailySales = await getDailySales();
  const forecast = await getForecastPrediction();

  const historical = dailySales.slice(-30).map((d) => ({
    date: d.date,
    sales: d.totalSales,
    type: "historical",
  }));

  const forecastData = forecast.predictions.map((p) => ({
    date: p.date,
    sales: p.predictedSales,
    lowerBound: p.lowerBound,
    upperBound: p.upperBound,
    type: "forecast",
  }));

  return {
    historical,
    forecast: forecastData,
    combined: [...historical, ...forecastData],
  };
};

/**
 * Insertar transacción en BigQuery (streaming)
 */
export const insertTransaction = async (data) => {
  if (isProduction && bigQueryClient) {
    try {
      const dataset = bigQueryClient.dataset(bigQueryConfig.dataset);
      const table = dataset.table(bigQueryConfig.tables.salesTransactions);

      // Manejar tanto objeto único como array (batch)
      const rows = Array.isArray(data) ? data : [data];

      await table.insert(rows);

      if (rows.length > 1) {
        console.log(
          `📦 [BigQuery Batch] Se insertaron ${rows.length} transacciones`
        );
      } else {
        console.log(
          `✅ [BigQuery] Transacción insertada: ${rows[0].transaction_id}`
        );
      }
      return true;
    } catch (error) {
      console.error("❌ Error insertando en BigQuery:", error.message);
      // errors suele ser un array con detalles de fallos por fila
      if (error.errors) console.error(JSON.stringify(error.errors, null, 2));
      return false;
    }
  }

  // Log para desarrollo
  const count = Array.isArray(data) ? data.length : 1;
  // console.log(`[Mock] ${count} transacciones simuladas`);
  return true;
};

export default {
  loadSalesData,
  getGeneralStats,
  getSalesByCategory,
  getSalesByRegion,
  getDailySales,
  getForecastPrediction,
  getHistoricalWithForecast,
  insertTransaction,
};
