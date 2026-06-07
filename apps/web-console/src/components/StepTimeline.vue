<script setup lang="ts">
import { ref } from 'vue';
import {
  CheckCircle2,
  Loader2,
  Circle,
  XCircle,
  SkipForward,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertTriangle,
} from 'lucide-vue-next';
import type { TaskStep } from '@agentops/shared-types';

defineProps<{
  steps: TaskStep[];
}>();

const expandedErrors = ref<Set<string>>(new Set());

const toggleError = (stepId: string) => {
  if (expandedErrors.value.has(stepId)) {
    expandedErrors.value.delete(stepId);
  } else {
    expandedErrors.value.add(stepId);
  }
};

const formatDuration = (ms?: number) => {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

const getStepIcon = (status: TaskStep['status']) => {
  const map = {
    pending: Circle,
    running: Loader2,
    completed: CheckCircle2,
    error: XCircle,
    skipped: SkipForward,
  };
  return map[status];
};

const getStepColor = (status: TaskStep['status']) => {
  const map = {
    pending: 'text-slate-500',
    running: 'text-amber-400',
    completed: 'text-green-400',
    error: 'text-red-400',
    skipped: 'text-slate-500',
  };
  return map[status];
};

const getLineColor = (status: TaskStep['status']) => {
  const map = {
    pending: 'bg-slate-700',
    running: 'bg-amber-500/50',
    completed: 'bg-green-500/50',
    error: 'bg-red-500/50',
    skipped: 'bg-slate-700',
  };
  return map[status];
};
</script>

<template>
  <div class="space-y-1">
    <div
      v-for="(step, index) in steps"
      :key="step.id"
      class="relative pl-8 pb-4"
    >
      <div
        v-if="index < steps.length - 1"
        class="absolute left-[11px] top-6 w-0.5 h-full"
        :class="getLineColor(step.status)"
      />

      <div class="absolute left-0 top-0.5">
        <component
          :is="getStepIcon(step.status)"
          class="w-6 h-6"
          :class="[getStepColor(step.status), step.status === 'running' ? 'animate-spin' : '']"
        />
      </div>

      <div
        class="p-3 rounded-lg transition-colors"
        :class="[
          step.status === 'running' ? 'bg-amber-500/5 border border-amber-500/20' : '',
          step.status === 'error' ? 'bg-red-500/5 border border-red-500/20' : '',
          step.status !== 'running' && step.status !== 'error' ? 'bg-slate-800/30' : '',
        ]"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium text-slate-200 text-sm">{{ step.name }}</span>
              <span
                v-if="step.status === 'error'"
                @click="toggleError(step.id)"
                class="cursor-pointer p-0.5 rounded hover:bg-red-500/10 transition-colors"
              >
                <ChevronDown v-if="expandedErrors.has(step.id)" class="w-4 h-4 text-red-400" />
                <ChevronRight v-else class="w-4 h-4 text-red-400" />
              </span>
            </div>
            <div v-if="step.durationMs" class="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <Clock class="w-3 h-3" />
              <span>耗时: {{ formatDuration(step.durationMs) }}</span>
            </div>
          </div>
        </div>

        <Transition name="slide">
          <div
            v-if="step.status === 'error' && step.errorMessage && expandedErrors.has(step.id)"
            class="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-md animate-fade-in"
          >
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <p class="text-xs font-medium text-red-400 mb-1">错误详情</p>
                <p class="text-xs text-red-300 font-mono leading-relaxed">{{ step.errorMessage }}</p>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
