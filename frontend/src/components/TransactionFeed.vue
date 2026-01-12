<template>
  <div class="card p-6 flex flex-col h-full">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-semibold text-gray-800">Live Transactions</h3>
        <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 rounded-full text-[10px] font-semibold text-green-600 uppercase">
          <Radio :size="10" />
          Live
        </span>
      </div>
      <span class="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium" 
            :class="isConnected ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'">
        <Wifi v-if="isConnected" :size="12" />
        <WifiOff v-else :size="12" />
        {{ isConnected ? "Connected" : "Reconnecting..." }}
      </span>
    </div>

    <div class="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[300px]">
      <TransitionGroup 
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-x-5"
        leave-active-class="transition-all duration-200 ease-in absolute"
        leave-to-class="opacity-0 translate-x-5"
      >
        <div
          v-for="tx in transactions.slice(0, 5)"
          :key="tx.transaction_id"
          class="flex items-center gap-4 p-2 rounded-xl transition-all duration-200 hover:bg-slate-50"
        >
          <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-800 shrink-0">
            <component :is="getCategoryIcon(tx.category)" :size="18" />
          </div>
          <div class="flex-1 flex flex-col">
            <span class="text-sm font-semibold text-gray-800">{{ tx.category }}</span>
            <span class="text-xs text-gray-400"
              >{{ tx.region }} • {{ formatRelativeTime(tx.timestamp) }}</span
            >
          </div>
          <span class="text-sm font-semibold text-green-500">+${{ tx.amount.toFixed(2) }}</span>
        </div>
      </TransitionGroup>

      <div v-if="!transactions.length" class="flex-1 flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
        <Radio :size="32" class="opacity-50" />
        <p>Waiting for transactions...</p>
      </div>
    </div>

    <div class="flex justify-around pt-6 mt-6 border-t border-gray-100">
      <div class="text-center">
        <span class="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">LAST MINUTE</span>
        <span class="text-xl font-bold text-gray-800">${{ lastMinuteSales.toFixed(2) }}</span>
      </div>
      <div class="text-center">
        <span class="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">SESSION TRANSACTIONS</span>
        <span class="text-xl font-bold text-gray-800">{{ lastMinuteCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Radio,
  Wifi,
  WifiOff,
  Monitor,
  Shirt,
  Home,
  BookOpen,
  Package,
} from "lucide-vue-next";

import { formatRelativeTime } from "../utils/formatters";

const props = defineProps({
  transactions: { type: Array, default: () => [] },
  lastMinuteSales: { type: Number, default: 0 },
  lastMinuteCount: { type: Number, default: 0 },
  isConnected: { type: Boolean, default: false },
});

const categoryColors = {
  Electronics: "#3b82f6",
  Clothing: "#ec4899",
  Home: "#10b981",
  Books: "#f59e0b",
};

const categoryIcons = {
  Electronics: Monitor,
  Clothing: Shirt,
  Home: Home,
  Books: BookOpen,
};

const getCategoryColor = (cat) => categoryColors[cat] || "#3b82f6";
const getCategoryIcon = (cat) => categoryIcons[cat] || Package;
</script>
