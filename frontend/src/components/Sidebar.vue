<template>
  <aside class="sidebar">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="logo-icon">
        <BarChart3 :size="20" />
      </div>
      <span class="logo-text">Analytics</span>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <span class="nav-label">MENU</span>
        <a href="#" class="nav-item active">
          <LayoutDashboard :size="18" />
          <span>Dashboard</span>
        </a>
        <a href="#" class="nav-item">
          <TrendingUp :size="18" />
          <span>Analytics</span>
        </a>
        <a href="#" class="nav-item">
          <Package :size="18" />
          <span>Products</span>
        </a>
        <a href="#" class="nav-item">
          <Users :size="18" />
          <span>Customers</span>
        </a>
      </div>

      <div class="nav-section">
        <span class="nav-label">FINANCIAL</span>
        <a href="#" class="nav-item">
          <CreditCard :size="18" />
          <span>Transactions</span>
        </a>
        <a href="#" class="nav-item">
          <FileText :size="18" />
          <span>Reports</span>
        </a>
      </div>

      <div class="nav-section">
        <span class="nav-label">TOOLS</span>
        <a href="#" class="nav-item">
          <Settings :size="18" />
          <span>Settings</span>
        </a>
        <a href="#" class="nav-item">
          <HelpCircle :size="18" />
          <span>Help</span>
        </a>
      </div>
    </nav>

    <!-- Upgrade Card -->
    <div class="sidebar-upgrade">
      <div class="upgrade-content">
        <Crown :size="24" class="upgrade-icon" />
        <span class="upgrade-title">Upgrade Pro</span>
        <p class="upgrade-text">Unlock all features</p>
        <button class="upgrade-btn">Upgrade $30</button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import {
  BarChart3,
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  CreditCard,
  FileText,
  Settings,
  HelpCircle,
  Crown,
} from "lucide-vue-next";
</script>

<style scoped>
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: #ffffff;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  border-right: 1px solid #e2e8f0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) 0;
  margin-bottom: var(--spacing-lg);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: var(--primary-500);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.nav-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: var(--spacing-sm) var(--spacing-md);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: #64748b;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.nav-item.active {
  background: var(--primary-500);
  color: white;
}

.sidebar-upgrade {
  margin-top: auto;
}

.upgrade-content {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  text-align: center;
}

.upgrade-icon {
  color: #f59e0b;
  margin-bottom: var(--spacing-sm);
}

.upgrade-title {
  display: block;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.upgrade-text {
  color: #64748b;
  font-size: 0.75rem;
  margin-bottom: var(--spacing-md);
}

.upgrade-btn {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--primary-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.upgrade-btn:hover {
  background: var(--primary-600);
}
</style>
