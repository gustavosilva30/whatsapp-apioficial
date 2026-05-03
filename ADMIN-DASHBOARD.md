# Admin Dashboard - Global System Overview

## Overview
Dashboard administrativo protegido para visualizar todos os tenants, volume de mensagens, usuários e status dos serviços (PostgreSQL e Redis).

## Acesso

**URL:** `http://seu-dominio.com/admin`

**Acesso restrito:** Apenas usuários com role `ADMIN`

## Features

### 1. **Estatísticas Globais (Cards)**

4 cards principais com métricas em tempo real:

| Card | Métrica | Info Secundária |
|------|---------|-----------------|
| 🏢 **Tenants** | Total de empresas | Ativos vs Total |
| 💬 **Messages** | Total de mensagens | Hoje |
| 👥 **Users** | Total de usuários | Online agora |
| 📡 **Channels** | Total de canais | % Online |

### 2. **Lista de Tenants**

Tabela expandida mostrando:
- Nome da empresa
- CNPJ
- Status (ativo/inativo)
- Quantidade de usuários
- Quantidade de canais
- Total de mensagens
- Data de criação
- Última atividade

**Interações:**
- Click para expandir detalhes
- Ordenado por data de criação (mais recente primeiro)

### 3. **Status dos Serviços**

Monitoramento em tempo real:

#### PostgreSQL
- ✅ Status (online/offline)
- ⏱️ Latência (ms)
- ⏰ Uptime
- 📊 Versão
- 👥 Conexões ativas

#### Redis
- ✅ Status (online/offline)
- ⏱️ Latência (ms)
- ⏰ Uptime
- 📊 Versão
- 💾 Uso de memória

#### API Server
- ✅ Status
- ⏰ Uptime
- 📊 Versão
- 💾 Uso de memória

### 4. **Quick Actions**

Botões rápidos para ações administrativas:
- ➕ Criar novo tenant
- 📊 Ver relatórios completos
- 💾 Backup do banco
- 🛡️ Configurações de segurança

## Backend API

### Rotas Disponíveis:

```typescript
// Estatísticas globais
GET /api/v1/admin/stats
→ {
  totalTenants,
  activeTenants,
  totalMessages,
  messagesToday,
  totalUsers,
  activeUsers,
  totalChannels,
  activeChannels
}

// Lista de todos os tenants
GET /api/v1/admin/tenants
→ Tenant[]

// Detalhes de um tenant específico
GET /api/v1/admin/tenants/:id
→ Tenant + Users + Channels

// Status dos serviços
GET /api/v1/admin/services
→ ServiceStatus[]

// Logs do sistema
GET /api/v1/admin/logs
→ Log[]

// Criar novo tenant
POST /api/v1/admin/tenants
→ { name, cnpj, plan }

// Ativar/desativar tenant
PATCH /api/v1/admin/tenants/:id/status
→ { isActive }
```

### Middlewares:
```typescript
authenticate + requireRole('ADMIN')
```

## Componentes

### AdminDashboard.tsx
```typescript
// Estados
const [tenants, setTenants] = useState<Tenant[]>([]);
const [services, setServices] = useState<ServiceStatus[]>([]);
const [stats, setStats] = useState<SystemStats | null>(null);
const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

// Auto-refresh a cada 30 segundos
useEffect(() => {
  const interval = setInterval(fetchAdminData, 30000);
  return () => clearInterval(interval);
}, []);
```

### admin.ts (Backend)
```typescript
// Health checks em paralelo
const [pgStatus, redisStatus, apiStatus] = await Promise.all([
  checkPostgreSQL(),
  checkRedis(),
  checkAPI()
]);

// Queries otimizadas com count
prisma.tenant.count()
prisma.tenant.findMany({ include: { _count: { select: {...} } } })
```

## Design System

### Cores por Status:
```
Online:   bg-emerald-100 text-emerald-700
Warning:  bg-amber-100 text-amber-700
Offline:  bg-red-100 text-red-700
```

