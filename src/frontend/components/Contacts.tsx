import React, { useState } from 'react';
import { Search, Phone, Mail, MapPin, Tag, Calendar, Filter, Plus, Edit, Trash2, Eye, User, Building, ChevronDown, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tags: string[];
  status: 'active' | 'inactive' | 'pending';
  lastContact?: string;
  totalOrders?: number;
  totalValue?: string;
  createdAt: string;
  customFields?: Record<string, string>;
}

const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    name: 'Carlos Oliveira',
    phone: '+55 11 98765-4321',
    email: 'carlos.oliveira@email.com',
    address: 'São Paulo - SP',
    tags: ['Mercado Livre', 'Vip', 'Cliente Regular'],
    status: 'active',
    lastContact: '2025-05-02',
    totalOrders: 12,
    totalValue: 'R$ 8.500,00',
    createdAt: '2024-03-15',
    customFields: {
      'CPF / CNPJ': '12.345.678/0001-90',
      'Veículo': 'VW Gol G4 1.0 2008'
    }
  },
  {
    id: 'c-2',
    name: 'Oficina do Toninho',
    phone: '+55 21 99999-8888',
    email: 'contato@oficinatoninho.com.br',
    address: 'Rio de Janeiro - RJ',
    tags: ['Oficina Parceira', 'Atacado'],
    status: 'active',
    lastContact: '2025-05-01',
    totalOrders: 8,
    totalValue: 'R$ 15.200,00',
    createdAt: '2024-01-20',
    customFields: {
      'CNPJ': '98.765.432/0001-10',
      'Responsável': 'Antônio'
    }
  },
  {
    id: 'c-3',
    name: 'Mariana Costa',
    phone: '+55 31 97777-6666',
    email: 'mariana.costa@email.com',
    address: 'Belo Horizonte - MG',
    tags: ['Balcão', 'Devolução'],
    status: 'pending',
    lastContact: '2025-04-30',
    totalOrders: 3,
    totalValue: 'R$ 450,00',
    createdAt: '2024-04-10'
  },
  {
    id: 'c-4',
    name: 'Auto Peças Central',
    phone: '+55 16 33333-2222',
    email: 'compras@autopcascentral.com.br',
    address: 'Ribeirão Preto - SP',
    tags: ['Atacado', 'Revendedor'],
    status: 'active',
    lastContact: '2025-04-28',
    totalOrders: 25,
    totalValue: 'R$ 45.000,00',
    createdAt: '2023-11-05',
    customFields: {
      'CNPJ': '45.678.901/0001-23',
      'Segmento': 'Auto Peças'
    }
  }
];

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Get unique tags for filter
  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags)));

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.phone.includes(searchQuery) ||
                         contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus;
    const matchesTag = selectedTag === 'all' || contact.tags.includes(selectedTag);
    
    return matchesSearch && matchesStatus && matchesTag;
  });

  const getStatusIcon = (status: Contact['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: Contact['status']) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'pending': return 'Pendente';
    }
  };

  const getTagColor = (tag: string) => {
    if (tag.toLowerCase().includes('vip')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (tag.toLowerCase().includes('mercado livre')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (tag.toLowerCase().includes('atacado')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (tag.toLowerCase().includes('oficina')) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="flex-1 bg-gray-50 h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contatos CRM</h1>
            <p className="text-gray-500 mt-1">Gerencie sua base de clientes e leads</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Novo Contato
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                  <option value="pending">Pendentes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300"
                >
                  <option value="all">Todas</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contacts List */}
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedidos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Contato</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </div>
                          {contact.email && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(contact.status)}
                        <span className="text-sm text-gray-900">{getStatusText(contact.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map(tag => (
                          <span key={tag} className={`px-2 py-1 text-xs font-medium rounded-md border ${getTagColor(tag)}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {contact.totalOrders || 0}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {contact.totalValue || 'R$ 0,00'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {contact.lastContact || 'Nunca'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedContact(contact)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Detalhes do Contato</h2>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedContact.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedContact.status)}
                    <span className="text-sm text-gray-600">{getStatusText(selectedContact.status)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Informações de Contato</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedContact.phone}</span>
                    </div>
                    {selectedContact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{selectedContact.email}</span>
                      </div>
                    )}
                    {selectedContact.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{selectedContact.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Informações de Vendas</h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-500">Total de Pedidos:</span>
                      <span className="ml-2 font-medium">{selectedContact.totalOrders || 0}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Valor Total:</span>
                      <span className="ml-2 font-medium">{selectedContact.totalValue || 'R$ 0,00'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Último Contato:</span>
                      <span className="ml-2 font-medium">{selectedContact.lastContact || 'Nunca'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedContact.tags.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.tags.map(tag => (
                      <span key={tag} className={`px-3 py-1 text-sm font-medium rounded-md border ${getTagColor(tag)}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedContact.customFields && Object.keys(selectedContact.customFields).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Campos Personalizados</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {Object.entries(selectedContact.customFields).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-gray-500">{key}:</span>
                        <span className="ml-2 font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
