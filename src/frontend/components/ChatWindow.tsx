import React, { useState, useRef, useEffect } from 'react';
import { Ticket, Message } from '../types';
import { Paperclip, Smile, LayoutTemplate, Send, CheckCircle2, Check, Clock, MessageSquareDashed, Mic, Search, MoreVertical, X, Play, Trash2, Camera, User, BarChart2, FileText, ImageIcon, ChevronDown, Ban, Lock, Zap, ArrowRightLeft, Eye, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight } from 'lucide-react';
import { format } from 'date-fns';

const COMMANDS = [
  { command: '/pix', text: 'Nossa chave PIX é o CNPJ: 12.345.678/0001-90. Banco Itaú, Favorecido: Auto Peças e Desmanche SA.' },
  { command: '/garantia', text: 'Nossas peças usadas possuem garantia de 90 dias contra defeitos de funcionamento. O selo de garantia não deve ser violado ou removido.' },
  { command: '/frete', text: 'Por favor, me informe o seu CEP completo para que eu possa calcular o valor e o prazo do frete pela transportadora.' },
  { command: '/nfe', text: 'Para emitirmos sua Nota Fiscal, precisamos dos seguintes dados: CNPJ/CPF, Razão Social/Nome Completo, Inscrição Estadual (se houver) e Endereço com CEP.' },
];

interface ChatWindowProps {
  ticket: Ticket | null;
  onSendMessage: (ticketId: string, content: string, type?: Message['type']) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}

