# -*- coding: utf-8 -*-
"""
日志服务：读取和追加任务日志
"""
import os
from .utils import read_json, write_json, get_current_iso_time

# 日志数据文件路径
LOGS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'logs.json')


def _load_logs():
    """加载所有日志"""
    return read_json(LOGS_FILE)


def _save_logs(logs):
    """保存所有日志"""
    write_json(LOGS_FILE, logs)


def get_logs_by_task(task_id):
    """根据任务ID获取日志列表"""
    logs = _load_logs()
    task_logs = [log for log in logs if log.get('taskId') == task_id]
    task_logs.sort(key=lambda x: x.get('timestamp', ''))
    return task_logs


def append_log(task_id, level, message):
    """追加一条日志，自动记录时间戳"""
    logs = _load_logs()
    new_log = {
        'id': f'log-{len(logs) + 1:03d}',
        'taskId': task_id,
        'timestamp': get_current_iso_time(),
        'level': level,
        'message': message
    }
    logs.append(new_log)
    _save_logs(logs)
    return new_log
