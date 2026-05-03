import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Redis connection (optional for development)
let redisConnection: IORedis | null = null;
let redisAvailable = false;

try {
  redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    connectTimeout: 3000,
  });
  // Suppress error events
  redisConnection.on('error', () => { /* Ignore connection errors */ });
  // Test connection
  redisConnection.connect().then(() => {
    redisAvailable = true;
    console.log('[Worker] Redis connected');
  }).catch(() => {
    console.log('[Worker] Redis unavailable - worker not started');
    redisConnection = null;
  });
} catch {
  console.log('[Worker] Redis not configured - worker not started');
}

/**
 * ETAPA 2: O Consumidor (Worker do BullMQ)
 * Escuta fila 'meta-webhook-queue', processa payloads, salva DB e dispara WebSockets.
 */
export function startMetaWorker(io: SocketIOServer) {
  if (!redisConnection || !redisAvailable) {
    console.log('[Worker] BullMQ worker not started (Redis unavailable) - webhooks will be logged but not processed');
    return null;
  }

  const worker = new Worker('meta-webhook-queue', async (job: Job) => {
    console.log(`[Worker] Processando Job ${job.id}`);
    const body = job.data;

    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) return;

      const phoneNumberId = value.metadata?.phone_number_id;

      // ---- A. Tratamento de Novas Mensagens ----
      if (value.messages && value.messages.length > 0) {
        const message = value.messages[0];
        const contactInfo = value.contacts?.[0];
        
        const senderPhone = message.from; 
        const messageId = message.id;     
        const messageType = message.type;

        let contentStr = '';
        let extractedType = 'TEXT';

        switch (messageType) {
          case 'text':
            contentStr = message.text?.body || '';
            extractedType = 'TEXT';
            break;
          case 'image':
            contentStr = `[Imagem recebida - ID: ${message.image?.id}]`;
            extractedType = 'IMAGE';
            break;
          case 'audio':
            contentStr = `[Áudio recebido - ID: ${message.audio?.id}]`;
            extractedType = 'AUDIO';
            break;
          case 'document':
            contentStr = `[Documento recebido - ID: ${message.document?.id}]`;
            extractedType = 'DOCUMENT';
            break;
          case 'button': 
            contentStr = message.button?.text || '';
            extractedType = 'TEXT'; 
            break;
          case 'interactive': 
            if (message.interactive?.type === 'button_reply') {
              contentStr = message.interactive.button_reply?.title || '';
            } else if (message.interactive?.type === 'list_reply') {
              contentStr = message.interactive.list_reply?.title || '';
            }
            extractedType = 'TEXT';
            break;
          default:
            contentStr = `[Mensagem não suportada do tipo: ${messageType}]`;
        }
        
        console.log(`[Worker] Nova MSG de ${senderPhone} para canal ${phoneNumberId}: ${contentStr}`);

        // Roteamento por Coexistência: Identifica qual atendente é dono deste número
        // Busca na tabela Channel através do phoneNumberId fornecido pelo payload da Meta.
        const channel = await prisma.channel.findUnique({
          where: { phoneNumberId: phoneNumberId },
          include: { user: true } // Inclui o atendente dono (User)
        });

        if (!channel || !channel.userId) {
          console.warn(`[Worker] Canal não encontrado ou sem atendente vinculado para phoneNumberId: ${phoneNumberId}`);
          return; // Aborta se o número não está rastreado no DB
        }

        const tenantId = channel.tenantId;
        const agentId = channel.userId;

        // A partir daqui, as integrações de BD para Contato e Ticket utilizariam tenantId e agentId
        // Mock de Criação:
        // const contact = await prisma.contact.upsert({ ... })
        // const ticket = await prisma.ticket.findFirst({ ... })
        const mockTicketId = 'ticket-456';

        const messageData = {
          ticketId: mockTicketId,
          message: {
            id: messageId,
            content: contentStr,
            sender: 'CONTACT',
            type: extractedType,
            createdAt: new Date().toISOString()
          },
          tenantId,
          agentId
        };

        // Emit to agent-specific room (direct notification to assigned agent)
        io.to(`agent:${agentId}`).emit('meta_new_message', messageData);
        
        // Also emit to tenant room (for supervisors/dashboards)
        io.to(`tenant:${tenantId}`).emit('meta_new_message', messageData);
        
        console.log(`[Worker] Message emitted to agent:${agentId} and tenant:${tenantId}`);
      }

      // ---- B. Tratamento de Status (Sent, Delivered, Read, Failed) ----
      if (value.statuses && value.statuses.length > 0) {
        const statusObj = value.statuses[0];
        const messageId = statusObj.id;
        const statusString = statusObj.status; 
        const phoneNumberId = value.metadata?.phone_number_id; // Recaptura o ID para a query
        
        console.log(`[Worker] Status de ${messageId} atualizado para: ${statusString}`);

        // Roteamento para retorno de Status de mensagem
        const channel = await prisma.channel.findUnique({
          where: { metaPhoneNumberId: phoneNumberId }
        });

        // Atualizar status no banco
        // await prisma.message.update({ where: { metaId: messageId }, data: { status: statusString.toUpperCase() }});

        if (channel && channel.userId) {
          const statusData = {
            messageId: messageId,
            status: statusString.toUpperCase(),
            tenantId: channel.tenantId,
            agentId: channel.userId
          };
          
          // Notifica especificamente o atendente via WebSocket que a mensagem foi entregue/lida
          io.to(`agent:${channel.userId}`).emit('meta_message_status', statusData);
          
          // Also emit to tenant room for dashboards/supervisors
          io.to(`tenant:${channel.tenantId}`).emit('meta_message_status', statusData);
        }
      }

    } catch (error) {
      console.error(`[Worker] Erro crítico ao processar o payload da Meta no Job ${job.id}`, error);
      throw error; // Propaga erro para que o BullMQ realize o retry (backoff)
    }
  }, { connection: redisConnection });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} falhou com o erro: ${err.message}`);
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} concluído com sucesso!`);
  });

  console.log('👷 Worker BullMQ (meta-webhook-queue) inicializado.');
  
  return worker;
}
