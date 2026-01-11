# Database Scripts - E-commerce Dashboard

Scripts SQL para BigQuery y generador de datos sintéticos.

## Estructura

```
database/
├── scripts/
│   ├── 01_schema.sql          # DDL de tabla con partición y clustering
│   ├── 02_bqml_model.sql      # Modelo ML ARIMA_PLUS
│   └── generate-dataset.js    # Generador de datos sintéticos
└── data/
    ├── sales_data.ndjson      # Dataset para BigQuery (JSONL)
    └── sales_data.json        # Dataset en formato JSON array
```

## Uso

### 1. Generar Dataset

```bash
cd scripts
node generate-dataset.js
```

Esto genera 12,000 registros en `data/`.

### 2. Crear Tabla en BigQuery

Ejecutar `01_schema.sql` en BigQuery Console o via `bq` CLI:

```bash
bq query --use_legacy_sql=false < scripts/01_schema.sql
```

### 3. Cargar Datos

```bash
bq load --source_format=NEWLINE_DELIMITED_JSON \
  ecommerce_analytics.sales_transactions \
  data/sales_data.ndjson
```

### 4. Crear Modelo ML

Ejecutar `02_bqml_model.sql` en BigQuery Console.

## Estrategia de Particionamiento y Clustering

| Estrategia     | Campo              | Justificación                                                                                                          |
| -------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Partición**  | `DATE(timestamp)`  | Las consultas del dashboard siempre filtran por rangos de fecha. Reduce costos al escanear solo particiones necesarias |
| **Clustering** | `category, region` | Filtros más frecuentes en reportes de e-commerce. Ordena físicamente los datos para acceso más rápido                  |
