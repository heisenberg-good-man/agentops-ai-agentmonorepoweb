import { ref, inject } from 'vue';
import type { Agent } from '@agentops/shared-types';
import { getAgents } from '@/api/agents';

type ShowToastFn = (message: string, type?: 'success' | 'error') => void;

export function useAgents() {
  const agents = ref<Agent[]>([]);
  const loading = ref(false);
  const showToast = inject<ShowToastFn>('showToast');

  const fetchAgents = async () => {
    loading.value = true;
    try {
      agents.value = await getAgents();
    } catch (error) {
      showToast?.(error instanceof Error ? error.message : '获取 Agent 列表失败', 'error');
    } finally {
      loading.value = false;
    }
  };

  return {
    agents,
    loading,
    fetchAgents,
  };
}
