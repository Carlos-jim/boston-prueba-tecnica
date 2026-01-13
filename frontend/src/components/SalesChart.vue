<template>
  <div class="card p-6">
    <div class="flex justify-between items-start mb-6 flex-wrap gap-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 mb-1">{{ title }}</h3>
        <p class="text-xs text-gray-500">{{ subtitle }}</p>
      </div>
      <div class="flex gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          v-for="range in timeRanges"
          :key="range.value"
          class="px-3.5 py-1.5 bg-transparent border-none rounded-lg text-xs font-semibold text-gray-500 cursor-pointer transition-all hover:text-gray-800"
          :class="{
            'bg-white text-blue-600 shadow-sm': selectedRange === range.value,
          }"
          @click="changeRange(range.value)"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <div class="h-[280px] mb-4">
      <Line
        v-if="!isLoading && chartData"
        ref="chartRef"
        :data="chartData"
        :options="chartOptions"
      />
      <div v-else class="skeleton h-full w-full rounded-xl"></div>
    </div>

    <div class="flex justify-center gap-6">
      <div class="flex items-center gap-1.5 text-xs text-gray-500">
        <span class="w-2 h-2 rounded-full bg-blue-500"></span>
        <span>Histórico</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-gray-500">
        <span class="w-2 h-2 rounded-full bg-cyan-500"></span>
        <span>Pronóstico</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
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
  title: { type: String, default: "Resumen de Ventas" },
  subtitle: { type: String, default: "Datos históricos con proyección" },
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
  { label: "Todos", value: -1 },
];

const selectedRange = ref(30);

// Timeout refs for cleanup
let animationTimeout = null;
let rangeTimeout = null;

// After initial animation completes, disable animation for real-time updates
onMounted(() => {
  animationTimeout = setTimeout(() => {
    shouldAnimate.value = false;
  }, 800);
});

// Cleanup timeouts on unmount to prevent memory leaks
onUnmounted(() => {
  if (animationTimeout) clearTimeout(animationTimeout);
  if (rangeTimeout) clearTimeout(rangeTimeout);
});

// Change range with animation - temporarily enable animation for filter change
const changeRange = (value) => {
  shouldAnimate.value = true; // Enable animation for filter change
  selectedRange.value = value;

  // Clear existing timeout if any
  if (rangeTimeout) clearTimeout(rangeTimeout);
  
  // Disable animation again after filter animation completes
  rangeTimeout = setTimeout(() => {
    shouldAnimate.value = false;
  }, 700);
};

const filteredData = computed(() => {
  if (selectedRange.value === -1) return props.data;
  return props.data.slice(-selectedRange.value);
});

const chartData = computed(() => {
  if (!filteredData.value.length) return null;

  const historicalLabels = filteredData.value.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
  });

  const forecastLabels = props.forecastData.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
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
        label: "Ventas Históricas",
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
        label: "Pronóstico",
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
        duration: 600,
        easing: "easeInOutQuart",
        delay: (context) => {
          let delay = 0;
          if (context.type === "data" && context.mode === "default") {
            delay = context.dataIndex * 10 + context.datasetIndex * 50;
          }
          return delay;
        },
      }
    : { duration: 200 }, // Quick smooth updates for real-time data
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
