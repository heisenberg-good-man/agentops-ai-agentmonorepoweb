$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  AgentOps AI Agent 平台 - 开发模式启动" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "[1/4] 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "      OK: Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "      错误: 未检测到 Node.js，请先安装 Node.js >= 18" -ForegroundColor Red
    exit 1
}

Write-Host "[2/4] 检查 Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "      OK: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "      错误: 未检测到 Python，请先安装 Python >= 3.10" -ForegroundColor Red
    exit 1
}

Write-Host "[3/4] 安装依赖..." -ForegroundColor Yellow

Write-Host "      安装 npm 依赖..." -ForegroundColor Gray
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "      npm 依赖安装失败" -ForegroundColor Red
    exit 1
}
Write-Host "      npm 依赖安装完成" -ForegroundColor Green

Write-Host "      安装 Python 依赖..." -ForegroundColor Gray
pip install -r apps/backend/requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "      Python 依赖安装失败" -ForegroundColor Red
    exit 1
}
Write-Host "      Python 依赖安装完成" -ForegroundColor Green

Write-Host "[4/4] 启动服务..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  后端 API:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "  前端控制台: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "  按 Ctrl+C 停止所有服务" -ForegroundColor DarkGray
Write-Host ""

npm run dev
