import express, { Request, Response } from 'express';
import { waService } from './whatsapp';
import { z } from 'zod';

/**
 * Endpoints Expostos para Sistemas Externos (Gateways para ERPs, n8n, Zapier)
 * ETAPA 4 do prompt
 */
export const registerGatewayRoutes = (app: express.Express) => {
  const router = express.Router();

  // Middleware de Autenticação da API Externa
  router.use((req: Request, res: Response, next: express.NextFunction) => {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    // Formato experado: Bearer <token_de_api_do_tenant>
    const token = bearerHeader.split(' ')[1];
    
    // Lógica mockada: Validação do token contra o DB para identificar o Tenant/Canal
    if (token === 'ERP_TOKEN_123') {
      req.body.tenantId = 'tenant-123';
      req.body.metaPhoneNumberId = '1234567890'; // Roteamento Dinâmico (Coexistência) - Viria do DB
      next();
    } else {
      return res.status(403).json({ error: 'Token inválido' });
    }
  });

  // Schema de Validação (Zod garante segurança de tipos na porta de entrada)
  const SendMessageSchema = z.object({
    to: z.string().min(10, 'O número de telefone deve conter o código do país'),
    type: z.enum(['TEXT', 'TEMPLATE']),
    text: z.string().optional(),
    template: z.object({
      name: z.string(),
      language: z.string(),
      components: z.array(z.any()).optional()
    }).optional(),
  });

  /**
   * POST /api/v1/gateway/send
   * Endpoint usado pelo ERP para Injetar mensagem e enviar
   */
  router.post('/send', async (req: Request, res: Response) => {
    try {
      const validatedData = SendMessageSchema.parse(req.body);
      const { tenantId, metaPhoneNumberId } = req.body; // Inseridos pelo middleware
      
      let metaResponse;

      // 1. Processo de Envio Real
      if (validatedData.type === 'TEXT' && validatedData.text) {
        metaResponse = await waService.sendText(
          { to: validatedData.to, metaPhoneNumberId, tenantId },
          validatedData.text
        );
      } else if (validatedData.type === 'TEMPLATE' && validatedData.template) {
        metaResponse = await waService.sendTemplate(
          { to: validatedData.to, metaPhoneNumberId, tenantId },
          validatedData.template.name,
          validatedData.template.language,
          validatedData.template.components
        );
      } else {
        return res.status(400).json({ error: 'Payload incompleto para o tipo especificado' });
      }

      // 2. Persistir a mensagem no Banco de Dados (Prisma)
      // await prisma.message.create({ ... }) associada ao `validatedData.to` (Contact) e a um Ticket.
      
      // 3. Resposta imediata para a API Externa
      res.status(200).json({ 
        success: true, 
        messageId: metaResponse?.messages?.[0]?.id || 'N/A'
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validação Falhou', details: error.errors });
      }
      res.status(500).json({ error: 'Falha interna na integração', detail: error.message });
    }
  });

  // Registra rotas sob o prefixo v1
  app.use('/api/v1/gateway', router);
};
