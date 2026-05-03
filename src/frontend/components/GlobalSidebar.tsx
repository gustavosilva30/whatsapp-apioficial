import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Inbox, Users, BarChart3, Package, Layers, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GlobalSidebarProps {
  currentView: 'chat' | 'contacts' | 'reports' | 'settings';
  setCurrentView: (view: 'chat' | 'contacts' | 'reports' | 'settings') => void;
}

export function GlobalSidebar({ currentView, setCurrentView }: GlobalSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="w-[72px] bg-slate-900 h-full flex flex-col items-center py-5 border-r border-slate-800 shrink-0 z-20 shadow-xl">
      <div 
        onClick={() => setCurrentView('chat')}
        className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-8 cursor-pointer hover:scale-105 transition-transform" 
        title="SaaS Auto Parts"
      >
        <Layers className="w-6 h-6" />
      </div>

      <div className="flex flex-col gap-3 flex-1 w-full px-2">
        <NavItem icon={Inbox} active={currentView === 'chat'} onClick={() => setCurrentView('chat')} tooltip="Caixa de Entrada" />
        <NavItem icon={Users} active={currentView === 'contacts'} onClick={() => setCurrentView('contacts')} tooltip="Contatos CRM" />
        <NavItem icon={BarChart3} active={currentView === 'reports'} onClick={() => setCurrentView('reports')} tooltip="Relatórios e Metas" />
        
        {/* Admin Link - Only visible for ADMIN users */}
        {user?.role === 'ADMIN' && (
          <NavItem 
            icon={Shield} 
            active={false} 
            onClick={() => navigate('/admin')} 
            tooltip="Admin Dashboard" 
          />
        )}
      </div>

      <div className="mt-auto px-2 w-full">
         <NavItem icon={Settings} active={currentView === 'settings'} onClick={() => setCurrentView('settings')} tooltip="Configurações do Sistema" />
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, active, tooltip, onClick }: { icon: any, active?: boolean, tooltip: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`w-full aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-all relative group ${
        active 
          ? 'bg-blue-600/15 text-blue-400' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
      title={tooltip}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-[40%] bg-blue-500 rounded-r-full" />}
      <Icon className="w-[22px] h-[22px]" />
    </div>
  );
}
