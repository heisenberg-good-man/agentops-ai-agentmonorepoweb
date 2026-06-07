import { httpClient } from './client';
import type { Task, LogEntry, CreateTaskRequest } from '@agentops/shared-types';

export const getTasks = async (): Promise<Task[]> => {
  try {
    return await httpClient.get<Task[]>('/tasks');
  } catch {
    return [
      {
        id: 'task-001',
        name: '数据同步任务',
        description: '从主数据库同步数据到分析数据库',
        status: 'running',
        priority: 'high',
        assignee: '张伟',
        assignedAgentId: 'agent-001',
        progress: 65,
        steps: [
          { id: 'step-1', name: '建立数据库连接', status: 'completed', durationMs: 2300 },
          { id: 'step-2', name: '读取源数据', status: 'completed', durationMs: 15400 },
          { id: 'step-3', name: '数据转换清洗', status: 'running', startedAt: new Date().toISOString() },
          { id: 'step-4', name: '写入目标数据库', status: 'pending' },
          { id: 'step-5', name: '验证数据一致性', status: 'pending' },
        ],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'task-002',
        name: '模型训练 Pipeline',
        description: '每日增量训练推荐模型',
        status: 'pending',
        priority: 'medium',
        assignee: '李娜',
        progress: 0,
        steps: [
          { id: 'step-1', name: '准备训练数据', status: 'pending' },
          { id: 'step-2', name: '执行训练', status: 'pending' },
          { id: 'step-3', name: '模型评估', status: 'pending' },
          { id: 'step-4', name: '部署上线', status: 'pending' },
        ],
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'task-003',
        name: '用户行为分析报告',
        description: '生成每周用户行为分析报告',
        status: 'completed',
        priority: 'low',
        assignee: '王芳',
        progress: 100,
        steps: [
          { id: 'step-1', name: '采集行为数据', status: 'completed', durationMs: 8200 },
          { id: 'step-2', name: '数据分析处理', status: 'completed', durationMs: 45000 },
          { id: 'step-3', name: '生成可视化图表', status: 'completed', durationMs: 12300 },
          { id: 'step-4', name: '发送邮件报告', status: 'completed', durationMs: 1500 },
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString(),
        startedAt: new Date(Date.now() - 72000000).toISOString(),
        finishedAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: 'task-004',
        name: '订单批量处理',
        description: '处理积压的订单数据',
        status: 'error',
        priority: 'critical',
        assignee: '陈明',
        assignedAgentId: 'agent-002',
        progress: 40,
        steps: [
          { id: 'step-1', name: '拉取订单数据', status: 'completed', durationMs: 5600 },
          { id: 'step-2', name: '订单校验', status: 'completed', durationMs: 23400 },
          {
            id: 'step-3',
            name: '调用支付接口',
            status: 'error',
            durationMs: 8900,
            errorMessage: '支付网关超时: connection timeout after 30s, 请检查网络连接或支付服务状态',
          },
          { id: 'step-4', name: '更新订单状态', status: 'skipped' },
          { id: 'step-5', name: '发送通知', status: 'skipped' },
        ],
        errorMessage: '支付接口调用失败',
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        startedAt: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        id: 'task-005',
        name: '日志归档清理',
        description: '归档 30 天前的日志文件',
        status: 'pending',
        priority: 'low',
        assignee: '刘强',
        progress: 0,
        steps: [
          { id: 'step-1', name: '扫描日志目录', status: 'pending' },
          { id: 'step-2', name: '压缩旧日志', status: 'pending' },
          { id: 'step-3', name: '上传到对象存储', status: 'pending' },
          { id: 'step-4', name: '删除本地文件', status: 'pending' },
        ],
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'task-006',
        name: '安全漏洞扫描',
        description: '对生产环境进行安全扫描',
        status: 'stopped',
        priority: 'high',
        assignee: '赵磊',
        progress: 55,
        steps: [
          { id: 'step-1', name: '端口扫描', status: 'completed', durationMs: 12000 },
          { id: 'step-2', name: '服务指纹识别', status: 'completed', durationMs: 8500 },
          { id: 'step-3', name: '漏洞检测', status: 'pending' },
          { id: 'step-4', name: '生成报告', status: 'pending' },
        ],
        createdAt: new Date(Date.now() - 28800000).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
        startedAt: new Date(Date.now() - 14400000).toISOString(),
      },
    ];
  }
};

export const getTask = async (id: string): Promise<Task> => {
  try {
    return await httpClient.get<Task>(`/tasks/${id}`);
  } catch {
    const tasks = await getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      throw new Error('任务不存在');
    }
    return task;
  }
};

