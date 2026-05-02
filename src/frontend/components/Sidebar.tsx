import React, { useState } from 'react';
import { Ticket, Message } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Search, Filter, Pin, VolumeX, Check, CheckCircle2, Mic } from 'lucide-react';

interface SidebarProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  activeTab: 'OPEN' | 'PENDING' | 'CLOSED';
  onTabChange: (tab: 'OPEN' | 'PENDING' | 'CLOSED') => void;
}

export function Sidebar({ tickets, selectedTicketId, onSelectTicket, activeTab, onTabChange }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTickets = tickets.filter(t => 
    t.status === activeTab && 
    (t.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     t.contact.phone.includes(searchQuery))
  );

  const getTabClass = (tab: string) => {
    const isActive = activeTab === tab;
    return `flex-1 py-3.5 text-[13px] font-bold text-center cursor-pointer transition-all border-b-[3px] ${
      isActive 
        ? 'border-blue-600 text-blue-700 bg-white' 
        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50 bg-gray-50/50'
    }`;
  };

  const renderMessageStatus = (status: Message['status']) => {
    switch (status) {
      case 'SENT': return <Check className="w-[14px] h-[14px] text-gray-400 inline-block mr-1" />;
      case 'DELIVERED': return <CheckCircle2 className="w-[14px] h-[14px] text-gray-400 inline-block mr-1" />;
      case 'READ': return <CheckCircle2 className="w-[14px] h-[14px] text-blue-500 inline-block mr-1" fill="currentColor" />;
      default: return null;
    }
  };

  const getMessagePreview = (ticket: Ticket) => {
    if (ticket.isTyping) {
      return <span className="text-[#00a884] font-medium text-[13px]">Digitando...</span>;
    }
    const msg = ticket.lastMessage;
    if (!msg) return 'Nenhuma mensagem.';
    
    let prefix = msg.sender === 'VIRTUAL_NUMBER' ? renderMessageStatus(msg.status) : null;
    let content = msg.isDeleted ? '🚫 Mensagem apagada' : 
                   msg.type === 'AUDIO' ? <span className="flex items-center gap-1"><Mic className="w-3 h-3"/> Áudio ({msg.audioDuration})</span> :
                   msg.type === 'IMAGE' ? '📷 Foto' : msg.content;
                   
    return <span className="flex items-center text-[13px] text-gray-500">{prefix} <span className="truncate">{content}</span></span>;
  };

  return (
    <div className="w-[380px] flex flex-col h-full border-r border-gray-200 bg-white shrink-0">
      
      {/* Header Profile / Search */}
      <div className="bg-gray-50 p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3 px-1">
          <h1 className="text-[22px] font-bold tracking-tight text-gray-800">Atendimentos</h1>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar ou começar uma nova conversa"
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-500 text-gray-800 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors shadow-sm tooltip" title="Filtro de conversas">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white shadow-sm z-10 w-full shrink-0 border-b border-gray-200">
        <div className={getTabClass('OPEN')} onClick={() => onTabChange('OPEN')}>
          Abertos
        </div>
        <div className={getTabClass('PENDING')} onClick={() => onTabChange('PENDING')}>
          Pendentes
        </div>
        <div className={getTabClass('CLOSED')} onClick={() => onTabChange('CLOSED')}>
          Fechados
        </div>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-400 mt-10">
            <MessageCircle className="w-10 h-10 opacity-20 mx-auto mb-3" />
            <p className="text-[14px] font-medium">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredTickets.map((ticket) => {
              const isSelected = selectedTicketId === ticket.id;
              
              return (
                <div 
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket.id)}
                  className={`flex items-stretch gap-3 pl-3 pr-4 py-3 cursor-pointer transition-all outline-none border-b border-gray-100 ${
                    isSelected 
                      ? 'bg-gray-100/80 relative before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-blue-600' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="py-0.5">
                    <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-xl font-medium overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 border border-gray-200/50">
                      {ticket.contact.avatarUrl ? (
                        <img src={ticket.contact.avatarUrl} alt={ticket.contact.name} className="w-full h-full object-cover" />
                      ) : (
                        ticket.contact.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center pb-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-[16px] font-normal truncate text-gray-900">
                        {ticket.contact.name}
                      </h3>
                      {ticket.lastMessage && (
                        <span className={`text-[12px] whitespace-nowrap pl-2 ${ticket.unreadCount > 0 ? 'text-[#00a884] font-medium' : 'text-gray-400'}`}>
                          {formatDistanceToNow(new Date(ticket.lastMessage.createdAt), { addSuffix: false, locale: ptBR })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1 truncate min-w-0">
                        {getMessagePreview(ticket)}
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ticket.isMuted && <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
                        {ticket.isPinned && <Pin className="w-3.5 h-3.5 text-gray-400" />}
                        {ticket.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#00a884] shadow-sm text-[11px] font-bold text-white">
                            {ticket.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
