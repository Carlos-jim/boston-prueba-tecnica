/**
 * Real-time Sales Store
 * Maneja el estado global de datos en tiempo real via WebSocket
 * ACTUALIZA TODOS LOS COMPONENTES cuando llegan nuevas transacciones
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const useSalesStore = defineStore("sales", () => {
  // ============================================
  // State
  // ============================================
  const socket = ref(null);
  const isConnected = ref(false);
  const connectionError = ref(null);

  // Stats data
  const generalStats = ref(null);
  const categoryStats = ref([]);
  const regionStats = ref([]);
  const dailySales = ref([]);
  const forecast = ref(null);

  // Real-time data
  const realtimeStats = ref({
    lastMinuteSales: 0,
    lastMinuteTransactions: 0,
    recentTransactions: [],
  });

  // Loading states
  const isLoading = ref(true);
  const isLoadingForecast = ref(true);

  // ============================================
  // Computed
  // ============================================
  const formattedTotalSales = computed(() => {
    if (!generalStats.value) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(generalStats.value.totalSales);
  });

  const formattedAvgTicket = computed(() => {
    if (!generalStats.value) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(generalStats.value.avgTicket);
  });

  const formattedLastMinuteSales = computed(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(realtimeStats.value.lastMinuteSales);
  });

  // ============================================
  // Actions - Update stats when new transaction arrives
  // ============================================
  function updateStatsWithTransaction(transaction) {
    // Update general stats
    if (generalStats.value) {
      generalStats.value = {
        ...generalStats.value,
        totalSales: generalStats.value.totalSales + transaction.amount,
        totalTransactions: generalStats.value.totalTransactions + 1,
        avgTicket:
          (generalStats.value.totalSales + transaction.amount) /
          (generalStats.value.totalTransactions + 1),
      };
    }

    // Update category stats
    if (categoryStats.value.length > 0) {
      const categoryIndex = categoryStats.value.findIndex(
        (c) => c.category === transaction.category
      );
      if (categoryIndex !== -1) {
        const updated = [...categoryStats.value];
        updated[categoryIndex] = {
          ...updated[categoryIndex],
          totalSales: updated[categoryIndex].totalSales + transaction.amount,
          transactions: updated[categoryIndex].transactions + 1,
        };
        categoryStats.value = updated;
      }
    }

    // Update region stats
    if (regionStats.value.length > 0) {
      const regionIndex = regionStats.value.findIndex(
        (r) => r.region === transaction.region
      );
      if (regionIndex !== -1) {
        const updated = [...regionStats.value];
        updated[regionIndex] = {
          ...updated[regionIndex],
          totalSales: updated[regionIndex].totalSales + transaction.amount,
          transactions: updated[regionIndex].transactions + 1,
        };
        regionStats.value = updated;
      }
    }

    // Update daily sales for today
    if (dailySales.value.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const todayIndex = dailySales.value.findIndex((d) => d.date === today);

      if (todayIndex !== -1) {
        const updated = [...dailySales.value];
        updated[todayIndex] = {
          ...updated[todayIndex],
          totalSales: updated[todayIndex].totalSales + transaction.amount,
          transactions: (updated[todayIndex].transactions || 0) + 1,
        };
        dailySales.value = updated;
      } else {
        // Add today if not exists
        dailySales.value = [
          ...dailySales.value,
          {
            date: today,
            totalSales: transaction.amount,
            transactions: 1,
          },
        ];
      }
    }
  }

  // ============================================
  // Actions - API Calls
  // ============================================
  async function fetchGeneralStats() {
    try {
      const response = await fetch(`${API_URL}/sales/stats`);
      const data = await response.json();
      if (data.success) {
        generalStats.value = data.data;
        realtimeStats.value = {
          lastMinuteSales: data.data.realtime?.lastMinuteSales || 0,
          lastMinuteTransactions:
            data.data.realtime?.lastMinuteTransactions || 0,
          recentTransactions: [],
        };
      }
    } catch (error) {
      console.error("Error fetching general stats:", error);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCategoryStats() {
    try {
      const response = await fetch(`${API_URL}/sales/by-category`);
      const data = await response.json();
      if (data.success) {
        categoryStats.value = data.data;
      }
    } catch (error) {
      console.error("Error fetching category stats:", error);
    }
  }

  async function fetchRegionStats() {
    try {
      const response = await fetch(`${API_URL}/sales/by-region`);
      const data = await response.json();
      if (data.success) {
        regionStats.value = data.data;
      }
    } catch (error) {
      console.error("Error fetching region stats:", error);
    }
  }

  async function fetchDailySales() {
    try {
      const response = await fetch(`${API_URL}/sales/daily`);
      const data = await response.json();
      if (data.success) {
        dailySales.value = data.data.items || data.data;
      }
    } catch (error) {
      console.error("Error fetching daily sales:", error);
    }
  }

  async function fetchForecast() {
    try {
      const response = await fetch(`${API_URL}/predictions/historical`);
      const data = await response.json();
      if (data.success) {
        forecast.value = data.data;
        // Agregamos el log para que lo veas en la consola del navegador
        console.log("🤖 Sales Forecast Source:", data.data.model);
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
    } finally {
      isLoadingForecast.value = false;
    }
  }

  async function fetchAllData() {
    isLoading.value = true;
    await Promise.all([
      fetchGeneralStats(),
      fetchCategoryStats(),
      fetchRegionStats(),
      fetchDailySales(),
      fetchForecast(),
    ]);
  }

  // ============================================
  // Actions - WebSocket
  // ============================================
  function connectSocket() {
    if (socket.value?.connected) return;

    socket.value = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.value.on("connect", () => {
      isConnected.value = true;
      connectionError.value = null;
      console.log("🔌 WebSocket conectado");
    });

    socket.value.on("disconnect", (reason) => {
      isConnected.value = false;
      console.log("🔌 WebSocket desconectado:", reason);
    });

    socket.value.on("connect_error", (error) => {
      connectionError.value = error.message;
      console.error("❌ Error de conexión:", error.message);
    });

    // Handle new transactions - UPDATE ALL COMPONENTS
    socket.value.on("new-transaction", (data) => {
      // Update realtime stats
      realtimeStats.value = {
        lastMinuteSales: data.stats.lastMinuteSales,
        lastMinuteTransactions: data.stats.lastMinuteTransactions,
        recentTransactions: data.stats.recentTransactions || [],
      };

      // Update all other stats with this transaction
      if (data.transaction) {
        updateStatsWithTransaction(data.transaction);
      }
    });

    socket.value.on("connected", (data) => {
      console.log("📊 Estado inicial recibido:", data);
    });
  }

  function disconnectSocket() {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
    }
  }

  // ============================================
  // Initialize
  // ============================================
  function initialize() {
    fetchAllData();
    connectSocket();
  }

  function cleanup() {
    disconnectSocket();
  }

  return {
    // State
    socket,
    isConnected,
    connectionError,
    generalStats,
    categoryStats,
    regionStats,
    dailySales,
    forecast,
    realtimeStats,
    isLoading,
    isLoadingForecast,

    // Computed
    formattedTotalSales,
    formattedAvgTicket,
    formattedLastMinuteSales,

    // Actions
    fetchGeneralStats,
    fetchCategoryStats,
    fetchRegionStats,
    fetchDailySales,
    fetchForecast,
    fetchAllData,
    connectSocket,
    disconnectSocket,
    initialize,
    cleanup,
    updateStatsWithTransaction,
  };
});
