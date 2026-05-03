# Prisma Schema Update - Multi-Tenancy Support

## Overview
O schema Prisma foi atualizado para suportar multi-tenancy completo em todas as tabelas principais. Todas as entidades agora possuem `tenantId` para garantir isolamento de dados entre empresas (tenants).

## Alterações Realizadas

### ✅ **1. Model Tenant (Base)**
```prisma
model Tenant {
  id        String    @id @default(uuid())
  name      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt          // ADICIONADO
  users     User[]
  channels  Channel[]
  contacts  Contact[]
  tickets   Ticket[]
  messages  Message[]                    // ADICIONADO
}
```
**Alterações:**
- Adicionado `updatedAt` para tracking de modificações
- Adicionado relacionamento `messages` para acesso direto às mensagens do tenant

### ✅ **2. Model User**
```prisma
model User {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  name      String
  email     String   @unique
  password  String   // Senha hash (bcrypt)
  role      Role     @default(AGENT)
  isActive  Boolean  @default(true)
  tickets   Ticket[]
  channels  Channel[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
**Features:**
- ✅ `tenantId` para isolamento multi-tenant
- ✅ `password` para autenticação JWT
- ✅ `role` enum (ADMIN, AGENT)
- ✅ `isActive` para controle de status
- ✅ Relação com Tenant
- ✅ Relação com Tickets (atribuídos)
- ✅ Relação com Channels (responsável)

### ✅ **3. Model Channel**
```prisma
model Channel {
  id            String   @id @default(uuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  userId        String?  // Responsável pelo canal
  user          User?    @relation(fields: [userId], references: [id])
  phoneNumberId String   @unique // ID na Meta API
  wabaId        String   // WhatsApp Business Account ID
  verifyToken   String   // Token webhook
  accessToken   String   // Access Token Meta
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```
**Features:**
- ✅ `tenantId` para isolamento
- ✅ `userId` para atribuição a atendente
- ✅ Campos necessários para integração Meta API
- ✅ `isActive` para controle de status

### ✅ **4. Model Contact**
```prisma
model Contact {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  name      String
  phone     String   // wa_id da Meta
  tickets   Ticket[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt          // ADICIONADO

  @@unique([tenantId, phone]) // Contato único por tenant
}
```
**Alterações:**
- Adicionado `updatedAt` para tracking
- ✅ `tenantId` + `phone` unique constraint
- ✅ Isolamento por tenant garantido

### ✅ **5. Model Ticket**
```prisma
model Ticket {
  id             String       @id @default(uuid())
  tenantId       String
  tenant         Tenant       @relation(fields: [tenantId], references: [id])
  contactId      String
  contact        Contact      @relation(fields: [contactId], references: [id])
  assignedUserId String?
  assignedUser   User?        @relation(fields: [assignedUserId], references: [id])
  status         TicketStatus @default(OPEN)
  messages       Message[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}
```
**Features:**
- ✅ `tenantId` para isolamento
- ✅ Relação com Contact
- ✅ `assignedUserId` para atribuição
- ✅ Status enum (OPEN, PENDING, CLOSED)

### ✅ **6. Model Message** ⚠️ **ATUALIZADO**
```prisma
model Message {
  id        String        @id @default(uuid())
  tenantId  String                              // ADICIONADO
  tenant    Tenant        @relation(fields: [tenantId], references: [id]) // ADICIONADO
  ticketId  String
  ticket    Ticket        @relation(fields: [ticketId], references: [id])
  sender    SenderType
  type      MessageType
  content   Json          // Payload flexível
  metaId    String?       // ID na Meta
  status    MessageStatus @default(SENT)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt           // ADICIONADO
}
```
**Alterações Importantes:**
- ✅ **ADICIONADO** `tenantId` para isolamento multi-tenant
- ✅ **ADICIONADO** relação com `Tenant`
- ✅ **ADICIONADO** `updatedAt` para tracking

## Estrutura de Multi-Tenancy

### Isolamento por Tenant
```
Tenant (Empresa)
├── users[]         (Atendentes/Agentes)
├── channels[]      (Canais WhatsApp)
├── contacts[]      (Contatos de clientes)
├── tickets[]       (Tickets de atendimento)
└── messages[]      (Mensagens)
```

### Relacionamentos Chave
- **User** → Tenant (N:1)
- **Channel** → Tenant (N:1) + User (N:1 opcional)
- **Contact** → Tenant (N:1)
- **Ticket** → Tenant (N:1) + Contact (N:1) + User (N:1 opcional)
- **Message** → Tenant (N:1) + Ticket (N:1)

## Enums Definidos

### Role
```prisma
enum Role {
  ADMIN    // Administrador do tenant
  AGENT    // Atendente/Agente
}
```

### TicketStatus
```prisma
enum TicketStatus {
  OPEN     // Ticket aberto
  PENDING  // Aguardando resposta
  CLOSED   // Ticket fechado
}
```

### SenderType
```prisma
enum SenderType {
  VIRTUAL_NUMBER  // Enviada pelo sistema/atendente
  CONTACT         // Enviada pelo cliente
  SYSTEM          // Mensagens de sistema
}
```

### MessageType
```prisma
enum MessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  TEMPLATE
}
```

### MessageStatus
```prisma
enum MessageStatus {
  SENT      // Enviada
  DELIVERED // Entregue
  READ      // Lida
  FAILED    // Falhou
}
```

## Indexes e Constraints

### Unique Constraints
- `User.email` - Email único global
- `Channel.phoneNumberId` - Número WhatsApp único
- `Contact.[tenantId, phone]` - Contato único por tenant

### Foreign Keys (Automáticos pelo Prisma)
- Todas as tabelas têm FK para `Tenant.id` via `tenantId`
- Relações N:1 e 1:N configuradas corretamente

## Uso do Prisma Client

### Exemplo: Criar usuário com tenant
```typescript
const user = await prisma.user.create({
  data: {
    name: 'João Silva',
    email: 'joao@empresa.com',
    password: await bcrypt.hash('senha123', 12),
    role: 'AGENT',
    tenantId: 'tenant-uuid-aqui', // Isolamento
    tenant: {
      connect: { id: 'tenant-uuid-aqui' }
    }
  }
});
```

### Exemplo: Buscar tickets do tenant
```typescript
const tickets = await prisma.ticket.findMany({
  where: { tenantId: 'tenant-uuid-aqui' }, // Filtro obrigatório
  include: {
    contact: true,
    assignedUser: true,
    messages: true
  }
});
```

### Exemplo: Criar mensagem com tenant
```typescript
const message = await prisma.message.create({
  data: {
    tenantId: 'tenant-uuid-aqui', // Isolamento
    ticketId: 'ticket-uuid-aqui',
    sender: 'VIRTUAL_NUMBER',
    type: 'TEXT',
    content: { body: 'Olá!' },
    status: 'SENT'
  }
});
```

## Próximos Passos

### 1. Gerar Prisma Client
```bash
# Definir variável de ambiente
export DATABASE_URL="postgres://postgres:Dourados1000@crm-loja_db-whatsapp:5432/crm-loja?sslmode=disable"

# Gerar client
npx prisma generate

# Ou usar o script
chmod +x scripts/generate-prisma.sh
./scripts/generate-prisma.sh
```

### 2. Criar Migration (Opcional)
Se estiver usando migrations:
```bash
npx prisma migrate dev --name add_multi_tenant_support
```

### 3. Verificar Geração
```bash
# Verificar se o client foi gerado
ls node_modules/@prisma/client

# Testar conexão
npx prisma db pull
```

## Arquivos Criados/Atualizados

- ✅ `prisma/schema.prisma` - Schema atualizado
- ✅ `src/lib/prisma.ts` - Client singleton
- ✅ `scripts/generate-prisma.sh` - Script de geração

## Status: ✅ COMPLETO

Todas as tabelas principais agora possuem:
- ✅ Campo `tenantId` para isolamento
- ✅ Relação com model `Tenant`
- ✅ Timestamps `createdAt` e `updatedAt`
- ✅ Configuração de datasource com DATABASE_URL

O schema está pronto para uso multi-tenant completo! 🚀
