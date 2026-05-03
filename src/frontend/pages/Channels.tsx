import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Settings, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Copy,
  Webhook,
  Smartphone,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Channel {
  id: string;
  phoneNumberId: string;
  wabaId: string;
  verifyToken: string;
  isActive: boolean;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ChannelFormData {
  phoneNumberId: string;
  wabaId: string;
  verifyToken: string;
  accessToken: string;
  userId: string;
}

export default function Channels() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ChannelFormData>({
    phoneNumberId: '',
    wabaId: '',
    verifyToken: '',
    accessToken: '',
    userId: ''
  });

  const API_URL = (import.meta as any).env?.VITE_API_URL || window.location.origin;
  const WEBHOOK_URL = `${API_URL}/webhook/meta`;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchChannels();
  }, [isAuthenticated, navigate]);

  const fetchChannels = async () => {
    try {
      setIsLoading(true);
      const response = await (window as any).apiCall('/api/v1/channels');
      
      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }
      
      const data = await response.json();
      if (data.success) {
        setChannels(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading channels');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await (window as any).apiCall('/api/v1/channels', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create channel');
      }
      
      const data = await response.json();
      if (data.success) {
        setChannels([...channels, data.data]);
        setShowAddModal(false);
        setFormData({
          phoneNumberId: '',
          wabaId: '',
          verifyToken: '',
          accessToken: '',
          userId: ''
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;
    
    try {
      const response = await (window as any).apiCall(`/api/v1/channels/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setChannels(channels.filter(c => c.id !== id));
      }
    } catch (err) {
      setError('Failed to delete channel');
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      const response = await (window as any).apiCall(`/api/v1/channels/${id}/test`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Connection test successful!');
      } else {
        alert('Connection test failed. Please check your configuration.');
      }
    } catch (err) {
      alert('Connection test failed');
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generateVerifyToken = () => {
    const token = 'whst_' + Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    setFormData({ ...formData, verifyToken: token });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-600">Loading channels...</p>
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
            <div>
              <h1 className="text-2xl font-bold text-slate-900">WhatsApp Channels</h1>
              <p className="text-sm text-slate-500">Manage your Meta Business API connections</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Channel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Webhook Configuration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Webhook className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Webhook Configuration
              </h3>
              <p className="text-slate-600 mb-4">
                Configure these settings in your Meta Developer Dashboard to receive messages.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-slate-500 w-32">Webhook URL:</span>
                  <code className="flex-1 text-sm bg-slate-100 px-3 py-1.5 rounded font-mono text-slate-700">
                    {WEBHOOK_URL}
                  </code>
                  <button
                    onClick={() => copyToClipboard(WEBHOOK_URL, 'webhook_url')}
                    className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                    title="Copy URL"
                  >
                    {copiedField === 'webhook_url' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-slate-500 w-32">Verify Token:</span>
                  <span className="text-sm text-slate-400">Generated per channel below</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Channels List */}
        <div className="space-y-4">
          {channels.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white rounded-xl border border-slate-200"
            >
              <Smartphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No channels connected</h3>
              <p className="text-slate-500 mb-6">Add your first WhatsApp Business channel to start receiving messages.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Channel
              </button>
            </motion.div>
          ) : (
            channels.map((channel, index) => (
              <motion.div
                key={channel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl border transition-all ${
                  channel.isActive ? 'border-emerald-200 shadow-sm' : 'border-slate-200'
                }`}
              >
                {/* Channel Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Status Indicator */}
                      <div className={`w-3 h-3 rounded-full ${
                        channel.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                      }`} />
                      
                      {/* Phone Icon */}
                      <div className={`p-3 rounded-lg ${
                        channel.isActive ? 'bg-emerald-50' : 'bg-slate-50'
                      }`}>
                        <Smartphone className={`w-6 h-6 ${
                          channel.isActive ? 'text-emerald-600' : 'text-slate-400'
                        }`} />
                      </div>
                      
                      {/* Channel Info */}
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Phone ID: {channel.phoneNumberId}
                        </h3>
                        <p className="text-sm text-slate-500">
                          WABA ID: {channel.wabaId}
                        </p>
                        {channel.user && (
                          <p className="text-xs text-slate-400 mt-1">
                            Assigned to: {channel.user.name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        channel.isActive 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {channel.isActive ? '● Online' : '○ Offline'}
                      </span>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTestConnection(channel.id)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Test Connection"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setExpandedChannel(
                            expandedChannel === channel.id ? null : channel.id
                          )}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          {expandedChannel === channel.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(channel.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Channel"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedChannel === channel.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white rounded-lg border border-slate-200">
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Webhook URL
                            </label>
                            <div className="flex items-center gap-2 mt-2">
                              <code className="flex-1 text-sm font-mono text-slate-700 bg-slate-50 px-3 py-2 rounded">
                                {WEBHOOK_URL}
                              </code>
                              <button
                                onClick={() => copyToClipboard(WEBHOOK_URL, `webhook_${channel.id}`)}
                                className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                              >
                                {copiedField === `webhook_${channel.id}` ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-white rounded-lg border border-slate-200">
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Verify Token
                            </label>
                            <div className="flex items-center gap-2 mt-2">
                              <code className="flex-1 text-sm font-mono text-slate-700 bg-slate-50 px-3 py-2 rounded">
                                {channel.verifyToken}
                              </code>
                              <button
                                onClick={() => copyToClipboard(channel.verifyToken, `token_${channel.id}`)}
                                className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                              >
                                {copiedField === `token_${channel.id}` ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>Created: {new Date(channel.createdAt).toLocaleDateString()}</span>
                          <span>Last updated: {new Date(channel.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add Channel Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Add WhatsApp Channel</h2>
                <p className="text-slate-500 mt-1">Configure your Meta Business API connection</p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Phone Number ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumberId}
                    onChange={e => setFormData({ ...formData, phoneNumberId: e.target.value })}
                    placeholder="Ex: 123456789012345"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Found in Meta Developer Dashboard → WhatsApp → API Setup
                  </p>
                </div>

                {/* WABA ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    WhatsApp Business Account ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.wabaId}
                    onChange={e => setFormData({ ...formData, wabaId: e.target.value })}
                    placeholder="Ex: 987654321098765"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Verify Token */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Verify Token <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.verifyToken}
                      onChange={e => setFormData({ ...formData, verifyToken: e.target.value })}
                      placeholder="Generate or enter your verify token"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateVerifyToken}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    This token will be used by Meta to verify your webhook endpoint
                  </p>
                </div>

                {/* Access Token */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Permanent Access Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.accessToken}
                    onChange={e => setFormData({ ...formData, accessToken: e.target.value })}
                    placeholder="EAAxxxxx..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    System User Token from Meta Business Settings
                  </p>
                </div>

                {/* Webhook Configuration Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Webhook className="w-4 h-4" />
                    Webhook Configuration
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-slate-600">Callback URL:</span>
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                        {WEBHOOK_URL}
                      </code>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-slate-600">Verify Token:</span>
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                        {formData.verifyToken || '[Generate above]'}
                      </code>
                    </div>
                  </div>
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Open Meta Developer Dashboard
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Channel
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