### Ícones (Lucide):
```typescript
Shield        // Admin icon
Building2     // Tenants
MessageSquare // Messages
Users         // Users
Wifi          // Channels
Database      // PostgreSQL
HardDrive     // Redis
Server        // API Server
Activity      // Latency
Clock         // Uptime
TrendingUp    // Growth indicator
```

### Animações:
```typescript
// Card entrance
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}

// Tenant list stagger
transition={{ delay: index * 0.05 }}

// Service status slide
initial={{ opacity: 0, x: 20 }}
```

## Screenshots Esperados

### Dashboard Overview:
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🛡️ Admin Dashboard                              [Refresh] 19:45:30│
├─────────────────────────────────────────────────────────────────────┤
├──────────┬──────────┬──────────┬──────────┐
│ 🏢 25    │ 💬 12,5K │ 👥 48    │ 📡 15    │
│ 20 ativos│ +8%      │ 32 online│ 80% on   │
└──────────┴──────────┴──────────┴──────────┘
├──────────────────────────────────────────┬────────────────────────┤
│                                          │  💾 Service Status     │
│  🏢 Active Tenants                       │  ─────────────────────│
│  ─────────────────────────────────────   │  🐘 PostgreSQL [ONLINE]│
│                                          │  Latency: 12ms         │
│  🟢 Empresa A                 1.2K msgs│  Uptime: 99.9%         │
│  🟢 Empresa B                   850 msgs│                        │
│  ⚪ Empresa C (inactive)        200 msgs│  🔴 Redis [ONLINE]     │
│                                          │  Latency: 5ms          │
│  [20 more...]                            │  Memory: 45%           │
│                                          │                        │
│                                          │  ⚙️ API Server [ONLINE]│
│                                          │  Memory: 128MB         │
│                                          │                        │
│                                          │  🔧 Quick Actions      │
│                                          │  [+ New Tenant]        │
│                                          │  [View Reports]        │
│                                          │  [DB Backup]           │
│                                          │  [Security]            │
└──────────────────────────────────────────┴────────────────────────┘
```

## Implementação

### Arquivos Criados:
1. `src/frontend/pages/AdminDashboard.tsx` (400+ linhas)
2. `src/server/routes/admin.ts` (Backend API)
3. `src/App.tsx` (Roteamento /admin)
4. `src/frontend/components/GlobalSidebar.tsx` (Link para admin)

### Integração:
```typescript
// App.tsx - Rota protegida
<Route element={<ProtectedRoute requiredRole="ADMIN" />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Route>

// GlobalSidebar.tsx - Link condicional
{user?.role === 'ADMIN' && (
  <NavItem 
    icon={Shield} 
    onClick={() => navigate('/admin')} 
    tooltip="Admin Dashboard" 
  />
)}
```

## Health Check Logic

### PostgreSQL:
```typescript
const start = Date.now();
await prisma.$queryRaw`SELECT 1`;
// Calculate latency
```

### Redis:
```typescript
const start = Date.now();
await redis.ping();
const info = await redis.info('server');
// Parse version and calculate latency
```

### API Server:
```typescript
{
  name: 'API Server',
  status: 'online',
  uptime: process.uptime(),
  memoryUsage: process.memoryUsage().heapUsed
}
```

## Auditoria

Todas as ações administrativas são logadas:
```typescript
auditLogger('ADMIN_VIEW_TENANT', { tenantId }, req);
auditLogger('ADMIN_CREATE_TENANT', { tenantId, name }, req);
auditLogger('ADMIN_TOGGLE_TENANT', { tenantId, isActive }, req);
```

## Variáveis de Ambiente

```bash
# Redis (para health check)
REDIS_URL=redis://localhost:6379

# Opcional - versão do app
npm_package_version=1.0.0
```

## Status: ✅ IMPLEMENTADO

Dashboard admin completo com:
- ✅ Proteção por role ADMIN
- ✅ Estatísticas globais em tempo real
- ✅ Lista de todos os tenants
- ✅ Status de PostgreSQL e Redis
- ✅ Auto-refresh a cada 30s
- ✅ Ícones Lucide React
- ✅ Animações com Framer Motion
- ✅ Quick Actions para admin

**Pronto para produção! 🛡️**
