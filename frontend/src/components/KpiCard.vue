<template>
  <div class="kpi-card card">
    <div class="kpi-header">
      <div class="icon-wrapper" :class="iconClass">
        <component :is="iconComponent" :size="20" />
      </div>
      <span v-if="badge" class="badge" :class="badgeClass">
        {{ badgeIcon }} {{ badge }}
      </span>
      <span v-if="isLive" class="live-badge">
        <Radio :size="12" />
        Live
      </span>
    </div>

    <div class="kpi-body">
      <div class="kpi-value" ref="valueRef">{{ displayValue }}</div>
      <div class="kpi-label">{{ label }}</div>
    </div>

    <div v-if="trend !== undefined" class="kpi-trend" :class="trendClass">
      <component :is="trendIconComponent" :size="14" />
      <span>{{ Math.abs(trend) }}%</span>
      <span class="trend-label">vs last month</span>
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

const iconClass = computed(() => `icon-${props.color}`);

const badgeClass = computed(() => {
  if (props.trend === undefined) return "badge-primary";
  return props.trend >= 0 ? "badge-success" : "badge-danger";
});

const badgeIcon = computed(() => (props.trend >= 0 ? "↑" : "↓"));

const trendClass = computed(() => {
  if (props.trend === undefined) return "";
  return props.trend >= 0 ? "trend-up" : "trend-down";
});

const trendIconComponent = computed(() =>
  props.trend >= 0 ? TrendingUp : TrendingDown
);

watch(
  () => props.value,
  (newVal, oldVal) => {
    // Only flash if value actually changed and component is mounted
    if (valueRef.value && newVal !== oldVal) {
      valueRef.value.classList.add("value-flash");
      setTimeout(() => valueRef.value?.classList.remove("value-flash"), 600);
    }
  }
);
</script>

<style scoped>
.kpi-card {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 160px;
  animation: fadeSlideUp 0.5s ease-out both;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #1e293b;
}

.icon-primary,
.icon-success,
.icon-warning,
.icon-purple {
  background: #f1f5f9;
  color: #1e293b;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #dcfce7;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #16a34a;
  text-transform: uppercase;
}

.kpi-body {
  flex: 1;
}

.kpi-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.kpi-value.value-flash {
  transform: scale(1.08);
  color: var(--success);
  text-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
}

.kpi-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.kpi-trend.trend-up {
  color: var(--success);
}
.kpi-trend.trend-down {
  color: var(--danger);
}

.trend-label {
  color: var(--text-muted);
  margin-left: 4px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-success {
  background: #dcfce7;
  color: #16a34a;
}
.badge-danger {
  background: #fef2f2;
  color: #dc2626;
}
.badge-primary {
  background: var(--primary-100);
  color: var(--primary-700);
}
</style>
