import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { RightPanel } from './components/RightPanel';
import { GlobalSidebar } from './components/GlobalSidebar';
import { Settings } from './components/Settings';
import { Ticket, Message } from './types';
import { io, Socket } from 'socket.io-client';

// Detailed Mock Data based on an auto parts / junkyard scenario
const MOCK_TICKETS: Ticket[] = [
  {
    id: 't-1',
    status: 'OPEN',
    unreadCount: 0,
    isTyping: true,
    isPinned: true,
    contact: {
      id: 'c-1',
      name: 'Carlos Oliveira',
      phone: '+55 11 98765-4321',
      tags: ['Mercado Livre', 'Vip'],
      customFields: { 'CPF / CNPJ': '12.345.678/0001-90', 'Veículo': 'VW Gol G4 1.0 2008' },
      erpData: {
        status: 'Faturado',
        lastOrder: '#PED-10294',
        orderValue: 'R$ 850,00',
        searchingFor: 'Parachoque dianteiro original'
      }
    },
    messages: [
      { id: 'm-sys-1', content: 'ONTEM', type: 'SYSTEM', sender: 'SYSTEM', status: 'READ', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'm-1', content: 'Boa tarde, vocês têm o parachoque dianteiro do Gol G4 2008?', type: 'TEXT', sender: 'CONTACT', status: 'READ', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'm-note-1', content: 'Lembrar de verificar a grade original também. Se ele quiser, faço desconto.', type: 'INTERNAL_NOTE', sender: 'VIRTUAL_NUMBER', status: 'SENT', createdAt: new Date(Date.now() - 3550000).toISOString() },
      { id: 'm-2', content: 'Boa tarde, Carlos! Temos sim. Original usado em perfeito estado por R$ 350,00 ou paralelo novo por R$ 220,00.', type: 'TEXT', sender: 'VIRTUAL_NUMBER', status: 'READ', createdAt: new Date(Date.now() - 3500000).toISOString(), reactions: ['👍'] },
      { id: 'm-sys-2', content: 'HOJE', type: 'SYSTEM', sender: 'SYSTEM', status: 'READ', createdAt: new Date().toISOString() },
      { id: 'm-3', content: 'Manda foto do original, por favor.', type: 'TEXT', sender: 'CONTACT', status: 'READ', createdAt: new Date(Date.now() - 100000).toISOString() },
      { id: 'm-deleted', content: 'Esta mensagem foi apagada', type: 'TEXT', sender: 'CONTACT', status: 'READ', createdAt: new Date(Date.now() - 95000).toISOString(), isDeleted: true },
      { id: 'm-4', content: 'E qual o valor do frete para o CEP 01001-000?', type: 'TEXT', sender: 'CONTACT', status: 'READ', createdAt: new Date(Date.now() - 90000).toISOString() },
      { id: 'm-5', content: 'Pronto, aqui está a foto do original.', type: 'IMAGE', sender: 'VIRTUAL_NUMBER', status: 'READ', createdAt: new Date(Date.now() - 85000).toISOString(), quotedMessage: { sender: 'Carlos Oliveira', content: 'Manda foto do original, por favor.' } },
      { id: 'm-6', content: 'audio.ogg', type: 'AUDIO', sender: 'CONTACT', status: 'READ', createdAt: new Date(Date.now() - 80000).toISOString(), audioDuration: '0:12' }
    ]
  },
  {
    id: 't-2',
    status: 'OPEN',
    unreadCount: 0,
    isMuted: true,
    contact: {
      id: 'c-2',
      name: 'Oficina do Toninho',
      phone: '+55 21 99999-8888',
      tags: ['Oficina Parceira', 'Atacado'],
      customFields: { 'CNPJ': '98.765.432/0001-10', 'Responsável': 'Antônio' },
      erpData: {
        status: 'Orçamento Pendente',
        pendingQuote: 'Motor AP 1.8 Flex completo',
        orderValue: 'R$ 4.500,00'
      }
    },
    messages: [
      { id: 'm-5', content: 'Preciso de um Motor AP 1.8 Flex completo com nota baixa. Consegue?', type: 'TEXT', sender: 'CONTACT', status: 'READ', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'm-6', content: 'Fala Toninho! Acabou de entrar uma Saveiro sucata com motor intacto. Vou gerar o orçamento e te mando aqui.', type: 'TEXT', sender: 'VIRTUAL_NUMBER', status: 'READ', createdAt: new Date(Date.now() - 86000000).toISOString() },
      { id: 'm-7', content: 'Beleza, no aguardo.', type: 'TEXT', sender: 'CONTACT', status: 'READ', createdAt: new Date(Date.now() - 85000000).toISOString() }
    ]
  },
  {
    id: 't-3',
    status: 'PENDING',
    unreadCount: 1,
    contact: {
      id: 'c-3',
      name: 'Mariana Costa',
      phone: '+55 31 97777-6666',
      tags: ['Balcão', 'Devolução'],
    },
    messages: [
      { id: 'm-8', content: 'Comprei uma lanterna traseira de Corsa ontem, mas o lado está incorreto. Vocês trocam?', type: 'TEXT', sender: 'CONTACT', status: 'READ', createdAt: new Date(Date.now() - 172800000).toISOString() },
    ]
  }
];

