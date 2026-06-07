# -*- coding: utf-8 -*-
"""
任务路由蓝图
"""
from flask import Blueprint, request, jsonify

from services.task_service import (
    get_all_tasks,
    get_task_by_id,
    create_task,
    start_task,
    stop_task,
    retry_task,
    get_task_logs
)

tasks_bp = Blueprint('tasks', __name__)


@tasks_bp.route('', methods=['GET'])
def list_tasks():
    """获取任务列表 GET /api/tasks"""
    tasks = get_all_tasks()
    return jsonify({
        'success': True,
        'data': tasks,
        'message': '获取任务列表成功'
    })


@tasks_bp.route('/<task_id>', methods=['GET'])
def get_task(task_id):
    """获取单个任务详情 GET /api/tasks/:id"""
    task = get_task_by_id(task_id)
    if not task:
        return jsonify({
            'success': False,
            'error': 'NOT_FOUND',
            'message': f'任务 {task_id} 不存在'
        }), 404
    return jsonify({
        'success': True,
        'data': task,
        'message': '获取任务详情成功'
    })


@tasks_bp.route('', methods=['POST'])
def add_task():
    """创建新任务 POST /api/tasks"""
    data = request.get_json(silent=True) or {}
    new_task = create_task(data)
    return jsonify({
        'success': True,
        'data': new_task,
        'message': '任务创建成功'
    }), 201


@tasks_bp.route('/<task_id>/start', methods=['POST'])
def start(task_id):
    """启动任务 POST /api/tasks/:id/start"""
    task, error = start_task(task_id)
    if error:
        return jsonify({
            'success': False,
            'error': 'BAD_REQUEST',
            'message': error
        }), 400
    return jsonify({
        'success': True,
        'data': task,
        'message': '任务已启动'
    })


@tasks_bp.route('/<task_id>/stop', methods=['POST'])
def stop(task_id):
    """停止任务 POST /api/tasks/:id/stop"""
    task, error = stop_task(task_id)
    if error:
        return jsonify({
            'success': False,
            'error': 'BAD_REQUEST',
            'message': error
        }), 400
    return jsonify({
        'success': True,
        'data': task,
        'message': '任务已停止'
    })


@tasks_bp.route('/<task_id>/retry', methods=['POST'])
def retry(task_id):
    """重试任务 POST /api/tasks/:id/retry"""
    task, error = retry_task(task_id)
    if error:
        return jsonify({
            'success': False,
            'error': 'BAD_REQUEST',
            'message': error
        }), 400
    return jsonify({
        'success': True,
        'data': task,
        'message': '任务已重试启动'
    })


@tasks_bp.route('/<task_id>/logs', methods=['GET'])
def list_task_logs(task_id):
    """获取任务日志 GET /api/tasks/:id/logs"""
    task = get_task_by_id(task_id)
    if not task:
        return jsonify({
            'success': False,
            'error': 'NOT_FOUND',
            'message': f'任务 {task_id} 不存在'
        }), 404
    logs = get_task_logs(task_id)
    return jsonify({
        'success': True,
        'data': logs,
        'message': '获取任务日志成功'
    })
