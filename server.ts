import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Importa nossas rotas vitais criadas
import { registerWebhookRoutes } from './src/server/webhooks';
import { registerGatewayRoutes } from './src/server/gateway';
import { startMetaWorker } from './src/server/workers/metaWorker';
import authRoutes from './src/server/auth/auth.routes';
import channelRoutes from './src/server/routes/channels';
import adminRoutes from './src/server/routes/admin';
import { socketAuthMiddleware, joinTenantRoom, leaveTenantRoom } from './src/server/socket/socket.auth';
import { generalLimiter, authLimiter, apiKeyLimiter, webhookLimiter } from './src/server/middleware/rateLimit';
import { requestLogger } from './src/lib/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = process.env.PORT || 3000;

  const corsOrigin = process.env.CORS_ORIGIN || 'https://whatsapp-apioficial.vercel.app';
  const allowedOrigins = corsOrigin.split(',').map(o => o.trim());

  // Middleware básicos - CORS aberto para diagnóstico
  app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  // Responde preflight OPTIONS imediatamente
  app.options('*', cors());
  app.use(express.json()); // Necessário para parsear Webhooks e payloads do Gateway

  // Request Logging (Winston)
  app.use(requestLogger);

  // Rate Limiting
  app.use('/api/', generalLimiter);        // General API rate limiting
  app.use('/api/v1/auth/login', authLimiter); // Strict rate limit for login
  app.use('/api/v1/auth/refresh', authLimiter); // Strict rate limit for refresh

  // Servidor HTTP anexado ao Express para suportar WebSockets
  const httpServer = createServer(app);

  // Real-Time System (Socket.io)
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Apply authentication middleware to all socket connections
  io.use(socketAuthMiddleware);

  // Lógica de Conexões WebSocket com Rooms por Tenant/Agente
  io.on('connection', (socket) => {
    const authSocket = socket as import('./src/server/socket/socket.auth').AuthenticatedSocket;
    
    console.log(`🔌 New socket connection: ${socket.id}`);
    
    // Join tenant and agent rooms
    joinTenantRoom(authSocket);
    
    // Handle client events
    socket.on('join_ticket', (ticketId: string) => {
      const ticketRoom = `ticket:${ticketId}`;
      socket.join(ticketRoom);
      console.log(`👤 User joined ticket room: ${ticketRoom}`);
    });

    socket.on('leave_ticket', (ticketId: string) => {
      const ticketRoom = `ticket:${ticketId}`;
      socket.leave(ticketRoom);
      console.log(`👤 User left ticket room: ${ticketRoom}`);
    });

    socket.on('typing', (data: { ticketId: string; isTyping: boolean }) => {
      // Broadcast typing status to other users in the ticket room
      const ticketRoom = `ticket:${data.ticketId}`;
      socket.to(ticketRoom).emit('typing', {
        userId: authSocket.user?.userId,
        ticketId: data.ticketId,
        isTyping: data.isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      leaveTenantRoom(authSocket);
    });
  });

  // Make io available globally for workers
  (global as any).io = io;

  // ===== INICIALIZAÇÃO DOS MÓDULOS SaaS (Backend) =====

  // 1. Auth Routes (Authentication & Authorization)
  app.use('/api/v1/auth', authRoutes);

  // 2. Channel Routes (WhatsApp Numbers Management)
  app.use('/api/v1/channels', channelRoutes);
  
  // 3. Admin Routes (System Administration)
  app.use('/api/v1/admin', adminRoutes);
  
  // 4. Endpoint do Webhook (Meta) -> Adiciona eventos à fila do BullMQ
  registerWebhookRoutes(app);
  
  // 2. Gateway Externo (Integrações ERP) -> Rota de injeção de mensagens.
  registerGatewayRoutes(app);

  // 3. Worker Background -> Processamento Assíncrono com Redis/BullMQ
  startMetaWorker(io);

  // ====================================================

  // Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'SaaS WhatsApp Integrations Backend Online' });
  });

  // Global Error Handler (must be last)
  app.use((err: any, req: any, res: any, next: any) => {
    import('./src/lib/logger').then(({ errorLogger }) => {
      errorLogger(err, req, res);
      
      const statusCode = err.statusCode || err.status || 500;
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message;
      
      res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
      });
    });
  });

  // Configuração Vite para ambiente de Desenvolvimento (AI Studio / Local)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 SaaS Backend rodando na porta ${PORT}`);
  });
}

bootstrap().catch(console.error);

