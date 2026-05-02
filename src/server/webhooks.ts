import express, { Request, Response } from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io'; // Still importing for type, but might not be needed in this file directly if worker handles emit

// Configuração do Redis e da Fila BullMQ
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
export const metaWebhookQueue = new Queue('meta-webhook-queue', { connection: redisConnection });

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

      // Adiciona o payload cru à fila para processamento assíncrono garantido
      try {
        await metaWebhookQueue.add('process-meta-event', body, {
          attempts: 5,            // Retry logic
          backoff: {
            type: 'exponential',
            delay: 2000,          // Espera 2s no primeiro retry, dps 4s, 8s...
          },
          removeOnComplete: true, // Mantém o redis limpo
          removeOnFail: false,    // Útil para análise de erros e Dead Letter Queue
        });
        console.log('Evento adicionado à meta-webhook-queue.');
      } catch (error) {
        console.error('Erro ao adicionar evento na fila:', error);
      }
    }
  });
};
