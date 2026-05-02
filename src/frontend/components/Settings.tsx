import React, { useState } from 'react';
import { User, Building2, MessageCircle, Users, Link as LinkIcon, Camera, Save, Bell, Moon, Plus, KeyRound, Loader2, Phone, Trash2, Edit2, Hexagon, CreditCard } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'whatsapp' | 'team' | 'integrations'>('profile');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className="flex-1 flex bg-gray-50 h-full overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-[280px] bg-white border-r border-gray-200 flex flex-col shrink-0 shadow-sm z-10">
        <div className="p-6 pb-4">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Configurações</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Gerencie seu hub de atendimento</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <SettingsTab 
            id="profile" 
            label="Meu Perfil" 
            icon={User} 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
          />
          <SettingsTab 
            id="company" 
            label="Empresa" 
            icon={Building2} 
            active={activeTab === 'company'} 
            onClick={() => setActiveTab('company')} 
          />
          <SettingsTab 
            id="whatsapp" 
            label="API do WhatsApp" 
            icon={MessageCircle} 
            active={activeTab === 'whatsapp'} 
            onClick={() => setActiveTab('whatsapp')} 
          />
          <SettingsTab 
            id="team" 
            label="Equipe" 
            icon={Users} 
            active={activeTab === 'team'} 
            onClick={() => setActiveTab('team')} 
          />
          <SettingsTab 
            id="integrations" 
            label="Integrações" 
            icon={LinkIcon} 
            active={activeTab === 'integrations'} 
            onClick={() => setActiveTab('integrations')} 
          />
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'company' && <CompanyTab />}
          {activeTab === 'whatsapp' && <WhatsAppTab />}
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}

          {/* Action Footer */}
          <div className="mt-8 flex justify-end">
             <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center min-w-[140px] shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ label, icon: Icon, active, onClick }: { label: string, icon: any, active: boolean, onClick: () => void, id: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
        active 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
      <span className="text-[14px]">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
    </button>
  );
}

function ProfileTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden border-t-4 border-t-blue-500">
        <div className="p-8 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Informações Pessoais</h3>
          <p className="text-gray-500 text-sm font-medium">Atualize sua foto e detalhes de login.</p>
        </div>
        
        <div className="p-8 space-y-8">
           <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center relative group cursor-pointer transition-colors hover:border-blue-400">
                 <User className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                 <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                 </div>
              </div>
              <div className="flex-1">
                 <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm">
                   Alterar Foto
                 </button>
                 <p className="text-gray-400 text-xs font-medium mt-2">JPG, GIF ou PNG. Tamanho máximo de 2MB.</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1.5">Nome Completo</label>
                 <input type="text" defaultValue="Carlos Oliveira" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-400 transition-all text-sm font-semibold text-gray-800" />
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1.5">E-mail</label>
                 <input type="email" defaultValue="carlos@saasparts.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-400 transition-all text-sm font-semibold text-gray-800" />
              </div>
              <div className="col-span-2">
                 <label className="block text-sm font-bold text-gray-700 mb-1.5">Nova Senha</label>
                 <div className="relative">
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-400 transition-all text-sm font-semibold text-gray-800" />
                    <KeyRound className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                 </div>
              </div>
           </div>

           <hr className="border-gray-100 border-dashed" />

           <div>
              <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-6">Preferências</h4>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                          <Bell className="w-5 h-5 text-blue-600" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-800">Notificações Sonoras</p>
                          <p className="text-[12px] font-medium text-gray-500">Tocar um som "plim" ao receber mensagens.</p>
                       </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 transition-colors"></div>
                    </label>
                 </div>

                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                          <Moon className="w-5 h-5 text-slate-600" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-800">Tema Escuro</p>
                          <p className="text-[12px] font-medium text-gray-500">Aparência do painel para redução de brilho.</p>
                       </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 transition-colors"></div>
                    </label>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function CompanyTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden border-t-4 border-t-indigo-500">
        <div className="p-8 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Empresa e Atendimento</h3>
          <p className="text-gray-500 text-sm font-medium">Dados faturáveis e regras de fila automática.</p>
        </div>
        
        <div className="p-8 space-y-6">
           <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 sm:col-span-1">
                 <label className="block text-sm font-bold text-gray-700 mb-1.5">Razão Social</label>
                 <input type="text" defaultValue="Auto Peças SaaS Ltda" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-400 transition-all text-sm font-semibold text-gray-800" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                 <label className="block text-sm font-bold text-gray-700 mb-1.5">CNPJ</label>
                 <input type="text" defaultValue="12.345.678/0001-90" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-400 transition-all text-sm font-semibold text-gray-800 font-mono" />
              </div>
           </div>

           <hr className="border-gray-100 border-dashed" />

           <div>
              <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-4">Horário Comercial</h4>
              <div className="bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden">
                 {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((day) => (
                    <div key={day} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 bg-white">
                       <div className="flex items-center gap-4 min-w-[120px]">
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" className="sr-only peer" defaultChecked />
                           <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 transition-colors"></div>
                         </label>
                         <span className="text-sm font-bold text-gray-700">{day}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <input type="time" defaultValue="08:00" className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-sm font-semibold text-gray-700" />
                          <span className="text-gray-400 font-bold text-xs uppercase">Até</span>
                          <input type="time" defaultValue="18:00" className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-sm font-semibold text-gray-700" />
                       </div>
                    </div>
                 ))}
                 <div className="flex items-center justify-between p-4 bg-gray-50/50">
                    <div className="flex items-center gap-4 min-w-[120px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 transition-colors"></div>
                      </label>
                      <span className="text-sm font-bold text-gray-500">Sábado</span>
                    </div>
                 </div>
              </div>
           </div>

           <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Mensagem de Ausência Automática</label>
              <textarea 
                 rows={3} 
                 defaultValue="Olá! Nosso horário de atendimento é de segunda a sexta, das 08h às 18h. Deixe sua mensagem e responderemos no próximo dia útil!"
                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white focus:border-indigo-400 transition-all text-sm font-medium text-gray-800 resize-none" 
              />
              <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-wide">Enviada automaticamente fora do horário comercial.</p>
           </div>
        </div>
      </div>
    </div>
  );
}

function WhatsAppTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden border-t-4 border-t-[#25D366]">
        <div className="p-8 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
               WhatsApp Business API
            </h3>
            <p className="text-gray-500 text-sm font-medium">Configure suas credenciais do Meta Developer.</p>
          </div>
          <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             Conectado
          </div>
        </div>
        
        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 gap-5">
              <div>
                 <label className="block text-[13px] font-bold text-gray-700 mb-1.5">System User Token (Permanente)</label>
                 <input type="password" defaultValue="EAAQx123...abc" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:bg-white focus:border-[#25D366] transition-all text-sm font-semibold text-gray-800 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                 <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">WABA ID</label>
                    <input type="text" defaultValue="112233445566778" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:bg-white focus:border-[#25D366] transition-all text-sm font-semibold text-gray-800 font-mono" />
                 </div>
                 <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Webhook Verify Token</label>
                    <input type="text" defaultValue="meu_token_secreto_saas_2026" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:bg-white focus:border-[#25D366] transition-all text-sm font-semibold text-gray-800 font-mono" />
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h4 className="text-[14px] font-bold text-gray-900 uppercase tracking-wide">Canais / Números Vinculados</h4>
          <button className="flex items-center gap-1.5 text-[12px] font-bold text-[#25D366] bg-[#25D366]/10 px-3 py-1.5 rounded-lg hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20">
             <Plus className="w-3.5 h-3.5" /> Adicionar Número
          </button>
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-white border-b border-gray-100 text-[11px] uppercase tracking-widest text-gray-400">
                    <th className="px-6 py-3 font-bold">Número (WABA)</th>
                    <th className="px-6 py-3 font-bold">Phone Number ID</th>
                    <th className="px-6 py-3 font-bold">Atendente Default</th>
                    <th className="px-6 py-3 font-bold text-right">Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 <tr className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20">
                             <Phone className="w-4 h-4 text-[#25D366]" />
                          </div>
                          <span className="text-[14px] font-bold text-gray-800 tracking-tight">+55 11 9876-0001</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-[12px] font-mono font-medium text-gray-500">105349202029302</td>
                    <td className="px-6 py-4 text-[13px] font-semibold text-gray-700">Geral / Recepção</td>
                    <td className="px-6 py-4 text-right">
                       <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-widest rounded-md border border-emerald-100">Conectado</span>
                    </td>
                 </tr>
                 <tr className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20">
                             <Phone className="w-4 h-4 text-[#25D366]" />
                          </div>
                          <span className="text-[14px] font-bold text-gray-800 tracking-tight">+55 11 9876-0002</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-[12px] font-mono font-medium text-gray-500">105349202029303</td>
                    <td className="px-6 py-4 text-[13px] font-semibold text-gray-700">Carlos - Vendas</td>
                    <td className="px-6 py-4 text-right">
                       <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-widest rounded-md border border-emerald-100">Conectado</span>
                    </td>
                 </tr>
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function TeamTab() {
  const users = [
    { id: 1, name: 'Administrador SaaS', email: 'admin@saasparts.com', role: 'Admin', initial: 'A', color: 'bg-indigo-100 text-indigo-700' },
    { id: 2, name: 'Carlos - Vendas', email: 'carlos@saasparts.com', role: 'Atendente', initial: 'C', color: 'bg-emerald-100 text-emerald-700' },
    { id: 3, name: 'Ana - Suporte', email: 'ana@saasparts.com', role: 'Atendente', initial: 'A', color: 'bg-blue-100 text-blue-700' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden border-t-4 border-t-purple-500">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Membros da Equipe</h3>
            <p className="text-gray-500 text-sm font-medium">Controle de acesso e atendentes da plataforma.</p>
          </div>
          <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-[13px] transition-colors shadow-[0_4px_10px_rgba(147,51,234,0.3)]">
             <Plus className="w-4 h-4" /> Convidar Usuário
          </button>
        </div>
        
        <div className="p-6 space-y-4">
           {users.map(u => (
             <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50/50 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-200 transition-colors group">
                <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[15px] ${u.color} shadow-sm border border-black/5`}>
                      {u.initial}
                   </div>
                   <div>
                      <p className="text-[14px] font-bold text-gray-900">{u.name}</p>
                      <p className="text-[12px] font-medium text-gray-500">{u.email}</p>
                   </div>
                </div>
                <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto">
                   <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-200 text-gray-600 border border-gray-300'}`}>
                      {u.role}
                   </span>
                   <div className="flex items-center gap-2 ml-auto sm:ml-0">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip" title="Editar Usuário">
                         <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip" title="Remover">
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden border-t-4 border-t-rose-500">
        <div className="p-8 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Hub de Integrações</h3>
          <p className="text-gray-500 text-sm font-medium">Conecte seu CRM a ERPs, sistemas fiscais e e-commerce.</p>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
           <IntegrationCard 
             title="ERP Automotivo Pró"
             desc="Sincronização de catálogo de peças, categorias e preços em tempo real."
             icon={Hexagon}
             color="bg-orange-100 text-orange-600 border-orange-200"
             active={true}
           />
           <IntegrationCard 
             title="NFe.io - Emissão Fiscal"
             desc="Sistema automático de emissão e envio imediato de XML via WhatsApp."
             icon={Building2}
             color="bg-blue-100 text-blue-600 border-blue-200"
             active={false}
           />
           <IntegrationCard 
             title="Mercado Livre"
             desc="Atrelar link do ML na base de respostas curtas automaticamente."
             icon={LinkIcon}
             color="bg-yellow-100 text-yellow-700 border-yellow-200"
             active={false}
           />
           <IntegrationCard 
             title="Stripe - Pagamentos"
             desc="Envio de links de pagamento instantâneo por cartão de crédito e PIX."
             icon={CreditCard}
             color="bg-indigo-100 text-indigo-600 border-indigo-200"
             active={true}
           />
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({ title, desc, icon: Icon, color, active }: any) {
  return (
    <div className={`p-6 rounded-xl border-2 transition-all group hover:shadow-md ${active ? 'bg-white border-green-400/50 hover:border-green-400' : 'bg-gray-50/50 border-gray-200 hover:border-rose-300'}`}>
      <div className="flex items-start gap-4">
         <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${color} shadow-sm group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
         </div>
         <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
               <h4 className="text-[15px] font-bold text-gray-900">{title}</h4>
               <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}></div>
            </div>
            <p className="text-[13px] text-gray-500 font-medium leading-snug mb-4">{desc}</p>
            
            <div>
               <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{active ? 'Token Configurado' : 'Acess Token'}</label>
               <input 
                 type={active ? "password" : "text"} 
                 defaultValue={active ? "••••••••••••••••" : ""} 
                 placeholder="Cole seu Bearer Token aqui"
                 className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all text-xs font-mono" 
               />
            </div>
         </div>
      </div>
    </div>
  );
}