// Initialize Last Messages
MOCK_TICKETS.forEach(t => {
  t.lastMessage = t.messages[t.messages.length - 1];
});

export function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'PENDING' | 'CLOSED'>('OPEN');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [currentView, setCurrentView] = useState<'chat' | 'settings'>('chat');

  useEffect(() => {
    // Determine the socket URL. Port 3000 is always used in this environment.
    const url = window.location.origin;
    
    // Conectando ao backend emulando o ID do Atendente (para a room no Gateway/MetaWorker)
    const newSocket = io(url, {
      auth: { tenantId: 'tenant-123' }, // Mocking for connection
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket ligado ao backend SaaS.');
    });

    newSocket.on('meta_new_message', (data: { ticketId: string, message: Message }) => {
      console.log('Nova mensagem recebida via WebSocket:', data);
      
      setTickets(prev => {
        const newTickets = [...prev];
        const tIndex = newTickets.findIndex(t => t.id === data.ticketId);
        
        if (tIndex >= 0) {
          const ticket = { ...newTickets[tIndex] };
          ticket.messages = [...ticket.messages, data.message];
          ticket.lastMessage = data.message;
          // Increment unread count if not currently selected
          if (selectedTicketId !== data.ticketId) {
            ticket.unreadCount += 1;
          }
          newTickets[tIndex] = ticket;
        } else {
          // TODO: Handle new ticket creation dynamically if not in list
        }
        
        return newTickets;
      });
    });

    newSocket.on('meta_message_status', (data: { messageId: string, status: Message['status'] }) => {
      // Atualizar status das mensagens
      setTickets(prev => {
        return prev.map(t => ({
          ...t,
          messages: t.messages.map(m => m.id === data.messageId ? { ...m, status: data.status } : m)
        }));
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [selectedTicketId]);

  const handleSelectTicket = (id: string) => {
    setSelectedTicketId(id);
    setIsRightPanelOpen(true);
    // Clear unread count
    setTickets(prev => prev.map(t => 
      t.id === id ? { ...t, unreadCount: 0 } : t
    ));
  };

  const handleSendMessage = async (ticketId: string, content: string, type: Message['type'] = 'TEXT') => {
    // 1. Otimistic Update na UI
    const newMessage: Message = {
      id: `m-temp-${Date.now()}`,
      content,
      sender: 'VIRTUAL_NUMBER',
      type: type,
      status: 'SENT',
      createdAt: new Date().toISOString()
    };

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          messages: [...t.messages, newMessage],
          lastMessage: newMessage
        };
      }
      return t;
    }));

    // 2. Disparar via API REST (Gateway) para enfileirar o Meta Webhook de envio
    try {
      console.log('Enviando para backend:', { ticketId, content });
    } catch (err) {
      console.error('Falha ao enviar:', err);
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 font-sans antialiased text-gray-800">
      <GlobalSidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      {currentView === 'chat' ? (
        <>
          {isSidebarOpen && (
            <Sidebar 
              tickets={tickets} 
              selectedTicketId={selectedTicketId} 
              onSelectTicket={handleSelectTicket}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}
          <div className="flex flex-1 overflow-hidden bg-white shadow-sm border-x border-gray-200">
            <ChatWindow 
              ticket={selectedTicket} 
              onSendMessage={handleSendMessage}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isRightPanelOpen={isRightPanelOpen}
              onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
            />
          </div>
          {isRightPanelOpen && (
            <RightPanel 
              ticket={selectedTicket} 
            />
          )}
        </>
      ) : (
        <Settings />
      )}
    </div>
  );
}