export const createTask = async (data: CreateTaskRequest): Promise<Task> => {
  try {
    return await httpClient.post<Task>('/tasks', data);
  } catch {
    return {
      id: `task-${Date.now()}`,
      name: data.name,
      description: data.description,
      status: 'pending',
      priority: data.priority,
      assignee: '当前用户',
      assignedAgentId: data.assignedAgentId,
      progress: 0,
      steps: [
        { id: 'step-1', name: '初始化任务', status: 'pending' },
        { id: 'step-2', name: '执行处理', status: 'pending' },
        { id: 'step-3', name: '完成验证', status: 'pending' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
};

export const startTask = async (id: string): Promise<Task> => {
  try {
    return await httpClient.post<Task>(`/tasks/${id}/start`);
  } catch {
    const task = await getTask(id);
    return {
      ...task,
      status: 'running',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: task.steps.map((s, i) =>
        i === 0 ? { ...s, status: 'running' as const, startedAt: new Date().toISOString() } : s
      ),
    };
  }
};

export const stopTask = async (id: string): Promise<Task> => {
  try {
    return await httpClient.post<Task>(`/tasks/${id}/stop`);
  } catch {
    const task = await getTask(id);
    return {
      ...task,
      status: 'stopped',
      updatedAt: new Date().toISOString(),
      steps: task.steps.map((s) =>
        s.status === 'running' ? { ...s, status: 'skipped' as const, finishedAt: new Date().toISOString() } : s
      ),
    };
  }
};

export const retryTask = async (id: string): Promise<Task> => {
  try {
    return await httpClient.post<Task>(`/tasks/${id}/retry`);
  } catch {
    const task = await getTask(id);
    return {
      ...task,
      status: 'running',
      errorMessage: undefined,
      progress: Math.min(task.progress + 10, 90),
      updatedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      steps: task.steps.map((s) => {
        if (s.status === 'error' || s.status === 'skipped') {
          return { ...s, status: 'pending' as const, errorMessage: undefined };
        }
        if (s.status === 'completed') return s;
        return { ...s, status: 'pending' as const };
      }),
    };
  }
};

export const getTaskLogs = async (taskId: string): Promise<LogEntry[]> => {
  try {
    return await httpClient.get<LogEntry[]>(`/tasks/${taskId}/logs`);
  } catch {
    const now = Date.now();
    return [
      {
        id: 'log-1',
        timestamp: new Date(now - 120000).toISOString(),
        level: 'INFO',
        message: '[TaskManager] 任务初始化完成，准备执行步骤: 建立数据库连接',
        taskId,
        stepId: 'step-1',
      },
      {
        id: 'log-2',
        timestamp: new Date(now - 118000).toISOString(),
        level: 'INFO',
        message: '[DBConnector] 正在连接主数据库 postgres://prod-db:5432/main',
        taskId,
        stepId: 'step-1',
      },
      {
        id: 'log-3',
        timestamp: new Date(now - 116000).toISOString(),
        level: 'INFO',
        message: '[DBConnector] 数据库连接成功，延迟: 12ms',
        taskId,
        stepId: 'step-1',
      },
      {
        id: 'log-4',
        timestamp: new Date(now - 115000).toISOString(),
        level: 'INFO',
        message: '[TaskManager] 步骤 [建立数据库连接] 完成，耗时: 2300ms',
        taskId,
        stepId: 'step-1',
      },
      {
        id: 'log-5',
        timestamp: new Date(now - 100000).toISOString(),
        level: 'INFO',
        message: '[DataReader] 开始读取源表 user_events，预计行数: 1,250,000',
        taskId,
        stepId: 'step-2',
      },
      {
        id: 'log-6',
        timestamp: new Date(now - 85000).toISOString(),
        level: 'DEBUG',
        message: '[DataReader] 已读取 500,000 / 1,250,000 行 (40%)',
        taskId,
        stepId: 'step-2',
      },
      {
        id: 'log-7',
        timestamp: new Date(now - 70000).toISOString(),
        level: 'DEBUG',
        message: '[DataReader] 已读取 1,000,000 / 1,250,000 行 (80%)',
        taskId,
        stepId: 'step-2',
      },
      {
        id: 'log-8',
        timestamp: new Date(now - 60000).toISOString(),
        level: 'INFO',
        message: '[DataReader] 数据读取完成，共 1,250,432 行，耗时: 15400ms',
        taskId,
        stepId: 'step-2',
      },
      {
        id: 'log-9',
        timestamp: new Date(now - 55000).toISOString(),
        level: 'INFO',
        message: '[TaskManager] 步骤 [读取源数据] 完成，耗时: 15400ms',
        taskId,
        stepId: 'step-2',
      },
      {
        id: 'log-10',
        timestamp: new Date(now - 50000).toISOString(),
        level: 'INFO',
        message: '[DataTransformer] 开始数据转换，规则集: v2.3.1',
        taskId,
        stepId: 'step-3',
      },
      {
        id: 'log-11',
        timestamp: new Date(now - 30000).toISOString(),
        level: 'WARN',
        message: '[DataTransformer] 检测到 23 行异常数据，已按规则过滤',
        taskId,
        stepId: 'step-3',
      },
      {
        id: 'log-12',
        timestamp: new Date(now - 10000).toISOString(),
        level: 'INFO',
        message: '[DataTransformer] 数据转换进度: 75%，剩余约 5 秒',
        taskId,
        stepId: 'step-3',
      },
    ];
  }
};
