<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <main class="main-content">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1 class="page-title">Sales Report</h1>
          <p class="page-date">{{ currentDate }}</p>
        </div>
        <div class="header-right">
          <div
            class="connection-badge"
            :class="{ connected: store.isConnected }"
          >
            <Wifi v-if="store.isConnected" :size="14" />
            <WifiOff v-else :size="14" />
            {{ store.isConnected ? "Real-time Connected" : "Connecting..." }}
          </div>
          <button class="refresh-btn" @click="store.fetchAllData">
            <RefreshCw :size="14" />
            Refresh
          </button>
        </div>
      </header>

      <!-- Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- KPI Cards Row -->
        <div class="grid-row kpi-row">
          <KpiCard
            :value="store.generalStats?.totalSales || 0"
            label="Total Sales"
            format="currency"
            color="primary"
            icon="dollar"
            :trend="2.06"
            badge="+2.06%"
            style="animation-delay: 0ms"
          />

          <KpiCard
            :value="store.generalStats?.totalTransactions || 0"
            label="Total Orders"
            format="number"
            color="purple"
            icon="cart"
            :trend="12.4"
            style="animation-delay: 100ms"
          />

          <KpiCard
            :value="store.generalStats?.uniqueUsers || 0"
            label="Visitors"
            format="number"
            color="warning"
            icon="ticket"
            :trend="-2.06"
            style="animation-delay: 200ms"
          />

          <KpiCard
            :value="store.realtimeStats.lastMinuteSales"
            label="Last Minute Sales"
            format="currency"
            color="success"
            icon="zap"
            is-live
            style="animation-delay: 300ms"
          />
        </div>

        <!-- Charts Row -->
        <div class="grid-row charts-row">
          <div class="chart-main">
            <SalesChart
              title="Customer Habbits"
              subtitle="Track your customer habits"
              :data="store.dailySales"
              :forecast-data="store.forecast?.forecast || []"
              :is-loading="store.isLoading"
            />
          </div>
          <div class="chart-side">
            <CategoryChart
              :data="store.categoryStats"
              :is-loading="store.isLoading"
            />
          </div>
        </div>

        <!-- Bottom Row -->
        <div class="grid-row bottom-row">
          <div class="transactions-panel">
            <TransactionFeed
              :transactions="store.realtimeStats.recentTransactions"
              :last-minute-sales="store.realtimeStats.lastMinuteSales"
              :last-minute-count="store.realtimeStats.lastMinuteTransactions"
              :is-connected="store.isConnected"
            />
          </div>
          <div class="forecast-panel">
            <ForecastCard
              :predictions="
                store.forecast?.forecast?.map((f) => ({
                  date: f.date,
                  predictedSales: f.sales,
                  lowerBound: f.lowerBound || f.sales * 0.85,
                  upperBound: f.upperBound || f.sales * 1.15,
                })) || []
              "
              :generated-at="new Date().toISOString()"
              :model-name="store.forecast?.model || 'ARIMA_PLUS'"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="page-footer">
        E-Commerce Dashboard MVP • Vue 3 + Pinia + Socket.io •
        <strong>BigQuery ML</strong> Powered
      </footer>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed } from "vue";
import { useSalesStore } from "./stores/salesStore";
import Sidebar from "./components/Sidebar.vue";
import KpiCard from "./components/KpiCard.vue";
import SalesChart from "./components/SalesChart.vue";
import CategoryChart from "./components/CategoryChart.vue";
import TransactionFeed from "./components/TransactionFeed.vue";
import ForecastCard from "./components/ForecastCard.vue";
import { Wifi, WifiOff, RefreshCw } from "lucide-vue-next";

const store = useSalesStore();

const currentDate = computed(() => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

onMounted(() => store.initialize());
onUnmounted(() => store.cleanup());
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  padding: var(--spacing-xl);
  background: var(--bg-main);
  min-width: 0;
  width: calc(100% - 240px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.page-date {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.connection-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #fef2f2;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #dc2626;
}

.connection-badge.connected {
  background: #dcfce7;
  color: #16a34a;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--primary-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: var(--primary-600);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.refresh-btn:hover svg {
  animation: spin 0.8s ease-in-out;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.grid-row {
  display: grid;
  gap: var(--spacing-lg);
}

.kpi-row {
  grid-template-columns: repeat(4, 1fr);
}

.charts-row {
  grid-template-columns: 2fr 1fr;
}

.chart-main,
.chart-side,
.transactions-panel,
.forecast-panel {
  animation: fadeUp 0.6s ease-out both;
}

.chart-main {
  animation-delay: 400ms;
}
.chart-side {
  animation-delay: 500ms;
}
.transactions-panel {
  animation-delay: 600ms;
}
.forecast-panel {
  animation-delay: 700ms;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bottom-row {
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 1400px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1200px) {
  .charts-row,
  .bottom-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: var(--spacing-md);
  }

  .kpi-row {
    grid-template-columns: 1fr;
  }
}

.page-footer {
  text-align: center;
  padding: var(--spacing-xl) 0;
  margin-top: var(--spacing-xl);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.page-footer strong {
  color: var(--primary-500);
}
</style>