export function ChatWindow({ ticket, onSendMessage, isSidebarOpen, onToggleSidebar, isRightPanelOpen, onToggleRightPanel }: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachments, setShowAttachments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashSearch, setSlashSearch] = useState('');
  const [slashCommandIndex, setSlashCommandIndex] = useState(0);
  
  const [showTransferMenu, setShowTransferMenu] = useState(false);
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  const [transcribingMsgId, setTranscribingMsgId] = useState<string | null>(null);
  const [transcribedMsgIds, setTranscribedMsgIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  const filteredCommands = COMMANDS.filter(c => c.command.toLowerCase().startsWith(slashSearch));

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.messages]);

  // Audio Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
      setRecordingTime(0);
    }
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, [isRecording]);

  const simulateTranscription = (msgId: string) => {
    setTranscribingMsgId(msgId);
    setTimeout(() => {
       setTranscribingMsgId(null);
       setTranscribedMsgIds(prev => [...prev, msgId]);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] border-b-[6px] border-[#00a884] relative">
        <div className=" absolute top-4 left-4">
          <button onClick={onToggleSidebar} className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-gray-500 hover:text-gray-700 tooltip" title={isSidebarOpen ? "Recolher Contatos" : "Expandir Contatos"}>
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5"/> : <PanelLeft className="w-5 h-5"/>}
          </button>
        </div>
        <div className="w-80 max-w-full text-center">
          <div className="w-24 h-24 rounded-full bg-slate-200/50 flex items-center justify-center mx-auto mb-6">
             <MessageSquareDashed className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-[32px] font-light text-slate-700 tracking-tight mb-4">SaaS Atendimento</h2>
          <p className="text-slate-500 text-sm leading-relaxed">Selecione uma conversa na lista lateral para iniciar o atendimento. Receba e envie mensagens sincronizadas em tempo real via WhatsApp Cloud API.</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (inputText.trim() === '') return;
    onSendMessage(ticket.id, inputText, isInternalNote ? 'INTERNAL_NOTE' : 'TEXT');
    setInputText('');
    setReplyingTo(null);
    setShowAttachments(false);
    setIsInternalNote(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    const match = val.match(/(?:^|\s)(\/[a-z0-9_-]*)$/i);
    if (match) {
      setSlashSearch(match[1].toLowerCase());
      setShowSlashCommands(true);
      setSlashCommandIndex(0);
    } else {
      setShowSlashCommands(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashCommands && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashCommandIndex(prev => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashCommandIndex(prev => prev === 0 ? filteredCommands.length - 1 : prev - 1);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[slashCommandIndex];
        if (selected) {
           const newVal = inputText.replace(/(?:^|\s)(\/[a-z0-9_-]*)$/i, ` ${selected.text} `);
           setInputText(newVal.replace(/^\s+/, '')); 
           setShowSlashCommands(false);
        }
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageStatus = (status: Message['status']) => {
    switch (status) {
      case 'SENT': return <Check className="w-[15px] h-[15px] text-gray-400" />;
      case 'DELIVERED': return <CheckCircle2 className="w-[15px] h-[15px] text-gray-400" />;
      case 'READ': return <CheckCircle2 className="w-[15px] h-[15px] text-[#53bdeb]" fill="currentColor" />;
      case 'FAILED': return <span className="text-[10px] text-red-400 font-bold">!</span>;
      default: return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#efeae2] h-full relative overflow-hidden">
      {/* Background Pattern WhatsApp */}
      <div className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundRepeat: 'repeat' }}></div>
      
      {/* Header */}
      <div className="h-[59px] px-4 bg-gray-50 border-b border-gray-200 flex items-center shadow-sm z-10 shrink-0">
        <button onClick={onToggleSidebar} className="mr-3 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors" title={isSidebarOpen ? "Recolher Contatos" : "Expandir Contatos"}>
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5"/> : <PanelLeft className="w-5 h-5"/>}
        </button>
        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold text-gray-600 mr-4 overflow-hidden bg-gray-200 cursor-pointer">
          {ticket.contact.avatarUrl ? (
            <img src={ticket.contact.avatarUrl} alt={ticket.contact.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            ticket.contact.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0 cursor-pointer">
          <h2 className="text-[16px] font-medium text-gray-900 leading-tight truncate">{ticket.contact.name}</h2>
          <div className="flex items-center gap-1 mt-0.5">
             <p className="text-[13px] text-gray-500 truncate">Online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-gray-500">
          {/* Collision Info */}
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200 text-[11px] font-bold shadow-sm">
            <Eye className="w-3.5 h-3.5" />
            <span>Ana (Visualizando)</span>
          </div>

          {/* Transfer Button */}
          <div className="relative">
            <button 
               onClick={() => setShowTransferMenu(!showTransferMenu)} 
               className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-md border border-gray-200 text-[12px] font-bold transition-all shadow-sm focus:ring-2 focus:ring-blue-100"
            >
               <ArrowRightLeft className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Transferir</span>
            </button>
            
            {showTransferMenu && (
               <div className="absolute top-[calc(100%+8px)] right-0 w-52 bg-white border border-gray-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 py-1.5 animate-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selecione o Setor</span>
                  </div>
                  {['Suporte Técnico', 'Financeiro / Faturam.', 'Vendas (Peças Novas)', 'Logística / Frete'].map(dept => (
                     <button 
                       key={dept} 
                       onClick={() => setShowTransferMenu(false)}
                       className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-[13px] text-gray-700 font-medium transition-colors"
                     >
                       {dept}
                     </button>
                  ))}
               </div>
            )}
          </div>

          <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

          <Search className="w-5 h-5 cursor-pointer hover:text-gray-700 transition-colors" />
          <MoreVertical className="w-5 h-5 cursor-pointer hover:text-gray-700 transition-colors" />
          
          <button onClick={onToggleRightPanel} className="ml-1 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors" title={isRightPanelOpen ? "Recolher Info" : "Expandir Info"}>
            {isRightPanelOpen ? <PanelRightClose className="w-5 h-5"/> : <PanelRight className="w-5 h-5"/>}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-[5%] py-4 space-y-2 z-10">
        {ticket.messages.map((message, index) => {
          if (message.type === 'SYSTEM') {
            return (
              <div key={message.id} className="flex justify-center my-3">
                <span className="bg-white/90 text-gray-500 text-[12.5px] px-3 py-1 rounded-lg uppercase tracking-wider shadow-sm backdrop-blur-sm border border-gray-100">
                  {message.content}
                </span>
              </div>
            );
          }

          if (message.type === 'INTERNAL_NOTE') {
            return (
              <div key={message.id} className="flex justify-end mb-1 group">
                <div className="max-w-[75%] px-3 py-2 shadow-sm rounded-xl bg-[#fff9c4] text-[#827717] border border-[#fdd835]/40 relative">
                  <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                    <Lock className="w-3.5 h-3.5 text-[#f57f17]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#f57f17]">Nota Interna</span>
                  </div>
                  <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap font-medium">{message.content}</p>
                  <div className="float-right flex items-center justify-end gap-1 mt-[-6px] ml-2 pb-0.5">
                    <span className="text-[11px] leading-[15px] opacity-70">
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          const isMe = message.sender === 'VIRTUAL_NUMBER';
          const previousMessage = ticket.messages[index - 1];
          const isFirstInGroup = !previousMessage || previousMessage.sender !== message.sender || previousMessage.type === 'SYSTEM';

          return (
            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 group`}>
              <div 
                className={`max-w-[75%] px-2 py-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,.13)] relative text-[14.2px] leading-[19px] group-hover:bg-opacity-95 ${
                  isMe 
                    ? `bg-[#d9fdd3] text-[#111b21] ${isFirstInGroup ? 'rounded-tl-[7.5px] rounded-bl-[7.5px] rounded-br-[7.5px] rounded-tr-none' : 'rounded-[7.5px]'}` 
                    : `bg-white text-[#111b21] ${isFirstInGroup ? 'rounded-tr-[7.5px] rounded-br-[7.5px] rounded-bl-[7.5px] rounded-tl-none' : 'rounded-[7.5px]'}`
                }`}
              >
                {/* Tail */}
                {isFirstInGroup && (
                   <div className={`absolute top-0 w-2 h-3.5 ${
                     isMe 
                       ? '-right-2 bg-[#d9fdd3]' 
                       : '-left-2 bg-white'
                   }`} style={{ clipPath: isMe ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(100% 0, 0 0, 100% 100%)' }} />
                )}

                {/* Quoted Message */}
                {message.quotedMessage && (
                  <div className={`mb-1 p-2 rounded text-[13px] border-l-4 overflow-hidden relative cursor-pointer ${isMe ? 'bg-[#cce8c8] border-[#07bc4c]' : 'bg-[#f0f2f5] border-[#07bc4c]'}`}>
                    <span className="font-semibold text-[#07bc4c] block mb-0.5">{message.quotedMessage.sender}</span>
                    <span className="text-gray-600 line-clamp-1">{message.quotedMessage.content}</span>
                  </div>
                )}
                
                {/* Content */}
                {message.isDeleted ? (
                  <p className="text-gray-500 italic flex items-center gap-1 py-1">
                    <Ban className="w-3.5 h-3.5" />
                    {message.content}
                  </p>
                ) : message.type === 'AUDIO' ? (
                  <div className="flex flex-col gap-2 w-64 pt-1 pb-1 px-1">
                    <div className="flex items-center gap-3">
                       <div className="w-[45px] h-[45px] rounded-full bg-gray-400 flex items-center justify-center shrink-0 border border-black/5 shadow-sm">
                          <User className="w-6 h-6 text-white"/>
                       </div>
                       <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <button className="text-gray-500 hover:text-gray-800 transition-colors focus:outline-none">
                                <Play className="w-6 h-6 fill-current"/>
                             </button>
                             {/* Fake Waveform */}
                             <div className="flex-1 h-3.5 flex items-center gap-[2px]">
                                {[1, 3, 5, 8, 10, 6, 4, 3, 5, 8, 4, 3, 5, 6, 4, 9, 5, 4, 2, 1].map((h, i) => (
                                   <div key={i} className={`w-[3px] rounded-full ${isMe ? 'bg-[#76a18d]' : 'bg-gray-300'}`} style={{ height: `${h * 10}%` }}></div>
                                ))}
                             </div>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-gray-500 px-1 font-medium">
                             <span>{message.audioDuration || '0:00'}</span>
                             
                             {!transcribedMsgIds.includes(message.id) && transcribingMsgId !== message.id && (
                                <button onClick={() => simulateTranscription(message.id)} className="text-blue-500 hover:text-blue-600 font-bold transition-colors">
                                  Transcrever
                                </button>
                             )}
                             {transcribingMsgId === message.id && (
                                <span className="text-blue-500 font-bold animate-pulse">Processando...</span>
                             )}
                          </div>
                       </div>
                    </div>
                    
                    {transcribedMsgIds.includes(message.id) && (
                       <div className="mt-1 mb-1 p-2.5 rounded-lg bg-black/[0.03] text-[13.5px] text-gray-700 italic border-l-[3px] border-blue-400 leading-relaxed font-medium">
                         "Amigo, consegue ver se o parachoque vem com a grade? E quanto faz à vista no PIX, consegue melhorar esse valor?"
                       </div>
                    )}
                  </div>
                ) : message.type === 'IMAGE' ? (
                  <div className="p-0.5 rounded cursor-pointer relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=300" alt="uploaded" className="rounded max-w-sm w-full h-auto" />
                    <p className="mt-1 px-1 break-words">{message.content}</p>
                  </div>
                ) : (
                  <p className="break-words whitespace-pre-wrap ml-1 mr-12 min-w-[30px]">{message.content}</p>
                )}
                
                {/* Status / Time */}
                <div className={`float-right flex items-center justify-end gap-1 mt-[-10px] ml-2 pb-0.5 relative translate-y-1.5 ${isMe ? 'text-[#667781]' : 'text-[#667781]'}`}>
                  <span className="text-[11px] leading-[15px]">
                    {format(new Date(message.createdAt), 'HH:mm')}
                  </span>
                  {isMe && renderMessageStatus(message.status)}
                </div>

                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className={`absolute -bottom-3 ${isMe ? 'right-0' : 'left-0'} bg-white border border-gray-100 rounded-full px-1.5 py-0.5 shadow-sm text-sm z-10 flex`}>
                    {message.reactions.map((emoji, i) => <span key={i}>{emoji}</span>)}
                  </div>
                )}

                {/* Hover Context Menu Icon */}
                <div onClick={() => setReplyingTo(message)} className="absolute top-1 right-1 bg-gradient-to-l from-[#d9fdd3] via-[#d9fdd3] to-transparent text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5 pl-3 rounded-tr">
                  <ChevronDown className="w-5 h-5"/>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Menu Hover */}
      {showAttachments && (
        <div className="absolute bottom-16 left-4 z-50 bg-white p-3 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.15)] flex flex-col gap-4 animate-in slide-in-from-bottom-2">
          <div className="flex flex-col gap-3">
             <button className="flex items-center gap-3 px-2 py-1 w-full text-left hover:bg-gray-50 rounded-lg group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#b388ff] to-[#7c4dff] flex items-center justify-center text-white group-hover:-translate-y-1 transition-transform">
                   <FileText className="w-5 h-5" />
                </div>
                <span className="text-[15px] text-gray-700">Documento</span>
             </button>
             <button className="flex items-center gap-3 px-2 py-1 w-full text-left hover:bg-gray-50 rounded-lg group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#ff5252] to-[#d50000] flex items-center justify-center text-white group-hover:-translate-y-1 transition-transform">
                   <Camera className="w-5 h-5" />
                </div>
                <span className="text-[15px] text-gray-700">Câmera</span>
             </button>
             <button className="flex items-center gap-3 px-2 py-1 w-full text-left hover:bg-gray-50 rounded-lg group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#bf59cf] to-[#9c27b0] flex items-center justify-center text-white group-hover:-translate-y-1 transition-transform">
                   <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-[15px] text-gray-700">Galeria</span>
             </button>
             <button className="flex items-center gap-3 px-2 py-1 w-full text-left hover:bg-gray-50 rounded-lg group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#00bfa5] to-[#009688] flex items-center justify-center text-white group-hover:-translate-y-1 transition-transform">
                   <LayoutTemplate className="w-5 h-5" />
                </div>
                <span className="text-[15px] text-gray-700">Templates HSM</span>
             </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-[#f0f2f5] z-10 w-full relative">
        {/* Reply Context Bar */}
        {replyingTo && (
           <div className="bg-[#f0f2f5] px-4 pt-2 pb-1 relative flex">
              <div className="flex-1 bg-gray-100 rounded-lg p-3 border-l-4 border-blue-500 shadow-sm relative pr-10">
                 <h4 className="text-[13px] font-bold text-blue-500 mb-1">{replyingTo.sender === 'VIRTUAL_NUMBER' ? 'Você' : ticket.contact.name}</h4>
                 <p className="text-[13px] text-gray-600 line-clamp-1">{replyingTo.content}</p>
                 <button onClick={() => setReplyingTo(null)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4"/>
                 </button>
              </div>
           </div>
        )}

        <div className="flex items-end gap-2 px-4 py-2 min-h-[62px]">
          {isRecording ? (
             <div className="flex-1 flex items-center gap-4 bg-white rounded-lg px-4 py-3 shadow-sm">
                <Trash2 
                  className="w-6 h-6 text-red-500 cursor-pointer hover:rotate-12 transition-transform" 
                  onClick={() => setIsRecording(false)} 
                />
                <div className="flex-1 flex items-center justify-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                   <span className="text-gray-700 font-mono text-[15px]">{formatTime(recordingTime)}</span>
                </div>
                <button 
                  onClick={() => { setIsRecording(false); handleSend(); }}
                  className="p-2.5 bg-[#00a884] text-white rounded-full hover:bg-emerald-600 shadow-md flex items-center justify-center"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
             </div>
          ) : (
            <>
              <div className="flex gap-1 pb-2 shrink-0">
                <button className="p-2.5 text-[#54656f] hover:text-[#54656f] rounded-full transition-all shrink-0">
                  <Smile className="w-[26px] h-[26px]" />
                </button>
                <button 
                  onClick={() => setShowAttachments(!showAttachments)}
                  className={`p-2.5 rounded-full transition-all shrink-0 ${showAttachments ? 'bg-gray-200 text-[#54656f]' : 'text-[#54656f] hover:bg-gray-200'}`}
                >
                  <Paperclip className="w-[24px] h-[24px]" />
                </button>
              </div>
              
              <div className={`flex-1 rounded-lg border focus-within:shadow-sm flex mb-1 transition-colors relative ${isInternalNote ? 'bg-yellow-50 border-yellow-200 focus-within:border-yellow-300' : 'bg-white border-white focus-within:border-gray-200'}`}>
                
                {showSlashCommands && filteredCommands.length > 0 && (
                  <div className="absolute bottom-[calc(100%+10px)] left-0 w-96 bg-white border border-gray-200 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in slide-in-from-bottom-2">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                       <Zap className="w-4 h-4 text-blue-500" />
                       <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Respostas Rápidas</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1.5 flex flex-col gap-1">
                      {filteredCommands.map((c, i) => (
                         <div 
                           key={c.command} 
                           className={`px-3 py-2 rounded-lg cursor-pointer flex flex-col gap-1 transition-colors ${i === slashCommandIndex ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-50 border-transparent'} border`}
                           onMouseEnter={() => setSlashCommandIndex(i)}
                           onClick={() => {
                             const newVal = inputText.replace(/(?:^|\s)(\/[a-z0-9_-]*)$/i, ` ${c.text} `);
                             setInputText(newVal.replace(/^\s+/, '')); 
                             setShowSlashCommands(false);
                           }}
                         >
                           <span className="text-[13px] font-bold text-blue-700">{c.command}</span>
                           <span className="text-[12px] text-gray-600 line-clamp-2 leading-relaxed">{c.text}</span>
                         </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setIsInternalNote(!isInternalNote)}
                  className={`ml-2 my-1 p-2 rounded-full transition-all shrink-0 tooltip self-end mb-1.5 ${isInternalNote ? 'bg-yellow-200/50 text-yellow-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                  title="Nota Interna (Oculta para o cliente)"
                >
                  <Lock className="w-[20px] h-[20px]" />
                </button>

                <textarea 
                  value={inputText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder={isInternalNote ? "Adicione uma nota interna ao ticket..." : "Digite uma mensagem"}
                  className={`flex-1 bg-transparent border-none focus:ring-0 resize-none py-2.5 px-3 text-[15px] ${isInternalNote ? 'text-yellow-900 placeholder-yellow-600/60' : 'text-[#111b21] placeholder-[#8696a0]'} overflow-hidden outline-none min-h-[44px] max-h-[120px]`}
                  rows={1}
                />
              </div>

              <div className="flex pb-1 shrink-0 px-1 gap-1">
                <div className="relative">
                  <button 
                    onClick={() => setShowScheduleMenu(!showScheduleMenu)}
                    className="p-3 text-[#54656f] hover:bg-gray-200 rounded-full transition-all flex items-center justify-center shrink-0 tooltip"
                    title="Agendar Follow-up"
                  >
                    <Clock className="w-[24px] h-[24px]" />
                  </button>
                  {showScheduleMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-gray-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 py-1 overflow-hidden animate-in slide-in-from-bottom-2">
                       <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/80">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Agendar Retorno</span>
                       </div>
                       {[
                         { label: 'Hoje à tarde', time: '14:00' },
                         { label: 'Amanhã de manhã', time: '09:00' },
                         { label: 'Amanhã à tarde', time: '15:00' },
                         { label: 'Próxima segunda', time: '09:00' }
                       ].map(opt => (
                          <button 
                             key={opt.label} 
                             onClick={() => setShowScheduleMenu(false)} 
                             className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-left transition-colors group"
                          >
                             <span className="text-[13px] text-gray-700 font-bold group-hover:text-blue-700">{opt.label}</span>
                             <span className="text-[11px] font-medium text-gray-400 group-hover:text-blue-400">{opt.time}</span>
                          </button>
                       ))}
                    </div>
                  )}
                </div>

                {inputText.trim() ? (
                  <button 
                    onClick={handleSend}
                    className="p-3 text-[#54656f] hover:bg-gray-200 rounded-full transition-all flex items-center justify-center"
                  >
                    <Send className="w-6 h-6 ml-0.5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsRecording(true)}
                    className="p-3 text-[#54656f] hover:bg-gray-200 rounded-full transition-all flex items-center justify-center shrink-0"
                  >
                    <Mic className="w-[26px] h-[26px]" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
