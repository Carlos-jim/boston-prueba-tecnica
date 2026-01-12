/**
 * Script to load sales_data.ndjson into BigQuery
 * Run: node scripts/loadDataToBigQuery.js
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { BigQuery } from "@google-cloud/bigquery";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NDJSON_PATH = path.join(
  __dirname,
  "../../database/data/sales_data.ndjson"
);

// BigQuery configuration
const projectId = process.env.BIGQUERY_PROJECT_ID;
const keyFilename = path.join(__dirname, "../src/config/service-account.json");

async function loadData() {
  console.log("🚀 Starting BigQuery data load...\n");

  // Validate file exists
  if (!fs.existsSync(NDJSON_PATH)) {
    console.error(`❌ File not found: ${NDJSON_PATH}`);
    process.exit(1);
  }

  // Initialize BigQuery client
  const bigquery = new BigQuery({
    projectId,
    keyFilename,
  });

  console.log(`📁 Project ID: ${projectId}`);
  console.log(`📁 Key file: ${keyFilename}`);
  console.log(`📁 Data file: ${NDJSON_PATH}\n`);

  // Read NDJSON file line by line
  const rows = [];
  const fileStream = fs.createReadStream(NDJSON_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        rows.push(JSON.parse(line));
      } catch (err) {
        console.warn(
          `⚠️ Skipping invalid JSON line: ${line.substring(0, 50)}...`
        );
      }
    }
  }

  console.log(`📊 Parsed ${rows.length} rows from NDJSON file\n`);

  if (rows.length === 0) {
    console.error("❌ No valid rows found in file");
    process.exit(1);
  }

  // Insert in batches
  const BATCH_SIZE = parseInt(process.env.BIGQUERY_BATCH_SIZE) || 500;
  const dataset = bigquery.dataset("ecommerce_analytics");
  const table = dataset.table("sales_transactions");

  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    try {
      await table.insert(batch);
      inserted += batch.length;
      console.log(
        `✅ Inserted batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${
          batch.length
        } rows (Total: ${inserted}/${rows.length})`
      );
    } catch (error) {
      failed += batch.length;
      console.error(
        `❌ Failed batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${error.message}`
      );
      if (error.errors) {
        error.errors.slice(0, 3).forEach((e, idx) => {
          console.error(`   Error ${idx + 1}:`, JSON.stringify(e.errors));
        });
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📈 Load complete!`);
  console.log(`   ✅ Inserted: ${inserted} rows`);
  console.log(`   ❌ Failed: ${failed} rows`);
  console.log("=".repeat(50));
}

loadData().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
