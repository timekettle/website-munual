#!/bin/bash
set -e

echo "🔨 构建项目..."
npm run build

echo ""
echo "✅ 构建完成！dist 目录已生成。"
echo ""
echo "📋 部署后请在七牛云刷新以下 URL："
echo "   - https://manual.timekettle.co/index.html"
echo "   - https://manual.timekettle.co/"
