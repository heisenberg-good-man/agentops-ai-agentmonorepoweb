# -*- coding: utf-8 -*-
"""
任务服务：模拟任务调度，start/stop/retry 时随机生成步骤执行和日志
"""
import os
import random
import threading
from datetime import datetime, timezone

from .utils import read_json, write_json, get_current_iso_time
from .log_service import append_log
from .agent_service import get_available_agent, update_agent_status

# 任务数据文件路径
TASKS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'tasks.json')

# 正在运行的任务定时器字典，用于 stop 操作
_running_timers = {}


def _load_tasks():
    """加载所有任务"""
    return read_json(TASKS_FILE)


def _save_tasks(tasks):
    """保存所有任务"""
    write_json(TASKS_FILE, tasks)


def get_all_tasks():
    """获取所有任务列表"""
    return _load_tasks()


def get_task_by_id(task_id):
    """根据 ID 获取单个任务"""
    tasks = _load_tasks()
    for task in tasks:
        if task.get('id') == task_id:
            return task
    return None


def create_task(task_data):
    """创建新任务"""
    tasks = _load_tasks()
    new_id = f'task-{len(tasks) + 1:03d}'
    now = get_current_iso_time()

    step_count = random.randint(3, 5)
    step_names = [
        '初始化环境', '加载配置', '连接数据源', '数据校验', '执行核心逻辑',
        '数据转换', '结果写入', '生成报告', '清理资源', '发送通知'
    ]
    selected_steps = random.sample(step_names, step_count)
    steps = []
    for i, name in enumerate(selected_steps):
        steps.append({
            'id': f's{i + 1}',
            'name': name,
            'status': 'pending',
            'startedAt': None,
            'completedAt': None
        })

    assignees = ['张伟', '李娜', '王强', '刘洋', '陈静']

    new_task = {
        'id': new_id,
        'name': task_data.get('name', '未命名任务'),
        'description': task_data.get('description', ''),
        'status': 'pending',
        'createdAt': now,
        'updatedAt': now,
        'startedAt': None,
        'completedAt': None,
        'agentId': task_data.get('assignedAgentId') or None,
        'priority': task_data.get('priority', 'medium'),
        'steps': steps,
        'progress': 0,
        'assignee': random.choice(assignees),
    }
    tasks.append(new_task)
    _save_tasks(tasks)
    return new_task


def _calculate_progress(steps):
    """根据步骤状态计算任务进度百分比"""
    if not steps:
        return 0
    completed = sum(1 for s in steps if s.get('status') == 'completed')
    running = sum(1 for s in steps if s.get('status') == 'running')
    return int((completed + 0.5 * running) / len(steps) * 100)


def _execute_step(task_id, step_index):
    """执行单个步骤（模拟异步）"""
    tasks = _load_tasks()
    task = None
    for t in tasks:
        if t.get('id') == task_id:
            task = t
            break

    if not task or task['status'] != 'running':
        return

    steps = task['steps']
    if step_index >= len(steps):
        # 所有步骤执行完成
        task['status'] = 'completed'
        task['completedAt'] = get_current_iso_time()
        task['updatedAt'] = get_current_iso_time()
        task['progress'] = 100
        if task.get('agentId'):
            update_agent_status(task['agentId'], 'idle', current_task_id=None)
        append_log(task_id, 'INFO', '任务执行完成')
        _save_tasks(tasks)
        _running_timers.pop(task_id, None)
        return

    step = steps[step_index]
    now = get_current_iso_time()
    step['status'] = 'running'
    step['startedAt'] = now
    task['updatedAt'] = now
    task['progress'] = _calculate_progress(steps)
    append_log(task_id, 'INFO', f'步骤{step_index + 1}【{step["name"]}】开始执行')
    _save_tasks(tasks)

    # 模拟步骤执行时间 1-3 秒
    delay = random.randint(1, 3)

    def _after_step_delay():
        tasks_inner = _load_tasks()
        task_inner = None
        for t in tasks_inner:
            if t.get('id') == task_id:
                task_inner = t
                break

        if not task_inner or task_inner['status'] != 'running':
            _running_timers.pop(task_id, None)
            return

        step_inner = task_inner['steps'][step_index]
        now_inner = get_current_iso_time()
        # 30% 概率出错
        if random.random() < 0.3:
            step_inner['status'] = 'error'
            step_inner['completedAt'] = now_inner
            task_inner['status'] = 'error'
            task_inner['updatedAt'] = now_inner
            task_inner['progress'] = _calculate_progress(task_inner['steps'])
            error_msg = f'步骤{step_index + 1}【{step_inner["name"]}】执行失败：模拟随机错误'
            task_inner['errorMessage'] = error_msg
            if task_inner.get('agentId'):
                update_agent_status(task_inner['agentId'], 'idle', current_task_id=None)
            append_log(task_id, 'ERROR', error_msg)
            append_log(task_id, 'ERROR', f'任务执行失败：{error_msg}')
            _save_tasks(tasks_inner)
            _running_timers.pop(task_id, None)
            return

        step_inner['status'] = 'completed'
        step_inner['completedAt'] = now_inner
        task_inner['updatedAt'] = now_inner
        task_inner['progress'] = _calculate_progress(task_inner['steps'])
        append_log(task_id, 'INFO', f'步骤{step_index + 1}【{step_inner["name"]}】执行完成')
        _save_tasks(tasks_inner)

        # 继续执行下一步
        _execute_step(task_id, step_index + 1)

    timer = threading.Timer(delay, _after_step_delay)
    timer.start()
    _running_timers[task_id] = timer


