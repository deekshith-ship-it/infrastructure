import { useState, useEffect } from 'react';
import { Globe, Plus, Search, Pencil, Trash2, Phone, Mail as MailIcon, Hash, ShieldCheck, Calendar, DollarSign, Server, Lock, RefreshCw, Link, AlertCircle, ChevronDown } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { MagneticButton } from '@/components/MagneticButton';
import type { Domain } from '@/types';

interface DomainsProps {
  domains: Domain[];
  onAdd: (domain: Omit<Domain, 'id'>) => void | Promise<unknown>;
  onUpdate: (id: string, updates: Partial<Domain>) => void | Promise<unknown>;
  onDelete: (id: string) => void | Promise<unknown>;
  initialSelectedId?: string | null;
}

function getServiceBadge(service: string) {
  const map: Record<string, string> = {
    domain: 'mg-badge mg-badge-domain',
    email: 'mg-badge mg-badge-email',
    cloud: 'mg-badge mg-badge-cloud',
  };
  return map[service] || 'mg-badge mg-badge-domain';
}

export function Domains({ domains, onAdd, onUpdate, onDelete, initialSelectedId }: DomainsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState<Omit<Domain, 'id'>>({
    name: '',
    status: 'active',
    service: 'domain',
    seats: 1,
    phone: '',
    contactEmail: '',
    money: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    provider: 'Squarespace',
    server: '',
    registrarName: '',
    autoRenew: false,
    sslExpiryDate: '',
    dnsProvider: '',
  });
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'expire' | 'suspended' | 'expiring'>('all');
  const [isDnsOpen, setIsDnsOpen] = useState(false);

  useEffect(() => {
    if (initialSelectedId) {
      const match = domains.find(d => d.id === initialSelectedId);
      if (match) setSelectedDomain(match);
    }
  }, [initialSelectedId, domains]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDays = new Date();
  thirtyDays.setDate(today.getDate() + 30);
  const fifteenDays = new Date();
  fifteenDays.setDate(today.getDate() + 15);
  const sevenDays = new Date();
  sevenDays.setDate(today.getDate() + 7);

  const domainStats = {
    active: domains.filter(d => d.status === 'active').length,
    expired: domains.filter(d => (d.endDate && new Date(d.endDate) < today) || d.status === 'expire').length,
    suspended: domains.filter(d => d.status === 'suspended').length,
    expiring: domains.filter(d => d.endDate && new Date(d.endDate) >= today && new Date(d.endDate) <= thirtyDays).length,
  };

  const filtered = domains.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.provider.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'active') return d.status === 'active';
    if (filterMode === 'expire') return (d.endDate && new Date(d.endDate) < today) || d.status === 'expire';
    if (filterMode === 'suspended') return d.status === 'suspended';
    if (filterMode === 'expiring') return d.endDate && new Date(d.endDate) >= today && new Date(d.endDate) <= thirtyDays;

    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDomain) {
      onUpdate(editingDomain.id, formData);
    } else {
      onAdd(formData);
    }
    closeModal();
  };

  const openAddModal = () => {
    setEditingDomain(null);
    setFormData({
      name: '',
      status: 'active',
      service: 'domain',
      seats: 1,
      phone: '',
      contactEmail: '',
      money: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      provider: 'Squarespace',
      server: '',
      registrarName: '',
      autoRenew: false,
      sslExpiryDate: '',
      dnsProvider: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (domain: Domain) => {
    setEditingDomain(domain);
    setFormData({
      name: domain.name,
      status: domain.status,
      service: domain.service,
      seats: domain.seats,
      phone: domain.phone,
      contactEmail: domain.contactEmail,
      money: domain.money,
      startDate: domain.startDate,
      endDate: domain.endDate,
      provider: domain.provider,
      server: domain.server,
      registrarName: domain.registrarName || '',
      autoRenew: domain.autoRenew || false,
      sslExpiryDate: domain.sslExpiryDate || '',
      dnsProvider: domain.dnsProvider || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDomain(null);
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '₹0.00';
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getSSLStatus = (date?: string) => {
    if (!date) return { label: 'None', color: 'text-gray-500 dark:text-gray-400' };
    const expiry = new Date(date);
    if (expiry < today) return { label: 'Expired', color: 'text-red-500' };
    if (expiry <= fifteenDays) return { label: 'Warning', color: 'text-orange-500' };
    return { label: 'Secure', color: 'text-emerald-500' };
  };

  const getExpiryAlert = (date?: string) => {
    if (!date) return null;
    const exp = new Date(date);
    if (exp < today) return { label: 'EXPIRED', color: 'bg-red-500/10 text-red-500' };
    if (exp <= sevenDays) return { label: 'CRITICAL', color: 'bg-red-500/10 text-red-500' };
    if (exp <= fifteenDays) return { label: 'WARNING', color: 'bg-orange-500/10 text-orange-500' };
    if (exp <= thirtyDays) return { label: 'EXPIRING', color: 'bg-blue-500/10 text-blue-500' };
    return null;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Domain Overview Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'active', label: 'Active Domains', count: domainStats.active, icon: ShieldCheck, color: 'emerald' },
          { id: 'expire', label: 'Expired Domains', count: domainStats.expired, icon: AlertCircle, color: 'red' },
          { id: 'suspended', label: 'Suspended', count: domainStats.suspended, icon: Trash2, color: 'gray' },
          { id: 'expiring', label: 'Expiring Soon', count: domainStats.expiring, icon: Calendar, color: 'orange' },
        ].map((stat) => {
          const isActive = filterMode === stat.id;
          return (
            <div
              key={stat.id}
              onClick={() => setFilterMode(isActive ? 'all' : stat.id as any)}
              className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 cursor-pointer transition-all border-l-4 ${isActive ? 'ring-2 ring-blue-500/50' : ''}`}
              style={{ borderLeftColor: `var(--${stat.color}-500)` }}
            >
              <div className="flex justify-between items-start mb-2">
                <stat.icon size={16} className={`text-${stat.color}-500`} />
                <span className="text-xl font-black text-gray-900 dark:text-gray-100">{stat.count}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Domain Fleet</h1>
          {filterMode !== 'all' && (
            <button onClick={() => setFilterMode('all')} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 uppercase tracking-widest">
              Clear Filter
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search domains..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="mg-input pl-12 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
            />
          </div>

          <MagneticButton onClick={openAddModal} className="mg-btn-primary shadow-sm">
            <Plus size={18} />
            <span>Add Domain</span>
          </MagneticButton>
        </div>
      </div>

      {/* Grid of Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
            <Globe size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">System database empty</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
            {searchQuery ? 'No match found for your search' : 'Add your first domain to begin monitoring'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((domain) => (
            <div
              key={domain.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col h-full cursor-pointer hover:border-blue-500/20 dark:hover:border-blue-500/40 hover:shadow-md transition-all"
              onClick={() => setSelectedDomain(domain)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Globe size={18} className="text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-gray-900 dark:text-gray-100 truncate">{domain.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${domain.status === 'active' ? 'bg-emerald-500' : (domain.status === 'expire' ? 'bg-red-500' : 'bg-orange-500')}`} />
                      <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">{domain.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getExpiryAlert(domain.endDate) && (
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${getExpiryAlert(domain.endDate)?.color}`}>
                      {getExpiryAlert(domain.endDate)?.label}
                    </span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(domain); }}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(domain.id); }}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <span className={getServiceBadge(domain.service)}>{domain.service.toUpperCase()}</span>
                <span className="mg-badge bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">{domain.registrarName || domain.provider || 'Generic'}</span>
                <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 ${getSSLStatus(domain.sslExpiryDate).color}`}>
                  <Lock size={10} /> SSL: {getSSLStatus(domain.sslExpiryDate).label}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 mb-6 text-[11px] font-bold uppercase tracking-wider">
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500"><Hash size={12} /> Seats</p>
                  <p className="text-gray-800 dark:text-gray-200">{domain.seats || '0'}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500"><Globe size={12} /> Registrar</p>
                  <p className="truncate text-gray-800 dark:text-gray-200">{domain.registrarName || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500"><ShieldCheck size={12} /> DNS Provider</p>
                  <p className="font-mono truncate text-gray-800 dark:text-gray-200">{domain.dnsProvider || 'LOCAL'}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500"><Calendar size={12} /> SSL Expiry</p>
                  <p className="truncate text-gray-800 dark:text-gray-200">{formatDate(domain.sslExpiryDate)}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Investment</p>
                    <p className="text-blue-500 dark:text-blue-400 font-black text-sm">{formatCurrency(domain.money)}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Timeline</p>
                    <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400">
                      {formatDate(domain.startDate)} - {formatDate(domain.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                {domain.autoRenew && (
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-500">
                    <RefreshCw size={10} /> Auto-renew Active
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedDomain}
        onClose={() => setSelectedDomain(null)}
        title={selectedDomain?.name || 'Domain Details'}
        subtitle="Global registration parameters"
        size="lg"
      >
        {selectedDomain && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className={`mg-badge ${selectedDomain.status === 'active' ? 'mg-badge-active' : 'mg-badge-inactive'}`}>{selectedDomain.status}</span>
              <span className={getServiceBadge(selectedDomain.service)}>{selectedDomain.service.toUpperCase()}</span>
              <span className="mg-badge bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">{selectedDomain.provider || 'Generic'}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><Hash size={11} /> Seats Capacity</p>
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{selectedDomain.seats || '0'}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><Server size={11} /> Primary Server</p>
                <p className="font-mono font-bold truncate text-gray-900 dark:text-gray-100">{selectedDomain.server || 'LOCAL'}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><Phone size={11} /> Network Contact</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{selectedDomain.phone || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><MailIcon size={11} /> Admin Email</p>
                <p className="font-bold truncate text-gray-900 dark:text-gray-100">{selectedDomain.contactEmail || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><DollarSign size={11} /> Capital Outlay</p>
                <p className="text-blue-600 dark:text-blue-400 font-black text-lg">{formatCurrency(selectedDomain.money)}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><Calendar size={11} /> Lifecycle Window</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{formatDate(selectedDomain.startDate)} — {formatDate(selectedDomain.endDate)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setIsDnsOpen(!isDnsOpen)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Link size={16} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-gray-100">DNS Zone File</span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isDnsOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDnsOpen && (
                <div className="p-4 pt-0 space-y-3 border-t border-gray-50 dark:border-gray-800/50">
                  <div className="grid grid-cols-4 gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-50 dark:border-gray-800/50">
                    <span>Type</span>
                    <span>Host</span>
                    <span className="col-span-2">Value</span>
                  </div>
                  {[
                    { type: 'A', host: '@', value: '192.168.1.1' },
                    { type: 'CNAME', host: 'www', value: 'ghs.googlehost.com' },
                    { type: 'MX', host: '@', value: '10 mail.google.com' },
                    { type: 'TXT', host: '@', value: 'v=spf1 include:_spf.google.com ~all' }
                  ].map((record, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 text-[10px] font-bold py-1">
                      <span className="text-blue-500">{record.type}</span>
                      <span className="text-gray-600 dark:text-gray-300">{record.host}</span>
                      <span className="col-span-2 truncate text-gray-400 dar:text-gray-500">{record.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { openEditModal(selectedDomain); setSelectedDomain(null); }}
                className="mg-btn-primary flex-1"
              >
                <Pencil size={14} /> Update Fleet
              </button>
              <button
                onClick={() => setSelectedDomain(null)}
                className="mg-btn-secondary flex-1 dark:border-gray-800 dark:text-gray-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingDomain ? 'Update Registry Parameters' : 'Register New Asset'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">FQDN Address</label>
              <input required placeholder="eg: domain.io" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mg-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Service Category</label>
              <select value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value as Domain['service'] })} className="mg-select font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="domain">Domain Allocation</option>
                <option value="email">Email Provisioning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Lifecycle</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as Domain['status'] })} className="mg-select font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="active">Active (Production)</option>
                <option value="expire">Expired (Action Required)</option>
                <option value="inactive">Inactive (Archived)</option>
                <option value="pending">Pending (Provisioning)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Provisioned Seats</label>
              <input type="number" min={0} value={formData.seats} onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) || 0 })} className="mg-input font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Network Phone</label>
              <input placeholder="+91 000 000 0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mg-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Handle</label>
              <input placeholder="eg: @admin" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} className="mg-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Value (₹)</label>
              <input type="number" min={0} step={0.01} value={formData.money} onChange={e => setFormData({ ...formData, money: parseFloat(e.target.value) || 0 })} className="mg-input font-bold text-blue-600 dark:text-blue-400 dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registry Provider</label>
              <input placeholder="eg: Squarespace" value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} className="mg-input font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Start Date</label>
              <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="mg-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">End Date</label>
              <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="mg-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400">Registry Governance</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Registrar Name</label>
                <input placeholder="eg: Namecheap" value={formData.registrarName} onChange={e => setFormData({ ...formData, registrarName: e.target.value })} className="mg-input !bg-blue-500/5 !border-blue-500/10 dark:!bg-gray-800 dark:!border-gray-700 dark:text-gray-100" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">SSL Expiration</label>
                <input type="date" value={formData.sslExpiryDate} onChange={e => setFormData({ ...formData, sslExpiryDate: e.target.value })} className="mg-input !bg-blue-500/5 !border-blue-500/10 dark:!bg-gray-800 dark:!border-gray-700 dark:text-gray-100" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">DNS Infrastructure</label>
                <input placeholder="eg: Cloudflare" value={formData.dnsProvider} onChange={e => setFormData({ ...formData, dnsProvider: e.target.value })} className="mg-input !bg-blue-500/5 !border-blue-500/10 dark:!bg-gray-800 dark:!border-gray-700 dark:text-gray-100" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="auto-renew" checked={formData.autoRenew} onChange={e => setFormData({ ...formData, autoRenew: e.target.checked })} className="w-5 h-5 rounded appearance-none border border-blue-500/30 bg-blue-500/5 checked:bg-blue-600 transition-colors cursor-pointer" />
                <label htmlFor="auto-renew" className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 cursor-pointer">Enable Permanent Lease (Auto-Renew)</label>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={closeModal} className="mg-btn-secondary flex-1 dark:border-gray-800 dark:text-gray-300">
              Abort
            </button>
            <button type="submit" className="mg-btn-primary flex-1">
              {editingDomain ? 'Commit Parameter' : 'Finalize Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div >
  );
}
