#!/bin/bash

# Script to execute SQL commands via MCP
# This script runs the create-tables.sql script on the PostgreSQL database

echo "🗄️ Executing SQL script on PostgreSQL database..."

# Database connection details
DB_HOST="crm-loja_db-whatsapp"
DB_PORT="5432"
DB_NAME="crm-loja"
DB_USER="postgres"
DB_PASSWORD="Dourados1000"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Execute the SQL script
echo "📋 Creating tables and inserting sample data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f scripts/create-tables.sql

# Check if execution was successful
if [ $? -eq 0 ]; then
    echo "✅ SQL script executed successfully!"
    echo ""
    echo "📊 Tables created:"
    echo "- tenants (Empresas/SaaS clients)"
    echo "- users (Atendentes/Agentes)"
    echo "- channels (Canais WhatsApp)"
    echo "- contacts (Contatos de clientes)"
    echo "- tickets (Tickets de atendimento)"
    echo "- messages (Mensagens)"
    echo ""
    echo "🔍 Sample data inserted:"
    echo "- 2 tenants"
    echo "- 3 users"
    echo "- 2 channels"
    echo "- 3 contacts"
    echo "- 3 tickets"
    echo "- 4 messages"
    echo ""
    echo "📈 To verify the data, run:"
    echo "SELECT * FROM dashboard_summary;"
else
    echo "❌ Error executing SQL script!"
    echo "Please check your database connection and try again."
fi

# Unset password
unset PGPASSWORD
