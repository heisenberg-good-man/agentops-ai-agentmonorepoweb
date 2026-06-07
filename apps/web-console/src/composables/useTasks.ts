import { ref, inject } from 'vue';
import type { Task, LogEntry, CreateTaskRequest } from '@agentops/shared-types';
import {
  getTasks,
  getTask,
  createTask,
  startTask,
  stopTask,
  retryTask,
  getTaskLogs,
} from '@/api/tasks';

type ShowToastFn = (message: string, type?: 'success' | 'error') => void;

export function useTasks() {
  const tasks = ref<Task[]>([]);
  const task = ref<Task | null>(null);
  const logs = ref<LogEntry[]>([]);
  const loading = ref(false);
  const showToast = inject<ShowToastFn>('showToast');

  const fetchTasks = async () => {
    loading.value = true;
    try {
      tasks.value = await getTasks();
    } catch (error) {
      showToast?.(error instanceof Error ? error.message : '获取任务列表失败', 'error');
    } finally {
      loading.value = false;
    }
  };

  const fetchTask = async (id: string) => {
    loading.value = true;
    try {
      task.value = await getTask(id);
    } catch (error) {
      showToast?.(error instanceof Error ? error.message : '获取任务详情失败', 'error');
    } finally {
      loading.value = false;
    }
  };

  const fetchTaskLogs = async (taskId: string) => {
    try {
      logs.value = await getTaskLogs(taskId);
    } catch (error) {
      showToast?.(error instanceof Error ? error.message : '获取日志失败', 'error');
    }
  };

  const handleCreateTask = async (data: CreateTaskRequest) => {
    try {
      const newTask = await createTask(data);
      tasks.value.unshift(newTask);
      showToast?.('任务创建成功');
      return newTask;
    } catch (error) {
      showToast?.(error instanceof Error ? error.message : '创建任务失败', 'error');
      throw error;
    }
  };

  const handleStartTask = async (id: string) => {
    try {
      const updatedTask = await startTask(id);
      const index = tasks.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        tasks.value[index] = updatedTask;
      }
      if (task.value?.id === id) {
        task.value = updatedTask;
      }
      showToast?.('任务已启动');
      return updatedTask;
    } catch (error) {
      showToast?.(error instanceof Error ? error.message : '启动任务失败', 'error');
      throw error;
    }
  };

  const handleStopTask = async (id: string) => {
    try {
      const updatedTask = await stopTask(id);
      const index = tasks.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        tasks.value[index] = updatedTask;
      }
      if (task.value?.id === id) {
        task.value = updatedTask;
      }
      showToast?.('任务已停止');
      return updatedTask;
    } catch (error) {
      showToast?.(error instanceof Error ? error.message : '停止任务失败', 'error');
      throw error;
    }
  };

  const handleRetryTask = async (id: string) => {
    try {
      const updatedTask = await retryTask(id);
      const index = tasks.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        tasks.value[index] = updatedTask;
      }
      if (task.value?.id === id) {
        task.value = updatedTask;
      }
      showToast?.('任务重试已启动');
      return updatedTask;
    } catch (error) {
      showToast?.(error instanceof Error ? error.message : '重试任务失败', 'error');
      throw error;
    }
  };

  return {
    tasks,
    task,
    logs,
    loading,
    fetchTasks,
    fetchTask,
    fetchTaskLogs,
    handleCreateTask,
    handleStartTask,
    handleStopTask,
    handleRetryTask,
  };
}
