<script setup lang="ts">
import { computed } from 'vue';
import {
  CheckCircle2,
  Loader2,
  Circle,
  XCircle,
  PauseCircle,
  SkipForward,
} from 'lucide-vue-next';

type StatusType = 'pending' | 'running' | 'completed' | 'error' | 'stopped' | 'skipped';

const props = defineProps<{
  status: StatusType;
  size?: 'sm' | 'md';
}>();

const config = computed(() => {
  const map: Record<StatusType, { bg: string; text: string; border: string; icon: unknown; label: string; pulse?: boolean }> = {
    pending: {
      bg: 'bg-slate-700/50',
      text: 'text-slate-400',
      border: 'border-slate-600',
      icon: Circle,
      label: '待执行',
    },
    running: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: Loader2,
      label: '运行中',
      pulse: true,
    },
    completed: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/30',
      icon: CheckCircle2,
      label: '已完成',
    },
    error: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      icon: XCircle,
      label: '异常',
    },
    stopped: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      icon: PauseCircle,
      label: '已停止',
    },
    skipped: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-500',
      border: 'border-slate-600',
      icon: SkipForward,
      label: '已跳过',
    },
  };
  return map[props.status];
});

const sizeClass = computed(() => (props.size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-xs gap-1.5'));
const iconSize = computed(() => (props.size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'));
</script>

<template>
  <span
    class="inline-flex items-center rounded-md border font-medium transition-all"
    :class="[config.bg, config.text, config.border, sizeClass, config.pulse ? 'animate-pulse-glow' : '']"
  >
    <component :is="config.icon" :class="[iconSize, status === 'running' ? 'animate-spin' : '']" />
    {{ config.label }}
  </span>
</template>
