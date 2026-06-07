<script setup lang="ts">
import { ref, computed, inject, onMounted, reactive } from 'vue';
import { Bot, Shield, Loader2, Check, X, Edit3, RotateCcw, Save, History, Clock, User, AlertCircle } from 'lucide-vue-next';
import { ALL_PERMISSIONS, USER_ROLE_LABELS } from '@agentops/shared-types';
import type { UserRole } from '@agentops/shared-types';
import { useAgents } from '@/composables/useAgents';
import { useRoles } from '@/composables/useRoles';
import AgentRow from '@/components/AgentRow.vue';

type HasPermissionFn = (permission: string) => boolean;
type ShowToastFn = (message: string, type?: 'success' | 'error') => void;

interface OperationRecord {
  id: string;
  role: UserRole;
  action: string;
  detail: string;
  timestamp: string;
  operator: string;
  status: 'success' | 'failed';
}

interface ConfirmDialog {
  visible: boolean;
  action: 'cancel-edit' | null;
  title: string;
  message: string;
  confirmText: string;
}

const hasPermission = inject<HasPermissionFn>('hasPermission');
const showToast = inject<ShowToastFn>('showToast');
const { agents, loading: agentsLoading, fetchAgents } = useAgents();
const { roles, loading: rolesLoading, fetchRoles, handleUpdateRole } = useRoles();

const activeTab = ref<'agents' | 'roles' | 'records'>('agents');
const savingRole = ref<UserRole | null>(null);
const editMode = ref(false);
const draftPermissions = reactive<Record<UserRole, string[]>>({ admin: [], operator: [], viewer: [] });

const confirmDialog = reactive<ConfirmDialog>({
  visible: false,
  action: null,
  title: '',
  message: '',
  confirmText: '',
});

const operationRecords = ref<OperationRecord[]>([
  {
    id: 'op-init-1',
    role: 'admin',
    action: '系统初始化',
    detail: '加载默认角色权限配置',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    operator: 'system',
    status: 'success',
  },
]);

const canManageRoles = computed(() => hasPermission?.('role:manage'));

const hasRolePermission = (role: UserRole, permission: string) => {
  if (editMode.value) {
    return draftPermissions[role]?.includes(permission) || false;
  }
  const roleConfig = roles.value.find((r) => r.role === role);
  return roleConfig?.permissions.includes(permission) || false;
};

const hasDraftChanges = computed(() => {
  if (!editMode.value) return false;
  return roles.value.some((roleConfig) => {
    const draft = draftPermissions[roleConfig.role] || [];
    const original = roleConfig.permissions;
    if (draft.length !== original.length) return true;
    return draft.some((p) => !original.includes(p));
  });
});

const formatTime = (iso: string) => {
  return new Date(iso).toLocaleString('zh-CN');
};

const enterEditMode = () => {
  if (!canManageRoles.value) return;
  roles.value.forEach((r) => {
    draftPermissions[r.role] = [...r.permissions];
  });
  editMode.value = true;
  operationRecords.value.unshift({
    id: `op-${Date.now()}-edit`,
    role: 'admin',
    action: '进入编辑模式',
    detail: '开始修改角色权限配置',
    timestamp: new Date().toISOString(),
    operator: '当前用户',
    status: 'success',
  });
  showToast?.('已进入编辑模式，修改完成后请点击保存');
};

const closeConfirm = () => {
  confirmDialog.visible = false;
  confirmDialog.action = null;
};

const openCancelConfirm = () => {
  confirmDialog.visible = true;
  confirmDialog.action = 'cancel-edit';
  confirmDialog.title = '确认取消编辑？';
  confirmDialog.message = '未保存的修改将丢失，是否继续？';
  confirmDialog.confirmText = '确认取消';
};

const executeConfirmedCancel = () => {
  closeConfirm();
  editMode.value = false;
  operationRecords.value.unshift({
    id: `op-${Date.now()}-cancel`,
    role: 'admin',
    action: '取消编辑',
    detail: '放弃未保存的角色权限修改',
    timestamp: new Date().toISOString(),
    operator: '当前用户',
    status: 'success',
  });
  showToast?.('已取消编辑');
};

