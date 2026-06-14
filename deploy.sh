#!/bin/bash
# ============================================================
#  瞬云的尽头 — 部署脚本
#  使用: bash deploy.sh
# ============================================================
set -e

PROJECT="akog-blog"
DEPLOY_DIR="deploy"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
PACKAGE="${PROJECT}-${TIMESTAMP}.tar.gz"

echo "🚀 开始部署流程..."

# 1. 清理
echo "🧹 清理旧产物..."
rm -rf .next "$DEPLOY_DIR" "$PROJECT"-*.tar.gz
rm -f data/debug.log

# 2. 构建
echo "📦 构建生产版本..."
npm run build

# 3. 准备部署目录
echo "📁 打包部署文件..."
mkdir -p "$DEPLOY_DIR"

# 核心文件
cp -r .next          "$DEPLOY_DIR/"
cp -r public         "$DEPLOY_DIR/"
cp -r data           "$DEPLOY_DIR/"
cp package.json      "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp next.config.ts    "$DEPLOY_DIR/"
cp postcss.config.mjs "$DEPLOY_DIR/"
cp tsconfig.json     "$DEPLOY_DIR/"

# 环境变量模板
cat > "$DEPLOY_DIR/.env.example" << 'EOF'
# 必填：JWT 签名密钥（请改为随机字符串）
JWT_SECRET=your-random-secret-here

# 可选：SMTP 邮件配置（不配则验证码打印到控制台）
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASS=your-password
# SMTP_FROM=your-email@example.com
EOF

# 服务端启动脚本
cat > "$DEPLOY_DIR/start.sh" << 'EOF'
#!/bin/bash
set -e

# 加载环境变量
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# 安装依赖（首次）
if [ ! -d node_modules ]; then
  echo "📦 安装依赖..."
  npm install --production
fi

echo "🌐 启动服务..."
npx next start -p 3000
EOF
chmod +x "$DEPLOY_DIR/start.sh"

# PM2 配置
cat > "$DEPLOY_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'akog-blog',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      JWT_SECRET: process.env.JWT_SECRET || 'change-me',
    },
  }],
};
EOF

# 4. 打包
echo "📦 压缩打包..."
tar -czf "$PACKAGE" -C "$DEPLOY_DIR" .

# 5. 完成
PACKAGE_SIZE=$(du -h "$PACKAGE" | cut -f1)
echo ""
echo "========================================="
echo " ✅ 部署包已生成: $PACKAGE ($PACKAGE_SIZE)"
echo "========================================="
echo ""
echo "📋 服务器部署步骤:"
echo ""
echo "  1. 上传 $PACKAGE 到服务器"
echo "     scp $PACKAGE user@your-server:/home/akog/"
echo ""
echo "  2. SSH 登录服务器，解压"
echo "     ssh user@your-server"
echo "     mkdir -p /home/akog/blog && cd /home/akog/blog"
echo "     tar -xzf ../$PACKAGE"
echo ""
echo "  3. 配置环境变量"
echo "     cp .env.example .env"
echo "     nano .env  # 修改 JWT_SECRET"
echo ""
echo "  4. 安装依赖并启动（二选一）"
echo "     # 方式 A: 直接启动"
echo "     npm install --production && npm start"
echo ""
echo "     # 方式 B: PM2 保活（推荐）"
echo "     npm install -g pm2"
echo "     npm install --production"
echo "     pm2 start ecosystem.config.js"
echo "     pm2 save && pm2 startup"
echo ""
echo "  5. 配置 Nginx 反向代理"
echo "     见下方 Nginx 配置"
echo ""
echo "🗑️  清理本地打包文件: rm -rf $DEPLOY_DIR $PACKAGE"
