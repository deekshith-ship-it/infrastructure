import { useState, useEffect } from 'react';
import { Mail, Plus, Search, Pencil, Trash2, HardDrive, Database, ShieldCheck, Calendar, Key, Shield } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { MagneticButton } from '@/components/MagneticButton';
import type { Email, Domain } from '@/types';

interface EmailsProps {
  emails: Email[];
  domains: Domain[];
  onAdd: (email: Omit<Email, 'id'>) => void | Promise<unknown>;
  onUpdate: (id: string, updates: Partial<Email>) => void | Promise<unknown>;
  onDelete: (id: string) => void | Promise<unknown>;
  initialSelectedId?: string | null;
}

export function Emails({ emails, domains, onAdd, onUpdate, onDelete, initialSelectedId }: EmailsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<Email | null>(null);
  const [formData, setFormData] = useState({
    address: '',
    domainId: '',
    status: 'active' as Email['status'],
    quota: 5120, // MB
    used: 0,
    createdAt: new Date().toISOString().split('T')[0],
    accountStatus: 'Active' as 'Active' | 'Suspended' | 'Expired',
    storageLimit: 5, // GB default
    storageUsed: 0,
    sslExpiryDate: '',
    spfStatus: 'Missing' as 'Valid' | 'Invalid' | 'Missing',
    dkimStatus: 'Missing' as 'Valid' | 'Invalid' | 'Missing',
    adminPasswordReset: false,
    resetRequested: false,
  });
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [processedId, setProcessedId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'expire' | 'suspended' | 'storage'>('all');

  useEffect(() => {
    if (initialSelectedId && initialSelectedId !== processedId) {
      const match = emails.find(e => e.id === initialSelectedId);
      if (match) {
        setSelectedEmail(match);
        setProcessedId(initialSelectedId);
      }
    }
  }, [initialSelectedId, emails, processedId]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fifteenDays = new Date();
  fifteenDays.setDate(today.getDate() + 15);

  const getEmailStatus = (email: Email) => {
    const domain = domains.find(d => d.id === email.domainId);
    if (domain && domain.status === 'expire') return 'expire';
    return email.status;
  };

  const emailStats = {
    active: emails.filter(e => getEmailStatus(e) === 'active').length,
    expired: emails.filter(e => getEmailStatus(e) === 'expire').length,
    suspended: emails.filter(e => getEmailStatus(e) === 'suspended').length,
    totalUsed: emails.reduce((acc, e) => acc + (e.storageUsed || 0), 0),
    totalLimit: emails.reduce((acc, e) => acc + (e.storageLimit || 5), 0),
  };

  const filtered = emails.filter(e => {
    const matchesSearch = e.address.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const status = getEmailStatus(e);
    if (filterMode === 'active') return status === 'active';
    if (filterMode === 'expire') return status === 'expire';
    if (filterMode === 'suspended') return status === 'suspended';
    if (filterMode === 'storage') {
      const used = e.storageUsed || (e.used / 1024);
      const limit = e.storageLimit || (e.quota / 1024);
      return (used / limit) > 0.8;
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmail) {
      onUpdate(editingEmail.id, formData);
    } else {
      onAdd(formData);
    }
    closeModal();
  };

  const openAddModal = () => {
    setEditingEmail(null);
    setFormData({
      address: '',
      domainId: domains[0]?.id || '',
      status: 'active',
      quota: 5120,
      used: 0,
      createdAt: new Date().toISOString().split('T')[0],
      accountStatus: 'Active',
      storageLimit: 5,
      storageUsed: 0,
      sslExpiryDate: '',
      spfStatus: 'Missing',
      dkimStatus: 'Missing',
      adminPasswordReset: false,
      resetRequested: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (email: Email) => {
    setEditingEmail(email);
    setFormData({
      address: email.address,
      domainId: email.domainId,
      status: email.status as any,
      quota: email.quota,
      used: email.used,
      createdAt: email.createdAt,
      accountStatus: email.accountStatus || 'Active',
      storageLimit: email.storageLimit || 5,
      storageUsed: email.storageUsed || 0,
      sslExpiryDate: email.sslExpiryDate || '',
      spfStatus: email.spfStatus || 'Missing',
      dkimStatus: email.dkimStatus || 'Missing',
      adminPasswordReset: email.adminPasswordReset || false,
      resetRequested: email.resetRequested || false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmail(null);
  };

  const getDomainName = (domainId: string) =>
    domains.find(d => d.id === domainId)?.name || 'Unknown';

  const getStorageUsageColor = (used: number, limit: number) => {
    const pct = (used / limit) * 100;
    if (pct < 50) return '#22c55e';
    if (pct < 80) return '#f59e0b';
    return '#ef4444';
  };

  const getSSLBadge = (date?: string) => {
    if (!date) return null;
    const expiry = new Date(date);
    if (expiry < today) return { label: 'Expired', color: 'bg-red-500/10 text-red-500' };
    if (expiry <= fifteenDays) return { label: 'Warning', color: 'bg-orange-500/10 text-orange-500' };
    return { label: 'Secure', color: 'bg-emerald-500/10 text-emerald-500' };
  };

  const handleResetPassword = (id: string) => {
    onUpdate(id, { resetRequested: true });
  };

  return (
    <div className="space-y-6">
      {/* Email Overview Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'active', label: 'Active Seats', count: emailStats.active, icon: Mail, color: 'emerald' },
          { id: 'expire', label: 'Expired', count: emailStats.expired, icon: Calendar, color: 'red' },
          { id: 'suspended', label: 'Suspended', count: emailStats.suspended, icon: Shield, color: 'orange' },
          {
            id: 'storage',
            label: 'Total Storage',
            count: `${emailStats.totalUsed.toFixed(1)}GB`,
            icon: HardDrive,
            color: 'blue',
            subtitle: `${emailStats.totalLimit}GB Limit`
          },
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
              {stat.subtitle && <p className="text-[9px] font-bold text-gray-500 dark:text-gray-500 mt-1">{stat.subtitle}</p>}
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Email Accounts</h1>
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
              placeholder="Search address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="mg-input pl-12 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
            />
          </div>

          <MagneticButton
            onClick={openAddModal}
            className="mg-btn-primary shadow-sm"
            disabled={domains.length === 0}
          >
            <Plus size={18} />
            <span>Add Email</span>
          </MagneticButton>
        </div>
      </div>

      {/* No domains warning */}
      {domains.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="font-bold text-[10px] uppercase tracking-widest text-red-600 dark:text-red-400">No domains available. Add a domain first.</p>
        </div>
      )}

      {/* Grid of Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
            <Mail size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">No email accounts found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
            {searchQuery
              ? 'No match found for your search'
              : domains.length === 0
                ? 'Add a domain first to enable email creation'
                : 'Add your first email endpoint to begin monitoring'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((email) => {
            const used = email.storageUsed || (email.used / 1024);
            const limit = email.storageLimit || (email.quota / 1024);
            const usagePct = (used / limit) * 100;
            const usageColor = getStorageUsageColor(used, limit);

            return (
              <div
                key={email.id}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col h-full cursor-pointer hover:border-blue-500/20 dark:hover:border-blue-500/40 hover:shadow-md transition-all"
                onClick={() => setSelectedEmail(email)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                      <Mail size={18} className="text-pink-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-gray-900 dark:text-gray-100 truncate">{email.address}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${getEmailStatus(email) === 'active' ? 'bg-emerald-500' : (getEmailStatus(email) === 'expire' ? 'bg-red-500' : 'bg-orange-500')}`} />
                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">{getEmailStatus(email)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {email.resetRequested && (
                      <span className="text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded self-center">PENDING</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(email); }}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(email.id); }}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-6">
                  <span className="mg-badge mg-badge-email">{getDomainName(email.domainId)}</span>
                  <div className="flex gap-1 px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-[8px] font-black uppercase">
                    <span className={email.spfStatus === 'Valid' ? 'text-emerald-500' : 'text-gray-400'}>SPF</span>
                    <span className="text-gray-200 dark:text-gray-700">|</span>
                    <span className={email.dkimStatus === 'Valid' ? 'text-emerald-500' : 'text-gray-400'}>DKIM</span>
                  </div>
                  {getSSLBadge(email.sslExpiryDate) && (
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${getSSLBadge(email.sslExpiryDate)?.color}`}>
                      SSL: {getSSLBadge(email.sslExpiryDate)?.label}
                    </span>
                  )}
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <HardDrive size={12} /> Storage Usage
                    </p>
                    <p className="text-[11px] font-black text-gray-800 dark:text-gray-200">
                      {used.toFixed(1)} <span className="text-gray-300 dark:text-gray-600">/</span> {limit.toFixed(0)} GB
                    </p>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      style={{ height: '100%', background: usageColor, width: `${usagePct}%`, transition: 'width 1s ease-out' }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-gray-400">
                    <span>Capacity Status</span>
                    <span style={{ color: usageColor }}>{usagePct.toFixed(0)}%</span>
                  </div>
                </div>

                {email.accountStatus && email.accountStatus !== 'Active' && (
                  <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <Shield size={12} className="text-orange-500" />
                    <span className="text-[10px] font-bold text-orange-500 uppercase">Restricted: {email.accountStatus}</span>
                  </div>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Database size={12} className="text-pink-500" />
                    <span className="text-[10px] font-bold text-gray-400">
                      Added {email.createdAt ? new Date(email.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Unknown'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleResetPassword(email.id); }}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <Key size={12} /> {email.resetRequested ? 'REQUESTED' : 'RESET PWD'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedEmail}
        onClose={() => setSelectedEmail(null)}
        title={selectedEmail?.address || 'Account Details'}
        subtitle="SaaS account configuration"
      >
        {selectedEmail && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className={`mg-badge ${getEmailStatus(selectedEmail) === 'active' ? 'mg-badge-active' : 'mg-badge-inactive'}`}>{getEmailStatus(selectedEmail)}</span>
              <span className="mg-badge mg-badge-email">{getDomainName(selectedEmail.domainId)}</span>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex justify-between items-end">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400"><HardDrive size={12} /> Storage Allocation</p>
                <p className="text-sm font-black text-gray-900 dark:text-gray-100">
                  {(selectedEmail.used / 1024).toFixed(1)} <span className="text-gray-400 dark:text-gray-600">/</span> {(selectedEmail.quota / 1024).toFixed(0)} GB
                </p>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${Math.min((selectedEmail.used / selectedEmail.quota) * 100, 100)}%`, transition: 'width 0.8s ease-out' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><ShieldCheck size={12} /> Origin Domain</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{getDomainName(selectedEmail.domainId)}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><Calendar size={12} /> Creation Date</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {selectedEmail.createdAt ? new Date(selectedEmail.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><HardDrive size={12} /> Hard Limit</p>
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{(selectedEmail.quota / 1024).toFixed(0)} GB</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><Database size={12} /> Delta Used</p>
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{(selectedEmail.used / 1024).toFixed(1)} GB</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { openEditModal(selectedEmail); setSelectedEmail(null); }}
                className="mg-btn-primary flex-1"
              >
                <Pencil size={14} /> Update Settings
              </button>
              <button
                onClick={() => setSelectedEmail(null)}
                className="mg-btn-secondary flex-1 dark:border-gray-800 dark:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEmail ? 'Modify Mail Seat' : 'Add Email'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Endpoint Address</label>
            <div className="flex gap-3 items-center">
              <input
                required
                placeholder="eg: support"
                value={formData.address.split('@')[0] || ''}
                onChange={e => {
                  const domain = domains.find(d => d.id === formData.domainId)?.name || '';
                  setFormData({ ...formData, address: `${e.target.value}@${domain}` });
                }}
                className="mg-input flex-1 font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
              <span className="font-bold text-gray-400">@</span>
              <select
                value={formData.domainId}
                onChange={e => {
                  const domainName = domains.find(d => d.id === e.target.value)?.name || '';
                  const localPart = formData.address.split('@')[0] || '';
                  setFormData({
                    ...formData,
                    domainId: e.target.value,
                    address: localPart ? `${localPart}@${domainName}` : `@${domainName}`,
                  });
                }}
                className="mg-select flex-1 font-bold text-blue-600 dark:text-blue-400 dark:bg-gray-800 dark:border-gray-700"
              >
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Integrity</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'suspended' | 'disabled' })}
              className="mg-select font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="active">Operational (Active)</option>
              <option value="suspended">Restricted (Suspended)</option>
              <option value="disabled">Decommissioned (Disabled)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Storage Limit (MB)</label>
              <input
                type="number"
                required
                min={100}
                step={100}
                value={formData.quota}
                onChange={e => setFormData({ ...formData, quota: parseInt(e.target.value) })}
                className="mg-input font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            {editingEmail && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Occupancy (MB)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={formData.quota}
                  value={formData.used}
                  onChange={e => setFormData({ ...formData, used: parseInt(e.target.value) })}
                  className="mg-input font-bold text-blue-600 dark:text-blue-400 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-pink-500/5 border border-pink-500/10 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-pink-500 dark:text-pink-400">Advanced Governance</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest">Subscription Tier</label>
                <select value={formData.accountStatus} onChange={e => setFormData({ ...formData, accountStatus: e.target.value as any })} className="mg-select !bg-pink-500/5 !border-pink-500/10 dark:!bg-gray-800 dark:!border-gray-700">
                  <option value="Active">Standard Subscription</option>
                  <option value="Suspended">Manual Suspension</option>
                  <option value="Expired">Resource Expired</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest">TLS/SSL Cycle</label>
                <input type="date" value={formData.sslExpiryDate} onChange={e => setFormData({ ...formData, sslExpiryDate: e.target.value })} className="mg-input !bg-pink-500/5 !border-pink-500/10 dark:!bg-gray-800 dark:!border-gray-700" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest">SPF Record Validation</label>
                <select value={formData.spfStatus} onChange={e => setFormData({ ...formData, spfStatus: e.target.value as any })} className="mg-select !bg-pink-500/5 !border-pink-500/10 dark:!bg-gray-800 dark:!border-gray-700">
                  <option value="Valid">System Validated</option>
                  <option value="Invalid">Mismatched Hash</option>
                  <option value="Missing">Not Configured</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest">DKIM Cryptography</label>
                <select value={formData.dkimStatus} onChange={e => setFormData({ ...formData, dkimStatus: e.target.value as any })} className="mg-select !bg-pink-500/5 !border-pink-500/10 dark:!bg-gray-800 dark:!border-gray-700">
                  <option value="Valid">RSA-SHA256 Valid</option>
                  <option value="Invalid">Key Mismatch</option>
                  <option value="Missing">No Signature</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={closeModal} className="mg-btn-secondary flex-1 dark:border-gray-800 dark:text-gray-300">Cancel</button>
            <button type="submit" className="mg-btn-primary flex-1">
              {editingEmail ? 'Update Email' : 'Add Email'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
