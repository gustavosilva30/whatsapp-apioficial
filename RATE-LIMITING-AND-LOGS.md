# Rate Limiting e Logging Configuration

## Overview
Sistema de Rate Limiting com Redis e Logging estruturado com Winston para monitoramento e segurança.

## Rate Limiting

### Arquitetura
- **Store**: Redis (persistente e distribuído)
- **Key Format**: `{prefix}:{ip}:{tenantId}` ou `{prefix}:{identifier}`
- **TTL**: Automaticamente configurado pelo windowMs

### Tipos de Rate Limiters

#### 1. **General Limiter** (`/api/*`)
```typescript
windowMs: 15 minutos
max: 100 requisições
skip: /api/health, /webhook/*
```
**Uso**: Proteção geral contra abuse de API

#### 2. **Auth Limiter** (`/api/v1/auth/login`, `/api/v1/auth/refresh`)
```typescript
windowMs: 15 minutos
max: 5 tentativas
key: {ip}:{email}
```
**Uso**: Proteção contra brute force em login

#### 3. **API Key Limiter** (Gateway Externo)
```typescript
windowMs: 1 minuto
max: 60 requisições
key: x-api-key header
```
**Uso**: Controle de uso para integrações ERP

#### 4. **Webhook Limiter** (Meta Webhooks)
```typescript
windowMs: 1 minuto
max: 1000 requisições
key: phoneNumberId ou IP
```
**Uso**: Proteção contra flood de webhooks

#### 5. **Tenant Limiter** (Operações pesadas)
```typescript
windowMs: 1 minuto
max: 30 requisições
key: tenantId
```
**Uso**: Prevenir sobrecarga por tenant

### Resposta de Rate Limit Excedido
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
}
```

### Headers de Resposta
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699123456
```

## Winston Logging

### Estrutura de Logs

#### Arquivos de Log
```
logs/
├── error.log      # Apenas erros
├── combined.log   # Todos os logs
└── requests.log   # Apenas requisições HTTP
```

#### Configuração
- **Max Size**: 5MB por arquivo
- **Max Files**: 5 arquivos (rotação automática)
- **Format**: JSON estruturado (arquivos) | Colorizado (console)
- **Level**: `info` em produção, `debug` em desenvolvimento

### Tipos de Log

#### 1. **HTTP Request Logs**
```json
{
  "timestamp": "2025-05-02 19:30:45",
  "level": "info",
  "method": "POST",
  "url": "/api/v1/auth/login",
  "statusCode": 200,
  "duration": "45ms",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "tenantId": "550e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440011"
}
```

#### 2. **Error Logs**
```json
{
  "timestamp": "2025-05-02 19:30:45",
  "level": "error",
  "message": "Database connection failed",
  "stack": "Error: Connection refused...",
  "method": "GET",
  "url": "/api/v1/channels",
  "tenantId": "550e8400-e29b-41d4-a716-446655440001"
}
```

#### 3. **Audit Logs**
```json
{
  "timestamp": "2025-05-02 19:30:45",
  "level": "info",
  "action": "CHANNEL_CREATED",
  "details": {
    "channelId": "...",
    "phoneNumberId": "..."
  },
  "userId": "...",
  "userEmail": "admin@empresa.com",
  "ip": "192.168.1.1"
}
```

### Funções de Logger

#### Logger HTTP (Request)
```typescript
import { requestLogger } from './src/lib/logger';
app.use(requestLogger);  // Registra todas as requisições
```

#### Logger de Erros
```typescript
import { errorLogger } from './src/lib/logger';
errorLogger(error, req, res);  // Loga erro com contexto
```

#### Logger de Auditoria
```typescript
import { auditLogger } from './src/lib/logger';
auditLogger('CHANNEL_CREATED', { channelId, phoneNumberId }, req);
```

#### Logger de Webhooks
```typescript
import { webhookLogger } from './src/lib/logger';
webhookLogger('meta', 'message_received', data, 'success');
```

#### Logger de Database
```typescript
import { dbLogger } from './src/lib/logger';
dbLogger('create', 'channels', 45);  // 45ms de duração
```

#### Logger de Performance
```typescript
import { performanceLogger } from './src/lib/logger';
performanceLogger('heavy_operation', 1200);  // Alerta se > 1000ms
```

## Configuração no Server.ts

### Rate Limiting
```typescript
// Import
import { generalLimiter, authLimiter, apiKeyLimiter, webhookLimiter } from './src/server/middleware/rateLimit';

// Aplicação
app.use('/api/', generalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/refresh', authLimiter);
```

### Request Logging
```typescript
// Import
import { requestLogger } from './src/lib/logger';

// Aplicação (antes das rotas)
app.use(requestLogger);
```

### Global Error Handler
```typescript
app.use((err, req, res, next) => {
  import('./src/lib/logger').then(({ errorLogger }) => {
    errorLogger(err, req, res);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  });
});
```

## Monitoramento na VPS

### Ver Logs em Tempo Real
```bash
# Todas as requisições
tail -f logs/requests.log

# Apenas erros
tail -f logs/error.log

# Todos os logs (com cores)
npm run dev  # ou pm2 logs
```

### Comandos Úteis
```bash
# Contar erros nas últimas 24h
grep "$(date -d '1 day ago' '+%Y-%m-%d')" logs/error.log | wc -l

# Buscar logs por tenant
grep "tenantId.*550e8400" logs/combined.log

# Rate limiting hits
grep "Rate Limit" logs/combined.log
```

### Integração com PM2
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'whatsapp-saas',
    script: './dist/server.js',
    log_file: './logs/combined.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

## Variáveis de Ambiente

```bash
# Redis
REDIS_URL=redis://default:w5q38zychxrhx1qtzeix@crm-loja_redis-whatsapp:6379

# Logging
LOG_LEVEL=info  # debug, info, warn, error
NODE_ENV=production

# Rate Limiting (opcional - valores padrão já configurados)
RATE_LIMIT_GENERAL_MAX=100
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_WEBHOOK_MAX=1000
```

## Exemplo de Uso

### Código do Controller
```typescript
import { auditLogger } from '../lib/logger';

class ChannelController {
  static async create(req, res) {
    try {
      // ... criação do canal ...
      
      // Log de auditoria
      auditLogger('CHANNEL_CREATED', {
        channelId: channel.id,
        phoneNumberId: channel.phoneNumberId
      }, req);
      
      res.json({ success: true, data: channel });
      
    } catch (error) {
      // Erro automaticamente logado pelo global error handler
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

## Resumo

✅ **Implementado:**
- Rate Limiting com Redis Store (5 tipos diferentes)
- Winston Logger com 3 arquivos de saída
- Request logging automático
- Error logging com stack traces
- Audit logging para operações sensíveis
- Webhook logging
- Database performance logging
- Global error handler com logging

**Status:** Sistema de segurança e monitoramento completo! 🛡️
