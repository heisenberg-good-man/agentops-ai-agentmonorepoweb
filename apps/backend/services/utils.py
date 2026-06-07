# -*- coding: utf-8 -*-
"""
工具函数：JSON 文件读写与文件锁
"""
import json
import os
import threading
from datetime import datetime, timezone

# 文件锁字典，每个文件一个锁
_file_locks = {}
_lock_lock = threading.Lock()


def _get_file_lock(file_path):
    """获取指定文件的锁对象"""
    with _lock_lock:
        if file_path not in _file_locks:
            _file_locks[file_path] = threading.Lock()
        return _file_locks[file_path]


def read_json(file_path):
    """读取 JSON 文件，加锁保护"""
    lock = _get_file_lock(file_path)
    with lock:
        if not os.path.exists(file_path):
            return []
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)


def write_json(file_path, data):
    """写入 JSON 文件，加锁保护"""
    lock = _get_file_lock(file_path)
    with lock:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


def get_current_iso_time():
    """获取当前 UTC 时间的 ISO 格式字符串"""
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