const cancelEditMode = () => {
  if (hasDraftChanges.value) {
    openCancelConfirm();
    return;
  }
  executeConfirmedCancel();
};

const togglePermission = (role: UserRole, permission: string) => {
  if (!editMode.value || !canManageRoles.value) return;
  const current = draftPermissions[role] || [];
  if (current.includes(permission)) {
    draftPermissions[role] = current.filter((p) => p !== permission);
  } else {
    draftPermissions[role] = [...current, permission];
  }
};

const saveAllChanges = async () => {
  if (!canManageRoles.value) return;
  const changedRoles = roles.value.filter((roleConfig) => {
    const draft = draftPermissions[roleConfig.role] || [];
    const original = roleConfig.permissions;
    if (draft.length !== original.length) return true;
    return draft.some((p) => !original.includes(p));
  });

  if (changedRoles.length === 0) {
    showToast?.('没有检测到修改', 'error');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const roleConfig of changedRoles) {
    const role = roleConfig.role;
    const newPermissions = draftPermissions[role] || [];
    const added = newPermissions.filter((p) => !roleConfig.permissions.includes(p));
    const removed = roleConfig.permissions.filter((p) => !newPermissions.includes(p));
    const detailParts: string[] = [];
    if (added.length) detailParts.push(`新增: ${added.join(', ')}`);
    if (removed.length) detailParts.push(`移除: ${removed.join(', ')}`);

    savingRole.value = role;
    try {
      await handleUpdateRole(role, { permissions: newPermissions });
      operationRecords.value.unshift({
        id: `op-${Date.now()}-${role}`,
        role,
        action: '更新权限',
        detail: detailParts.join(' | '),
        timestamp: new Date().toISOString(),
        operator: '当前用户',
        status: 'success',
      });
      successCount++;
    } catch (err) {
      operationRecords.value.unshift({
        id: `op-${Date.now()}-${role}`,
        role,
        action: '更新权限',
        detail: detailParts.join(' | '),
        timestamp: new Date().toISOString(),
        operator: '当前用户',
        status: 'failed',
      });
      failCount++;
    } finally {
      savingRole.value = null;
    }
  }

  editMode.value = false;
  if (failCount === 0) {
    showToast?.(`已保存 ${successCount} 个角色的权限配置`);
  } else {
    showToast?.(`保存完成：成功 ${successCount} 个，失败 ${failCount} 个`, 'error');
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
      <button
        v-if="hasPermission?.('role:view')"
        @click="activeTab = 'records'"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
        :class="activeTab === 'records' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
      >
        <History class="w-4 h-4" />
        操作记录
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
      <div v-else>
        <div class="flex items-center justify-between mb-4">
          <div v-if="editMode" class="text-sm text-amber-400 flex items-center gap-2">
            <Edit3 class="w-4 h-4" />
            编辑模式已启用 — 点击权限项勾选/取消，完成后点击保存
          </div>
          <div v-else class="text-sm text-slate-500">
            提示：点击「编辑」按钮后可修改角色权限配置
          </div>
          <div class="flex items-center gap-2">
            <template v-if="editMode">
              <button
                @click="cancelEditMode"
                class="btn-secondary inline-flex items-center gap-2"
                :disabled="savingRole !== null"
              >
                <RotateCcw class="w-4 h-4" />
                取消
              </button>
              <button
                @click="saveAllChanges"
                class="btn-primary inline-flex items-center gap-2"
                :disabled="savingRole !== null || !hasDraftChanges"
              >
                <Loader2 v-if="savingRole !== null" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                {{ savingRole !== null ? '保存中...' : `保存${hasDraftChanges ? ' (有未保存修改)' : ''}` }}
              </button>
            </template>
            <button
              v-else
              v-if="canManageRoles"
              @click="enterEditMode"
              class="btn-primary inline-flex items-center gap-2"
            >
              <Edit3 class="w-4 h-4" />
              编辑权限
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="role in roles"
            :key="role.role"
            class="card overflow-hidden"
            :class="editMode ? 'ring-1 ring-cyan-500/30' : ''"
          >
            <div class="px-5 py-4 border-b border-slate-700 bg-slate-800/30 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                  <Shield class="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 class="font-semibold text-slate-100">
                    {{ USER_ROLE_LABELS[role.role] }}
                    <span class="text-xs text-slate-500 font-normal ml-2">{{ role.role }}</span>
                  </h3>
                  <p class="text-sm text-slate-500">{{ role.description }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-500">
                  共 {{ (editMode ? draftPermissions[role.role] : role.permissions).length }} 项权限
                </span>
                <div v-if="savingRole === role.role" class="flex items-center gap-2 text-sm text-cyan-400">
                  <Loader2 class="w-4 h-4 animate-spin" />
                  保存中...
                </div>
              </div>
            </div>
            <div class="p-5">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div
                  v-for="perm in ALL_PERMISSIONS"
                  :key="perm.key"
                  class="flex items-start gap-3 p-3 rounded-lg border transition-all"
                  :class="[
                    hasRolePermission(role.role, perm.key)
                      ? 'bg-cyan-500/5 border-cyan-500/20'
                      : 'bg-slate-800/30 border-slate-700',
                    editMode && canManageRoles ? 'cursor-pointer hover:border-cyan-500/40 hover:bg-slate-800/60' : 'opacity-90',
                  ]"
                  @click="togglePermission(role.role, perm.key)"
                >
                  <div
                    class="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                    :class="[
                      hasRolePermission(role.role, perm.key)
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                        : 'bg-slate-700 border border-slate-600',
                    ]"
                  >
                    <Check
                      v-if="hasRolePermission(role.role, perm.key)"
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
      </div>
    </template>

    <template v-else-if="activeTab === 'records'">
      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-700 bg-slate-800/30 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <History class="w-4 h-4 text-cyan-400" />
            <h3 class="font-semibold text-slate-100">操作记录</h3>
            <span class="text-xs text-slate-500">共 {{ operationRecords.length }} 条</span>
          </div>
        </div>
        <div v-if="operationRecords.length === 0" class="py-12 text-center text-slate-500">
          暂无操作记录
        </div>
        <div v-else class="divide-y divide-slate-700">
          <div
            v-for="record in operationRecords"
            :key="record.id"
            class="px-5 py-3 flex items-start gap-4 hover:bg-slate-800/30 transition-colors"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              :class="record.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'"
            >
              <Check v-if="record.status === 'success'" class="w-4 h-4" />
              <X v-else class="w-4 h-4" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-sm text-slate-200">{{ record.action }}</span>
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="[
                    record.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400' :
                    record.role === 'operator' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-slate-500/10 text-slate-400',
                  ]"
                >
                  {{ USER_ROLE_LABELS[record.role] }}
                </span>
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="record.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'"
                >
                  {{ record.status === 'success' ? '成功' : '失败' }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mb-1">{{ record.detail }}</p>
              <div class="flex items-center gap-3 text-xs text-slate-600">
                <span class="inline-flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ formatTime(record.timestamp) }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <User class="w-3 h-3" />
                  {{ record.operator }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="confirmDialog.visible" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeConfirm" />
          <div class="relative card w-full max-w-md mx-4 animate-fade-in">
            <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h3 class="text-lg font-semibold text-slate-100">{{ confirmDialog.title }}</h3>
              <button
                @click="closeConfirm"
                class="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
            <div class="px-5 py-4">
              <div class="flex items-start gap-3">
                <AlertCircle class="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-slate-300 leading-relaxed">{{ confirmDialog.message }}</p>
              </div>
            </div>
            <div class="px-5 py-3 border-t border-slate-700 flex items-center justify-end gap-3">
              <button @click="closeConfirm" class="btn-secondary" :disabled="savingRole !== null">
                继续编辑
              </button>
              <button
                @click="executeConfirmedCancel"
                class="btn-danger inline-flex items-center gap-2"
                :disabled="savingRole !== null"
              >
                {{ confirmDialog.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
