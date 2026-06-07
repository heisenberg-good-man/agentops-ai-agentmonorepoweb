export type TaskStatus = 'pending' | 'running' | 'completed' | 'error' | 'stopped';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export type AgentStatus = 'online' | 'offline' | 'busy' | 'idle';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface TaskStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  taskId: string;
  stepId?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  cpuUsage: number;
  memoryUsage: number;
  lastHeartbeat: string;
  capabilities: string[];
}

export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  agentId?: string | null;
  steps: TaskStep[];
  progress: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string;
}

export interface RolePermission {
  role: UserRole;
  roleName: string;
  description: string;
  permissions: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateTaskRequest {
  name: string;
  description: string;
  priority: TaskPriority;
  assignedAgentId?: string;
}

export interface UpdateRoleRequest {
  permissions: string[];
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待执行',
  running: '运行中',
  completed: '已完成',
  error: '异常',
  stopped: '已停止',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  online: '在线',
  offline: '离线',
  busy: '忙碌',
  idle: '空闲',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: '平台管理员',
  operator: '运维操作员',
  viewer: '只读观察者',
};

export const ALL_PERMISSIONS: Array<{ key: string; name: string; description: string }> = [
  { key: 'task:view', name: '查看任务', description: '查看任务看板和任务详情' },
  { key: 'task:create', name: '创建任务', description: '新建任务' },
  { key: 'task:start', name: '启动任务', description: '启动待执行任务' },
  { key: 'task:stop', name: '停止任务', description: '停止运行中任务' },
  { key: 'task:retry', name: '重试任务', description: '重试失败的任务' },
  { key: 'agent:view', name: '查看Agent', description: '查看Agent列表和状态' },
  { key: 'agent:manage', name: '管理Agent', description: '添加、编辑、删除Agent' },
  { key: 'role:view', name: '查看角色', description: '查看角色和权限配置' },
  { key: 'role:manage', name: '管理角色', description: '修改角色权限配置' },
  { key: 'user:manage', name: '用户管理', description: '创建、编辑、删除用户' },
];
