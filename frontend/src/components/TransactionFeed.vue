<template>
  <div class="transaction-feed card">
    <div class="feed-header">
      <div>
        <h3 class="feed-title">Live Transactions</h3>
        <span class="live-badge">
          <Radio :size="10" />
          Live
        </span>
      </div>
      <span class="connection-status" :class="{ connected: isConnected }">
        <Wifi v-if="isConnected" :size="12" />
        <WifiOff v-else :size="12" />
        {{ isConnected ? "Connected" : "Reconnecting..." }}
      </span>
    </div>

    <div class="transactions-list">
      <TransitionGroup name="tx">
        <div
          v-for="tx in transactions.slice(0, 5)"
          :key="tx.transaction_id"
          class="transaction-item"
        >
          <div class="tx-avatar">
            <component :is="getCategoryIcon(tx.category)" :size="18" />
          </div>
          <div class="tx-info">
            <span class="tx-category">{{ tx.category }}</span>
            <span class="tx-meta"
              >{{ tx.region }} • {{ formatRelativeTime(tx.timestamp) }}</span
            >
          </div>
          <span class="tx-amount positive">+${{ tx.amount.toFixed(2) }}</span>
        </div>
      </TransitionGroup>

      <div v-if="!transactions.length" class="empty-state">
        <Radio :size="32" class="empty-icon" />
        <p>Waiting for transactions...</p>
      </div>
    </div>

    <div class="feed-footer">
      <div class="footer-stat">
        <span class="stat-label">LAST MINUTE</span>
        <span class="stat-value">${{ lastMinuteSales.toFixed(2) }}</span>
      </div>
      <div class="footer-stat">
        <span class="stat-label">TRANSACTIONS</span>
        <span class="stat-value">{{ lastMinuteCount }}</span>
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

<style scoped>
.transaction-feed {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.feed-header > div {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.feed-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #dcfce7;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #16a34a;
  text-transform: uppercase;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
  background: #fef2f2;
  color: #dc2626;
}

.connection-status.connected {
  background: #dcfce7;
  color: #16a34a;
}

.transactions-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  overflow-y: auto;
  max-height: 300px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.transaction-item:hover {
  background: #f8fafc;
}

.tx-enter-active {
  transition: all 0.3s ease;
}
.tx-leave-active {
  transition: all 0.2s ease;
  position: absolute;
}
.tx-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.tx-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.tx-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #1e293b;
  flex-shrink: 0;
}

.tx-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tx-category {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.tx-meta {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.tx-amount {
  font-size: 0.9rem;
  font-weight: 600;
}

.tx-amount.positive {
  color: var(--success);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: var(--spacing-sm);
}

.empty-icon {
  opacity: 0.5;
}

.feed-footer {
  display: flex;
  justify-content: space-around;
  padding-top: var(--spacing-lg);
  margin-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.footer-stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
