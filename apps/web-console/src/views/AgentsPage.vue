<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue';
import { Bot, Shield, Loader2, Check, X } from 'lucide-vue-next';
import { ALL_PERMISSIONS, USER_ROLE_LABELS } from '@agentops/shared-types';
import type { UserRole } from '@agentops/shared-types';
import { useAgents } from '@/composables/useAgents';
import { useRoles } from '@/composables/useRoles';
import AgentRow from '@/components/AgentRow.vue';

type HasPermissionFn = (permission: string) => boolean;

const hasPermission = inject<HasPermissionFn>('hasPermission');
const { agents, loading: agentsLoading, fetchAgents } = useAgents();
const { roles, loading: rolesLoading, fetchRoles, handleUpdateRole } = useRoles();

const activeTab = ref<'agents' | 'roles'>('agents');
const savingRole = ref<UserRole | null>(null);

const canManageRoles = computed(() => hasPermission?.('role:manage'));

const hasRolePermission = (role: UserRole, permission: string) => {
  const roleConfig = roles.value.find((r) => r.role === role);
  return roleConfig?.permissions.includes(permission) || false;
};

const togglePermission = async (role: UserRole, permission: string) => {
  if (!canManageRoles.value) return;
  const roleConfig = roles.value.find((r) => r.role === role);
  if (!roleConfig) return;

  let newPermissions: string[];
  if (roleConfig.permissions.includes(permission)) {
    newPermissions = roleConfig.permissions.filter((p) => p !== permission);
  } else {
    newPermissions = [...roleConfig.permissions, permission];
  }

  savingRole.value = role;
  try {
    await handleUpdateRole(role, { permissions: newPermissions });
  } finally {
    savingRole.value = null;
  }
};

onMounted(() => {
  fetchAgents();
  fetchRoles();
});
</script>

<template>
  <div class="h-full flex flex-col p-6 overflow-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <Bot class="w-5 h-5 text-cyan-400" />
          <h1 class="text-xl font-bold text-slate-100">Agent 与权限管理</h1>
        </div>
        <p class="text-sm text-slate-500">管理 Agent 节点和角色权限配置</p>
      </div>
    </div>

    <div class="flex gap-1 p-1 bg-slate-800/50 rounded-lg w-fit mb-6">
      <button
        @click="activeTab = 'agents'"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
        :class="activeTab === 'agents' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
      >
        <Bot class="w-4 h-4" />
        Agent 列表
      </button>
      <button
        v-if="hasPermission?.('role:view')"
        @click="activeTab = 'roles'"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
        :class="activeTab === 'roles' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
      >
        <Shield class="w-4 h-4" />
        角色权限
      </button>
    </div>

    <template v-if="activeTab === 'agents'">
      <div v-if="agentsLoading" class="flex-1 flex items-center justify-center">
        <Loader2 class="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
      <div v-else class="card overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-700 bg-slate-800/50">
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Agent</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">CPU</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">内存</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">能力标签</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">心跳</th>
            </tr>
          </thead>
          <tbody>
            <AgentRow v-for="agent in agents" :key="agent.id" :agent="agent" />
          </tbody>
        </table>
        <div v-if="agents.length === 0" class="py-12 text-center text-slate-500">
          暂无 Agent 数据
        </div>
      </div>
    </template>

    <template v-else-if="activeTab === 'roles'">
      <div v-if="rolesLoading" class="flex-1 flex items-center justify-center">
        <Loader2 class="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="role in roles"
          :key="role.role"
          class="card overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-slate-700 bg-slate-800/30 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                <Shield class="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-100">
                  {{ USER_ROLE_LABELS[role.role as UserRole] }}
                  <span class="text-xs text-slate-500 font-normal ml-2">{{ role.role }}</span>
                </h3>
                <p class="text-sm text-slate-500">{{ role.description }}</p>
              </div>
            </div>
            <div v-if="savingRole === role.role" class="flex items-center gap-2 text-sm text-cyan-400">
              <Loader2 class="w-4 h-4 animate-spin" />
              保存中...
            </div>
          </div>
          <div class="p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                v-for="perm in ALL_PERMISSIONS"
                :key="perm.key"
                class="flex items-start gap-3 p-3 rounded-lg border transition-colors"
                :class="[
                  hasRolePermission(role.role as UserRole, perm.key)
                    ? 'bg-cyan-500/5 border-cyan-500/20'
                    : 'bg-slate-800/30 border-slate-700',
                  canManageRoles ? 'cursor-pointer hover:border-cyan-500/40' : 'opacity-80',
                ]"
                @click="togglePermission(role.role as UserRole, perm.key)"
              >
                <div
                  class="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                  :class="[
                    hasRolePermission(role.role as UserRole, perm.key)
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                      : 'bg-slate-700 border border-slate-600',
                  ]"
                >
                  <Check
                    v-if="hasRolePermission(role.role as UserRole, perm.key)"
                    class="w-3 h-3 text-white"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-slate-200">{{ perm.name }}</div>
                  <div class="text-xs text-slate-500 mt-0.5">{{ perm.description }}</div>
                  <div class="text-xs text-slate-600 font-mono mt-1">{{ perm.key }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
