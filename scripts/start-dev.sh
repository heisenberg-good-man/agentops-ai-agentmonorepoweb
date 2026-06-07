#!/bin/bash
set -e

echo -e "\033[36m============================================\033[0m"
echo -e "\033[36m  AgentOps AI Agent 平台 - 开发模式启动\033[0m"
echo -e "\033[36m============================================\033[0m"
echo ""

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "\033[33m[1/4] 检查 Node.js...\033[0m"
if command -v node &> /dev/null; then
    echo -e "      \033[32mOK: Node.js $(node --version)\033[0m"
else
    echo -e "      \033[31m错误: 未检测到 Node.js，请先安装 Node.js >= 18\033[0m"
    exit 1
fi

echo -e "\033[33m[2/4] 检查 Python...\033[0m"
if command -v python3 &> /dev/null; then
    echo -e "      \033[32mOK: $(python3 --version)\033[0m"
elif command -v python &> /dev/null; then
    echo -e "      \033[32mOK: $(python --version)\033[0m"
else
    echo -e "      \033[31m错误: 未检测到 Python，请先安装 Python >= 3.10\033[0m"
    exit 1
fi

echo -e "\033[33m[3/4] 安装依赖...\033[0m"

echo "      安装 npm 依赖..."
npm install
echo -e "      \033[32mnpm 依赖安装完成\033[0m"

echo "      安装 Python 依赖..."
pip3 install -r apps/backend/requirements.txt 2>/dev/null || pip install -r apps/backend/requirements.txt
echo -e "      \033[32mPython 依赖安装完成\033[0m"

echo -e "\033[33m[4/4] 启动服务...\033[0m"
echo ""
echo -e "  \033[36m后端 API:   http://localhost:5000\033[0m"
echo -e "  \033[36m前端控制台: http://localhost:5173\033[0m"
echo ""
echo -e "  \033[90m按 Ctrl+C 停止所有服务\033[0m"
echo ""

npm run dev
