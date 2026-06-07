# -*- coding: utf-8 -*-
"""
Agent 路由蓝图
"""
from flask import Blueprint, jsonify

from services.agent_service import get_all_agents

agents_bp = Blueprint('agents', __name__)


@agents_bp.route('', methods=['GET'])
def list_agents():
    """获取 Agent 列表 GET /api/agents"""
    agents = get_all_agents()
    return jsonify({
        'success': True,
        'data': agents,
        'message': '获取 Agent 列表成功'
    })
