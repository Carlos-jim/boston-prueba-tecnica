<template>
  <div class="forecast-card card">
    <div class="forecast-header">
      <div>
        <h3 class="forecast-title">7-Day Sales Forecast</h3>
        <p class="forecast-subtitle">
          <span class="model-tag" :class="{ simulated: isSimulated }">{{
            modelName
          }}</span>
          Predicted revenue
        </p>
      </div>
      <span class="confidence-tag">
        <Target :size="14" />
        95% confidence
      </span>
    </div>

    <div class="forecast-body">
      <!-- Total Projection -->
      <div class="projection-box">
        <span class="projection-label">PROJECTED TOTAL</span>
        <span class="projection-value">${{ formatNumber(totalForecast) }}</span>
        <span class="projection-range"
          >Range: ${{ formatNumber(lowerBound) }} - ${{
            formatNumber(upperBound)
          }}</span
        >
      </div>

      <!-- Daily Bars -->
      <div class="forecast-bars">
        <div
          v-for="(day, index) in predictions"
          :key="day.date"
          class="bar-row"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <span class="bar-label">{{ formatDay(day.date) }}</span>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{
                width: getBarWidth(day.predictedSales),
                animationDelay: `${index * 100 + 300}ms`,
              }"
            ></div>
          </div>
          <span class="bar-value">${{ formatShortNumber(day.predictedSales) }}</span>
        </div>
      </div>
    </div>

    <div class="forecast-footer">
      <Clock :size="12" />
      <span>Last updated: {{ formatUpdateTime(generatedAt) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { Target, Clock } from "lucide-vue-next";

import { formatNumber, formatShortNumber, formatDay, formatUpdateTime } from "../utils/formatters";

const props = defineProps({
  predictions: { type: Array, default: () => [] },
  generatedAt: { type: String, default: "" },
  modelName: { type: String, default: "ARIMA_PLUS" },
});

const isSimulated = computed(() => props.modelName.includes("simulated"));

const totalForecast = computed(() =>
  props.predictions.reduce((sum, d) => sum + d.predictedSales, 0)
);
const lowerBound = computed(() =>
  props.predictions.reduce((sum, d) => sum + d.lowerBound, 0)
);
const upperBound = computed(() =>
  props.predictions.reduce((sum, d) => sum + d.upperBound, 0)
);
const maxValue = computed(() =>
  Math.max(...props.predictions.map((d) => d.predictedSales))
);

const getBarWidth = (val) =>
  maxValue.value ? `${(val / maxValue.value) * 100}%` : "0%";
</script>

<style scoped>
.forecast-card {
  padding: var(--spacing-lg);
}

.forecast-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.forecast-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.forecast-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.model-tag {
  background: var(--primary-500);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.model-tag.simulated {
  background: #f59e0b; /* Warning color */
  color: #1e293b;
}

.confidence-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--primary-600);
  background: var(--primary-50);
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
}

.forecast-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.projection-box {
  background: #f8fafc;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  text-align: center;
}

.projection-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 1px;
  margin-bottom: var(--spacing-sm);
}

.projection-value {
  display: block;
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.projection-range {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.forecast-bars {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.bar-row {
  display: grid;
  grid-template-columns: 100px 1fr 60px;
  align-items: center;
  gap: var(--spacing-md);
  animation: slideIn 0.5s ease-out both;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.bar-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.bar-track {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--success);
  border-radius: 4px;
  animation: growBar 0.8s ease-out both;
}

@keyframes growBar {
  from {
    width: 0 !important;
  }
}

.bar-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--success);
  text-align: right;
}

.forecast-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: var(--spacing-md);
  margin-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  font-size: 0.7rem;
  color: var(--text-muted);
}
</style>
