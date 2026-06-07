<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue';
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
} from 'lucide-vue-next';
import type { Task } from '@agentops/shared-types';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@agentops/shared-types';
import { useTasks } from '@/composables/useTasks';
import StatusBadge from '@/components/StatusBadge.vue';
import StepTimeline from '@/components/StepTimeline.vue';
import LogPanel from '@/components/LogPanel.vue';

type HasPermissionFn = (permission: string) => boolean;

const route = useRoute();
const router = useRouter();
const hasPermission = inject<HasPermissionFn>('hasPermission');

const { task, logs, loading, fetchTask, fetchTaskLogs, handleStartTask, handleStopTask, handleRetryTask } = useTasks();

const actionLoading = ref<'start' | 'stop' | 'retry' | null>(null);

const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const goBack = () => {
  router.push('/');
};

const startTask = async () => {
  if (!task.value) return;
  actionLoading.value = 'start';
  try {
    await handleStartTask(task.value.id);
  } finally {
    actionLoading.value = null;
  }
};

const stopTask = async () => {
  if (!task.value) return;
  actionLoading.value = 'stop';
  try {
    await handleStopTask(task.value.id);
  } finally {
    actionLoading.value = null;
  }
};

const retryTask = async () => {
  if (!task.value) return;
  actionLoading.value = 'retry';
  try {
    await handleRetryTask(task.value.id);
    await fetchTaskLogs(task.value.id);
  } finally {
    actionLoading.value = null;
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

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div class="card p-5 flex flex-col min-h-[400px]">
          <h3 class="text-sm font-medium text-slate-400 mb-4">执行步骤</h3>
          <div class="flex-1 overflow-y-auto pr-2">
            <StepTimeline :steps="task.steps" />
          </div>
        </div>
        <div class="min-h-[400px]">
          <LogPanel :logs="logs" />
        </div>
      </div>
    </template>
  </div>
</template>
