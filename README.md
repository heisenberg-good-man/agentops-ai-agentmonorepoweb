# AgentOps AI Agent 自动作业平台

面向企业运维团队的 AI Agent 任务编排与监控系统，基于 Monorepo 架构搭建。

## 项目结构

```
agentops-ai-agentmonorepoweb/
├── packages/                          # 共享包
│   ├── shared-types/                  # TypeScript 共享类型定义
│   └── roles-config/                  # 角色与权限配置
├── apps/                              # 应用层
│   ├── web-console/                   # Vue 3 Web 控制台 (前端)
│   └── backend/                       # Python Flask 编排服务 (后端)
├── scripts/                           # 启动脚本
├── .trae/documents/                   # 设计文档
│   ├── PRD.md                         # 产品需求文档
│   └── architecture.md                # 技术架构文档
└── package.json                       # Monorepo 根配置 (npm workspaces)
```

## 技术栈

| 层级 | 技术选型 |
|-----|---------|
| 前端 | Vue 3 + TypeScript + Vite 5 + Tailwind CSS 3 + Vue Router 4 |
| 后端 | Python 3.10+ + Flask 3 |
| 共享 | TypeScript 类型包 + JSON 配置 |
| 数据 | 本地 JSON 文件模拟，无需数据库 |

## 核心功能

- **任务看板**：四列状态看板（待执行/运行中/已完成/异常），卡片式展示，支持新建任务
- **任务详情**：任务基本信息、步骤时间线、实时日志面板、启动/停止/重试操作
- **Agent 管理**：Agent 列表、在线状态、资源使用率、角色权限配置矩阵
- **角色权限**：平台管理员 / 运维操作员 / 只读观察者三种角色，权限动态控制

## 快速开始

### 环境要求

- Node.js >= 18
- Python >= 3.10
- npm >= 9 （用于 npm workspaces）

### 方式一：一键启动（推荐）

**Windows (PowerShell)**:
```powershell
.\scripts\start-dev.ps1
```

**macOS / Linux**:
```bash
chmod +x ./scripts/start-dev.sh
./scripts/start-dev.sh
```

### 方式二：手动启动

#### 1. 安装依赖

```bash
# 安装前端及共享包依赖
npm install

# 安装后端 Python 依赖
pip install -r apps/backend/requirements.txt
```

#### 2. 启动服务

**启动后端 (终端 1)**:
```bash
cd apps/backend
python run.py
```
后端服务将在 http://localhost:5000 启动

**启动前端 (终端 2)**:
```bash
npm run dev:web
```
前端控制台将在 http://localhost:5173 启动

#### 3. 同时启动前后端

```bash
npm run dev
```

## 功能验证清单

| 业务动作 | 操作路径 | 预期结果 |
|---------|---------|---------|
| 查看任务看板 | 访问首页 `/` | 显示四列状态看板，每列包含任务卡片 |
| 新建任务 | 看板页点击「新建任务」按钮 | 弹出表单，填写后提交，任务出现在「待执行」列 |
| 查看任务详情 | 点击任意任务卡片 | 进入 `/task/:id`，显示任务信息、步骤时间线、日志面板 |
| 启动任务 | 任务详情页点击「启动任务」 | 状态变为「运行中」，开始输出日志，步骤依次执行 |
| 停止任务 | 运行中的任务点击「停止任务」 | 状态变为「已停止」，日志停止输出 |
| 重试任务 | 异常状态任务点击「重试任务」 | 从失败步骤继续执行 |
| 切换角色 | 顶部栏点击角色下拉切换 | 不同角色显示/隐藏不同操作按钮 |
| 查看 Agent 管理 | 侧边栏点击「Agent 管理」 | 进入 `/agents`，显示 Agent 列表和角色权限矩阵 |
| 修改角色权限 | Agent 管理页勾选权限后保存 | 角色配置更新成功并提示 |

## API 接口

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/tasks` | 获取任务列表 |
| GET | `/api/tasks/:taskId` | 获取任务详情 |
| POST | `/api/tasks` | 创建新任务 |
| POST | `/api/tasks/:taskId/start` | 启动任务 |
| POST | `/api/tasks/:taskId/stop` | 停止任务 |
| POST | `/api/tasks/:taskId/retry` | 重试任务 |
| GET | `/api/tasks/:taskId/logs` | 获取任务日志 |
| GET | `/api/agents` | 获取 Agent 列表 |
| GET | `/api/roles` | 获取角色配置 |
| PUT | `/api/roles/:roleName` | 更新角色权限 |

## 设计文档

完整设计文档请查看：
- [产品需求文档 PRD](.trae/documents/PRD.md)
- [技术架构文档](.trae/documents/architecture.md)
