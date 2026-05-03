# Channels Management Interface

## Overview
Interface completa para gerenciar canais de WhatsApp Business, incluindo configuração de webhooks, status visual e integração com Meta Business API.

## Acesso à Interface

URL: `http://seu-dominio.com/channels`

Ou adicione um link no menu principal apontando para `/channels`

## Funcionalidades

### 1. **Lista de Canais**

#### Status Visual:
- **🟢 Online** - Canal ativo e conectado
- **⚪ Offline** - Canal inativo ou desconectado

#### Informações Exibidas:
- Phone Number ID
- WhatsApp Business Account ID (WABA ID)
- Atendente responsável (se vinculado)
- Data de criação
- Última atualização

#### Ações:
- **Test Connection** - Verificar conexão com Meta API
- **Expand/Colapse** - Ver detalhes do webhook
- **Delete** - Remover canal (apenas admin)

### 2. **Webhook Configuration Display**

Para cada canal expandido, mostra:

```
┌─────────────────────────────────────────┐
│  Webhook URL:                           │
│  https://seu-dominio.com/webhook/meta   │
│  [Copy]                                 │
│                                         │
│  Verify Token:                          │
│  whst_a1b2c3d4e5f6...                   │
│  [Copy]                                 │
└─────────────────────────────────────────┘
```

### 3. **Adicionar Novo Canal**

#### Formulário:
1. **Phone Number ID** (obrigatório)
   - Encontrado no: Meta Developer → WhatsApp → API Setup
   - Formato: Número de 15 dígitos

2. **WABA ID** (obrigatório)
   - WhatsApp Business Account ID
   - Encontrado nas configurações da conta

3. **Verify Token** (obrigatório)
   - Botão "Generate" cria token automático
   - Ou insira manualmente
   - Usado pela Meta para verificar o webhook

4. **Access Token** (obrigatório)
   - System User Token permanente
   - Gerado em Meta Business Settings

#### Instruções de Configuração:

**Passo 1:** Configurar no Meta Developer Dashboard
```
1. Acesse: https://developers.facebook.com/apps
2. Selecione seu app
3. Vá em: WhatsApp → Configuration
4. Em "Webhooks", clique em "Edit"
5. Preencha:
   - Callback URL: (copie da interface)
   - Verify Token: (copie da interface)
6. Clique "Verify and Save"
```

**Passo 2:** Subscrever eventos
```
1. Após verificar, clique em "Add Subscriptions"
2. Selecione:
   - messages (receber mensagens)
   - message_statuses (status de entrega)
3. Salve
```

## Componentes Criados

### **Channels Page** (`src/frontend/pages/Channels.tsx`)

#### Features:
- ✅ Listagem de canais com status visual
- ✅ Badge Online/Offline com animação
- ✅ Expansão para detalhes do webhook
- ✅ Copy-to-clipboard para URL e Token
- ✅ Modal de adição com formulário
- ✅ Geração automática de Verify Token
- ✅ Teste de conexão
- ✅ Deleção de canal
- ✅ Animações com Framer Motion

#### Estados de Loading:
- Skeleton loader durante fetch
- Spinner durante ações
- Feedback visual de erros

#### Integração API:
```typescript
// Listar canais
GET /api/v1/channels

// Criar canal
POST /api/v1/channels
{
  phoneNumberId: string,
  wabaId: string,
  verifyToken: string,
  accessToken: string,
  userId?: string
}

// Testar conexão
POST /api/v1/channels/:id/test

// Deletar canal
DELETE /api/v1/channels/:id
```

## Design System

### Cores:
- **Online**: `bg-emerald-500` com `animate-pulse`
- **Offline**: `bg-slate-300`
- **Header**: Gradient `from-blue-50 to-indigo-50`
- **Cards**: White com shadow suave

### Ícones (Lucide):
- `Smartphone` - Canal WhatsApp
- `Webhook` - Configuração
- `Copy` - Copiar para clipboard
- `CheckCircle2` - Copiado com sucesso
- `RefreshCw` - Testar conexão
- `Plus` - Adicionar canal
- `Trash2` - Deletar

