import React, { useState } from 'react';
import { Ticket } from '../types';
import { User, Phone, Tag, Database, ShoppingCart, Info, Wrench, Search, FileText, ChevronDown, CheckCircle, Package, Link, RefreshCcw, FileSignature, Loader2, CreditCard, Zap } from 'lucide-react';

interface RightPanelProps {
  ticket: Ticket | null;
}

const Accordion = ({ title, icon: Icon, defaultOpen, children }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200/60 bg-white">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 focus:outline-none transition-colors"
      >
        <div className="flex items-center gap-3 text-gray-700">
          <Icon className="w-[18px] h-[18px] text-gray-400" />
          <span className="text-[12px] font-bold uppercase tracking-widest text-gray-600">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="p-5 pt-0">
          {children}
        </div>
      )}
    </div>
  );
};

const ActionButton = ({ icon: Icon, label, onClick, loading }: any) => {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
        loading 
          ? 'bg-gray-50 border-gray-200 cursor-wait' 
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md shadow-sm hover:bg-blue-50/20'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg transition-colors ${loading ? 'bg-gray-200 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        </div>
        <span className={`text-[13px] font-bold ${loading ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
      </div>
    </button>
  );
};

export function RightPanel({ ticket }: RightPanelProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = (actionId: string) => {
     setActionLoading(actionId);
     setTimeout(() => {
        setActionLoading(null);
     }, 1500);
  };

  if (!ticket) {
    return (
      <div className="w-[360px] bg-gray-50 p-6 flex flex-col items-center justify-center border-l border-gray-200">
        <Database className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-400 text-sm xl:text-base font-medium text-center">Contexto do Cliente</p>
        <p className="text-gray-400 text-xs text-center mt-2 max-w-[200px]">Selecione um chat para ver os dados do sistema integrado.</p>
      </div>
    );
  }

  const { contact } = ticket;

  return (
    <div className="w-[360px] bg-gray-50 h-full overflow-y-auto border-l border-gray-200 shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)]">
      
      {/* Profile Header (Static) */}
      <div className="flex flex-col items-center p-8 border-b border-gray-200/60 bg-white shadow-sm z-10 relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 text-blue-600 flex items-center justify-center text-4xl font-bold mb-4 shadow-sm border border-blue-100/50">
          {contact.avatarUrl ? (
            <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full rounded-full object-cover" />
          ) : (
             contact.name.charAt(0).toUpperCase()
          )}
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{contact.name}</h2>
        <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-sm font-medium">
          <Phone className="w-4 h-4 text-gray-400" />
          {contact.phone}
        </div>
      </div>

      <Accordion title="Dados do Cliente" icon={User} defaultOpen={true}>
        <div className="flex flex-wrap gap-2 mb-6">
          {contact.tags && contact.tags.length > 0 ? (
            contact.tags.map(tag => {
              const isVip = tag.toLowerCase().includes('vip');
              const isMercadoLivre = tag.toLowerCase().includes('mercado livre');
              
              let tagClasses = "bg-gray-100 text-gray-700 border-gray-200";
              if (isVip) tagClasses = "bg-amber-100 text-amber-800 border-amber-200";
              if (isMercadoLivre) tagClasses = "bg-yellow-100 text-yellow-800 border-yellow-200";

              return (
                <span key={tag} className={`px-2.5 py-1 text-[11px] font-bold border rounded-md shadow-sm uppercase tracking-wider ${tagClasses}`}>
                  {tag}
                </span>
              )
            })
          ) : (
            <span className="text-sm text-gray-400 font-medium">Nenhuma tag atribuída.</span>
          )}
        </div>

        {contact.customFields && Object.keys(contact.customFields).length > 0 && (
          <div className="space-y-3">
            {Object.entries(contact.customFields).map(([key, value]) => (
              <div key={key} className="bg-gray-50/80 p-3.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="block text-[11px] font-bold tracking-widest text-blue-500/80 uppercase mb-1">{key}</span>
                <span className="block text-sm font-semibold text-gray-900 break-words">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Accordion>

      <Accordion title="Integração ML / Estoque" icon={Package} defaultOpen={true}>
         <div className="relative mb-5">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar peça ou código..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400 text-gray-800 shadow-sm font-medium"
            />
         </div>

         {/* Mock Item */}
         <div className="bg-white border text-left border-gray-200 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
            <div className="flex gap-3">
              <div className="w-[52px] h-[52px] rounded-lg bg-[#f0f2f5] flex items-center justify-center shrink-0 border border-gray-100">
                <Wrench className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-bold text-gray-800 leading-tight">Motor AP 1.8 Flex Original (Gol/Saveiro)</h4>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[15px] font-black text-emerald-600 tracking-tight">R$ 2.500,00</span>
                  <span className="text-[10px] font-extrabold bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9] px-2 py-0.5 rounded-md">1 EM ESTOQUE</span>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-4 flex items-center justify-center gap-1.5 text-[13px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-lg transition-colors border border-blue-100/50">
              <Link className="w-4 h-4" />
              Anexar ao Atendimento
            </button>
         </div>
      </Accordion>

      <Accordion title="Histórico ERP" icon={Database} defaultOpen={false}>
        {contact.erpData ? (
          <div className="bg-slate-900 rounded-xl p-5 text-white relative overflow-hidden group shadow-lg border border-slate-800">
            {/* Background Icon */}
            <div className="absolute top-0 right-0 p-4 opacity-5 transform -translate-y-2 translate-x-4 mix-blend-overlay">
              <Database className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                   contact.erpData.status === 'Faturado' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-300'
                 }`}>
                   {contact.erpData.status}
                 </span>
                 {contact.erpData.lastOrder && (
                    <span className="text-slate-400 text-xs font-mono font-medium">{contact.erpData.lastOrder}</span>
                 )}
              </div>

              {contact.erpData.searchingFor && (
                <div className="mb-4">
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1 flex items-center gap-1.5"><Search className="w-3.5 h-3.5"/> Buscando Atualmente</p>
                  <p className="text-[15px] font-semibold text-white leading-tight">{contact.erpData.searchingFor}</p>
                </div>
              )}

               {contact.erpData.pendingQuote && (
                <div className="mb-4">
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Orçamento Pendente</p>
                  <p className="text-[15px] font-semibold text-white leading-tight">{contact.erpData.pendingQuote}</p>
                </div>
              )}
              
              {contact.erpData.orderValue && (
                <div className="space-y-2 pt-3 border-t border-slate-800/60 mt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Valor Total</span>
                    <span className="font-bold text-xl text-white tracking-tight">{contact.erpData.orderValue}</span>
                  </div>
                </div>
              )}

              <button className="w-full mt-5 bg-white text-slate-900 hover:bg-gray-100 transition-colors py-2.5 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm">
                <ShoppingCart className="w-4 h-4 text-slate-600" />
                Abrir no PDV
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 border-dashed rounded-xl p-5 text-center shadow-sm">
            <p className="text-gray-500 text-sm font-medium">Nenhum histórico recente no ERP.</p>
          </div>
        )}
      </Accordion>

      <Accordion title="Ações Rápidas ERP" icon={Zap} defaultOpen={true}>
         <div className="space-y-2.5">
           <ActionButton 
             icon={RefreshCcw} 
             label="Sincronizar Mercado Livre" 
             onClick={() => handleAction('ml')}
             loading={actionLoading === 'ml'}
           />
           <ActionButton 
             icon={FileSignature} 
             label="Emitir NF-e (Rascunho)" 
             onClick={() => handleAction('nfe')}
             loading={actionLoading === 'nfe'}
           />
           <ActionButton 
             icon={CreditCard} 
             label="Gerar Link de Pagamento" 
             onClick={() => handleAction('pay')}
             loading={actionLoading === 'pay'}
           />
         </div>
      </Accordion>
      
    </div>
  );
}
