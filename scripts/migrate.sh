#!/bin/bash

# Database Migration Script
# This script generates and applies Prisma migrations to the database

echo "🗄️ Starting database migration..."

# Set environment variables
export DATABASE_URL="postgres://postgres:Dourados1000@crm-loja_db-whatsapp:5432/crm-loja?sslmode=disable"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Create migration
echo "🔄 Creating migration..."
npx prisma migrate dev --name init_multi_tenant_schema

# Apply migration to database
echo "✅ Applying migration to database..."
npx prisma migrate deploy

# Reset database (optional - uncomment if needed)
# echo "🔄 Resetting database..."
# npx prisma migrate reset --force

echo "✅ Migration completed successfully!"
echo ""
echo "📊 Database schema created with the following tables:"
echo "- tenants (Empresas/SaaS clients)"
echo "- users (Atendentes/Agentes)"
echo "- channels (Canais WhatsApp)"
echo "- contacts (Contatos de clientes)"
echo "- tickets (Tickets de atendimento)"
echo "- messages (Mensagens)"
echo ""
echo "🔍 To verify the migration, run:"
echo "npx prisma studio"
echo ""
echo "🌐 To connect via MCP, use:"
echo "SELECT * FROM tenants;"
