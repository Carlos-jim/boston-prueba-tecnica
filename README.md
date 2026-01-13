# 📊 E-Commerce Dashboard MVP

Dashboard de ventas en tiempo real con predicciones ML para e-commerce.

**Stack:** Vue 3 + Node.js + BigQuery ML + Socket.io

---

## 🚀 Instalación y Ejecución

### Prerrequisitos

- **Node.js** v18.0.0 o superior
- **npm** o **pnpm**
- Cuenta de Google Cloud con BigQuery habilitado

### 1. Clonar el repositorio

```bash
git clone https://github.com/Carlos-jim/boston-prueba-tecnica.git
cd boston-prueba-tecnica
```

### 2. Instalar dependencias del Backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del Frontend

```bash
#Nueva terminal
cd frontend
npm install
```

### 4. Generar el dataset de prueba

```bash
#Nueva terminal
cd database/scripts
node generate-dataset.js
```

Esto generará 12,000 transacciones sintéticas en `database/data/`.

## ⚙️ Variables de Entorno

Para conectar con BigQuery real, crea un archivo `.env` en `/backend`:

```env
NODE_ENV=production
GCLOUD_PROJECT_ID=tu-proyecto-gcp
GCLOUD_KEYFILE_PATH=./src/config/service-account.json
BIGQUERY_BATCH_SIZE=5
# Simulador de transacciones
SIMULATOR_MIN_INTERVAL_MS=2000
SIMULATOR_MAX_INTERVAL_MS=5000
```

> **Nota:** Sin estas variables, el proyecto funciona en modo desarrollo usando datos locales.

---

### 5. Ejecutar el Backend

```bash
#Nueva terminal
cd backend
npm run dev
```

El servidor iniciará en `http://localhost:3001`

### 6. Ejecutar el Frontend (en otra terminal)

```bash
cd frontend
npm run dev
```

El dashboard estará disponible en `http://localhost:5173`

---

## �️ Configuración de BigQuery (Producción)

Si deseas usar BigQuery real, sigue estos pasos en la consola de Google Cloud:

### Paso 1: Crear la tabla con particionamiento

Ejecuta el script DDL en BigQuery Console o via CLI:

```bash
bq query --use_legacy_sql=false < database/scripts/01_schema.sql
```

O copia el contenido de `01_schema.sql` directamente en BigQuery Console.

### Paso 2: Cargar los datos históricos

**Opción A: Script Node.js (Recomendado)**

```bash
cd backend
node scripts/loadDataToBigQuery.js
```

Este script carga los datos en lotes de 500 registros usando el service account configurado.

