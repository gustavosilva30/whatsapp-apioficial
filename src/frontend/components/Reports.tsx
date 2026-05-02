import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, MessageSquare, ShoppingCart, DollarSign, Calendar, Download, Filter, ChevronDown, Target, Award, AlertCircle, CheckCircle, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ReportData {
  period: string;
  totalMessages: number;
  totalContacts: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  responseTime: number;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
  category: 'sales' | 'service' | 'efficiency';
}

const MOCK_REPORTS_DATA: ReportData[] = [
  { period: 'Jan 2025', totalMessages: 1240, totalContacts: 89, totalOrders: 45, totalRevenue: 12500, conversionRate: 50.6, responseTime: 2.3 },
  { period: 'Fev 2025', totalMessages: 1380, totalContacts: 102, totalOrders: 52, totalRevenue: 15800, conversionRate: 51.0, responseTime: 2.1 },
  { period: 'Mar 2025', totalMessages: 1420, totalContacts: 95, totalOrders: 48, totalRevenue: 14200, conversionRate: 50.5, responseTime: 2.4 },
  { period: 'Abr 2025', totalMessages: 1560, totalContacts: 110, totalOrders: 58, totalRevenue: 18900, conversionRate: 52.7, responseTime: 1.9 },
  { period: 'Mai 2025', totalMessages: 1480, totalContacts: 98, totalOrders: 55, totalRevenue: 17200, conversionRate: 56.1, responseTime: 1.8 },
];

const MOCK_GOALS: Goal[] = [
  {
    id: 'g-1',
    title: 'Meta de Vendas',
    description: 'Atingir R$ 100.000 em vendas mensais',
    target: 100000,
    current: 72000,
    unit: 'R$',
    deadline: '2025-05-31',
    status: 'at-risk',
    category: 'sales'
  },
  {
    id: 'g-2',
    title: 'Tempo de Resposta',
    description: 'Manter tempo médio de resposta abaixo de 2 minutos',
    target: 2,
    current: 1.8,
    unit: 'min',
    deadline: '2025-05-31',
    status: 'on-track',
    category: 'service'
  },
  {
    id: 'g-3',
    title: 'Taxa de Conversão',
    description: 'Aumentar taxa de conversão para 60%',
    target: 60,
    current: 56.1,
    unit: '%',
    deadline: '2025-06-30',
    status: 'on-track',
    category: 'efficiency'
  },
  {
    id: 'g-4',
    title: 'Novos Contatos',
    description: 'Adicionar 150 novos contatos qualificados',
    target: 150,
    current: 142,
    unit: 'contatos',
    deadline: '2025-05-31',
    status: 'behind',
    category: 'sales'
  }
];

export function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'detailed'>('overview');

  const currentMonthData = MOCK_REPORTS_DATA[MOCK_REPORTS_DATA.length - 1];
  const previousMonthData = MOCK_REPORTS_DATA[MOCK_REPORTS_DATA.length - 2];

  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getGoalIcon = (category: Goal['category']) => {
    switch (category) {
      case 'sales': return <DollarSign className="w-5 h-5" />;
      case 'service': return <MessageSquare className="w-5 h-5" />;
      case 'efficiency': return <Target className="w-5 h-5" />;
    }
  };

  const getGoalStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'on-track': return 'text-green-600 bg-green-100 border-green-200';
      case 'at-risk': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'behind': return 'text-red-600 bg-red-100 border-red-200';
      case 'completed': return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getGoalStatusText = (status: Goal['status']) => {
    switch (status) {
      case 'on-track': return 'No Caminho';
      case 'at-risk': return 'Em Risco';
      case 'behind': return 'Atrasado';
      case 'completed': return 'Concluído';
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const StatCard = ({ title, value, change, icon: Icon, unit = '', color = 'blue' }: any) => {
    const changeData = calculateChange(value, change);
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200'
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg border ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          {change !== value && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              changeData.direction === 'up' ? 'text-green-600' : 
              changeData.direction === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {changeData.direction === 'up' && <ArrowUp className="w-4 h-4" />}
              {changeData.direction === 'down' && <ArrowDown className="w-4 h-4" />}
              {changeData.direction === 'neutral' && <Minus className="w-4 h-4" />}
              {changeData.value.toFixed(1)}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-gray-900">
            {unit === 'R$' ? formatCurrency(value) : `${value.toLocaleString('pt-BR')}${unit}`}
          </p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-gray-50 h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios e Metas</h1>
            <p className="text-gray-500 mt-1">Acompanhe o desempenho do seu negócio</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period === 'day' && 'Hoje'}
              {period === 'week' && 'Esta Semana'}
              {period === 'month' && 'Este Mês'}
              {period === 'year' && 'Este Ano'}
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Relatório</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300">
                  <option>Todos</option>
                  <option>Vendas</option>
                  <option>Atendimento</option>
                  <option>Marketing</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'goals'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Metas
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'detailed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Relatórios Detalhados
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Mensagens Enviadas"
                value={currentMonthData.totalMessages}
                change={previousMonthData.totalMessages}
                icon={MessageSquare}
                color="blue"
              />
              <StatCard
                title="Novos Contatos"
                value={currentMonthData.totalContacts}
                change={previousMonthData.totalContacts}
                icon={Users}
                color="green"
              />
              <StatCard
                title="Pedidos Realizados"
                value={currentMonthData.totalOrders}
                change={previousMonthData.totalOrders}
                icon={ShoppingCart}
                color="purple"
              />
              <StatCard
                title="Faturamento"
                value={currentMonthData.totalRevenue}
                change={previousMonthData.totalRevenue}
                icon={DollarSign}
                unit="R$"
                color="orange"
              />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Desempenho</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Taxa de Conversão</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{currentMonthData.conversionRate}%</p>
                      <p className="text-xs text-green-600">+2.4% vs mês anterior</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Tempo Médio de Resposta</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{currentMonthData.responseTime} min</p>
                      <p className="text-xs text-green-600">-0.3 min vs mês anterior</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência Mensal</h3>
                <div className="space-y-3">
                  {MOCK_REPORTS_DATA.slice(-3).map((data, index) => (
                    <div key={data.period} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{data.period}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{data.totalOrders} pedidos</span>
                        <span className="text-sm font-bold text-green-600">{formatCurrency(data.totalRevenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {MOCK_GOALS.map((goal) => {
                const progress = getProgressPercentage(goal.current, goal.target);
                const isCompleted = goal.status === 'completed';
                
                return (
                  <div key={goal.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${getGoalStatusColor(goal.status)}`}>
                          {getGoalIcon(goal.category)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                          <p className="text-sm text-gray-500">{goal.description}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getGoalStatusColor(goal.status)}`}>
                        {getGoalStatusText(goal.status)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progresso</span>
                        <span className="font-medium text-gray-900">
                          {goal.current.toLocaleString('pt-BR')} / {goal.target.toLocaleString('pt-BR')} {goal.unit}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isCompleted ? 'bg-blue-600' :
                            goal.status === 'on-track' ? 'bg-green-600' :
                            goal.status === 'at-risk' ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="font-medium">{progress.toFixed(1)}% completo</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'detailed' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Histórico de Desempenho</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensagens</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contatos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedidos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faturamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversão</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo Resp.</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {MOCK_REPORTS_DATA.map((data) => (
                      <tr key={data.period} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{data.period}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{data.totalMessages.toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{data.totalContacts.toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{data.totalOrders.toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(data.totalRevenue)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{data.conversionRate}%</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{data.responseTime} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
