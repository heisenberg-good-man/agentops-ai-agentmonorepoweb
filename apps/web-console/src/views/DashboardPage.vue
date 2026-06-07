<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue';
import { Plus, X, LayoutDashboard, Loader2 } from 'lucide-vue-next';
import type { TaskPriority, CreateTaskRequest } from '@agentops/shared-types';
import { TASK_PRIORITY_LABELS } from '@agentops/shared-types';
import { useTasks } from '@/composables/useTasks';
import TaskColumn from '@/components/TaskColumn.vue';

type HasPermissionFn = (permission: string) => boolean;

const { tasks, loading, fetchTasks, handleCreateTask } = useTasks();
const hasPermission = inject<HasPermissionFn>('hasPermission');

const showModal = ref(false);
const submitting = ref(false);
const formData = ref<CreateTaskRequest>({
  name: '',
  description: '',
  priority: 'medium',
});

const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

const pendingTasks = computed(() => tasks.value.filter((t) => t.status === 'pending'));
const runningTasks = computed(() => tasks.value.filter((t) => t.status === 'running'));
const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'completed'));
const errorTasks = computed(() => tasks.value.filter((t) => t.status === 'error' || t.status === 'stopped'));

const openModal = () => {
  showModal.value = true;
  formData.value = { name: '', description: '', priority: 'medium' };
};

const closeModal = () => {
  showModal.value = false;
};

const submitForm = async () => {
  if (!formData.value.name.trim()) return;
  submitting.value = true;
  try {
    await handleCreateTask(formData.value);
    closeModal();
  } catch {
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchTasks();
});
</script>

<template>
  <div class="h-full flex flex-col p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <LayoutDashboard class="w-5 h-5 text-cyan-400" />
          <h1 class="text-xl font-bold text-slate-100">任务看板</h1>
        </div>
        <p class="text-sm text-slate-500">实时监控所有任务的执行状态</p>
      </div>
      <button
        v-if="hasPermission?.('task:create')"
        @click="openModal"
        class="btn-primary inline-flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        新建任务
      </button>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-8 h-8 text-cyan-400 animate-spin" />
    </div>

    <div v-else class="flex-1 flex gap-4 min-h-0 overflow-x-auto">
      <TaskColumn title="待执行" :tasks="pendingTasks" accent-color="bg-slate-400" />
      <TaskColumn title="运行中" :tasks="runningTasks" accent-color="bg-amber-400" />
      <TaskColumn title="已完成" :tasks="completedTasks" accent-color="bg-green-400" />
      <TaskColumn title="异常/已停止" :tasks="errorTasks" accent-color="bg-red-400" />
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal" />
          <div class="relative card w-full max-w-md mx-4 animate-fade-in">
            <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 class="text-lg font-semibold text-slate-100">新建任务</h2>
              <button
                @click="closeModal"
                class="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
            <form @submit.prevent="submitForm" class="p-5 space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">
                  任务名称 <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="formData.name"
                  type="text"
                  class="input-field"
                  placeholder="请输入任务名称"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">任务描述</label>
                <textarea
                  v-model="formData.description"
                  rows="3"
                  class="input-field resize-none"
                  placeholder="请输入任务描述"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">优先级</label>
                <select v-model="formData.priority" class="input-field">
                  <option v-for="p in priorities" :key="p" :value="p">
                    {{ TASK_PRIORITY_LABELS[p] }}
                  </option>
                </select>
              </div>
              <div class="flex items-center justify-end gap-3 pt-2">
                <button type="button" @click="closeModal" class="btn-secondary">
                  取消
                </button>
                <button type="submit" class="btn-primary inline-flex items-center gap-2" :disabled="submitting">
                  <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
                  {{ submitting ? '创建中...' : '创建任务' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
