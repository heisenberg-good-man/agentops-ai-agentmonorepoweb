<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { Filter, Download, RefreshCw, Terminal } from 'lucide-vue-next';
import type { LogEntry, LogLevel } from '@agentops/shared-types';

const props = defineProps<{
  logs: LogEntry[];
}>();

const logContainer = ref<HTMLElement | null>(null);
const autoScroll = ref(true);
const activeFilters = ref<Set<LogLevel>>(new Set(['INFO', 'WARN', 'ERROR', 'DEBUG']));

const levels: LogLevel[] = ['INFO', 'WARN', 'ERROR', 'DEBUG'];

const levelColors: Record<LogLevel, string> = {
  INFO: 'text-cyan-400',
  WARN: 'text-amber-400',
  ERROR: 'text-red-400',
  DEBUG: 'text-slate-400',
};

const levelBgColors: Record<LogLevel, string> = {
  INFO: 'bg-cyan-500/10',
  WARN: 'bg-amber-500/10',
  ERROR: 'bg-red-500/10',
  DEBUG: 'bg-slate-500/10',
};

const filteredLogs = computed(() => {
  return props.logs.filter((log) => activeFilters.value.has(log.level));
});

const toggleFilter = (level: LogLevel) => {
  if (activeFilters.value.has(level)) {
    activeFilters.value.delete(level);
  } else {
    activeFilters.value.add(level);
  }
};

const formatTimestamp = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (logContainer.value && autoScroll.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

watch(
  () => props.logs.length,
  () => {
    scrollToBottom();
  }
);

onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <div class="card overflow-hidden flex flex-col h-full">
    <div class="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
      <div class="flex items-center gap-2">
        <Terminal class="w-4 h-4 text-cyan-400" />
        <span class="font-medium text-slate-200 text-sm">执行日志</span>
        <span class="text-xs text-slate-500">({{ filteredLogs.length }} 条)</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1">
          <Filter class="w-3.5 h-3.5 text-slate-500 mr-1" />
          <button
            v-for="level in levels"
            :key="level"
            @click="toggleFilter(level)"
            class="px-2 py-0.5 text-xs rounded transition-colors"
            :class="[
              activeFilters.has(level)
                ? `${levelBgColors[level]} ${levelColors[level]} border border-current/30`
                : 'text-slate-600 hover:text-slate-400',
            ]"
          >
            {{ level }}
          </button>
        </div>
        <button class="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">
          <RefreshCw class="w-4 h-4" />
        </button>
        <button class="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">
          <Download class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div
      ref="logContainer"
      class="flex-1 overflow-y-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed"
      @scroll="autoScroll = logContainer!.scrollTop + logContainer!.clientHeight >= logContainer!.scrollHeight - 10"
    >
      <div v-if="filteredLogs.length === 0" class="flex flex-col items-center justify-center h-full text-slate-600">
        <Terminal class="w-10 h-10 mb-2 opacity-50" />
        <span>暂无日志记录</span>
      </div>
      <div
        v-for="(log, index) in filteredLogs"
        :key="log.id"
        class="flex items-start gap-3 py-0.5 hover:bg-slate-900/50 px-1 rounded"
      >
        <span class="text-slate-600 select-none w-10 text-right flex-shrink-0">
          {{ String(index + 1).padStart(3, '0') }}
        </span>
        <span class="text-slate-500 flex-shrink-0">
          {{ formatTimestamp(log.timestamp) }}
        </span>
        <span
          class="font-medium flex-shrink-0 w-14"
          :class="levelColors[log.level]"
        >
          [{{ log.level }}]
        </span>
        <span class="text-slate-300 break-all flex-1">{{ log.message }}</span>
      </div>
    </div>

    <div class="px-4 py-2 border-t border-slate-700 bg-slate-800/30 flex items-center justify-between text-xs">
      <span class="text-slate-500">自动滚动</span>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="autoScroll" class="accent-cyan-500" />
        <span class="text-slate-400">{{ autoScroll ? '已启用' : '已禁用' }}</span>
      </label>
    </div>
  </div>
</template>
