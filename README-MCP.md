# MCP Server Configuration Guide

## Overview
Este documento descreve a configuração do MCP (Model Context Protocol) Server para acesso aos recursos do WhatsApp SaaS.

## Recursos Configurados

### 1. PostgreSQL Database
- **Host**: crm-loja_db-whatsapp:5432
- **Database**: crm-loja
- **User**: postgres
- **Password**: Dourados1000
- **SSL Mode**: disable

### 2. Redis Cache
- **Host**: crm-loja_redis-whatsapp:6379
- **Password**: w5q38zychxrhx1qtzeix
- **User**: default

### 3. SSH VPS Access
- **Host**: 217.216.65.15
- **User**: root
- **Password**: Dourados1000

## Arquivos de Configuração

### mcp-server.json
```json
{
  "mcpServers": {
    "postgres": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "--network=host", "mcp/postgres", "postgres://postgres:Dourados1000@crm-loja_db-whatsapp:5432/crm-loja?sslmode=disable"]
    },
    "redis": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "--network=host", "mcp/redis", "redis://default:w5q38zychxrhx1qtzeix@crm-loja_redis-whatsapp:6379"]
    },
    "ssh": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "--network=host", "mcp/ssh", "ssh://root:217.216.65.15"],
      "env": {"SSH_PASSWORD": "Dourados1000"}
    }
  }
}
```

## Setup Instructions

### 1. Instalar MCP Servers
```bash
chmod +x scripts/setup-mcp.sh
./scripts/setup-mcp.sh
```

### 2. Usar com Docker Compose
```bash
docker-compose -f docker-compose.mcp.yml up -d
```

### 3. Deploy para Produção
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## Queries de Teste

### PostgreSQL
```sql
-- Verificar tenants
SELECT * FROM tenants;

-- Verificar canais
SELECT * FROM channels;

-- Verificar usuários
SELECT * FROM users;

-- Verificar contatos
SELECT * FROM contacts;
```

### Redis
```bash
# Verificar informações do Redis
INFO

# Verificar chaves existentes
KEYS *

# Verificar filas do BullMQ
LLEN meta-webhook-queue
```

### SSH
```bash
# Verificar status da aplicação
systemctl status whatsapp-api-oficial

# Verificar logs
journalctl -u whatsapp-api-oficial -f

# Listar arquivos da aplicação
ls -la /opt/whatsapp-api-oficial
```

## Variáveis de Ambiente

### Production (.env)
```bash
DATABASE_URL=postgres://postgres:Dourados1000@crm-loja_db-whatsapp:5432/crm-loja?sslmode=disable
REDIS_URL=redis://default:w5q38zychxrhx1qtzeix@crm-loja_redis-whatsapp:6379
META_VERIFY_TOKEN=MEU_TOKEN_SECRETO_123
META_ACCESS_TOKEN=SEU_ACCESS_TOKEN
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=https://*.crm-loja-backend-metaapi.ini6ln.easypanel.host/
```

## EasyPanel Access

- **Email**: guga.b.139935@gmail.com
- **Password**: Dourados1000
- **Domain**: https://*.crm-loja-backend-metaapi.ini6ln.easypanel.host/

## Troubleshooting

### Problemas Comuns

1. **Docker não está rodando**
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

2. **Portas bloqueadas**
   ```bash
   # Verificar portas abertas
   netstat -tulpn | grep :3000
   
   # Abrir portas no firewall
   sudo ufw allow 3000
   ```

3. **Conexão com banco falhando**
   ```bash
   # Testar conexão PostgreSQL
   psql postgres://postgres:Dourados1000@crm-loja_db-whatsapp:5432/crm-loja
   
   # Testar conexão Redis
   redis-cli -h crm-loja_redis-whatsapp -p 6379 -a w5q38zychxrhx1qtzeix
   ```

### Logs e Monitoramento

```bash
# Logs da aplicação
ssh root@217.216.65.15 "journalctl -u whatsapp-api-oficial -f"

# Logs do Docker
docker-compose -f docker-compose.mcp.yml logs -f

# Logs do MCP
docker logs mcp-postgres
docker logs mcp-redis
docker logs mcp-ssh
```

## Segurança

⚠️ **Importante**: As credenciais neste arquivo são para desenvolvimento. Em produção:

1. Use secrets management (EasyPanel, AWS Secrets Manager, etc.)
2. Rotacione senhas regularmente
3. Use VPN ou whitelist para acesso ao banco
4. Implemente rate limiting e monitoring
5. Use SSL/TLS para todas as conexões

## Próximos Passos

1. [ ] Testar todas as conexões MCP
2. [ ] Implementar sistema de autenticação JWT
3. [ ] Configurar RBAC e permissões
4. [ ] Deploy em produção
5. [ ] Configurar monitoring e alerting
