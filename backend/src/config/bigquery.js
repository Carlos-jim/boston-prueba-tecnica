/**
 * Configuración del cliente de BigQuery
 * En producción, aquí se configuraría la conexión real a Google Cloud
 */

// import { BigQuery } from '@google-cloud/bigquery';

/**
 * Configuración de BigQuery
 * Para usar en producción:
 * 1. npm install @google-cloud/bigquery
 * 2. Configurar credenciales de servicio
 * 3. Descomentar el código de producción
 */
export const bigQueryConfig = {
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GCLOUD_KEYFILE_PATH,
  location: "US",
  dataset: "ecommerce_analytics",
  tables: {
    salesTransactions: "sales_transactions",
  },
  batchSize: parseInt(process.env.BIGQUERY_BATCH_SIZE) || 5,
};

/**
 * Cliente de BigQuery (Mock para desarrollo)
 * En producción, descomentar y usar el cliente real
 */
// export const bigQueryClient = new BigQuery({
//   projectId: bigQueryConfig.projectId,
//   keyFilename: bigQueryConfig.keyFilename,
// });

/**
 * Cliente Mock para desarrollo local
 * Simula las respuestas de BigQuery usando datos locales
 */
export const bigQueryClient = {
  dataset: (name) => ({
    table: (tableName) => ({
      insert: async (rows) => {
        console.log(
          `[BigQuery Mock] Insertando ${rows.length} filas en ${name}.${tableName}`
        );
        return { insertErrors: [] };
      },
    }),
  }),
  query: async (options) => {
    console.log(
      "[BigQuery Mock] Query ejecutada:",
      options.query?.substring(0, 100)
    );
    return [[]];
  },
};

export default bigQueryConfig;
