/**
 * Script to create BigQuery ML model for sales forecasting
 * Run: node scripts/createBQMLModel.js
 */

import path from "path";
import { fileURLToPath } from "url";
import { BigQuery } from "@google-cloud/bigquery";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyFilename = path.join(__dirname, "../src/config/service-account.json");
const projectId =
  process.env.BIGQUERY_PROJECT_ID || process.env.GCLOUD_PROJECT_ID;

async function createModel() {
  console.log("🚀 Starting BigQuery ML model creation...\n");

  const bigquery = new BigQuery({ projectId, keyFilename });
  console.log(`📁 Project ID: ${projectId}\n`);

  // Step 1: Create daily sales view
  console.log("📊 Step 1/3: Creating daily_sales_timeseries view...");
  const viewQuery = `
    CREATE OR REPLACE VIEW ecommerce_analytics.daily_sales_timeseries AS
    SELECT 
      DATE(timestamp) as sale_date,
      SUM(amount) as total_sales,
      COUNT(*) as transaction_count
    FROM ecommerce_analytics.sales_transactions
    GROUP BY sale_date
    ORDER BY sale_date
  `;

  await bigquery.query({ query: viewQuery });
  console.log("✅ View created successfully\n");

  // Step 2: Create ARIMA_PLUS model
  console.log(
    "🤖 Step 2/3: Training ARIMA_PLUS model (this may take 2-5 minutes)..."
  );
  const modelQuery = `
    CREATE OR REPLACE MODEL ecommerce_analytics.sales_forecast_model
    OPTIONS (
      model_type = 'ARIMA_PLUS',
      time_series_timestamp_col = 'sale_date',
      time_series_data_col = 'total_sales',
      auto_arima = TRUE,
      data_frequency = 'DAILY',
      horizon = 7,
      holiday_region = 'US'
    ) AS
    SELECT
      sale_date,
      total_sales
    FROM ecommerce_analytics.daily_sales_timeseries
  `;

  await bigquery.query({ query: modelQuery });
  console.log("✅ Model trained successfully\n");

  // Step 3: Test forecast
  console.log("🔮 Step 3/3: Testing forecast predictions...");
  const forecastQuery = `
    SELECT
      FORMAT_TIMESTAMP('%Y-%m-%d', forecast_timestamp) as date,
      ROUND(forecast_value, 2) as predicted_sales,
      ROUND(prediction_interval_lower_bound, 2) as lower_bound,
      ROUND(prediction_interval_upper_bound, 2) as upper_bound
    FROM ML.FORECAST(
      MODEL ecommerce_analytics.sales_forecast_model,
      STRUCT(7 AS horizon, 0.95 AS confidence_level)
    )
    ORDER BY forecast_timestamp
  `;

  const [predictions] = await bigquery.query({ query: forecastQuery });

  console.log("✅ Predictions generated:\n");
  console.table(predictions);

  console.log("\n" + "=".repeat(50));
  console.log("🎉 BigQuery ML model setup complete!");
  console.log("=".repeat(50));
}

createModel().catch((err) => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
