import express, { Request, Response } from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';

// Configuração do Redis (opcional - com fallback para processamento síncrono)
let redisConnection: IORedis | null = null;
let metaWebhookQueue: Queue | null = null;
let useQueue = false;

try {
  redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 2,
  });
  // Suppress error events
  redisConnection.on('error', () => { /* Ignore connection errors */ });
  // Test connection
  redisConnection.connect().then(() => {
    console.log('[Webhooks] Redis connected, using BullMQ queue');
    useQueue = true;
    metaWebhookQueue = new Queue('meta-webhook-queue', { connection: redisConnection! });
  }).catch(() => {
    console.log('[Webhooks] Redis unavailable, using synchronous processing');
    redisConnection = null;
    useQueue = false;
  });
} catch {
  console.log('[Webhooks] Redis not configured, using synchronous processing');
  useQueue = false;
}

/**
 * Endpoint do Webhook da Meta
 * ETAPA 1: O Produtor (Refatoração do Webhook)
 */
export const registerWebhookRoutes = (app: express.Express) => {
  
  // 1. Verificação do Webhook (GET)
  app.get('/webhook/meta', (req: Request, res: Response) => {
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'MEU_TOKEN_SECRETO_123';
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  });

  // 2. Recebimento de Mensagens e Status (POST)
  app.post('/webhook/meta', async (req: Request, res: Response) => {
    const body = req.body;

    // RETORNO IMEDIATO 200 PARA EVITAR TIMEOUT DA META
    res.status(200).send('EVENT_RECEIVED');

    // Valida se o evento é originário do WhatsApp API
    if (body.object === 'whatsapp_business_account') {

      // Adiciona o payload cru à fila (se Redis disponível) ou loga para debug
      if (useQueue && metaWebhookQueue) {
        try {
          await metaWebhookQueue.add('process-meta-event', body, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
          });
          console.log('[Webhooks] Evento adicionado à fila.');
        } catch (error) {
          console.error('[Webhooks] Erro ao adicionar evento na fila:', error);
        }
      } else {
        // Modo de desenvolvimento: apenas loga o evento
        console.log('[Webhooks] Evento recebido (modo dev - sem fila):', body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id || 'no-message-id');
      }
    }
  });
};
