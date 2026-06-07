<script setup lang="ts">
import { computed } from 'vue';
import { Cpu, HardDrive, Activity, Clock, Tag } from 'lucide-vue-next';
import type { Agent } from '@agentops/shared-types';
import { AGENT_STATUS_LABELS } from '@agentops/shared-types';

const props = defineProps<{
  agent: Agent;
}>();

const statusConfig = computed(() => {
  const map = {
    online: { color: 'text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-400' },
    offline: { color: 'text-slate-500', bg: 'bg-slate-500/10', dot: 'bg-slate-500' },
    busy: { color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
    idle: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', dot: 'bg-cyan-400' },
  };
  return map[props.agent.status];
});

const formatHeartbeat = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (seconds < 60) return `${seconds} 秒前`;
  if (minutes < 60) return `${minutes} 分钟前`;
  return `${hours} 小时前`;
};

const getUsageColor = (value: number) => {
  if (value >= 80) return 'text-red-400';
  if (value >= 60) return 'text-amber-400';
  return 'text-green-400';
};
</script>

<template>
  <tr class="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
    <td class="px-4 py-3">
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
            <Activity class="w-4 h-4 text-cyan-400" />
          </div>
          <span
            class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800"
            :class="statusConfig.dot"
          />
        </div>
        <div>
          <div class="font-medium text-slate-200 text-sm">{{ agent.name }}</div>
          <div class="text-xs text-slate-500">{{ agent.role }}</div>
        </div>
      </div>
    </td>
    <td class="px-4 py-3">
      <span
        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
        :class="[statusConfig.bg, statusConfig.color]"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="statusConfig.dot" />
        {{ AGENT_STATUS_LABELS[agent.status] }}
      </span>
    </td>
    <td class="px-4 py-3">
      <div class="flex items-center gap-2">
        <Cpu class="w-3.5 h-3.5 text-slate-500" />
        <div class="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="[
              agent.cpuUsage >= 80 ? 'bg-red-500' : '',
              agent.cpuUsage >= 60 && agent.cpuUsage < 80 ? 'bg-amber-500' : '',
              agent.cpuUsage < 60 ? 'bg-green-500' : '',
            ]"
            :style="{ width: `${agent.cpuUsage}%` }"
          />
        </div>
        <span class="text-xs font-mono w-10" :class="getUsageColor(agent.cpuUsage)">
          {{ agent.cpuUsage }}%
        </span>
      </div>
    </td>
    <td class="px-4 py-3">
      <div class="flex items-center gap-2">
        <HardDrive class="w-3.5 h-3.5 text-slate-500" />
        <div class="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="[
              agent.memoryUsage >= 80 ? 'bg-red-500' : '',
              agent.memoryUsage >= 60 && agent.memoryUsage < 80 ? 'bg-amber-500' : '',
              agent.memoryUsage < 60 ? 'bg-blue-500' : '',
            ]"
            :style="{ width: `${agent.memoryUsage}%` }"
          />
        </div>
        <span class="text-xs font-mono w-10" :class="getUsageColor(agent.memoryUsage)">
          {{ agent.memoryUsage }}%
        </span>
      </div>
    </td>
    <td class="px-4 py-3">
      <div class="flex flex-wrap gap-1 max-w-[200px]">
        <span
          v-for="cap in agent.capabilities"
          :key="cap"
          class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-400"
        >
          <Tag class="w-2.5 h-2.5" />
          {{ cap }}
        </span>
      </div>
    </td>
    <td class="px-4 py-3">
      <div class="flex items-center gap-1.5 text-xs text-slate-500">
        <Clock class="w-3.5 h-3.5" />
        {{ formatHeartbeat(agent.lastHeartbeat) }}
      </div>
    </td>
  </tr>
</template>