**Opción B: BigQuery CLI** (requiere [Google Cloud SDK](https://cloud.google.com/sdk/docs/install))

```bash
bq load --source_format=NEWLINE_DELIMITED_JSON \
  ecommerce_analytics.sales_transactions \
  database/data/sales_data.ndjson
```

### Paso 3: Crear y entrenar el modelo ML (ARIMA_PLUS)

**Opción A: Script Node.js (Recomendado)**

```bash
cd backend
node scripts/createBQMLModel.js
```

Este script crea la vista, entrena el modelo y muestra las predicciones de prueba.

**Opción B: BigQuery CLI** (requiere [Google Cloud SDK](https://cloud.google.com/sdk/docs/install))

```powershell
# PowerShell
Get-Content database/scripts/02_bqml_model.sql | bq query --use_legacy_sql=false
```

Este script hace lo siguiente:

1. **Crea una vista agregada** (`daily_sales_timeseries`) con ventas diarias
2. **Entrena el modelo ARIMA_PLUS** con detección automática de tendencias y estacionalidad
3. **Genera predicciones** para los próximos 7 días con 95% de confianza

```sql
-- Modelo creado
CREATE OR REPLACE MODEL ecommerce_analytics.sales_forecast_model
OPTIONS (
  model_type = 'ARIMA_PLUS',
  time_series_timestamp_col = 'sale_date',
  time_series_data_col = 'total_sales',
  auto_arima = TRUE,
  data_frequency = 'DAILY',
  horizon = 7,
  holiday_region = 'US'
)
```

### Paso 4: Verificar predicciones

Una vez entrenado el modelo, puedes consultar las predicciones:

```sql
SELECT
  FORMAT_TIMESTAMP('%Y-%m-%d', forecast_timestamp) as date,
  ROUND(forecast_value, 2) as predicted_sales,
  ROUND(prediction_interval_lower_bound, 2) as min_sales,
  ROUND(prediction_interval_upper_bound, 2) as max_sales
FROM ML.FORECAST(
  MODEL ecommerce_analytics.sales_forecast_model,
  STRUCT(7 AS horizon, 0.95 AS confidence_level)
)
ORDER BY forecast_timestamp;
```

> **Tiempo de entrenamiento:** El modelo ARIMA_PLUS tarda aproximadamente 2-5 minutos en entrenarse con 12,000 registros.

---

## �📁 Estructura del Proyecto

```
boston-prueba-tecnica/
├── backend/                # API Node.js + Express + Socket.io
│   ├── src/
│   │   ├── controllers/    # Controladores REST
│   │   ├── services/       # BigQuery y Simulador
│   │   ├── sockets/        # Handlers WebSocket
│   │   └── server.js       # Entry point
│   └── package.json
│
├── frontend/               # Vue 3 + Pinia + Chart.js
│   ├── src/
│   │   ├── components/     # Componentes del dashboard
│   │   ├── stores/         # Estado global (Pinia)
│   │   └── App.vue
│   └── package.json
│
└── database/               # Scripts SQL y datos
    ├── scripts/
    │   ├── 01_schema.sql       # DDL con partición/clustering
    │   ├── 02_bqml_model.sql   # Modelo ARIMA_PLUS
    │   └── generate-dataset.js
    └── data/                   # Dataset generado
```

---

## 🗄️ Estrategia de Particionamiento y Clustering

### ¿Por qué particionar por `DATE(timestamp)`?

Las consultas en el panel de control de comercio electrónico, a menudo, implican filtrar por fecha, como las "ventas del último mes", la "comparación interanual", o incluso las "tendencias semanales". Cuando uno particiona por fecha, BigQuery solo examina las particiones necesarias, y no la tabla completa, lo que disminuye los costos de procesamiento notablemente y acelerando los tiempos de respuesta. Esta optimización, es importantisima, especialmente para un conjunto de datos que crece día a día, con miles de transacciones, si queremos tener consultas rápidas a largo plazo.

### ¿Por qué clusterizar por `category` y `region`?

Los informes empresariales usuales en el comercio electrónico trozan datos por tipo de producto como por ejemplo "¿Cuánto se vendió en Electrónicos?" también por área geográfica "¿Cómo va LATAM?". Al agrupar por ambos elementos BigQuery acomoda físicamente los datos, optimizando las lecturas secuenciales al usar tales filtros. Juntar ambos como cluster keys obedece a que las consultas del panel usualmente filtran a través de ambas dimensiones a la vez como “Ventas de Ropa en US-Este”.

### Resultado esperado

Esta estrategia reduce el volumen de datos escaneados hasta en un 90% para consultas típicas del dashboard, lo cual se traduce directamente en menores costos de BigQuery (facturado por bytes procesados) y respuestas más rápidas para el usuario final.

---

## 📡 Endpoints API

| Método | Endpoint                      | Descripción            |
| ------ | ----------------------------- | ---------------------- |
| GET    | `/api/health`                 | Health check           |
| GET    | `/api/sales/stats`            | Estadísticas generales |
| GET    | `/api/sales/by-category`      | Ventas por categoría   |
| GET    | `/api/sales/by-region`        | Ventas por región      |
| GET    | `/api/sales/daily`            | Ventas diarias         |
| GET    | `/api/sales/realtime`         | Stats tiempo real      |
| GET    | `/api/predictions/forecast`   | Predicción 7 días      |
| GET    | `/api/predictions/historical` | Histórico + forecast   |

---

## 🔌 WebSocket Events

| Evento            | Dirección       | Descripción              |
| ----------------- | --------------- | ------------------------ |
| `connected`       | Server → Client | Confirmación de conexión |
| `new-transaction` | Server → Client | Nueva venta simulada     |
| `get-stats`       | Client → Server | Solicitar estadísticas   |
| `stats-update`    | Server → Client | Actualización de stats   |

---

## 🛠️ Tecnologías Utilizadas

**Backend:**

- Node.js + Express
- Socket.io
- @google-cloud/bigquery

**Frontend:**

- Vue 3 (Composition API)
- Pinia (State Management)
- Chart.js + vue-chartjs
- Tailwind CSS
- Lucide Icons

**Database:**

- BigQuery (particionado + clusterizado)
- BigQuery ML (ARIMA_PLUS)

---

## 📄 Licencia

MIT
