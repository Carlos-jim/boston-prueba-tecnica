<template>
  <div class="category-chart card">
    <div class="chart-header">
      <div>
        <h3 class="chart-title">Product Statistics</h3>
        <p class="chart-subtitle">Track your product sales</p>
      </div>
      <select class="period-select">
        <option>Today</option>
        <option>This Week</option>
        <option>This Month</option>
      </select>
    </div>

    <div class="chart-content">
      <!-- Ring Chart -->
      <div class="ring-chart-container">
        <Doughnut
          v-if="!isLoading && chartData"
          :data="chartData"
          :options="chartOptions"
        />
        <div class="ring-center">
          <span class="ring-value">{{ totalFormatted }}</span>
          <span class="ring-label">Total Sales</span>
        </div>
      </div>

      <!-- Category List -->
      <div class="category-list">
        <div
          v-for="(category, index) in data"
          :key="category.category"
          class="category-item"
        >
          <div class="category-info">
            <span
              class="category-dot"
              :style="{ background: colors[index] }"
            ></span>
            <span class="category-name">{{ category.category }}</span>
          </div>
          <div class="category-stats">
            <span class="category-value">{{
              formatNumber(category.totalSales)
            }}</span>
            <span
              class="category-badge"
              :class="index % 2 === 0 ? 'positive' : 'neutral'"
            >
              {{ index % 2 === 0 ? "+" : ""
              }}{{ (1.5 + index * 0.3).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { Doughnut } from "vue-chartjs";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps({
  data: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
});

const shouldAnimate = ref(true); // Controls full animation

// Disable animation after initial render (real-time updates will be smooth)
onMounted(() => {
  setTimeout(() => {
    shouldAnimate.value = false;
  }, 1500);
});

const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];

const totalSales = computed(() =>
  props.data.reduce((sum, cat) => sum + cat.totalSales, 0)
);

const totalFormatted = computed(() => {
  const val = totalSales.value;
  if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return (val / 1000).toFixed(0) + "K";
  return val.toFixed(0);
});

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toFixed(0);
};

const chartData = computed(() => {
  if (!props.data.length) return null;
  return {
    labels: props.data.map((d) => d.category),
    datasets: [
      {
        data: props.data.map((d) => d.totalSales),
        backgroundColor: colors.slice(0, props.data.length),
        borderWidth: 0,
        cutout: "75%",
        spacing: 2,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: shouldAnimate.value
    ? {
        animateRotate: true,
        animateScale: true,
        duration: 1200,
        easing: "easeOutQuart",
      }
    : { duration: 300 }, // Quick updates for real-time data
  hover: {
    animationDuration: 200,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1e293b",
      padding: 12,
      cornerRadius: 8,
      animation: {
        duration: 200,
      },
      callbacks: {
        label: (ctx) => `$${formatNumber(ctx.raw)}`,
      },
    },
  },
}));
</script>

<style scoped>
.category-chart {
  padding: var(--spacing-lg);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.chart-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.period-select {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: white;
  cursor: pointer;
}

.chart-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.ring-chart-container {
  position: relative;
  height: 180px;
  display: flex;
  justify-content: center;
}

.ring-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.ring-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.ring-label {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.category-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.category-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.category-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.category-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.category-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 600;
}

.category-badge.positive {
  background: #dcfce7;
  color: #16a34a;
}

.category-badge.neutral {
  background: #f1f5f9;
  color: var(--text-secondary);
}
</style>
