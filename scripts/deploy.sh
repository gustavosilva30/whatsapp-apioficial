#!/bin/bash

# Deployment Script for WhatsApp SaaS
# This script deploys the application to the VPS

echo "🚀 Deploying WhatsApp SaaS to VPS..."

# VPS Configuration
VPS_HOST="217.216.65.15"
VPS_USER="root"
VPS_PASSWORD="Dourados1000"
APP_NAME="whatsapp-api-oficial"
APP_DIR="/opt/$APP_NAME"

# Create deployment directory
echo "📁 Creating deployment directory..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "mkdir -p $APP_DIR"

# Copy application files
echo "📦 Copying application files..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no -r . $VPS_USER@$VPS_HOST:$APP_DIR/

# Install dependencies
echo "📦 Installing dependencies..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd $APP_DIR && npm install"

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd $APP_DIR && npm run build"

# Run database migrations
echo "🔄 Running database migrations..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd $APP_DIR && npx prisma migrate deploy"

# Build frontend
echo "🎨 Building frontend..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd $APP_DIR && npm run build:frontend"

# Create systemd service
echo "⚙️ Creating systemd service..."
cat > service.template << EOF
[Unit]
Description=WhatsApp SaaS API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/config/production.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no service.template $VPS_USER@$VPS_HOST:/tmp/
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "mv /tmp/service.template /etc/systemd/system/$APP_NAME.service"

# Enable and start service
echo "🚀 Starting service..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "systemctl daemon-reload && systemctl enable $APP_NAME && systemctl start $APP_NAME"

# Check service status
echo "📊 Checking service status..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "systemctl status $APP_NAME"

echo "✅ Deployment completed!"
echo ""
echo "🌐 Application URL: https://*.crm-loja-backend-metaapi.ini6ln.easypanel.host/"
echo "📊 Service status: ssh $VPS_USER@$VPS_HOST 'systemctl status $APP_NAME'"
echo "📝 Logs: ssh $VPS_USER@$VPS_HOST 'journalctl -u $APP_NAME -f'"
