import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Plus, Search, Pencil, Trash2, Phone, Mail as MailIcon, Hash, ShieldCheck, Calendar, DollarSign, Server } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { MagneticButton } from '@/components/MagneticButton';
import type { Domain } from '@/types';

interface DomainsProps {
  domains: Domain[];
  onAdd: (domain: Omit<Domain, 'id'>) => void | Promise<unknown>;
  onUpdate: (id: string, updates: Partial<Domain>) => void | Promise<unknown>;
  onDelete: (id: string) => void | Promise<unknown>;
}

function getServiceBadge(service: string) {
  const map: Record<string, string> = {
    domain: 'mg-badge mg-badge-domain',
    email: 'mg-badge mg-badge-email',
    cloud: 'mg-badge mg-badge-cloud',
  };
  return map[service] || 'mg-badge mg-badge-domain';
}

function DotStatus({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: '#22c55e',
    expire: '#ef4444',
    inactive: '#ef4444',
    pending: '#f59e0b',
  };
  return (
    <span className="mg-dot" style={{
      width: 7, height: 7, borderRadius: '50%',
      background: colors[status] || '#94a3b8',
      display: 'inline-block', flexShrink: 0
    }} />
  );
}

const initialForm: Omit<Domain, 'id'> = {
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
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.4, 0, 0.2, 1] as any }
  }),
};

