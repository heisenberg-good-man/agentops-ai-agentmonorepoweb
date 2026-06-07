<script setup lang="ts">
import { ref, computed, inject, onMounted, watch } from 'vue';
import { Plus, X, LayoutDashboard, Loader2, AlertCircle, Code, Globe, GitBranch, MessageSquare, Sparkles } from 'lucide-vue-next';
import type { TaskPriority, CreateTaskRequest } from '@agentops/shared-types';
import { TASK_PRIORITY_LABELS } from '@agentops/shared-types';
import { useTasks } from '@/composables/useTasks';
import TaskColumn from '@/components/TaskColumn.vue';

type HasPermissionFn = (permission: string) => boolean;
type ShowToastFn = (message: string, type?: 'success' | 'error') => void;

const { tasks, loading, fetchTasks, handleCreateTask } = useTasks();
const hasPermission = inject<HasPermissionFn>('hasPermission');
const showToast = inject<ShowToastFn>('showToast');

const showModal = ref(false);
const submitting = ref(false);
const formError = ref('');
const formData = ref<CreateTaskRequest>({
  name: '',
  description: '',
  priority: 'medium',
});

const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

const quickTemplates = [
  { key: 'code_review', name: '代码审查', icon: Code, desc: '自动化代码质量审查和规范检查', steps: ['拉取代码', '静态分析', '规范检查', '生成报告', '通知结果'] },
  { key: 'browser_test', name: '浏览器验收', icon: Globe, desc: '多浏览器兼容性自动化测试', steps: ['启动浏览器池', '执行用例', '截图比对', '收集日志', '生成报告'] },
  { key: 'github_sync', name: 'GitHub提交', icon: GitBranch, desc: '代码提交、PR创建和CI触发', steps: ['检查工作区', '构建测试', '提交代码', '创建PR', '等待CI'] },
  { key: 'feishu_preview', name: '飞书预览', icon: MessageSquare, desc: '飞书文档生成和消息推送', steps: ['准备内容', '生成文档', '发送通知', '收集反馈', '归档记录'] },
];

const pendingTasks = computed(() => tasks.value.filter((t) => t.status === 'pending'));
const runningTasks = computed(() => tasks.value.filter((t) => t.status === 'running'));
const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'completed'));
const errorTasks = computed(() => tasks.value.filter((t) => t.status === 'error' || t.status === 'stopped'));

const hasFormContent = computed(() => formData.value.name.trim() || formData.value.description.trim());

watch(
  () => formData.value.name,
  () => {
    if (formError.value) formError.value = '';
  }
);

const openModal = () => {
  showModal.value = true;
  formData.value = { name: '', description: '', priority: 'medium' };
  formError.value = '';
};

const closeModal = () => {
  if (hasFormContent.value && !submitting.value) {
    if (!confirm('确定要取消吗？已输入的内容将丢失。')) return;
  }
  showModal.value = false;
  formError.value = '';
};

const applyTemplate = (tpl: typeof quickTemplates[0]) => {
  formData.value.name = tpl.name + ' - ' + new Date().toLocaleDateString('zh-CN');
  formData.value.description = tpl.desc;
  showToast?.(`已应用「${tpl.name}」模板`);
};

const validateForm = (): boolean => {
  const name = formData.value.name.trim();
  if (!name) {
    formError.value = '请输入任务名称';
    return false;
  }
  if (name.length < 2) {
    formError.value = '任务名称至少 2 个字符';
    return false;
  }
  if (name.length > 100) {
    formError.value = '任务名称不能超过 100 个字符';
    return false;
  }
  return true;
};

const submitForm = async () => {
  if (!validateForm()) return;
  submitting.value = true;
  formError.value = '';
  try {
    await handleCreateTask(formData.value);
    await fetchTasks();
    showModal.value = false;
  } catch (err) {
    formError.value = err instanceof Error ? err.message : '创建失败，请重试';
  } finally {
    submitting.value = false;
  }
};

const refreshTasks = async () => {
  await fetchTasks();
  showToast?.('看板已刷新');
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
      <div class="flex items-center gap-3">
        <button
          @click="refreshTasks"
          class="btn-secondary inline-flex items-center gap-2"
          :disabled="loading"
        >
          <Loader2 class="w-4 h-4" :class="loading ? 'animate-spin' : ''" />
          刷新
        </button>
        <button
          v-if="hasPermission?.('task:create')"
          @click="openModal"
          class="btn-primary inline-flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          新建任务
        </button>
      </div>
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
          <div class="relative card w-full max-w-lg mx-4 animate-fade-in max-h-[90vh] flex flex-col">
            <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-shrink-0">
              <h2 class="text-lg font-semibold text-slate-100">新建任务</h2>
              <button
                @click="closeModal"
                class="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="px-5 py-3 border-b border-slate-700 bg-slate-800/30 flex-shrink-0">
              <div class="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles class="w-3.5 h-3.5 text-cyan-400" />
                快速模板（点击应用）
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="tpl in quickTemplates"
                  :key="tpl.key"
                  type="button"
                  @click="applyTemplate(tpl)"
                  class="flex items-start gap-2 p-2.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-cyan-500/40 transition-all text-left"
                >
                  <component :is="tpl.icon" class="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-slate-200">{{ tpl.name }}</div>
                    <div class="text-xs text-slate-500 truncate">{{ tpl.desc }}</div>
                  </div>
                </button>
              </div>
            </div>

            <form @submit.prevent="submitForm" class="p-5 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">
                  任务名称 <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="formData.name"
                  type="text"
                  class="input-field"
                  :class="formError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''"
                  placeholder="请输入任务名称（2-100字符）"
                />
                <p v-if="formError" class="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle class="w-3.5 h-3.5" />
                  {{ formError }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">任务描述</label>
                <textarea
                  v-model="formData.description"
                  rows="3"
                  class="input-field resize-none"
                  placeholder="请输入任务描述（可选）"
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
            </form>

            <div class="px-5 py-3 border-t border-slate-700 flex items-center justify-end gap-3 flex-shrink-0">
              <button type="button" @click="closeModal" class="btn-secondary" :disabled="submitting">
                取消
              </button>
              <button type="submit" @click="submitForm" class="btn-primary inline-flex items-center gap-2" :disabled="submitting">
                <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
                {{ submitting ? '创建中...' : '创建任务' }}
              </button>
            </div>
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