### Animações:
```typescript
// Card entrance
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} />

// Expand details
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
/>

// Modal
<motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} />
```

## Configuração do Webhook

### URL da API:
```
https://seu-dominio.com/webhook/meta
```

Ou em desenvolvimento:
```
http://localhost:3000/webhook/meta
```

### Headers na Requisição da Meta:
```
X-Hub-Signature-256: sha256=...
Content-Type: application/json
```

### Payload de Verificação:
```json
{
  "hub.mode": "subscribe",
  "hub.challenge": "random_challenge_string",
  "hub.verify_token": "seu_verify_token"
}
```

## Integração com Backend

### Rotas Utilizadas:
```typescript
// AuthContext disponibiliza apiCall global
const response = await window.apiCall('/api/v1/channels');

// Headers automáticos:
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Respostas da API:
```typescript
// Sucesso
{
  success: true,
  data: Channel[],
  count: number
}

// Erro
{
  success: false,
  error: string
}
```

## Screenshots Esperados

### Lista de Canais:
```
┌────────────────────────────────────────────────────────────┐
│ WhatsApp Channels                                    [+]  │
├────────────────────────────────────────────────────────────┤
│ 🔮 Webhook Configuration                                   │
│ Configure estas informações no Meta Developer Dashboard   │
│ Webhook URL: https://.../webhook/meta        [Copy]      │
│ Verify Token: Generate per channel below                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ● 🟢  Phone ID: 123456...                    [Online]     │
│    WABA: 987654...          [Test] [▼] [🗑️]             │
│    Assigned to: João Silva                                 │
│                                                            │
│ ● ⚪  Phone ID: 789012...                   [Offline]    │
│    WABA: 345678...          [Test] [▼] [🗑️]             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Modal Adicionar Canal:
```
┌─────────────────────────────────────────┐
│ Add WhatsApp Channel              [X]   │
├─────────────────────────────────────────┤
│                                         │
│ Phone Number ID *                       │
│ ┌─────────────────────────────────────┐ │
│ │ 123456789012345                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ WhatsApp Business Account ID *            │
│ ┌─────────────────────────────────────┐ │
│ │ 987654321098765                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Verify Token *              [Generate]  │
│ ┌─────────────────────────────────────┐ │
│ │ whst_a1b2c3d4e5f6...              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Permanent Access Token *                │
│ ┌─────────────────────────────────────┐ │
│ │ ••••••••••••••••••••••••          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📋 Webhook Configuration                │
│ Callback URL: https://.../webhook/meta│
│ Verify Token: whst_a1b2c3d4e5f6...    │
│ [Open Meta Developer Dashboard ↗]     │
│                                         │
│          [Cancel]    [Add Channel]      │
└─────────────────────────────────────────┘
```

## Troubleshooting

### "Failed to verify webhook URL"
- Verifique se o servidor está acessível publicamente
- Confirme se a URL está correta
- Verifique se o Verify Token está correto

### "Token has expired"
- O Access Token da Meta expira periodicamente
- Gere um novo token em Meta Business Settings
- Atualize o canal com o novo token

### "Phone number not found"
- Verifique se o Phone Number ID está correto
- Confirme que o número está registrado na Meta
- Verifique se a conta WABA está ativa

## Recursos

### Links Úteis:
- [Meta Developers](https://developers.facebook.com/apps)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/business-management-api)
- [Webhook Setup Guide](https://developers.facebook.com/docs/whatsapp/webhooks)

### Comando para Testar Webhook:
```bash
curl -X GET "https://seu-dominio.com/webhook/meta?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=test"
```

## Status: ✅ IMPLEMENTADO

Interface completa de gestão de canais com:
- ✅ Listagem visual com status Online/Offline
- ✅ Configuração de webhook (URL + Verify Token)
- ✅ Formulário moderno para adicionar canais
- ✅ Integração completa com backend
- ✅ Animações e feedback visual
- ✅ Copy-to-clipboard
- ✅ Teste de conexão

**Pronto para produção! 🚀**
