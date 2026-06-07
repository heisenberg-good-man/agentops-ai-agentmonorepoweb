# -*- coding: utf-8 -*-
"""
Flask 应用入口
"""
from flask import Flask
from flask_cors import CORS

from routes.tasks import tasks_bp
from routes.agents import agents_bp
from routes.roles import roles_bp


def create_app():
    """创建并配置 Flask 应用"""
    app = Flask(__name__)

    # 启用 CORS，允许前端 5173 端口访问
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

    # 注册蓝图
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(agents_bp, url_prefix='/api/agents')
    app.register_blueprint(roles_bp, url_prefix='/api/roles')

    @app.route('/api/health')
    def health_check():
        """健康检查接口"""
        return {
            'success': True,
            'data': {
                'status': 'ok',
                'message': 'AgentOps 后端服务运行正常'
            }
        }

    return app
