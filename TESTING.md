# 🧪 Guia de Testes Locais

## 🚀 Iniciar o Sistema

### Opção 1: Script PowerShell (Recomendado)
```powershell
# No PowerShell
.\scripts\start-local.ps1
```

### Opção 2: Script Batch
```cmd
# No CMD
scripts\start-local.bat
```

### Opção 3: Manualmente
```powershell
# Configurar variáveis
$env:DATABASE_URL = "postgres://postgres:Dourados1000@217.216.65.15:5432/crm-loja?sslmode=disable"
$env:REDIS_URL = "redis://default:w5q38zychxrhx1qtzeix@217.216.65.15:6379"
$env:JWT_SECRET = "local-dev-secret-key-change-in-production"
$env:JWT_EXPIRES_IN = "7d"
$env:PORT = "3000"
$env:NODE_ENV = "development"
$env:CORS_ORIGIN = "http://localhost:3000"
$env:META_VERIFY_TOKEN = "local_verify_token_123"
$env:META_ACCESS_TOKEN = "local_access_token_456"

# Instalar dependências (se necessário)
npm install

# Gerar Prisma Client (se necessário)
npx prisma generate

# Iniciar em modo desenvolvimento
npm run dev
```

## 🌐 Acessos

| Serviço | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **API** | http://localhost:3000/api/v1 |
| **Health Check** | http://localhost:3000/api/health |
| **Login** | http://localhost:3000/login |
| **Dashboard** | http://localhost:3000/dashboard |
| **Admin** | http://localhost:3000/admin |

## 📋 Checklist de Testes

### 1. **Health Check**
```bash
curl http://localhost:3000/api/health
```
Esperado: `{"status":"SaaS WhatsApp Integrations Backend Online"}`

### 2. **Autenticação**
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","password":"senha123"}'

# Profile (com token)
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer <token>"
```

### 3. **Canais**
```bash
# Listar canais
curl http://localhost:3000/api/v1/channels \
  -H "Authorization: Bearer <token>"

# Criar canal (ADMIN)
curl -X POST http://localhost:3000/api/v1/channels \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumberId": "123456789012345",
    "wabaId": "987654321098765",
    "verifyToken": "test_token",
    "accessToken": "test_access_token"
  }'
```

### 4. **Admin Dashboard**
```bash
# Estatísticas
curl http://localhost:3000/api/v1/admin/stats \
  -H "Authorization: Bearer <token>"

# Lista de tenants
curl http://localhost:3000/api/v1/admin/tenants \
  -H "Authorization: Bearer <token>"

# Status dos serviços
curl http://localhost:3000/api/v1/admin/services \
  -H "Authorization: Bearer <token>"
```

### 5. **WebSocket**

Conectar via browser console:
```javascript
const socket = io('ws://localhost:3000', {
  auth: { token: 'seu-jwt-token' }
});

socket.on('connect', () => console.log('Conectado!'));
socket.on('meta_new_message', (data) => console.log(data));
```

## 🔧 Troubleshooting

### Erro: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Erro: "Database connection failed"
- Verifique se o VPS está acessível
- Verifique as credenciais do banco
- Certifique-se que as portas 5432 (PostgreSQL) e 6379 (Redis) estão abertas

### Erro: "Port already in use"
```bash
# Matar processo na porta 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erro: "JWT must be provided"
- Adicione o header `Authorization: Bearer <token>`
- Verifique se o token não expirou

## 🎯 Fluxo de Teste Completo

### 1. **Setup Inicial**
```bash
# 1. Instalar dependências
npm install

# 2. Gerar Prisma Client
npx prisma generate

# 3. Iniciar servidor
.\scripts\start-local.ps1
```

### 2. **Criar Usuário Admin** (se necessário)
```sql
-- Inserir direto no banco
INSERT INTO "User" (id, email, password, name, role, "tenantId", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@exemplo.com',
  '$2a$10$...', -- bcrypt hash de 'senha123'
  'Administrador',
  'ADMIN',
  'tenant-id-aqui',
  true,
  NOW(),
  NOW()
);
```

### 3. **Testar no Browser**

1. Acesse http://localhost:3000/login
2. Faça login com as credenciais
3. Verifique o redirecionamento para /dashboard
4. Clique no menu Admin (se usuário for ADMIN)
5. Visualize estatísticas e tenants

### 4. **Testar WebSocket**

1. Abra o dashboard
2. Abra DevTools → Console
3. Execute:
```javascript
// Verificar conexão
socket.connected

// Entrar em um ticket
socket.emit('join_ticket', 'ticket-123');

// Simular digitação
socket.emit('typing', { ticketId: 'ticket-123', isTyping: true });
```

### 5. **Testar Rate Limiting**

```bash
# Fazer 110 requisições rápidas (limite é 100)
for ($i=1; $i -le 110; $i++) { 
  curl -s http://localhost:3000/api/health 
}

# Deve retornar 429 (Too Many Requests) após 100
```

### 6. **Verificar Logs**

```bash
# Em outro terminal, ver logs em tempo real
tail -f logs/combined.log

# Ou no Windows
type logs\combined.log
```

## 📊 Endpoints para Teste

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/auth/profile` | Perfil do usuário |
| GET | `/api/v1/channels` | Listar canais |
| POST | `/api/v1/channels` | Criar canal |
| DELETE | `/api/v1/channels/:id` | Deletar canal |
| GET | `/api/v1/admin/stats` | Stats globais |
| GET | `/api/v1/admin/tenants` | Lista tenants |
| GET | `/api/v1/admin/services` | Status serviços |

## 🎨 Testes no Frontend

### Tela de Login
- ✅ Formulário renderiza corretamente
- ✅ Validação de email/senha
- ✅ Animações de loading
- ✅ Redirecionamento após login
- ✅ Mensagem de erro para credenciais inválidas

### Dashboard
- ✅ Conexão Socket.IO automática
- ✅ Lista de tickets renderiza
- ✅ Menu lateral navegável
- ✅ UserMenu funciona
- ✅ Logout funciona

### Channels
- ✅ Lista de canais carrega
- ✅ Modal de adição abre
- ✅ Geração de verify token
- ✅ Copy-to-clipboard funciona
- ✅ Status online/offline visível

### Admin Dashboard
- ✅ Apenas ADMIN acessa
- ✅ Cards de estatísticas carregam
- ✅ Lista de tenants aparece
- ✅ Status de serviços em tempo real
- ✅ Auto-refresh funciona

## ✅ Verificação Final

Antes de ir para produção, verifique:

- [ ] Todas as rotas respondem corretamente
- [ ] Autenticação funciona (JWT)
- [ ] WebSocket conecta e recebe mensagens
- [ ] Rate limiting está ativo
- [ ] Logs estão sendo gerados
- [ ] Banco de dados persiste dados
- [ ] Redis está funcionando
- [ ] Frontend builda sem erros (`npm run build:frontend`)

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs em `logs/error.log`
2. Confirme variáveis de ambiente
3. Verifique conectividade com VPS
4. Teste endpoints individualmente com curl

**Bons testes! 🚀**
