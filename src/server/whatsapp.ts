import axios from 'axios';

interface SendMessageOptions {
  to: string;
  metaPhoneNumberId: string; // Exigido para o roteamento dinâmico (Coexistência)
  tenantId?: string; 
}

/**
 * Serviço responsável pelo envio de requisições para a Meta Cloud API
 */
export class WhatsAppService {
  
  // Em produção, buscaríamos o accessToken no banco (Prisma) usando o metaPhoneNumberId
  private async getAccessToken(metaPhoneNumberId: string) {
    return process.env.META_ACCESS_TOKEN || 'SEU_ACCESS_TOKEN';
  }

  /**
   * Builder genérico de requisição HTTP para a Graph API
   */
  private async sendHttpRequest(metaPhoneNumberId: string, payload: any) {
    const accessToken = await this.getAccessToken(metaPhoneNumberId);
    
    // Roteamento Dinâmico: A URL aponta para o ID do número de telefone específico deste Atendente
    const url = `https://graph.facebook.com/v19.0/${metaPhoneNumberId}/messages`;
    
    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data; // Contém o wamid da mensagem
    } catch (error: any) {
      console.error('Erro ao enviar mensagem Meta:', error.response?.data || error.message);
      throw new Error('Falha no envio para a Meta Cloud API');
    }
  }

  /**
   * 1. Enviar Mensagem de Texto Simples
   */
  public async sendText(options: SendMessageOptions, text: string) {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: options.to,
      type: 'text',
      text: {
        preview_url: true,
        body: text,
      },
    };

    return this.sendHttpRequest(options.metaPhoneNumberId, payload);
  }

  /**
   * 2. Enviar Template (HSM) - Muito usado para integrações ERP e iniciação de conversas
   */
  public async sendTemplate(options: SendMessageOptions, templateName: string, languageCode: string, components: any[] = []) {
    const payload = {
      messaging_product: 'whatsapp',
      to: options.to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components, // Variáveis do template Ex: {{1}}, Botões dinâmicos, etc.
      },
    };

    return this.sendHttpRequest(options.metaPhoneNumberId, payload);
  }

  /**
   * 3. Enviar Mídia (Documento ou Imagem suportando links ou media_id da Meta)
   */
  public async sendMedia(
    options: SendMessageOptions,
    mediaType: 'image' | 'document' | 'video',
    mediaUrlOrId: string, // Pode ser uma URL pública ou um ID de mídia salvo na Meta
    caption?: string
  ) {
    
    // Determina se estamos passando um link ou um id pre-uploadado
    const isUrl = mediaUrlOrId.startsWith('http');
    const mediaPayload: any = isUrl ? { link: mediaUrlOrId } : { id: mediaUrlOrId };
    
    if (caption) {
      mediaPayload.caption = caption;
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: options.to,
      type: mediaType,
      [mediaType]: mediaPayload,
    };

    return this.sendHttpRequest(options.metaPhoneNumberId, payload);
  }
}

export const waService = new WhatsAppService();
