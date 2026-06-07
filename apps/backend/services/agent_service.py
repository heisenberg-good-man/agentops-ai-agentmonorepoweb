# -*- coding: utf-8 -*-
"""
Agent 服务：读取和返回 Agent 列表
"""
import os
from .utils import read_json, write_json

# Agent 数据文件路径
AGENTS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'agents.json')


def _load_agents():
    """加载所有 Agent"""
    return read_json(AGENTS_FILE)


def _save_agents(agents):
    """保存所有 Agent"""
    write_json(AGENTS_FILE, agents)


def get_all_agents():
    """获取所有 Agent 列表"""
    return _load_agents()


def get_agent_by_id(agent_id):
    """根据 ID 获取单个 Agent"""
    agents = _load_agents()
    for agent in agents:
        if agent.get('id') == agent_id:
            return agent
    return None


def get_available_agent():
    """获取一个可用的 Agent（优先 idle 或 online）"""
    agents = _load_agents()
    for agent in agents:
        if agent.get('status') == 'idle':
            return agent
    for agent in agents:
        if agent.get('status') == 'online':
            return agent
    return agents[0] if agents else None


def update_agent_status(agent_id, status, current_task_id=None):
    """更新 Agent 状态"""
    agents = _load_agents()
    for agent in agents:
        if agent.get('id') == agent_id:
            agent['status'] = status
            if current_task_id is not None:
                agent['currentTaskId'] = current_task_id
            break
    _save_agents(agents)
