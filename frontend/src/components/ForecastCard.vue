<template>
  <div class="card p-6 h-full flex flex-col">
    <div class="flex justify-between items-start mb-6 gap-4 flex-wrap">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 mb-1">7-Day Sales Forecast</h3>
        <p class="text-xs text-gray-500 flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase" 
                :class="isSimulated ? 'bg-amber-500 text-slate-800' : 'bg-blue-500 text-white'">{{
            modelName
          }}</span>
          Predicted revenue
        </p>
      </div>
      <span class="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
        <Target :size="14" />
        95% confidence
      </span>
    </div>

    <div class="flex flex-col gap-6">
      <!-- Total Projection -->
      <div class="bg-slate-50 rounded-xl p-6 text-center">
        <span class="block text-[10px] font-semibold text-gray-400 tracking-wider mb-2 uppercase">PROJECTED TOTAL</span>
        <span class="block text-4xl font-bold text-gray-800 mb-1">${{ formatNumber(totalForecast) }}</span>
        <span class="text-xs text-gray-500"
          >Range: ${{ formatNumber(lowerBound) }} - ${{
            formatNumber(upperBound)
          }}</span
        >
      </div>

      <!-- Daily Bars -->
      <div class="flex flex-col gap-2">
        <div
          v-for="(day, index) in predictions"
          :key="day.date"
          class="grid grid-cols-[100px_1fr_60px] items-center gap-4 animate-[slideIn_0.5s_ease-out_both]"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <span class="text-xs text-gray-500">{{ formatDay(day.date) }}</span>
          <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-green-500 rounded-full animate-[growBar_0.8s_ease-out_both]"
              :style="{
                width: getBarWidth(day.predictedSales),
                animationDelay: `${index * 100 + 300}ms`,
              }"
            ></div>
          </div>
          <span class="text-xs font-semibold text-green-500 text-right">${{ formatShortNumber(day.predictedSales) }}</span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-1 pt-4 mt-6 border-t border-gray-100 text-xs text-gray-400">
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
