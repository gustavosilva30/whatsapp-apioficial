# Database Setup Guide

## Overview
Este documento descreve como criar as tabelas do WhatsApp SaaS no banco de dados PostgreSQL.

## Pré-requisitos
- MCP Server configurado e funcionando
- Acesso ao banco PostgreSQL: `crm-loja_db-whatsapp:5432/crm-loja`
- Credenciais: `postgres:Dourados1000`

## Opções de Execução

### Opção 1: Via MCP Server (Recomendado)
Use o MCP Server PostgreSQL para executar os comandos SQL diretamente:

```sql
-- Copie e cole o conteúdo do arquivo scripts/create-tables.sql no MCP
```

### Opção 2: Via Script Bash
```bash
chmod +x scripts/run-sql.sh
./scripts/run-sql.sh
```

### Opção 3: Via psql direto
```bash
psql -h crm-loja_db-whatsapp -p 5432 -U postgres -d crm-loja -f scripts/create-tables.sql
```

## Estrutura das Tabelas Criadas

### 1. **tenants** (Empresas/SaaS clients)
- `id`: UUID (Primary Key)
- `name`: Nome da empresa
- `created_at`, `updated_at`: Timestamps

### 2. **users** (Atendentes/Agentes)
- `id`: UUID (Primary Key)
- `tenant_id`: FK para tenants
- `name`, `email`, `password`: Dados do usuário
- `role`: ADMIN ou AGENT
- `is_active`: Status do usuário

### 3. **channels** (Canais WhatsApp)
- `id`: UUID (Primary Key)
- `tenant_id`: FK para tenants
- `user_id`: FK para users (responsável pelo canal)
- `phone_number_id`: ID do número na Meta API
- `waba_id`: WhatsApp Business Account ID
- `verify_token`, `access_token`: Credenciais Meta
- `is_active`: Status do canal

### 4. **contacts** (Contatos de clientes)
- `id`: UUID (Primary Key)
- `tenant_id`: FK para tenants
- `name`, `phone`: Dados do contato
- `unique(tenant_id, phone)`: Contato único por tenant

### 5. **tickets** (Tickets de atendimento)
- `id`: UUID (Primary Key)
- `tenant_id`: FK para tenants
- `contact_id`: FK para contacts
- `assigned_user_id`: FK para users
- `status`: OPEN, PENDING ou CLOSED

### 6. **messages** (Mensagens)
- `id`: UUID (Primary Key)
- `ticket_id`: FK para tickets
- `sender`: VIRTUAL_NUMBER, CONTACT ou SYSTEM
- `type`: TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT ou TEMPLATE
- `content`: JSONB com payload
- `meta_id`: ID da mensagem na Meta
- `status`: SENT, DELIVERED, READ ou FAILED

## Dados de Exemplo Inseridos

### Tenants
- **Empresa Exemplo LTDA** (ID: 550e8400-e29b-41d4-a716-446655440001)
- **Auto Peças Central S/A** (ID: 550e8400-e29b-41d4-a716-446655440002)

### Usuários
- **admin@exemplo.com** (ADMIN) - Empresa Exemplo
- **atendente1@exemplo.com** (AGENT) - Empresa Exemplo
- **admin@autpecas.com** (ADMIN) - Auto Peças Central

### Canais
- **Phone Number ID**: 1234567890 - Empresa Exemplo
- **Phone Number ID**: 0987654321 - Auto Peças Central

### Contatos
- Carlos Oliveira (5511987654321)
- Mariana Costa (5531977756666)
- Oficina do Toninho (5521999998888)

## Views e Índices

### Dashboard Summary View
```sql
SELECT * FROM dashboard_summary;
```

Retorna estatísticas por tenant:
- Total de usuários, canais, contatos, tickets, mensagens
- Contagem de tickets por status (OPEN, PENDING, CLOSED)

### Índices Criados
- Índices em todas as FKs para performance
- Índices em campos frequentemente consultados
- Índice em `messages.created_at` para consultas temporais

## Validação da Instalação

### Verificar Tabelas
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Verificar Dados
```sql
-- Contar registros por tabela
SELECT 
    'tenants' as table_name, COUNT(*) as record_count FROM tenants
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'channels', COUNT(*) FROM channels
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'messages', COUNT(*) FROM messages;
```

### Testar Relacionamentos
```sql
-- Verificar tickets com usuários atribuídos
SELECT 
    t.id as ticket_id,
    t.status,
    c.name as contact_name,
    u.name as assigned_user,
    u.email
FROM tickets t
JOIN contacts c ON t.contact_id = c.id
LEFT JOIN users u ON t.assigned_user_id = u.id;
```

## Próximos Passos

1. ✅ Criar estrutura das tabelas
2. ✅ Inserir dados de exemplo
3. ⏳ Implementar sistema de autenticação JWT
4. ⏳ Criar APIs CRUD para gestão de entidades
5. ⏳ Configurar WebSocket rooms por agente
6. ⏳ Implementar frontend de gestão

## Troubleshooting

### Erros Comuns

1. **Conexão recusada**
   - Verifique se o banco está acessível
   - Confirme as credenciais
   - Teste com: `psql -h crm-loja_db-whatsapp -U postgres -d crm-loja`

2. **Permissões negadas**
   - Verifique se o usuário tem permissões de CREATE
   - Execute: `GRANT ALL PRIVILEGES ON DATABASE crm-loja TO postgres;`

3. **Tabelas já existentes**
   - O script usa `IF NOT EXISTS` para evitar conflitos
   - Para resetar: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`

### Logs e Monitoramento
```sql
-- Verificar tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;
```

## Performance Considerations

- Índices criados em todas as FKs
- Particionamento pode ser considerado para tabelas grandes (messages)
- Considerar materialized views para relatórios complexos
- Monitorar queries lentas com `EXPLAIN ANALYZE`
