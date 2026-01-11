<template>
  <div class="sales-chart card">
    <div class="chart-header">
      <div>
        <h3 class="chart-title">{{ title }}</h3>
        <p class="chart-subtitle">{{ subtitle }}</p>
      </div>
      <div class="chart-filters">
        <button
          v-for="range in timeRanges"
          :key="range.value"
          class="filter-btn"
          :class="{ active: selectedRange === range.value }"
          @click="changeRange(range.value)"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <div class="chart-body">
      <Line
        v-if="!isLoading && chartData"
        ref="chartRef"
        :data="chartData"
        :options="chartOptions"
      />
      <div v-else class="chart-skeleton skeleton" style="height: 280px"></div>
    </div>

    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-dot" style="background: #3b82f6"></span>
        <span>Historical</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #06b6d4"></span>
        <span>Forecast</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps({
  title: { type: String, default: "Sales Overview" },
  subtitle: { type: String, default: "Historical data with forecast" },
  data: { type: Array, default: () => [] },
  forecastData: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
});

const chartRef = ref(null);
const shouldAnimate = ref(true); // Controls whether to show full animation

const timeRanges = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
  { label: "All", value: -1 },
];

const selectedRange = ref(30);

// After initial animation completes, disable animation for real-time updates
onMounted(() => {
  setTimeout(() => {
    shouldAnimate.value = false;
  }, 2000);
});

// Change range with animation - temporarily enable animation for filter change
const changeRange = (value) => {
  shouldAnimate.value = true; // Enable animation for filter change
  selectedRange.value = value;

  // Disable animation again after filter animation completes
  setTimeout(() => {
    shouldAnimate.value = false;
  }, 1800);
};

const filteredData = computed(() => {
  if (selectedRange.value === -1) return props.data;
  return props.data.slice(-selectedRange.value);
});

const chartData = computed(() => {
  if (!filteredData.value.length) return null;

  const historicalLabels = filteredData.value.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const forecastLabels = props.forecastData.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const allLabels = [...historicalLabels, ...forecastLabels];

  const historicalValues = [
    ...filteredData.value.map((d) => d.totalSales),
    ...props.forecastData.map(() => null),
  ];

  const forecastValues = [
    ...filteredData.value.map(() => null),
    ...props.forecastData.map((d) => d.sales),
  ];

  // Connect last historical point to forecast
  if (filteredData.value.length && props.forecastData.length) {
    forecastValues[filteredData.value.length - 1] =
      filteredData.value[filteredData.value.length - 1].totalSales;
  }

  return {
    labels: allLabels,
    datasets: [
      {
        label: "Historical Sales",
        data: historicalValues,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#3b82f6",
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
        borderWidth: 2.5,
      },
      {
        label: "Forecast",
        data: forecastValues,
        borderColor: "#06b6d4",
        backgroundColor: "rgba(6, 182, 212, 0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#06b6d4",
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
        borderWidth: 2.5,
        borderDash: [6, 4],
      },
    ],
  };
});

// Calculate min value for y-axis based on data
const minDataValue = computed(() => {
  const allValues = filteredData.value
    .map((d) => d.totalSales)
    .filter((v) => v !== null);
  if (!allValues.length) return 0;
  const min = Math.min(...allValues);
  return Math.floor(min * 0.85); // 15% padding below min
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  // Full animation on initial load or filter change, quick updates for real-time data
  animation: shouldAnimate.value
    ? {
        duration: 1500,
        easing: "easeInOutQuart",
        delay: (context) => {
          let delay = 0;
          if (context.type === "data" && context.mode === "default") {
            delay = context.dataIndex * 30 + context.datasetIndex * 100;
          }
          return delay;
        },
      }
    : { duration: 300 }, // Quick smooth updates for real-time data
  transitions: {
    active: {
      animation: {
        duration: 300,
      },
    },
  },
  interaction: {
    mode: "index",
    intersect: false,
  },
  hover: {
    animationDuration: 200,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1e293b",
      titleColor: "#f8fafc",
      bodyColor: "#94a3b8",
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      animation: {
        duration: 200,
      },
      callbacks: {
        label: (ctx) => {
          if (ctx.raw === null) return null;
          return `${ctx.dataset.label}: $${ctx.raw.toLocaleString()}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: "#94a3b8",
        font: { size: 11 },
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
      },
    },
    y: {
      grid: { color: "#f1f5f9" },
      ticks: {
        color: "#94a3b8",
        font: { size: 11 },
        callback: (value) => "$" + (value / 1000).toFixed(0) + "k",
      },
      suggestedMin: minDataValue.value,
    },
  },
}));
</script>

<style scoped>
.sales-chart {
  padding: var(--spacing-lg);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
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

.chart-filters {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: var(--radius-md);
}

.filter-btn {
  padding: 6px 14px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  color: var(--text-primary);
}

.filter-btn.active {
  background: white;
  color: var(--primary-600);
  box-shadow: var(--shadow-sm);
}

.chart-body {
  height: 280px;
  margin-bottom: var(--spacing-md);
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
