<script setup lang="ts">
import { ref, computed, provide, watch } from 'vue';
import { RouterView, useRouter, useRoute } from 'vue-router';
import {
  LayoutDashboard,
  Bot,
  Shield,
  ChevronLeft,
  ChevronRight,
  User,
  Bell,
  Search,
  LogOut,
} from 'lucide-vue-next';
import type { UserRole } from '@agentops/shared-types';
import { USER_ROLE_LABELS } from '@agentops/shared-types';
import type { RolePermission } from '@agentops/shared-types';
import rolesConfig from '../../../packages/roles-config/src/roles.json';

const router = useRouter();
const route = useRoute();

const sidebarCollapsed = ref(false);
const currentRole = ref<UserRole>('admin');
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null);

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { message, type };
  setTimeout(() => {
    toast.value = null;
  }, 3000);
};

provide('showToast', showToast);
provide('currentRole', currentRole);

const currentPermissions = computed(() => {
  const role = (rolesConfig as RolePermission[]).find((r) => r.role === currentRole.value);
  return role?.permissions || [];
});

const hasPermission = (permission: string) => {
  return currentPermissions.value.includes(permission);
};

provide('hasPermission', hasPermission);

const navItems = [
  { path: '/', label: '任务看板', icon: LayoutDashboard, permission: 'task:view' },
  { path: '/agents', label: 'Agent 管理', icon: Bot, permission: 'agent:view' },
];

const visibleNavItems = computed(() => {
  return navItems.filter((item) => hasPermission(item.permission));
});

const roles: UserRole[] = ['admin', 'operator', 'viewer'];

const isActive = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <div class="h-screen w-screen flex bg-slate-900 text-slate-200 overflow-hidden">
    <aside
      class="flex flex-col bg-slate-850 border-r border-slate-700 transition-all duration-300"
      :class="sidebarCollapsed ? 'w-16' : 'w-60'"
    >
      <div class="h-14 flex items-center border-b border-slate-700 px-4">
        <div class="flex items-center gap-2 overflow-hidden">
          <div class="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Bot class="w-5 h-5 text-white" />
          </div>
          <span
            v-if="!sidebarCollapsed"
            class="font-bold text-lg gradient-text whitespace-nowrap"
          >
            AgentOps
          </span>
        </div>
      </div>

      <nav class="flex-1 py-4 px-2 space-y-1">
        <button
          v-for="item in visibleNavItems"
          :key="item.path"
          @click="navigateTo(item.path)"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200"
          :class="[
            isActive(item.path)
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
          ]"
          :title="sidebarCollapsed ? item.label : ''"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!sidebarCollapsed" class="text-sm font-medium">{{ item.label }}</span>
        </button>
      </nav>

      <div class="border-t border-slate-700 p-2">
        <button
          @click="toggleSidebar"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft v-if="!sidebarCollapsed" class="w-5 h-5" />
          <ChevronRight v-else class="w-5 h-5" />
          <span v-if="!sidebarCollapsed" class="text-sm">收起菜单</span>
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="h-14 bg-slate-850 border-b border-slate-700 flex items-center justify-between px-6">
        <div class="flex items-center gap-4">
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="搜索任务、Agent..."
              class="pl-9 pr-4 py-1.5 w-64 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 bg-slate-800 rounded-md px-3 py-1.5 border border-slate-700">
            <Shield class="w-4 h-4 text-cyan-400" />
            <span class="text-xs text-slate-400">当前角色:</span>
            <select
              v-model="currentRole"
              class="bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              <option v-for="role in roles" :key="role" :value="role" class="bg-slate-800">
                {{ USER_ROLE_LABELS[role] }}
              </option>
            </select>
          </div>

          <button class="relative p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            <Bell class="w-5 h-5" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
          </button>

          <div class="flex items-center gap-2 pl-3 border-l border-slate-700">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <User class="w-4 h-4 text-white" />
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-medium text-slate-200">管理员</span>
              <span class="text-xs text-slate-500">admin@agentops.io</span>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-auto">
        <RouterView />
      </main>
    </div>

    <Transition name="fade">
      <div v-if="toast" :class="toast.type === 'error' ? 'toast-error' : 'toast-success'">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
