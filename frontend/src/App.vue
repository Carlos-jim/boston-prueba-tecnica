<template>
  <div class="flex min-h-screen w-full bg-slate-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <main class="flex-1 lg:ml-[240px] ml-0 p-4 lg:p-8 bg-slate-50 min-w-0 w-full lg:w-[calc(100%-240px)] transition-all duration-300">
      <!-- Header -->
      <header class="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-800">Reporte de Ventas</h1>
          <p class="text-sm text-slate-500 mt-1">{{ currentDate }}</p>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 rounded-full text-xs font-medium text-red-600 transition-colors"
            :class="{ 'bg-green-100 text-green-600': store.isConnected }"
          >
            <div class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
            {{ store.isConnected ? "Conectado en tiempo real" : "Conectando..." }}
          </div>
          <button 
            class="flex items-center gap-1.5 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 transition-all group"
            @click="store.fetchAllData"
          >
            <RefreshCw :size="14" class="group-hover:animate-spin" />
            Actualizar
          </button>
        </div>
      </header>

      <!-- Dashboard Grid -->
      <div class="flex flex-col gap-6">
        <!-- KPI Cards Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <KpiCard
            :value="store.generalStats?.totalSales || 0"
            label="Ventas Totales"
            format="currency"
            color="primary"
            icon="dollar"
            :trend="store.generalStats?.trends?.salesTrend || 0"
            class="animate-[fadeUp_0.6s_ease-out_both]"
            style="animation-delay: 0ms"
          />

          <KpiCard
            :value="store.generalStats?.totalTransactions || 0"
            label="Órdenes Totales"
            format="number"
            color="purple"
            icon="cart"
            :trend="store.generalStats?.trends?.transactionsTrend || 0"
            class="animate-[fadeUp_0.6s_ease-out_both]"
            style="animation-delay: 100ms"
          />

          <KpiCard
            :value="store.generalStats?.uniqueUsers || 0"
            label="Visitantes"
            format="number"
            color="warning"
            icon="ticket"
            :trend="store.generalStats?.trends?.usersTrend || 0"
            class="animate-[fadeUp_0.6s_ease-out_both]"
            style="animation-delay: 200ms"
          />

          <KpiCard
            :value="store.realtimeStats.lastMinuteSales"
            label="Ventas Último Minuto"
            format="currency"
            color="success"
            icon="zap"
            is-live
            class="animate-[fadeUp_0.6s_ease-out_both]"
            style="animation-delay: 300ms"
          />
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          <div class="animate-[fadeUp_0.6s_ease-out_both]" style="animation-delay: 400ms">
            <SalesChart
              title="Tendencias de Clientes"
              subtitle="Rastrea hábitos de clientes"
              :data="store.dailySales"
              :forecast-data="store.forecast?.forecast || []"
              :is-loading="store.isLoading"
            />
          </div>
          <div class="animate-[fadeUp_0.6s_ease-out_both]" style="animation-delay: 500ms">
            <CategoryChart
              :data="store.categoryStats"
              :is-loading="store.isLoading"
              @filter-change="(period) => store.fetchCategoryStats(period)"
            />
          </div>
        </div>

        <!-- Bottom Row -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div class="animate-[fadeUp_0.6s_ease-out_both]" style="animation-delay: 600ms">
            <TransactionFeed
              :transactions="store.realtimeStats.recentTransactions"
              :last-minute-sales="store.realtimeStats.lastMinuteSales"
              :last-minute-count="store.realtimeStats.sessionTransactions"
              :is-connected="store.isConnected"
            />
          </div>
          <div class="animate-[fadeUp_0.6s_ease-out_both]" style="animation-delay: 700ms">
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
      <footer class="text-center py-8 mt-8 text-xs text-gray-400">
        Panel E-Commerce MVP • Vue 3 + Pinia + Socket.io •
        Impulsado por <strong class="text-blue-500">BigQuery ML</strong>
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
  return new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

onMounted(() => store.initialize());
onUnmounted(() => store.cleanup());
</script>