export function Domains({ domains, onAdd, onUpdate, onDelete }: DomainsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState<Omit<Domain, 'id'>>(initialForm);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  const filtered = domains.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setFormData(initialForm);
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

  const formatDate = (date: string) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
    } catch {
      return date;
    }
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
        <h1 className="mg-page-title">Domains</h1>

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

          <MagneticButton onClick={openAddModal} className="mg-btn-primary shadow-lg shadow-blue-500/20">
            <Plus size={18} />
            <span>Add Domain</span>
          </MagneticButton>
        </div>
      </motion.div>

      {/* Content - Grid of Cards */}
      {filtered.length === 0 ? (
        <motion.div
          className="mg-card p-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mg-empty-icon w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-glass)' }}>
            <Globe size={32} style={{ color: 'var(--text-subtle)' }} />
          </div>
          <p className="mg-empty-title text-lg">System database empty</p>
          <p className="mg-empty-text mx-auto">
            {searchQuery ? 'No match found' : 'Add your first domain to begin monitoring'}
          </p>
        </motion.div>
      ) : (
        <div className="card-container">
          {filtered.map((domain, i) => (
            <motion.div
              key={domain.id}
              className="mg-card p-6 flex flex-col h-full cursor-pointer"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={i}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onClick={() => setSelectedDomain(domain)}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"
                    whileHover={{ rotate: 8, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Globe size={18} className="text-blue-400" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{domain.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <DotStatus status={domain.status} />
                      <span className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--text-subtle)' }}>{domain.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); openEditModal(domain); }}
                    className="mg-icon-btn p-1.5 rounded-lg"
                    whileHover={{ scale: 1.15, background: 'var(--bg-glass)' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Pencil size={14} />
                  </motion.button>
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); onDelete(domain.id); }}
                    className="mg-icon-btn danger p-1.5 rounded-lg"
                    whileHover={{ scale: 1.15, background: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-2 mb-6">
                <span className={getServiceBadge(domain.service)}>{domain.service}</span>
                <span className="mg-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>{domain.provider || 'Generic'}</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-y-4 mb-6 text-[12px]">
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Hash size={12} /> Seats</p>
                  <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>{domain.seats || '0'}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><ShieldCheck size={12} /> Server</p>
                  <p className="font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{domain.server || 'LOCAL'}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Phone size={12} /> Phone</p>
                  <p style={{ color: 'var(--text-secondary)' }}>{domain.phone || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><MailIcon size={12} /> Contact</p>
                  <p className="truncate" style={{ color: 'var(--text-secondary)' }}>{domain.contactEmail || '—'}</p>
                </div>
              </div>

              {/* Timeline & Money */}
              <div className="mt-auto pt-4 space-y-4" style={{ borderTop: '1px solid var(--border-default)' }}>
                <div className="flex justify-between items-center text-[11px]">
                  <div className="space-y-0.5">
                    <p className="uppercase tracking-tighter" style={{ color: 'var(--text-subtle)' }}>Investment</p>
                    <p className="text-blue-400 font-black text-sm">{formatCurrency(domain.money)}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="uppercase tracking-tighter" style={{ color: 'var(--text-subtle)' }}>Timeline</p>
                    <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>{formatDate(domain.startDate)} - {formatDate(domain.endDate)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedDomain}
        onClose={() => setSelectedDomain(null)}
        title={selectedDomain?.name || 'Domain Details'}
        subtitle="Domain information and configuration"
        size="lg"
      >
        {selectedDomain && (
          <div className="space-y-6">
            {/* Status & Service */}
            <div className="flex items-center gap-3">
              <DotStatus status={selectedDomain.status} />
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{selectedDomain.status}</span>
              <span className={getServiceBadge(selectedDomain.service)}>{selectedDomain.service}</span>
              <span className="mg-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>{selectedDomain.provider || 'Generic'}</span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 modal-info-grid">
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Hash size={12} /> Seats</p>
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{selectedDomain.seats || '0'}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Server size={12} /> Server</p>
                <p className="font-mono font-bold truncate" style={{ color: 'var(--text-primary)' }}>{selectedDomain.server || 'LOCAL'}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Phone size={12} /> Phone</p>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedDomain.phone || '—'}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><MailIcon size={12} /> Contact</p>
                <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{selectedDomain.contactEmail || '—'}</p>
              </div>
            </div>

            {/* Timeline & Money */}
            <div className="grid grid-cols-2 gap-4 modal-info-grid">
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><DollarSign size={12} /> Investment</p>
                <p className="text-blue-400 font-black text-lg">{formatCurrency(selectedDomain.money)}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Calendar size={12} /> Timeline</p>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatDate(selectedDomain.startDate)} — {formatDate(selectedDomain.endDate)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2 modal-actions">
              <motion.button
                onClick={() => { openEditModal(selectedDomain); setSelectedDomain(null); }}
                className="mg-btn-primary flex-1"
                whileTap={{ scale: 0.96 }}
              >
                <Pencil size={14} /> Edit Domain
              </motion.button>
              <motion.button
                onClick={() => setSelectedDomain(null)}
                className="mg-btn-secondary flex-1"
                whileTap={{ scale: 0.96 }}
              >
                Close
              </motion.button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingDomain ? 'Edit Domain' : 'Add Domain'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="mg-label">Domain Name</label>
              <input required placeholder="system.io" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mg-input" />
            </div>
            <div className="space-y-2">
              <label className="mg-label">Service Module</label>
              <select value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value as Domain['service'] })} className="mg-select font-bold">
                <option value="domain">Domain</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="mg-label">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as Domain['status'] })} className="mg-select font-bold">
                <option value="active">Active</option>
                <option value="expire">Expire</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="mg-label">Seats Capacity</label>
              <input type="number" min={0} value={formData.seats} onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) || 0 })} className="mg-input font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="mg-label">Phone</label>
              <input placeholder="+91…" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mg-input" />
            </div>
            <div className="space-y-2">
              <label className="mg-label">Contact</label>
              <input placeholder="@link" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} className="mg-input" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="mg-label">Investment (₹)</label>
              <input type="number" min={0} step={0.01} value={formData.money} onChange={e => setFormData({ ...formData, money: parseFloat(e.target.value) || 0 })} className="mg-input font-bold text-blue-400" />
            </div>
            <div className="space-y-2">
              <label className="mg-label">Provider</label>
              <input placeholder="Name" value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} className="mg-input font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="mg-label">Start Date</label>
              <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="mg-input" />
            </div>
            <div className="space-y-2">
              <label className="mg-label">End Date</label>
              <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="mg-input" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <motion.button type="button" onClick={closeModal} className="mg-btn-secondary flex-1" whileTap={{ scale: 0.96 }}>
              Cancel
            </motion.button>
            <motion.button type="submit" className="mg-btn-primary flex-1" whileTap={{ scale: 0.96 }}>
              {editingDomain ? 'Save Changes' : 'Add Domain'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
