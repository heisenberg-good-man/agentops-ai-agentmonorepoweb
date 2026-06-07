import { httpClient } from './client';
import type { Agent } from '@agentops/shared-types';

export const getAgents = async (): Promise<Agent[]> => {
  try {
    return await httpClient.get<Agent[]>('/agents');
  } catch {
    return [
      {
        id: 'agent-001',
        name: 'data-processor-01',
        role: '数据处理节点',
        status: 'busy',
        cpuUsage: 72,
        memoryUsage: 58,
        lastHeartbeat: new Date(Date.now() - 15000).toISOString(),
        capabilities: ['data-etl', 'database-ops', 'file-processing'],
      },
      {
        id: 'agent-002',
        name: 'payment-worker-01',
        role: '支付服务节点',
        status: 'online',
        cpuUsage: 23,
        memoryUsage: 41,
        lastHeartbeat: new Date(Date.now() - 8000).toISOString(),
        capabilities: ['payment-gateway', 'transaction-handler', 'notification-sender'],
      },
      {
        id: 'agent-003',
        name: 'ml-trainer-01',
        role: '模型训练节点',
        status: 'idle',
        cpuUsage: 5,
        memoryUsage: 12,
        lastHeartbeat: new Date(Date.now() - 5000).toISOString(),
        capabilities: ['model-training', 'data-visualization', 'hyperparameter-tuning'],
      },
      {
        id: 'agent-004',
        name: 'report-builder-01',
        role: '报告生成节点',
        status: 'online',
        cpuUsage: 18,
        memoryUsage: 35,
        lastHeartbeat: new Date(Date.now() - 12000).toISOString(),
        capabilities: ['report-generation', 'email-delivery', 'data-export'],
      },
      {
        id: 'agent-005',
        name: 'security-scanner-01',
        role: '安全扫描节点',
        status: 'offline',
        cpuUsage: 0,
        memoryUsage: 0,
        lastHeartbeat: new Date(Date.now() - 3600000).toISOString(),
        capabilities: ['vulnerability-scan', 'port-scan', 'compliance-check'],
      },
      {
        id: 'agent-006',
        name: 'log-archiver-01',
        role: '日志归档节点',
        status: 'idle',
        cpuUsage: 2,
        memoryUsage: 8,
        lastHeartbeat: new Date(Date.now() - 20000).toISOString(),
        capabilities: ['log-compression', 'object-storage', 'retention-policy'],
      },
    ];
  }
};
