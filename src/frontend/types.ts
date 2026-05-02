export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  tags?: string[];
  customFields?: Record<string, string>;
  erpData?: {
    status: string;
    lastOrder?: string;
    orderValue?: string;
    pendingQuote?: string;
    searchingFor?: string;
  };
}

export interface Message {
  id: string;
  content: string;
  sender: 'CONTACT' | 'VIRTUAL_NUMBER' | 'SYSTEM';
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' | 'TEMPLATE' | 'SYSTEM' | 'INTERNAL_NOTE';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  createdAt: string;
  quotedMessage?: {
    sender: string;
    content: string;
  };
  reactions?: string[];
  audioDuration?: string;
  isDeleted?: boolean;
}

export interface Ticket {
  id: string;
  contact: Contact;
  status: 'OPEN' | 'PENDING' | 'CLOSED';
  lastMessage?: Message;
  unreadCount: number;
  messages: Message[];
  isPinned?: boolean;
  isMuted?: boolean;
  isTyping?: boolean;
}

