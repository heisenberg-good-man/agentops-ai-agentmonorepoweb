<script setup lang="ts">
import type { Task } from '@agentops/shared-types';
import TaskCard from './TaskCard.vue';

defineProps<{
  title: string;
  tasks: Task[];
  accentColor?: string;
}>();
</script>

<template>
  <div class="flex-1 min-w-[280px] flex flex-col bg-slate-800/30 rounded-lg border border-slate-700/50">
    <div class="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div
          class="w-2 h-2 rounded-full"
          :class="accentColor || 'bg-slate-500'"
        />
        <h3 class="font-medium text-slate-200 text-sm">{{ title }}</h3>
      </div>
      <span class="px-2 py-0.5 text-xs rounded-md bg-slate-700/50 text-slate-400 font-medium">
        {{ tasks.length }}
      </span>
    </div>
    <div class="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px]">
      <TransitionGroup name="list">
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          class="animate-slide-in"
        />
      </TransitionGroup>
      <div v-if="tasks.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-600">
        <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span class="text-sm">暂无任务</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
.list-move {
  transition: transform 0.3s ease;
}
</style>
