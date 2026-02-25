import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Plus, Search, Pencil, Trash2, HardDrive, Database, ShieldCheck, MailPlus, Calendar } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { MagneticButton } from '@/components/MagneticButton';
import type { Email, Domain } from '@/types';

interface EmailsProps {
  emails: Email[];
  domains: Domain[];
  onAdd: (email: Omit<Email, 'id'>) => void | Promise<unknown>;
  onUpdate: (id: string, updates: Partial<Email>) => void | Promise<unknown>;
  onDelete: (id: string) => void | Promise<unknown>;
}



function DotStatus({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: '#22c55e',
    suspended: '#f59e0b',
    disabled: '#ef4444',
  };
  return (
    <span className="mg-dot" style={{
      width: 7, height: 7, borderRadius: '50%',
      background: colors[status] || '#94a3b8',
      display: 'inline-block', flexShrink: 0
    }} />
  );
}

const initialForm = {
  address: '',
  domainId: '',
  status: 'active' as 'active' | 'suspended' | 'disabled',
  quota: 5120,
  used: 0,
  createdAt: new Date().toISOString().split('T')[0],
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.45, ease: [0.4, 0, 0.2, 1] as any }
  }),
};

export function Emails({ emails, domains, onAdd, onUpdate, onDelete }: EmailsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<Email | null>(null);
  const [formData, setFormData] = useState(initialForm);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const filtered = emails.filter(e =>
    e.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setFormData({ ...initialForm, domainId: domains[0]?.id || '' });
    setIsModalOpen(true);
  };

  const openEditModal = (email: Email) => {
    setEditingEmail(email);
    setFormData({
      address: email.address,
      domainId: email.domainId,
      status: email.status,
      quota: email.quota,
      used: email.used,
      createdAt: email.createdAt,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmail(null);
  };

  const getDomainName = (domainId: string) =>
    domains.find(d => d.id === domainId)?.name || 'Unknown';

  const getUsagePct = (used: number, quota: number) =>
    Math.min((used / quota) * 100, 100);

  const getUsageColor = (pct: number) => {
    if (pct < 50) return '#22c55e';
    if (pct < 80) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <motion.div
        className="domain-header"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '24px' }}
      >
        <h1 className="mg-page-title">Emails</h1>

        <div className="domain-actions">
          {/* Search Bar */}
          <div className="mg-search-wrap">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="mg-input pl-12"
            />
          </div>

          <MagneticButton
            onClick={openAddModal}
            className="mg-btn-primary shadow-lg shadow-blue-500/20"
            disabled={domains.length === 0}
            title={domains.length === 0 ? 'Add a domain first' : undefined}
          >
            <Plus size={18} />
            <span>Add Email</span>
          </MagneticButton>
        </div>
      </motion.div>

      {/* No domains warning */}
      {domains.length === 0 && (
        <motion.div
          className="mg-error-banner"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="font-bold text-xs uppercase tracking-wider">No domains available.</p>
        </motion.div>
      )}

      {/* Grid of Cards */}
      {filtered.length === 0 ? (
        <motion.div
          className="mg-card p-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mg-empty-icon w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-glass)' }}>
            <Mail size={32} style={{ color: 'var(--text-subtle)' }} />
          </div>
          <p className="mg-empty-title text-lg">No emails found</p>
          <p className="mg-empty-text mx-auto">
            {searchQuery
              ? 'No match found'
              : domains.length === 0
                ? 'Add a domain first to enable email creation'
                : 'Add your first email endpoint to begin monitoring'}
          </p>
        </motion.div>
      ) : (
        <div className="card-container">
          {filtered.map((email, i) => {
            const usagePct = getUsagePct(email.used, email.quota);
            const usageColor = getUsageColor(usagePct);

            return (
              <motion.div
                key={email.id}
                className="mg-card p-6 flex flex-col h-full cursor-pointer"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={i}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
                onClick={() => setSelectedEmail(email)}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(236, 72, 153, 0.1)' }}
                      whileHover={{ rotate: -12, scale: 1.1 }}
                    >
                      <Mail size={18} className="text-pink-400" />
                    </motion.div>
                    <div className="min-w-0">
                      <h3 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{email.address}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <DotStatus status={email.status} />
                        <span className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--text-subtle)' }}>{email.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); openEditModal(email); }}
                      className="mg-icon-btn p-1.5 rounded-lg"
                      whileHover={{ scale: 1.15, background: 'var(--bg-glass)' }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Pencil size={14} />
                    </motion.button>
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); onDelete(email.id); }}
                      className="mg-icon-btn danger p-1.5 rounded-lg"
                      whileHover={{ scale: 1.15, background: 'rgba(239, 68, 68, 0.1)' }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheck size={12} className="text-blue-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    {getDomainName(email.domainId)}
                  </span>
                </div>

                {/* Storage Metric */}
                <div className="mb-6 space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
                      <HardDrive size={12} /> Usage
                    </p>
                    <p className="text-[11px] font-black" style={{ color: 'var(--text-secondary)' }}>
                      {(email.used / 1024).toFixed(1)} <span style={{ color: 'var(--text-subtle)' }}>/</span> {(email.quota / 1024).toFixed(0)} GB
                    </p>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden shadow-inner" style={{ background: 'var(--bg-tertiary)' }}>
                    <motion.div
                      style={{ height: '100%', background: usageColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePct}%` }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.05 }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-tighter" style={{ color: 'var(--text-subtle)' }}>
                    <span>Allocation</span>
                    <span style={{ color: usageColor }}>{usagePct.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <div className="flex items-center gap-2">
                    <Database size={12} className="text-pink-400" />
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-subtle)' }}>
                      Created: {email.createdAt ? new Date(email.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Unknown'}
                    </span>
                  </div>
                  <motion.div whileHover={{ scale: 1.2 }}>
                    <MailPlus size={14} className="text-slate-500 cursor-pointer hover:text-blue-400 transition-colors" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedEmail}
        onClose={() => setSelectedEmail(null)}
        title={selectedEmail?.address || 'Email Details'}
        subtitle="Email account configuration"
      >
        {selectedEmail && (() => {
          const selUsagePct = getUsagePct(selectedEmail.used, selectedEmail.quota);
          const selUsageColor = getUsageColor(selUsagePct);
          return (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <DotStatus status={selectedEmail.status} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{selectedEmail.status}</span>
                <span className="mg-badge mg-badge-email">{getDomainName(selectedEmail.domainId)}</span>
              </div>

              {/* Usage */}
              <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                <div className="flex justify-between items-end">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}><HardDrive size={12} /> Storage Usage</p>
                  <p className="text-sm font-black" style={{ color: 'var(--text-secondary)' }}>
                    {(selectedEmail.used / 1024).toFixed(1)} <span style={{ color: 'var(--text-subtle)' }}>/</span> {(selectedEmail.quota / 1024).toFixed(0)} GB
                  </p>
                </div>
                <div className="h-3 rounded-full overflow-hidden shadow-inner" style={{ background: 'var(--bg-tertiary)' }}>
                  <motion.div
                    style={{ height: '100%', background: selUsageColor, borderRadius: '9999px' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${selUsagePct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
                  <span>Allocation</span>
                  <span style={{ color: selUsageColor }}>{selUsagePct.toFixed(0)}%</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 modal-info-grid">
                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><ShieldCheck size={12} /> Domain</p>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{getDomainName(selectedEmail.domainId)}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Calendar size={12} /> Created</p>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {selectedEmail.createdAt ? new Date(selectedEmail.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><HardDrive size={12} /> Quota</p>
                  <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{(selectedEmail.quota / 1024).toFixed(0)} GB</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Database size={12} /> Used</p>
                  <p className="font-bold text-lg" style={{ color: selUsageColor }}>{(selectedEmail.used / 1024).toFixed(1)} GB</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-2 modal-actions">
                <motion.button
                  onClick={() => { openEditModal(selectedEmail); setSelectedEmail(null); }}
                  className="mg-btn-primary flex-1"
                  whileTap={{ scale: 0.96 }}
                >
                  <Pencil size={14} /> Edit Email
                </motion.button>
                <motion.button
                  onClick={() => setSelectedEmail(null)}
                  className="mg-btn-secondary flex-1"
                  whileTap={{ scale: 0.96 }}
                >
                  Close
                </motion.button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEmail ? 'Edit Email' : 'Add Email'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="mg-label">Email Address</label>
            <div className="email-address-row flex gap-4 items-center">
              <input
                required
                placeholder="user"
                value={formData.address.split('@')[0] || ''}
                onChange={e => {
                  const domain = domains.find(d => d.id === formData.domainId)?.name || '';
                  setFormData({ ...formData, address: `${e.target.value}@${domain}` });
                }}
                className="mg-input flex-1 font-bold"
              />
              <span className="at-symbol font-bold" style={{ color: 'var(--text-subtle)' }}>@</span>
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
                className="mg-select flex-1 font-bold text-blue-400"
              >
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="mg-label">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'suspended' | 'disabled' })}
              className="mg-select font-bold"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="mg-label">Storage (MB)</label>
              <input
                type="number"
                required
                min={100}
                step={100}
                value={formData.quota}
                onChange={e => setFormData({ ...formData, quota: parseInt(e.target.value) })}
                className="mg-input font-bold"
              />
            </div>
            {editingEmail && (
              <div className="space-y-2">
                <label className="mg-label">Used (MB)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={formData.quota}
                  value={formData.used}
                  onChange={e => setFormData({ ...formData, used: parseInt(e.target.value) })}
                  className="mg-input font-bold text-blue-400"
                />
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <motion.button type="button" onClick={closeModal} className="mg-btn-secondary flex-1" whileTap={{ scale: 0.96 }}>Cancel</motion.button>
            <motion.button type="submit" className="mg-btn-primary flex-1" whileTap={{ scale: 0.96 }}>
              {editingEmail ? 'Save Changes' : 'Add Email'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
