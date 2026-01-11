/**
 * Script para generar dataset sintético de ventas
 * Genera 10,000+ registros de transacciones históricas
 */

const fs = require("fs");
const crypto = require("crypto");

// Configuración
const TOTAL_RECORDS = 12000; // Más de 10,000 como se requiere
const START_DATE = new Date("2023-01-01T00:00:00Z");
const END_DATE = new Date("2024-12-31T23:59:59Z");

// Categorías y regiones según el esquema
const CATEGORIES = ["Electronics", "Clothing", "Home", "Books"];
const REGIONS = [
  "US-East",
  "US-West",
  "EU-West",
  "EU-Central",
  "APAC",
  "LATAM",
];

// Rangos de precio por categoría (para datos más realistas)
const PRICE_RANGES = {
  Electronics: { min: 50, max: 2000 },
  Clothing: { min: 15, max: 300 },
  Home: { min: 20, max: 500 },
  Books: { min: 5, max: 80 },
};

// Pesos de probabilidad para simular patrones reales
const CATEGORY_WEIGHTS = {
  Electronics: 0.3,
  Clothing: 0.35,
  Home: 0.2,
  Books: 0.15,
};

const REGION_WEIGHTS = {
  "US-East": 0.25,
  "US-West": 0.2,
  "EU-West": 0.18,
  "EU-Central": 0.12,
  APAC: 0.15,
  LATAM: 0.1,
};

// Generar UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

// Selección aleatoria ponderada
function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let random = Math.random() * total;

  for (const [key, weight] of entries) {
    random -= weight;
    if (random <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

// Generar timestamp aleatorio con patrones estacionales
function generateTimestamp(index, total) {
  const timeRange = END_DATE.getTime() - START_DATE.getTime();
  const baseTime = START_DATE.getTime() + timeRange * (index / total);

  // Añadir variación aleatoria (± 12 horas)
  const variation = (Math.random() - 0.5) * 24 * 60 * 60 * 1000;
  const timestamp = new Date(baseTime + variation);

  // Simular más ventas en horario comercial (9am - 9pm)
  const hour = 9 + Math.floor(Math.random() * 12);
  timestamp.setUTCHours(
    hour,
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60)
  );

  return timestamp.toISOString();
}

// Generar monto basado en la categoría
function generateAmount(category) {
  const range = PRICE_RANGES[category];
  const amount = range.min + Math.random() * (range.max - range.min);
  return Math.round(amount * 100) / 100; // Redondear a 2 decimales
}

// Generar user_id (simular ~2000 usuarios únicos)
function generateUserId() {
  const userId = Math.floor(Math.random() * 2000) + 1;
  return `user_${userId.toString().padStart(4, "0")}`;
}

// Generar un registro de transacción
function generateTransaction(index, total) {
  const category = weightedRandom(CATEGORY_WEIGHTS);
  const region = weightedRandom(REGION_WEIGHTS);

  return {
    transaction_id: generateUUID(),
    timestamp: generateTimestamp(index, total),
    amount: generateAmount(category),
    category: category,
    region: region,
    user_id: generateUserId(),
  };
}

// Función principal
function generateDataset() {
  console.log(`🚀 Generando ${TOTAL_RECORDS} registros de ventas...`);
  console.log(
    `📅 Rango de fechas: ${START_DATE.toISOString().split("T")[0]} - ${
      END_DATE.toISOString().split("T")[0]
    }`
  );

  const transactions = [];

  for (let i = 0; i < TOTAL_RECORDS; i++) {
    transactions.push(generateTransaction(i, TOTAL_RECORDS));

    // Mostrar progreso cada 1000 registros
    if ((i + 1) % 1000 === 0) {
      console.log(`   ✓ ${i + 1} registros generados...`);
    }
  }

  // Ordenar por timestamp
  transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Guardar como JSON (formato newline-delimited para BigQuery)
  const ndjsonPath = "../data/sales_data.ndjson";
  const ndjsonContent = transactions.map((t) => JSON.stringify(t)).join("\n");
  fs.writeFileSync(ndjsonPath, ndjsonContent);
  console.log(`\n✅ Dataset guardado en: ${ndjsonPath}`);

  // También guardar como JSON array para referencia
  const jsonPath = "../data/sales_data.json";
  fs.writeFileSync(jsonPath, JSON.stringify(transactions, null, 2));
  console.log(`✅ Dataset (array) guardado en: ${jsonPath}`);

  // Estadísticas del dataset
  console.log("\n📊 Estadísticas del Dataset:");
  console.log(`   Total de registros: ${transactions.length}`);

  // Por categoría
  const byCategory = {};
  CATEGORIES.forEach((cat) => (byCategory[cat] = 0));
  transactions.forEach((t) => byCategory[t.category]++);
  console.log("\n   Por Categoría:");
  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(
      `     - ${cat}: ${count} (${((count / transactions.length) * 100).toFixed(
        1
      )}%)`
    );
  });

  // Por región
  const byRegion = {};
  REGIONS.forEach((reg) => (byRegion[reg] = 0));
  transactions.forEach((t) => byRegion[t.region]++);
  console.log("\n   Por Región:");
  Object.entries(byRegion).forEach(([reg, count]) => {
    console.log(
      `     - ${reg}: ${count} (${((count / transactions.length) * 100).toFixed(
        1
      )}%)`
    );
  });

  // Totales
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  console.log(
    `\n   💰 Monto total de ventas: $${totalAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`
  );
  console.log(
    `   💵 Ticket promedio: $${(totalAmount / transactions.length).toFixed(2)}`
  );

  // Usuarios únicos
  const uniqueUsers = new Set(transactions.map((t) => t.user_id)).size;
  console.log(`   👥 Usuarios únicos: ${uniqueUsers}`);

  return transactions;
}

// Ejecutar
generateDataset();