def start_task(task_id):
    """启动任务"""
    tasks = _load_tasks()
    task = None
    for t in tasks:
        if t.get('id') == task_id:
            task = t
            break

    if not task:
        return None, '任务不存在'

    if task['status'] == 'running':
        return None, '任务正在运行中'

    # 分配 Agent
    agent = get_available_agent()
    if not agent:
        return None, '没有可用的 Agent'

    now = get_current_iso_time()
    task['status'] = 'running'
    task['startedAt'] = now
    task['completedAt'] = None
    task['agentId'] = agent['id']
    task.pop('errorMessage', None)

    # 重置所有步骤状态
    for step in task['steps']:
        step['status'] = 'pending'
        step['startedAt'] = None
        step['completedAt'] = None

    # 更新 Agent 状态
    update_agent_status(agent['id'], 'busy', current_task_id=task_id)

    append_log(task_id, 'INFO', f'任务开始执行，分配Agent: {agent["id"]}')
    _save_tasks(tasks)

    # 启动第一步
    _execute_step(task_id, 0)

    return task, None


def stop_task(task_id):
    """停止任务"""
    tasks = _load_tasks()
    task = None
    for t in tasks:
        if t.get('id') == task_id:
            task = t
            break

    if not task:
        return None, '任务不存在'

    if task['status'] != 'running':
        return None, '任务未在运行中'

    # 取消定时器
    timer = _running_timers.pop(task_id, None)
    if timer:
        timer.cancel()

    now = get_current_iso_time()
    task['status'] = 'stopped'
    task['updatedAt'] = now
    task['progress'] = _calculate_progress(task['steps'])
    task['completedAt'] = None
    if task.get('agentId'):
        update_agent_status(task['agentId'], 'idle', current_task_id=None)
        task['agentId'] = None

    # 将运行中的步骤重置为 pending
    for step in task['steps']:
        if step['status'] == 'running':
            step['status'] = 'pending'
            step['startedAt'] = None
            step['completedAt'] = None

    append_log(task_id, 'WARN', '任务已被用户手动停止')
    _save_tasks(tasks)

    return task, None


def retry_task(task_id):
    """重试任务"""
    tasks = _load_tasks()
    task = None
    for t in tasks:
        if t.get('id') == task_id:
            task = t
            break

    if not task:
        return None, '任务不存在'

    if task['status'] not in ('error', 'pending'):
        return None, '只有 error 或 pending 状态的任务可以重试'

    append_log(task_id, 'INFO', '用户触发任务重试')

    # 直接调用 start_task 启动（会重置状态）
    return start_task(task_id)


def get_task_logs(task_id):
    """获取任务日志"""
    from .log_service import get_logs_by_task
    return get_logs_by_task(task_id)
