<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Clock, User, Flag, AlertTriangle } from 'lucide-vue-next';
import type { Task } from '@agentops/shared-types';
import { TASK_PRIORITY_LABELS } from '@agentops/shared-types';
import StatusBadge from './StatusBadge.vue';

const props = defineProps<{
  task: Task;
}>();

const router = useRouter();

const priorityConfig = computed(() => {
  const map = {
    low: { color: 'text-slate-400', bg: 'bg-slate-700' },
    medium: { color: 'text-blue-400', bg: 'bg-blue-500/20' },
    high: { color: 'text-amber-400', bg: 'bg-amber-500/20' },
    critical: { color: 'text-red-400', bg: 'bg-red-500/20' },
  };
  return map[props.task.priority];
});

const formatTime = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  return `${days} 天前`;
};

const goToDetail = () => {
  router.push(`/task/${props.task.id}`);
};
</script>

<template>
  <div
    @click="goToDetail"
    class="card p-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"
    :class="[task.status === 'running' ? 'border-amber-500/40' : '']"
    :style="task.status === 'running' ? 'box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.3);' : ''"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-slate-200 truncate group-hover:text-cyan-400 transition-colors">
          {{ task.name }}
        </h3>
        <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">{{ task.description }}</p>
      </div>
      <StatusBadge :status="task.status" size="sm" class="ml-2 flex-shrink-0" />
    </div>

    <div v-if="task.progress > 0" class="mb-3">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-slate-500">进度</span>
        <span class="text-xs font-medium text-slate-400">{{ task.progress }}%</span>
      </div>
      <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="[
            task.status === 'error' ? 'bg-red-500' : '',
            task.status === 'completed' ? 'bg-green-500' : '',
            task.status === 'running' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : '',
            task.status === 'pending' || task.status === 'stopped' ? 'bg-slate-500' : '',
          ]"
          :style="{ width: `${task.progress}%` }"
        />
      </div>
    </div>

    <div v-if="task.status === 'error' && task.errorMessage" class="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
      <div class="flex items-start gap-1.5">
        <AlertTriangle class="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
        <span class="text-xs text-red-400 line-clamp-2">{{ task.errorMessage }}</span>
      </div>
    </div>

    <div class="flex items-center gap-3 text-xs text-slate-500">
      <span class="inline-flex items-center gap-1">
        <User class="w-3.5 h-3.5" />
        {{ task.assignee }}
      </span>
      <span class="inline-flex items-center gap-1" :class="priorityConfig.color">
        <Flag class="w-3.5 h-3.5" />
        {{ TASK_PRIORITY_LABELS[task.priority] }}
      </span>
      <span class="inline-flex items-center gap-1 ml-auto">
        <Clock class="w-3.5 h-3.5" />
        {{ formatTime(task.updatedAt) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
