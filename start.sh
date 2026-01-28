#!/bin/bash

# Li-SC Platform 启动脚本

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 启动 Li-SC Platform..."

# 启动后端
echo "📦 启动后端服务..."
(cd "$ROOT_DIR/server" && npm run dev) &
BACKEND_PID=$!

# 等待后端启动
sleep 2

# 启动前端
echo "🎨 启动前端服务..."
(cd "$ROOT_DIR" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "✅ 服务已启动："
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号，清理进程
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# 等待进程
wait
