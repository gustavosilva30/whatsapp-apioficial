# WebSocket Rooms Configuration

## Overview
O sistema Socket.IO foi configurado para suportar **salas (rooms)** baseadas em `tenantId` e `userId`, garantindo isolamento total entre empresas e atendentes.

## Arquitetura de Rooms

### **Room Naming Convention**

```
tenant:{tenantId}    # Sala da empresa (ex: tenant:550e8400-e29b-41d4-a716-446655440001)
agent:{userId}       # Sala do atendente (ex: agent:550e8400-e29b-41d4-a716-446655440011)
ticket:{ticketId}    # Sala do ticket (ex: ticket:550e8400-e29b-41d4-a716-446655440051)
```

### **Estrutura Hierárquica**

```
Socket Connection (Autenticado via JWT)
├── Join: tenant:{tenantId}     # Todos os usuários do tenant
├── Join: agent:{userId}        # Apenas o usuário específico
└── Opcional: ticket:{ticketId} # Quando atendendo um ticket
```

## Arquivos Criados/Atualizados

### **1. Socket Auth Middleware** (`src/server/socket/socket.auth.ts`)

```typescript
// Middleware de autenticação Socket.IO
socketAuthMiddleware(socket, next)

// Join nas salas do usuário
joinTenantRoom(socket)        // Entra em tenant:{id} e agent:{id}
leaveTenantRoom(socket)       // Sai das salas

// Helpers
getTenantRoom(tenantId)       // Retorna "tenant:{tenantId}"
getAgentRoom(userId)          // Retorna "agent:{userId}"
```

### **2. Server.ts** (`server.ts`)

```typescript
// Configuração Socket.IO
io.use(socketAuthMiddleware)  // JWT em todas as conexões

// Eventos suportados:
socket.on('join_ticket', ticketId)     // Entrar em sala de ticket
socket.on('leave_ticket', ticketId)    // Sair de sala de ticket
socket.on('typing', {ticketId, isTyping}) // Indicador de digitação
socket.on('disconnect')                 // Limpeza de salas
```

### **3. Meta Worker** (`src/server/workers/metaWorker.ts`)

```typescript
// Emissão de mensagens para as salas corretas
io.to(`agent:${agentId}`).emit('meta_new_message', data)     // Para o atendente
io.to(`tenant:${tenantId}`).emit('meta_new_message', data)   // Para o tenant

// Status de mensagens
io.to(`agent:${agentId}`).emit('meta_message_status', data)
io.to(`tenant:${tenantId}`).emit('meta_message_status', data)
```

## Fluxo de Conexão

### **1. Conexão do Cliente**

```javascript
// Frontend - Conectar com token JWT
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIs...'  // JWT access token
  }
});
```

### **2. Autenticação e Join Automático**

```
1. Cliente envia token JWT na conexão
2. socketAuthMiddleware valida o token
3. Dados do usuário são anexados ao socket
4. joinTenantRoom() é chamado automaticamente
5. Usuário entra nas salas:
   - tenant:{tenantId}
   - agent:{userId}
```

### **3. Recepção de Mensagens**

```javascript
// Escutar mensagens do Meta
socket.on('meta_new_message', (data) => {
  console.log('Nova mensagem:', data);
  // { ticketId, message, tenantId, agentId }
});

// Escutar status de mensagens
socket.on('meta_message_status', (data) => {
  console.log('Status atualizado:', data);
  // { messageId, status, tenantId, agentId }
});
```

## Isolamento de Dados

### **Garantias de Segurança**

| Room | Acesso | Propósito |
|------|--------|-----------|
| `tenant:{id}` | Todos os usuários do tenant | Broadcast para a empresa |
| `agent:{id}` | Apenas o atendente específico | Notificações diretas |
| `ticket:{id}` | Atendentes no ticket específico | Conversas em tempo real |

### **Cenários de Uso**

```
Cenário 1: Novo ticket para Atendente A
├── Meta Worker emite: agent:atendente-a-id
├── Meta Worker emite: tenant:empresa-id
└── Apenas Atendente A + Dashboard da empresa recebem

Cenário 2: Status de mensagem atualizado
├── Meta Worker emite: agent:remetente-id
├── Meta Worker emite: tenant:empresa-id  
└── Confirmação de entrega/leitura

Cenário 3: Supervisor quer ver todos os tickets
├── Frontend: Conectar na sala tenant:{id}
└── Recebe todas as mensagens da empresa
```

