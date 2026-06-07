<script setup lang="ts">
import { ref, computed, inject, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Play,
  Square,
  RotateCcw,
  Flag,
  User,
  Clock,
  Calendar,
  AlertTriangle,
  Loader2,
  FileText,
  Bot,
  History,
  X,
  Check,
  AlertCircle,
} from 'lucide-vue-next';
import type { Task } from '@agentops/shared-types';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@agentops/shared-types';
import { useTasks } from '@/composables/useTasks';
import StatusBadge from '@/components/StatusBadge.vue';
import StepTimeline from '@/components/StepTimeline.vue';
import LogPanel from '@/components/LogPanel.vue';

type HasPermissionFn = (permission: string) => boolean;
type ShowToastFn = (message: string, type?: 'success' | 'error') => void;

interface OperationRecord {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  operator: string;
  status: 'success' | 'failed';
}

interface ConfirmDialog {
  visible: boolean;
  action: 'start' | 'stop' | 'retry' | null;
  title: string;
  message: string;
  confirmText: string;
}

const route = useRoute();
const router = useRouter();
const hasPermission = inject<HasPermissionFn>('hasPermission');
const showToast = inject<ShowToastFn>('showToast');

const { task, logs, loading, fetchTask, fetchTaskLogs, handleStartTask, handleStopTask, handleRetryTask } = useTasks();

const actionLoading = ref<'start' | 'stop' | 'retry' | null>(null);
const activeSubTab = ref<'steps' | 'logs' | 'records'>('steps');

const confirmDialog = reactive<ConfirmDialog>({
  visible: false,
  action: null,
  title: '',
  message: '',
  confirmText: '',
});

const operationRecords = ref<OperationRecord[]>([
  {
    id: 'op-init',
    action: '任务加载',
    detail: '从后端获取任务详情和日志数据',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    operator: 'system',
    status: 'success',
  },
]);

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const addOperationRecord = (action: string, detail: string, status: 'success' | 'failed') => {
  operationRecords.value.unshift({
    id: `op-${Date.now()}`,
    action,
    detail,
    timestamp: new Date().toISOString(),
    operator: '当前用户',
    status,
  });
};

const goBack = () => {
  router.push('/');
};

const openConfirm = (action: 'start' | 'stop' | 'retry') => {
  const configs: Record<string, { title: string; message: string; confirmText: string }> = {
    start: {
      title: '确认启动任务？',
      message: `任务「${task.value?.name}」将开始执行，是否确认？`,
      confirmText: '启动任务',
    },
    stop: {
      title: '确认停止任务？',
      message: `任务「${task.value?.name}」正在运行中，停止后未完成的步骤将被终止，是否确认？`,
      confirmText: '停止任务',
    },
    retry: {
      title: '确认重试任务？',
      message: `任务「${task.value?.name}」将从失败步骤重新执行，错误步骤会被重置，是否确认？`,
      confirmText: '重试任务',
    },
  };
  const cfg = configs[action];
  confirmDialog.visible = true;
  confirmDialog.action = action;
  confirmDialog.title = cfg.title;
  confirmDialog.message = cfg.message;
  confirmDialog.confirmText = cfg.confirmText;
};

const closeConfirm = () => {
  confirmDialog.visible = false;
  confirmDialog.action = null;
};

const executeConfirmedAction = async () => {
  const action = confirmDialog.action;
  if (!action || !task.value) return;
  closeConfirm();

  const actionLabels: Record<string, string> = { start: '启动任务', stop: '停止任务', retry: '重试任务' };
  actionLoading.value = action;

  try {
    if (action === 'start') {
      await handleStartTask(task.value.id);
    } else if (action === 'stop') {
      await handleStopTask(task.value.id);
    } else if (action === 'retry') {
      await handleRetryTask(task.value.id);
      await fetchTaskLogs(task.value.id);
    }
    addOperationRecord(actionLabels[action], `任务ID: ${task.value.id}`, 'success');
  } catch (err) {
    const msg = err instanceof Error ? err.message : '操作失败';
    addOperationRecord(actionLabels[action], `任务ID: ${task.value.id}，错误: ${msg}`, 'failed');
    showToast?.(msg, 'error');
  } finally {
    actionLoading.value = null;
  }
};

const startTask = () => openConfirm('start');
const stopTask = () => openConfirm('stop');
const retryTask = () => openConfirm('retry');

const handleLogsRefresh = async () => {
  if (task.value) {
    await fetchTaskLogs(task.value.id);
    addOperationRecord('刷新日志', `任务ID: ${task.value.id}`, 'success');
  }
};

