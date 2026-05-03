#!/bin/bash

# MCP Server Setup Script
# This script sets up MCP servers for PostgreSQL, Redis, and SSH access

echo "🚀 Setting up MCP Servers for WhatsApp SaaS..."

# Create MCP directory if it doesn't exist
mkdir -p ~/.config/mcp-server

# Copy MCP configuration
echo "📋 Installing MCP configuration..."
cp mcp-server.json ~/.config/mcp-server/

# Install Docker MCP images
echo "🐳 Pulling MCP Docker images..."

# PostgreSQL MCP Server
docker pull mcp/postgres

# Redis MCP Server  
docker pull mcp/redis

# SSH MCP Server
docker pull mcp/ssh

echo "✅ MCP Servers setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Restart your IDE/editor to load MCP configuration"
echo "2. Test database connection: SELECT * FROM tenants;"
echo "3. Test Redis connection: INFO"
echo "4. Test SSH connection: ls -la"
echo ""
echo "🔗 Connection details:"
echo "- PostgreSQL: crm-loja_db-whatsapp:5432/crm-loja"
echo "- Redis: crm-loja_redis-whatsapp:6379"
echo "- SSH: root@217.216.65.15"
