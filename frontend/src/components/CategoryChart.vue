<template>
  <div class="card p-6 h-full flex flex-col">
    <div class="flex justify-between items-start mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 mb-1">Product Statistics</h3>
        <p class="text-xs text-gray-500">Track your product sales</p>
      </div>
      <select
        v-model="selectedPeriod"
        class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-500 bg-white cursor-pointer focus:outline-none focus:border-blue-500"
        @change="$emit('filter-change', selectedPeriod)"
      >
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>
    </div>

    <div class="flex-1 flex flex-col gap-6">
      <!-- Ring Chart -->
      <div class="relative h-[180px] flex justify-center">
        <Doughnut
          v-if="!isLoading && chartData"
          :data="chartData"
          :options="chartOptions"
        />
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <span class="block text-2xl font-bold text-slate-800">{{ totalFormatted }}</span>
          <span class="text-[10px] text-slate-400 uppercase tracking-wide">Total Sales</span>
        </div>
      </div>

      <!-- Category List -->
      <div class="flex flex-col gap-3 mt-auto">
        <div
          v-for="(category, index) in data"
          :key="category.category"
          class="flex justify-between items-center py-1"
        >
          <div class="flex items-center gap-3">
            <span
              class="w-2.5 h-2.5 rounded-full"
              :style="{ background: colors[index] }"
            ></span>
            <span class="text-sm font-medium text-slate-700">{{ category.category }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-slate-800">{{
              formatNumber(category.totalSales)
            }}</span>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              :class="index % 2 === 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'"
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

const emit = defineEmits(["filter-change"]);
const selectedPeriod = ref("today");

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
        hoverOffset: 12, // Animate segments on hover
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
    mode: 'nearest',
    intersect: true,
    animationDuration: 200,
  },
  onHover: (event, chartElement) => {
    // Optional: Add custom behavior on hover if needed
    if(chartElement.length) {
      event.native.target.style.cursor = 'pointer';
    } else {
      event.native.target.style.cursor = 'default';
    }
  },
  layout: {
    padding: 20
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
