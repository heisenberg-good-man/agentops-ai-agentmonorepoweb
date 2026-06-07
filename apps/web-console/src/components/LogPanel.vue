<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, inject } from 'vue';
import { Filter, Download, RefreshCw, Terminal, Copy, Check, AlertCircle } from 'lucide-vue-next';
import type { LogEntry, LogLevel } from '@agentops/shared-types';

type ShowToastFn = (message: string, type?: 'success' | 'error') => void;

const props = defineProps<{
  logs: LogEntry[];
  taskId?: string;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const showToast = inject<ShowToastFn>('showToast');

const logContainer = ref<HTMLElement | null>(null);
const autoScroll = ref(true);
const activeFilters = ref<Set<LogLevel>>(new Set(['INFO', 'WARN', 'ERROR', 'DEBUG']));
const refreshing = ref(false);
const copying = ref<string | null>(null);
const copyAllState = ref<'idle' | 'copying' | 'success'>('idle');

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

const formatFullTimestamp = (iso: string) => {
  return new Date(iso).toLocaleString('zh-CN');
};

const scrollToBottom = () => {
  nextTick(() => {
    if (logContainer.value && autoScroll.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

const buildLogText = (logs: LogEntry[]) => {
  return logs
    .map((log, idx) => {
      return `[${String(idx + 1).padStart(3, '0')}] ${formatFullTimestamp(log.timestamp)} [${log.level}] ${log.message}`;
    })
    .join('\n');
};

const handleRefresh = async () => {
  refreshing.value = true;
  try {
    emit('refresh');
    showToast?.('日志已刷新');
  } catch (err) {
    showToast?.(err instanceof Error ? err.message : '刷新日志失败', 'error');
  } finally {
    setTimeout(() => {
      refreshing.value = false;
    }, 500);
  }
};

const handleDownload = () => {
  if (filteredLogs.value.length === 0) {
    showToast?.('没有可下载的日志', 'error');
    return;
  }
  try {
    const content = buildLogText(filteredLogs.value);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTaskId = props.taskId?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'logs';
    a.download = `${safeTaskId}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast?.(`已下载 ${filteredLogs.value.length} 条日志`);
  } catch (err) {
    showToast?.(err instanceof Error ? err.message : '下载日志失败', 'error');
  }
};

const copyToClipboard = async (text: string, key?: string) => {
  try {
    if (key) {
      copying.value = key;
    } else {
      copyAllState.value = 'copying';
    }
    await navigator.clipboard.writeText(text);
    if (key) {
      copying.value = key;
      setTimeout(() => {
        copying.value = null;
      }, 1500);
    } else {
      copyAllState.value = 'success';
      setTimeout(() => {
        copyAllState.value = 'idle';
      }, 1500);
    }
    showToast?.('已复制到剪贴板');
  } catch (err) {
    showToast?.('复制失败，请手动选择复制', 'error');
    if (key) copying.value = null;
    else copyAllState.value = 'idle';
  }
};

const handleCopySingle = (log: LogEntry, index: number) => {
  const text = `[${formatFullTimestamp(log.timestamp)}] [${log.level}] ${log.message}`;
  copyToClipboard(text, log.id + '-' + index);
};

const handleCopyAll = () => {
  if (filteredLogs.value.length === 0) {
    showToast?.('没有可复制的日志', 'error');
    return;
  }
  const content = buildLogText(filteredLogs.value);
  copyToClipboard(content);
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
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1 pr-2 border-r border-slate-700">
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
            :title="activeFilters.has(level) ? `点击隐藏${level}日志` : `点击显示${level}日志`"
          >
            {{ level }}
          </button>
        </div>
        <button
          @click="handleRefresh"
          class="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          :disabled="refreshing"
          title="刷新日志"
        >
          <RefreshCw class="w-4 h-4" :class="refreshing ? 'animate-spin' : ''" />
        </button>
        <button
          @click="handleDownload"
          class="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          title="下载全部日志为 TXT 文件"
        >
          <Download class="w-4 h-4" />
        </button>
        <button
          @click="handleCopyAll"
          class="p-1.5 rounded transition-colors"
          :class="[
            copyAllState === 'success'
              ? 'text-green-400 bg-green-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700',
          ]"
          title="复制全部日志到剪贴板"
        >
          <Check v-if="copyAllState === 'success'" class="w-4 h-4" />
          <Copy v-else class="w-4 h-4" />
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
        <span class="text-xs mt-1 text-slate-700">点击刷新按钮或等待任务产生日志</span>
      </div>
      <div
        v-for="(log, index) in filteredLogs"
        :key="log.id"
        class="group flex items-start gap-3 py-0.5 hover:bg-slate-900/50 px-1 rounded"
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
        <button
          @click="handleCopySingle(log, index)"
          class="opacity-0 group-hover:opacity-100 p-1 rounded transition-all flex-shrink-0"
          :class="[
            copying === log.id + '-' + index
              ? 'text-green-400 bg-green-500/10 opacity-100'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800',
          ]"
          title="复制此条日志"
        >
          <Check v-if="copying === log.id + '-' + index" class="w-3 h-3" />
          <Copy v-else class="w-3 h-3" />
        </button>
      </div>
    </div>

    <div class="px-4 py-2 border-t border-slate-700 bg-slate-800/30 flex items-center justify-between text-xs">
      <div class="flex items-center gap-2 text-slate-500">
        <AlertCircle class="w-3 h-3" />
        <span>共 {{ logs.length }} 条，显示 {{ filteredLogs.length }} 条</span>
      </div>
      <label class="flex items-center gap-2 cursor-pointer">
        <span class="text-slate-500">自动滚动</span>
        <input type="checkbox" v-model="autoScroll" class="accent-cyan-500" />
        <span class="text-slate-400">{{ autoScroll ? '已启用' : '已禁用' }}</span>
      </label>
    </div>
  </div>
</template>
