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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware básicos
  app.use(cors());
  app.use(express.json()); // Necessário para parsear Webhooks e payloads do Gateway

  // Servidor HTTP anexado ao Express para suportar WebSockets
  const httpServer = createServer(app);
  
  // Real-Time System (Socket.io)
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  // Lógica de Conexões WebSocket
  io.on('connection', (socket) => {
    // Autenticação básica via Socket (em proc, valide JWT aqui)
    const tenantId = socket.handshake.auth.tenantId; 
    
    if (tenantId) {
      // O Atendente junta-se à "Room" do seu próprio Tenant
      socket.join(tenantId);
      console.log(`Atendente conectado na sala da empresa (tenant): ${tenantId}`);
    }

    socket.on('disconnect', () => {
      console.log('Cliente desconectado');
    });
  });

  // ===== INICIALIZAÇÃO DOS MÓDULOS SaaS (Backend) =====
  
  // 1. Endpoint do Webhook (Meta) -> Adiciona eventos à fila do BullMQ
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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SaaS Backend rodando na porta ${PORT}`);
  });
}

bootstrap().catch(console.error);

