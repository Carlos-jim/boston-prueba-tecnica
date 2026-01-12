<template>
  <aside class="w-[240px] min-h-screen bg-white p-6 flex flex-col fixed left-0 top-0 bottom-0 z-50 border-r border-slate-200 hidden lg:flex">
    <!-- Logo -->
    <div class="flex items-center gap-2 py-4 mb-6">
      <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
        <BarChart3 :size="20" />
      </div>
      <span class="text-xl font-bold text-slate-800">Analytics</span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 flex flex-col gap-6">
      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2">MENU</span>
        <a href="#" class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-blue-500 text-white hover:bg-blue-600">
          <LayoutDashboard :size="18" />
          <span>Dashboard</span>
        </a>
        <a href="#" class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <TrendingUp :size="18" />
          <span>Analytics</span>
        </a>
        <a href="#" class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <Package :size="18" />
          <span>Products</span>
        </a>
        <a href="#" class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <Users :size="18" />
          <span>Customers</span>
        </a>
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2">FINANCIAL</span>
        <a href="#" class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <CreditCard :size="18" />
          <span>Transactions</span>
        </a>
        <a href="#" class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <FileText :size="18" />
          <span>Reports</span>
        </a>
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2">TOOLS</span>
        <a href="#" class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <Settings :size="18" />
          <span>Settings</span>
        </a>
        <a href="#" class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <HelpCircle :size="18" />
          <span>Help</span>
        </a>
      </div>
    </nav>

    <!-- Upgrade Card -->
    <div class="mt-auto">
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
        <Crown :size="24" class="text-amber-500 mb-2 mx-auto" />
        <span class="block text-slate-800 text-base font-semibold mb-1">Upgrade Pro</span>
        <p class="text-slate-500 text-xs mb-4">Unlock all features</p>
        <button class="w-full px-4 py-2 bg-blue-500 text-white border-none rounded-xl text-xs font-semibold cursor-pointer transition-all hover:bg-blue-600">Upgrade $30</button>
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
