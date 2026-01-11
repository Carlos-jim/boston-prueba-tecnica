# 🔧 Guía de Configuración de BigQuery ML

Esta guía te llevará paso a paso para configurar Google BigQuery y activar el modelo ARIMA_PLUS para las predicciones de ventas.

---

## 📋 Índice

1. [Crear Proyecto en Google Cloud](#1-crear-proyecto-en-google-cloud)
2. [Habilitar BigQuery API](#2-habilitar-bigquery-api)
3. [Crear Cuenta de Servicio](#3-crear-cuenta-de-servicio)
4. [Crear Dataset y Tabla](#4-crear-dataset-y-tabla)
5. [Cargar Datos Históricos](#5-cargar-datos-históricos)
6. [Crear el Modelo ARIMA_PLUS](#6-crear-el-modelo-arima_plus)
7. [Configurar el Backend](#7-configurar-el-backend)
8. [Verificar la Integración](#8-verificar-la-integración)

---

## 1. Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Si es tu primera vez, acepta los términos de servicio
3. Haz clic en **"Seleccionar proyecto"** → **"Nuevo proyecto"**
4. Configura:
   - **Nombre del proyecto**: `ecommerce-dashboard-ml`
   - **ID del proyecto**: Se generará automáticamente (ej: `ecommerce-dashboard-ml-123456`)
   - **Organización**: Deja en blanco si es cuenta personal
5. Haz clic en **"Crear"**
6. **⚠️ IMPORTANTE**: Copia el **ID del proyecto** - lo necesitarás más adelante

> 💡 **Nota**: Google Cloud ofrece $300 USD de crédito gratis para nuevos usuarios.

---

## 2. Habilitar BigQuery API

1. En Google Cloud Console, asegúrate de tener tu proyecto seleccionado
2. Ve a **APIs y servicios** → **Biblioteca**
3. Busca **"BigQuery API"**
4. Haz clic en el resultado y luego en **"Habilitar"**
5. Espera a que se active (unos segundos)

---

## 3. Crear Cuenta de Servicio

La cuenta de servicio permite que el backend se autentique con BigQuery.

### 3.1 Crear la cuenta

1. Ve a **IAM y administración** → **Cuentas de servicio**
2. Haz clic en **"Crear cuenta de servicio"**
3. Configura:
   - **Nombre**: `ecommerce-backend`
   - **ID**: Se generará automáticamente
   - **Descripción**: `Backend de E-Commerce Dashboard`
4. Haz clic en **"Crear y continuar"**

### 3.2 Asignar permisos

1. En el segundo paso, busca y agrega estos roles:
   - `BigQuery Admin` (administrador completo)
   - `BigQuery Data Editor` (edición de datos)
   - `BigQuery Job User` (ejecutar queries)
2. Haz clic en **"Continuar"** → **"Listo"**

### 3.3 Descargar credenciales JSON

1. En la lista de cuentas de servicio, haz clic en la que acabas de crear
2. Ve a la pestaña **"Claves"**
3. Haz clic en **"Agregar clave"** → **"Crear clave nueva"**
4. Selecciona **JSON** y haz clic en **"Crear"**
5. Se descargará automáticamente un archivo `.json`
6. **Renómbralo** a: `service-account.json`
7. **Cópialo** a: `backend/config/service-account.json`

> ⚠️ **SEGURIDAD**: Nunca subas este archivo a Git. Ya está en `.gitignore`.

---

## 4. Crear Dataset y Tabla

### 4.1 Crear el Dataset

1. Ve a [BigQuery Console](https://console.cloud.google.com/bigquery)
2. En el panel izquierdo, haz clic en los **3 puntos** junto a tu proyecto
3. Selecciona **"Crear conjunto de datos"**
4. Configura:
   - **ID del conjunto de datos**: `ecommerce_analytics`
   - **Ubicación de los datos**: `us` (multi-región)
   - **Vencimiento de tabla predeterminado**: Deja en blanco
5. Haz clic en **"Crear conjunto de datos"**

### 4.2 Crear la Tabla

1. Haz clic en los **3 puntos** junto al dataset `ecommerce_analytics`
2. Selecciona **"Abrir"**
3. Haz clic en **"Crear tabla"**
4. Configura:
   - **Crear tabla a partir de**: `Consulta SQL`
5. Copia y pega el siguiente SQL:

```sql
CREATE TABLE ecommerce_analytics.sales_transactions (
  transaction_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  user_id STRING NOT NULL,
  amount FLOAT64 NOT NULL,
  category STRING NOT NULL,
  region STRING NOT NULL,
  payment_method STRING,
  product_count INT64
)
PARTITION BY DATE(timestamp)
CLUSTER BY category, region;
```

6. Haz clic en **"Ejecutar"**

---

## 5. Cargar Datos Históricos

### 5.1 Preparar el archivo

El archivo de datos está en: `database/data/sales_data.json`

Necesitas convertirlo a formato NDJSON (newline-delimited JSON):

```bash
# En la terminal del proyecto
cd database/data

# Convertir JSON a NDJSON (cada línea es un objeto)
node -e "
const data = require('./sales_data.json');
const fs = require('fs');
fs.writeFileSync('sales_data.ndjson', data.map(JSON.stringify).join('\n'));
console.log('✅ Creado sales_data.ndjson con', data.length, 'registros');
"
```

### 5.2 Cargar datos a BigQuery

**Opción A: Desde la consola web**

1. En BigQuery, haz clic en la tabla `sales_transactions`
2. Ve a la pestaña **"Vista previa"** → **"Cargar datos"**
3. Configura:
   - **Origen**: Subir archivo
   - **Archivo**: Selecciona `sales_data.ndjson`
   - **Formato**: JSON (líneas delimitadas por saltos de línea)
4. Haz clic en **"Crear tabla"**

**Opción B: Usando bq CLI**

```bash
# Instalar Google Cloud SDK si no lo tienes
# https://cloud.google.com/sdk/docs/install

# Autenticarte
gcloud auth login
gcloud config set project TU_PROJECT_ID

# Cargar datos
bq load \
  --source_format=NEWLINE_DELIMITED_JSON \
  ecommerce_analytics.sales_transactions \
  database/data/sales_data.ndjson
```

### 5.3 Verificar la carga

```sql
SELECT COUNT(*) as total_records
FROM ecommerce_analytics.sales_transactions;
```

Deberías ver aproximadamente **12,000+ registros**.

---

## 6. Crear el Modelo ARIMA_PLUS

### 6.1 Crear vista de serie temporal

Ejecuta en BigQuery Console:

```sql
CREATE OR REPLACE VIEW ecommerce_analytics.daily_sales_timeseries AS
SELECT
  DATE(timestamp) as sale_date,
  SUM(amount) as total_sales,
  COUNT(*) as transaction_count
FROM ecommerce_analytics.sales_transactions
GROUP BY sale_date
ORDER BY sale_date;
```

### 6.2 Verificar la vista

```sql
SELECT * FROM ecommerce_analytics.daily_sales_timeseries
ORDER BY sale_date DESC
LIMIT 10;
```

### 6.3 Crear el modelo ARIMA_PLUS

> ⚠️ Esta query puede tardar 1-5 minutos en ejecutarse.

```sql
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
FROM ecommerce_analytics.daily_sales_timeseries;
```

### 6.4 Verificar el modelo

```sql
-- Ver información del modelo
SELECT * FROM ML.ARIMA_EVALUATE(MODEL ecommerce_analytics.sales_forecast_model);
```

### 6.5 Probar predicción

```sql
SELECT
  FORMAT_TIMESTAMP('%Y-%m-%d', forecast_timestamp) as date,
  ROUND(forecast_value, 2) as predicted_sales,
  ROUND(prediction_interval_lower_bound, 2) as lower_bound,
  ROUND(prediction_interval_upper_bound, 2) as upper_bound
FROM ML.FORECAST(
  MODEL ecommerce_analytics.sales_forecast_model,
  STRUCT(7 AS horizon, 0.95 AS confidence_level)
)
ORDER BY forecast_timestamp;
```

Deberías ver 7 filas con las predicciones para los próximos 7 días.

---

## 7. Configurar el Backend

### 7.1 Actualizar variables de entorno

Edita el archivo `backend/.env`:

```env
# Servidor
PORT=3001

# ⚠️ CAMBIAR A production PARA USAR BIGQUERY
NODE_ENV=production

# Google Cloud BigQuery
GCLOUD_PROJECT_ID=tu-proyecto-id-aqui
GCLOUD_KEYFILE_PATH=./config/service-account.json

# WebSocket
WEBSOCKET_CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 7.2 Verificar archivo de credenciales

Asegúrate de que existe:

```
backend/config/service-account.json
```

### 7.3 Reiniciar el backend

```bash
cd backend
npm run dev
```

Deberías ver en la consola:

```
✅ [BigQueryService] Conectado a BigQuery real
```

---

## 8. Verificar la Integración

### 8.1 Probar endpoint de predicciones

```bash
curl http://localhost:3001/api/predictions/forecast
```

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "model": "ARIMA_PLUS",
    "generatedAt": "2026-01-11T...",
    "horizon": 7,
    "predictions": [
      {
        "date": "2026-01-12",
        "predictedSales": 5234.56,
        "lowerBound": 4823.12,
        "upperBound": 5645.99
      },
      ...
    ]
  }
}
```

### 8.2 Verificar en el dashboard

1. Abre http://localhost:5174
2. La tarjeta **"7-Day Sales Forecast"** debería mostrar:
   - Badge: `ARIMA_PLUS` (modelo real)
   - Predicciones con valores reales de BigQuery ML
   - Rangos de confianza calculados por el modelo

---

## 🎉 ¡Listo!

Tu dashboard ahora usa BigQuery ML para predicciones de ventas reales.

---

## 📚 Recursos Adicionales

- [BigQuery ML Documentation](https://cloud.google.com/bigquery-ml/docs)
- [ARIMA_PLUS Model](https://cloud.google.com/bigquery-ml/docs/reference/standard-sql/bigqueryml-syntax-create-time-series)
- [ML.FORECAST Function](https://cloud.google.com/bigquery-ml/docs/reference/standard-sql/bigqueryml-syntax-forecast)

---

## 🔧 Troubleshooting

### Error: "BigQuery client not initialized"

- Verifica que `NODE_ENV=production` en `.env`
- Verifica que el archivo `service-account.json` existe

### Error: "Permission denied"

- La cuenta de servicio necesita rol `BigQuery Admin`
- Regenera las credenciales y vuelve a descargar

### Error: "Model not found"

- Ejecuta el script SQL para crear el modelo (Paso 6.3)
- Verifica que el dataset sea `ecommerce_analytics`

### Predicciones muestran $0

- El modelo necesita al menos 14 días de datos históricos
- Verifica que los datos se cargaron correctamente