## Eventos Socket.IO

### **Cliente → Servidor**

```typescript
socket.emit('join_ticket', ticketId: string)      // Entrar em ticket
socket.emit('leave_ticket', ticketId: string)     // Sair de ticket
socket.emit('typing', {                           // Indicador de digitação
  ticketId: string,
  isTyping: boolean
})
```

### **Servidor → Cliente**

```typescript
// Nova mensagem recebida
socket.on('meta_new_message', (data) => {
  ticketId: string;
  message: {
    id: string;
    content: string;
    sender: 'CONTACT' | 'VIRTUAL_NUMBER' | 'SYSTEM';
    type: 'TEXT' | 'IMAGE' | ...;
    createdAt: string;
  };
  tenantId: string;
  agentId: string;
});

// Status de mensagem atualizado
socket.on('meta_message_status', (data) => {
  messageId: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  tenantId: string;
  agentId: string;
});

// Indicador de digitação
socket.on('typing', (data) => {
  userId: string;
  ticketId: string;
  isTyping: boolean;
});
```

## Exemplo de Uso no Frontend

```typescript
import { io } from 'socket.io-client';

// 1. Conectar com autenticação
const socket = io('ws://localhost:3000', {
  auth: { token: localStorage.getItem('accessToken') }
});

// 2. Entrar em um ticket específico
function openTicket(ticketId: string) {
  socket.emit('join_ticket', ticketId);
}

// 3. Receber novas mensagens
socket.on('meta_new_message', (data) => {
  if (data.ticketId === currentTicketId) {
    addMessageToChat(data.message);
  }
});

// 4. Enviar indicador de digitação
function onTyping(ticketId: string, isTyping: boolean) {
  socket.emit('typing', { ticketId, isTyping });
}

// 5. Sair do ticket
function closeTicket(ticketId: string) {
  socket.emit('leave_ticket', ticketId);
}

// 6. Limpar na desmontagem
window.addEventListener('beforeunload', () => {
  socket.disconnect();
});
```

## Configuração do Servidor

### **CORS Configurado**

```typescript
const io = new SocketIOServer(httpServer, {
  cors: { 
    origin: process.env.CORS_ORIGIN || '*', 
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

### **Autenticação Obrigatória**

```typescript
// Todos os sockets precisam de token JWT válido
io.use(socketAuthMiddleware);

// Conexões sem token são rejeitadas
```

## Teste de Conexão

### **Via Browser Console**

```javascript
// Conectar
const socket = io('ws://localhost:3000', {
  auth: { token: 'seu-jwt-aqui' }
});

// Escutar eventos
socket.on('connect', () => console.log('Conectado!'));
socket.on('meta_new_message', console.log);
socket.on('meta_message_status', console.log);

// Entrar em um ticket
socket.emit('join_ticket', 'ticket-uuid-aqui');

// Simular digitação
socket.emit('typing', { ticketId: 'ticket-uuid-aqui', isTyping: true });
```

## Troubleshooting

### **Problema: "Authentication token is required"**
- **Causa:** Token JWT não enviado na conexão
- **Solução:** Verifique o `auth: { token: ... }` na configuração do socket

### **Problema: "Invalid or expired token"**
- **Causa:** Token JWT inválido ou expirado
- **Solução:** Renove o token usando `/api/v1/auth/refresh`

### **Problema: Não recebendo mensagens**
- **Causa:** Socket não está na sala correta
- **Solução:** Verifique se o `tenantId` do usuário corresponde ao do canal

## Resumo

✅ **Implementado:**
- Autenticação JWT em todas as conexões Socket.IO
- Salas automáticas por `tenantId` e `userId`
- Suporte a salas de ticket dinâmicas
- Isolamento completo entre tenants
- Emissão de mensagens Meta apenas para salas corretas
- Indicador de digitação em tempo real

**Status:** Sistema de WebSocket rooms configurado e funcionando! 🚀