const canStart = computed(() => task.value?.status === 'pending' || task.value?.status === 'stopped');
const canStop = computed(() => task.value?.status === 'running');
const canRetry = computed(() => task.value?.status === 'error');

const priorityConfig = computed(() => {
  const map: Record<string, { color: string; bg: string }> = {
    low: { color: 'text-slate-400', bg: 'bg-slate-700' },
    medium: { color: 'text-blue-400', bg: 'bg-blue-500/20' },
    high: { color: 'text-amber-400', bg: 'bg-amber-500/20' },
    critical: { color: 'text-red-400', bg: 'bg-red-500/20' },
  };
  return task.value ? map[task.value.priority] : map.medium;
});

onMounted(async () => {
  const taskId = route.params.id as string;
  await fetchTask(taskId);
  await fetchTaskLogs(taskId);
});
</script>

<template>
  <div class="h-full flex flex-col p-6 overflow-auto">
    <div v-if="loading && !task" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-8 h-8 text-cyan-400 animate-spin" />
    </div>

    <template v-else-if="task">
      <div class="flex items-start justify-between mb-6">
        <div>
          <button
            @click="goBack"
            class="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-cyan-400 mb-3 transition-colors"
          >
            <ArrowLeft class="w-4 h-4" />
            返回看板
          </button>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-slate-100">{{ task.name }}</h1>
            <StatusBadge :status="task.status" />
          </div>
          <p class="text-sm text-slate-500 max-w-2xl">{{ task.description }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="hasPermission?.('task:start') && canStart"
            @click="startTask"
            class="btn-primary inline-flex items-center gap-2"
            :disabled="actionLoading !== null"
          >
            <Loader2 v-if="actionLoading === 'start'" class="w-4 h-4 animate-spin" />
            <Play v-else class="w-4 h-4" />
            {{ actionLoading === 'start' ? '启动中...' : '启动任务' }}
          </button>
          <button
            v-if="hasPermission?.('task:stop') && canStop"
            @click="stopTask"
            class="btn-danger inline-flex items-center gap-2"
            :disabled="actionLoading !== null"
          >
            <Loader2 v-if="actionLoading === 'stop'" class="w-4 h-4 animate-spin" />
            <Square v-else class="w-4 h-4" />
            {{ actionLoading === 'stop' ? '停止中...' : '停止任务' }}
          </button>
          <button
            v-if="hasPermission?.('task:retry') && canRetry"
            @click="retryTask"
            class="btn-primary inline-flex items-center gap-2"
            :disabled="actionLoading !== null"
          >
            <Loader2 v-if="actionLoading === 'retry'" class="w-4 h-4 animate-spin" />
            <RotateCcw v-else class="w-4 h-4" />
            {{ actionLoading === 'retry' ? '重试中...' : '重试任务' }}
          </button>
        </div>
      </div>

      <div v-if="task.errorMessage" class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p class="font-medium text-red-400 mb-1">任务执行失败</p>
            <p class="text-sm text-red-300 font-mono">{{ task.errorMessage }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="card p-5">
          <h3 class="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
            <FileText class="w-4 h-4" />
            任务信息
          </h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">任务ID</span>
              <span class="text-slate-300 font-mono">{{ task.id }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">状态</span>
              <span class="text-slate-300">{{ TASK_STATUS_LABELS[task.status] }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 flex items-center gap-1">
                <Flag class="w-3.5 h-3.5" />
                优先级
              </span>
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="[priorityConfig.color, priorityConfig.bg]"
              >
                {{ TASK_PRIORITY_LABELS[task.priority] }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 flex items-center gap-1">
                <User class="w-3.5 h-3.5" />
                负责人
              </span>
              <span class="text-slate-300">{{ task.assignee }}</span>
            </div>
            <div v-if="task.agentId" class="flex items-center justify-between">
              <span class="text-slate-500 flex items-center gap-1">
                <Bot class="w-3.5 h-3.5" />
                执行 Agent
              </span>
              <span class="text-slate-300 font-mono text-xs">{{ task.agentId }}</span>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
            <Calendar class="w-4 h-4" />
            时间信息
          </h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate-500 flex items-center gap-1">
                <Clock class="w-3.5 h-3.5" />
                创建时间
              </span>
              <span class="text-slate-300">{{ formatDateTime(task.createdAt) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 flex items-center gap-1">
                <Clock class="w-3.5 h-3.5" />
                开始时间
              </span>
              <span class="text-slate-300">{{ formatDateTime(task.startedAt) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 flex items-center gap-1">
                <Clock class="w-3.5 h-3.5" />
                结束时间
              </span>
              <span class="text-slate-300">{{ formatDateTime(task.completedAt) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 flex items-center gap-1">
                <Clock class="w-3.5 h-3.5" />
                更新时间
              </span>
              <span class="text-slate-300">{{ formatDateTime(task.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-medium text-slate-400 mb-4">执行进度</h3>
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm text-slate-500">总进度</span>
            <span class="text-lg font-bold gradient-text">{{ task.progress }}%</span>
          </div>
          <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="[
                task.status === 'error' ? 'bg-red-500' : '',
                task.status === 'completed' ? 'bg-green-500' : '',
                task.status === 'running' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : '',
                task.status === 'pending' || task.status === 'stopped' ? 'bg-slate-500' : '',
              ]"
              :style="{ width: `${task.progress}%` }"
            />
          </div>
          <div class="mt-4 grid grid-cols-3 gap-2 text-center">
            <div class="p-2 bg-slate-800/50 rounded">
              <div class="text-lg font-bold text-green-400">
                {{ task.steps.filter((s) => s.status === 'completed').length }}
              </div>
              <div class="text-xs text-slate-500">已完成</div>
            </div>
            <div class="p-2 bg-slate-800/50 rounded">
              <div class="text-lg font-bold text-amber-400">
                {{ task.steps.filter((s) => s.status === 'running').length }}
              </div>
              <div class="text-xs text-slate-500">执行中</div>
            </div>
            <div class="p-2 bg-slate-800/50 rounded">
              <div class="text-lg font-bold text-slate-400">
                {{ task.steps.filter((s) => s.status === 'pending' || s.status === 'skipped' || s.status === 'error').length }}
              </div>
              <div class="text-xs text-slate-500">待处理</div>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-4 flex gap-1 p-1 bg-slate-800/50 rounded-lg w-fit">
        <button
          @click="activeSubTab = 'steps'"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
          :class="activeSubTab === 'steps' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
        >
          <FileText class="w-4 h-4" />
          执行步骤
        </button>
        <button
          @click="activeSubTab = 'logs'"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
          :class="activeSubTab === 'logs' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
        >
          <AlertCircle class="w-4 h-4" />
          执行日志
          <span class="text-xs px-1.5 py-0.5 rounded bg-slate-600 text-slate-300">{{ logs.length }}</span>
        </button>
        <button
          @click="activeSubTab = 'records'"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
          :class="activeSubTab === 'records' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
        >
          <History class="w-4 h-4" />
          操作记录
          <span class="text-xs px-1.5 py-0.5 rounded bg-slate-600 text-slate-300">{{ operationRecords.length }}</span>
        </button>
      </div>

      <div class="flex-1 min-h-[400px]">
        <div v-show="activeSubTab === 'steps'" class="card p-5 h-full flex flex-col">
          <h3 class="text-sm font-medium text-slate-400 mb-4">执行步骤时间线</h3>
          <div class="flex-1 overflow-y-auto pr-2">
            <StepTimeline :steps="task.steps" />
          </div>
        </div>

        <div v-show="activeSubTab === 'logs'" class="h-full min-h-[400px]">
          <LogPanel :logs="logs" :task-id="task.id" @refresh="handleLogsRefresh" />
        </div>

        <div v-show="activeSubTab === 'records'" class="card overflow-hidden h-full">
          <div class="px-5 py-4 border-b border-slate-700 bg-slate-800/30 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <History class="w-4 h-4 text-cyan-400" />
              <h3 class="font-semibold text-slate-100">操作记录</h3>
              <span class="text-xs text-slate-500">共 {{ operationRecords.length }} 条可复查记录</span>
            </div>
          </div>
          <div v-if="operationRecords.length === 0" class="py-12 text-center text-slate-500">
            暂无操作记录
          </div>
          <div v-else class="divide-y divide-slate-700 max-h-[400px] overflow-y-auto">
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
                    :class="record.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'"
                  >
                    {{ record.status === 'success' ? '成功' : '失败' }}
                  </span>
                </div>
                <p class="text-xs text-slate-400 mb-1">{{ record.detail }}</p>
                <div class="flex items-center gap-3 text-xs text-slate-600">
                  <span class="inline-flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    {{ formatDateTime(record.timestamp) }}
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
              <button @click="closeConfirm" class="btn-secondary" :disabled="actionLoading !== null">
                取消
              </button>
              <button
                @click="executeConfirmedAction"
                class="btn-primary inline-flex items-center gap-2"
                :disabled="actionLoading !== null"
              >
                <Loader2 v-if="actionLoading !== null" class="w-4 h-4 animate-spin" />
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
