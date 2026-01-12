<template>
  <div class="card p-6 flex flex-col gap-4 min-h-[160px] animate-[fadeSlideUp_0.5s_ease-out_both]">
    <div class="flex items-center justify-between">
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-800">
        <component :is="iconComponent" :size="20" />
      </div>
      <span v-if="badge" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" :class="badgeClass">
        {{ badgeIcon }} {{ badge }}
      </span>
      <span v-if="isLive" class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 rounded-full text-xs font-semibold text-green-600 uppercase tracking-wide">
        <span class="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
        Live
      </span>
    </div>

    <div class="flex-1">
      <div class="text-3xl font-bold text-gray-800 mb-1 transition-all duration-300" ref="valueRef">{{ displayValue }}</div>
      <div class="text-sm text-gray-500">{{ label }}</div>
    </div>

    <div v-if="trend !== undefined" class="flex items-center gap-1 text-xs font-medium" :class="trendClass">
      <component :is="trendIconComponent" :size="14" />
      <span>{{ Math.abs(trend) }}%</span>
      <span class="text-gray-400 ml-1">vs last month</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import {
  DollarSign,
  ShoppingCart,
  Ticket,
  Zap,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Radio,
} from "lucide-vue-next";

const props = defineProps({
  value: { type: [Number, String], required: true },
  label: { type: String, required: true },
  prefix: { type: String, default: "" },
  suffix: { type: String, default: "" },
  trend: { type: Number, default: undefined },
  badge: { type: String, default: "" },
  isLive: { type: Boolean, default: false },
  color: { type: String, default: "primary" },
  format: { type: String, default: "number" },
  icon: { type: String, default: "dollar" },
});

const valueRef = ref(null);

const iconMap = {
  dollar: DollarSign,
  cart: ShoppingCart,
  ticket: Ticket,
  zap: Zap,
  refresh: RefreshCw,
};

const iconComponent = computed(() => iconMap[props.icon] || DollarSign);

const formatValue = (val) => {
  if (typeof val === "string") return val;
  switch (props.format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    case "percent":
      return `${val.toFixed(1)}%`;
    default:
      return new Intl.NumberFormat("en-US").format(val);
  }
};

const displayValue = computed(() => {
  const formatted = formatValue(props.value);
  return `${props.prefix}${formatted}${props.suffix}`;
});

const badgeClass = computed(() => {
  if (props.trend === undefined) return "bg-blue-100 text-blue-700";
  return props.trend >= 0 ? "bg-green-100 text-green-600" : "bg-red-50 text-red-600";
});

const badgeIcon = computed(() => (props.trend >= 0 ? "↑" : "↓"));

const trendClass = computed(() => {
  if (props.trend === undefined) return "";
  return props.trend >= 0 ? "text-green-600" : "text-red-500";
});

const trendIconComponent = computed(() =>
  props.trend >= 0 ? TrendingUp : TrendingDown
);

watch(
  () => props.value,
  (newVal, oldVal) => {
    // Only flash if value actually changed and component is mounted
    if (valueRef.value && newVal !== oldVal) {
      valueRef.value.classList.add("scale-110", "text-green-500", "drop-shadow-lg");
      // Need to handle removing classes manually or via a reactive state
      // Using direct DOM manipulation here to match previous behavior
      setTimeout(() => valueRef.value?.classList.remove("scale-110", "text-green-500", "drop-shadow-lg"), 600);
    }
  }
);
</script>
