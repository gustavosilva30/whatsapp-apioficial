import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Database,
  Server,
  Activity,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  HardDrive,
  Cpu,
  Wifi,
  Shield,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Tenant {
  id: string;
  name: string;
  cnpj: string;
  isActive: boolean;
  userCount: number;
  channelCount: number;
  messageCount: number;
  createdAt: string;
  lastActivity: string;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  latency: number;
  uptime: string;
  version?: string;
  connections?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  totalMessages: number;
  messagesToday: number;
  totalUsers: number;
  activeUsers: number;
  totalChannels: number;
  activeChannels: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    
    fetchAdminData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, navigate]);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data in parallel
      const [tenantsRes, statsRes, servicesRes] = await Promise.all([
        (window as any).apiCall('/api/v1/admin/tenants'),
        (window as any).apiCall('/api/v1/admin/stats'),
        (window as any).apiCall('/api/v1/admin/services')
      ]);
      
      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        if (tenantsData.success) {
          setTenants(tenantsData.data);
        }
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }
      
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        if (servicesData.success) {
          setServices(servicesData.data);
        }
      }
      
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      online: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      warning: 'bg-amber-100 text-amber-700 border-amber-200',
      offline: 'bg-red-100 text-red-700 border-red-200'
    };
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-600">Loading admin dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">Global System Overview</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                onClick={fetchAdminData}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Tenants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +12%
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.totalTenants}</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.activeTenants} active tenants
              </p>
            </motion.div>

            {/* Messages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +8%
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {stats.totalMessages.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.messagesToday.toLocaleString()} today
              </p>
            </motion.div>

            {/* Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {stats.activeUsers} online
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
              <p className="text-sm text-slate-500 mt-1">
                Total users
              </p>
            </motion.div>

            {/* Channels */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Wifi className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs text-emerald-600 font-medium">
                  {Math.round((stats.activeChannels / stats.totalChannels) * 100)}% online
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.totalChannels}</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.activeChannels} active channels
              </p>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tenants List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Active Tenants
                </h2>
              </div>
              
              <div className="divide-y divide-slate-200">
                {tenants.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No tenants found
                  </div>
                ) : (
                  tenants.map((tenant, index) => (
                    <motion.div
                      key={tenant.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                        selectedTenant === tenant.id ? 'bg-indigo-50' : ''
                      }`}
                      onClick={() => setSelectedTenant(
                        selectedTenant === tenant.id ? null : tenant.id
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${
                            tenant.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`} />
                          <div>
                            <p className="font-medium text-slate-900">{tenant.name}</p>
                            <p className="text-sm text-slate-500">CNPJ: {tenant.cnpj}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-semibold text-slate-900">{tenant.userCount}</p>
                            <p className="text-xs text-slate-500">Users</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-slate-900">{tenant.channelCount}</p>
                            <p className="text-xs text-slate-500">Channels</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-slate-900">
                              {tenant.messageCount.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">Messages</p>
                          </div>
                        </div>
                      </div>
                      
                      {selectedTenant === tenant.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-slate-400">Created:</span>
                              <p>{new Date(tenant.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Last Activity:</span>
                              <p>{new Date(tenant.lastActivity).toLocaleString()}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Services Status */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Service Status
                </h2>
              </div>
              
              <div className="divide-y divide-slate-200">
                {services.map((service, index) => (
                  <motion.div
                    key={service.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {service.name === 'PostgreSQL' ? (
                          <Database className="w-5 h-5 text-blue-500" />
                        ) : service.name === 'Redis' ? (
                          <HardDrive className="w-5 h-5 text-red-500" />
                        ) : (
                          <Server className="w-5 h-5 text-slate-500" />
                        )}
                        <span className="font-medium text-slate-900">{service.name}</span>
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Activity className="w-4 h-4" />
                        <span>{service.latency}ms</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>{service.uptime}</span>
                      </div>
                      {service.connections !== undefined && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="w-4 h-4" />
                          <span>{service.connections} conn</span>
                        </div>
                      )}
                      {service.memoryUsage !== undefined && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <HardDrive className="w-4 h-4" />
                          <span>{service.memoryUsage}% mem</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700">Create New Tenant</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
                  <BarChart3 className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700">View Reports</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
                  <Database className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700">Database Backup</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700">Security Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
