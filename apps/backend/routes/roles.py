# -*- coding: utf-8 -*-
"""
角色路由蓝图
"""
import os
from flask import Blueprint, request, jsonify

from services.utils import read_json, write_json

roles_bp = Blueprint('roles', __name__)

# 角色数据文件路径
ROLES_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'roles.json')


def _load_roles():
    """加载所有角色"""
    return read_json(ROLES_FILE)


def _save_roles(roles):
    """保存所有角色"""
    write_json(ROLES_FILE, roles)


@roles_bp.route('', methods=['GET'])
def list_roles():
    """获取角色列表 GET /api/roles"""
    roles = _load_roles()
    return jsonify({
        'success': True,
        'data': roles,
        'message': '获取角色列表成功'
    })


@roles_bp.route('/<role_name>', methods=['PUT'])
def update_role(role_name):
    """更新角色 PUT /api/roles/:roleName"""
    data = request.get_json(silent=True) or {}
    roles = _load_roles()

    # 根据 roleName 查找角色
    target_role = None
    for role in roles:
        if role.get('roleName') == role_name or role.get('role') == role_name:
            target_role = role
            break

    if not target_role:
        return jsonify({
            'success': False,
            'error': 'NOT_FOUND',
            'message': f'角色 {role_name} 不存在'
        }), 404

    # 更新字段
    if 'roleName' in data:
        target_role['roleName'] = data['roleName']
    if 'description' in data:
        target_role['description'] = data['description']
    if 'permissions' in data and isinstance(data['permissions'], list):
        target_role['permissions'] = data['permissions']

    _save_roles(roles)

    return jsonify({
        'success': True,
        'data': target_role,
        'message': '角色更新成功'
    })
