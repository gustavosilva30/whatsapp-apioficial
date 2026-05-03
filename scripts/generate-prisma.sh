#!/bin/bash

# Prisma Client Generation Script
# This script generates the Prisma Client for the updated schema

echo "🔄 Generating Prisma Client..."

# Set database URL
export DATABASE_URL="postgres://postgres:Dourados1000@crm-loja_db-whatsapp:5432/crm-loja?sslmode=disable"

# Generate Prisma Client
echo "📦 Running prisma generate..."
npx prisma generate

# Check if generation was successful
if [ $? -eq 0 ]; then
    echo "✅ Prisma Client generated successfully!"
    echo ""
    echo "📋 Generated files:"
    echo "- node_modules/@prisma/client"
    echo "- prisma/client"
    echo ""
    echo "🗄️  Schema includes:"
    echo "- Tenant (Multi-tenancy base)"
    echo "- User (with tenantId, password, role)"
    echo "- Channel (with tenantId, userId, phoneNumberId)"
    echo "- Contact (with tenantId, phone)"
    echo "- Ticket (with tenantId, contactId, assignedUserId)"
    echo "- Message (with tenantId, ticketId, content)"
    echo ""
    echo "🔧 All tables have proper multi-tenant isolation:"
    echo "- tenantId field in all main tables"
    echo "- Relationships to Tenant model"
    echo "- UpdatedAt timestamps for data tracking"
else
    echo "❌ Failed to generate Prisma Client"
    echo "Please check your DATABASE_URL and ensure the database is accessible."
fi
