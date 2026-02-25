import { useState } from 'react';
import { motion } from 'framer-motion';
import { Server as ServerIcon, Plus, Search, Pencil, Trash2, Cpu, Activity, Globe, Zap, Wifi, Hash } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { MagneticButton } from '@/components/MagneticButton';
import type { Server } from '@/types';

type ServerType = Server;

interface ServersProps {
  servers: ServerType[];
  onAdd: (server: Omit<ServerType, 'id'>) => void | Promise<unknown>;
  onUpdate: (id: string, updates: Partial<ServerType>) => void | Promise<unknown>;
  onDelete: (id: string) => void | Promise<unknown>;
}



function getTypeBadge(type: string) {
  const map: Record<string, string> = {
    smtp: 'mg-badge mg-badge-domain',
    imap: 'mg-badge mg-badge-email',
    pop3: 'mg-badge mg-badge-cloud',
  };
  return map[type] || 'mg-badge mg-badge-domain';
}

function DotStatus({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: '#22c55e',
    offline: '#ef4444',
    maintenance: '#f59e0b',
  };
  return (
    <span className="mg-dot" style={{
      width: 7, height: 7, borderRadius: '50%',
      background: colors[status] || '#94a3b8',
      display: 'inline-block', flexShrink: 0
    }} />
  );
}

const initialForm: Omit<ServerType, 'id'> = {
  name: '',
  hostname: '',
  ip: '',
  type: 'smtp',
  port: 587,
  status: 'online',
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.45, ease: [0.4, 0, 0.2, 1] as any }
  }),
};

export function Servers({ servers, onAdd, onUpdate, onDelete }: ServersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerType | null>(null);
  const [formData, setFormData] = useState<Omit<ServerType, 'id'>>(initialForm);
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);

  const filtered = servers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ip.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingServer) {
      onUpdate(editingServer.id, formData);
    } else {
      onAdd(formData);
    }
    closeModal();
  };

  const openAddModal = () => {
    setEditingServer(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (server: ServerType) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      hostname: server.hostname,
      ip: server.ip,
      type: server.type,
      port: server.port,
      status: server.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingServer(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="domain-header"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '24px' }}
      >
        <h1 className="mg-page-title">Servers</h1>

        <div className="domain-actions">
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
            <span>Add Server</span>
          </MagneticButton>
        </div>
      </motion.div>

      {/* Grid of Cards */}
      {filtered.length === 0 ? (
        <motion.div
          className="mg-card p-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mg-empty-icon w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-glass)' }}>
            <ServerIcon size={32} style={{ color: 'var(--text-subtle)' }} />
          </div>
          <p className="mg-empty-title text-lg">No servers found</p>
          <p className="mg-empty-text mx-auto">
            {searchQuery ? 'Identifier mismatch search' : 'Add your first server to start monitoring'}
          </p>
        </motion.div>
      ) : (
        <div className="card-container">
          {filtered.map((server, i) => (
            <motion.div
              key={server.id}
              className="mg-card p-6 flex flex-col h-full cursor-pointer"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={i}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onClick={() => setSelectedServer(server)}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(139, 92, 246, 0.1)' }}
                    whileHover={{ rotate: 12, scale: 1.1 }}
                  >
                    <ServerIcon size={18} className="text-purple-400" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{server.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <DotStatus status={server.status} />
                      <span className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--text-subtle)' }}>{server.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); openEditModal(server); }}
                    className="mg-icon-btn p-1.5 rounded-lg"
                    whileHover={{ scale: 1.15, background: 'var(--bg-glass)' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Pencil size={14} />
                  </motion.button>
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); onDelete(server.id); }}
                    className="mg-icon-btn danger p-1.5 rounded-lg"
                    whileHover={{ scale: 1.15, background: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-2 mb-6">
                <span className={getTypeBadge(server.type)}>{server.type.toUpperCase()}</span>
                <span className="mg-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>PORT {server.port}</span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 gap-4 mb-6 text-[12px]">
                <div className="space-y-1.5 p-3 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                  <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Globe size={12} /> Hostname</p>
                  <p className="font-mono text-blue-400 truncate">{server.hostname}</p>
                </div>
                <div className="space-y-1.5 p-3 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                  <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Zap size={12} /> IP Address</p>
                  <p className="font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>{server.ip}</p>
                </div>
              </div>

              {/* Status Footer */}
              <div className="mt-auto pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: 'var(--text-subtle)' }}>Monitoring Active</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                  <Cpu size={12} className="text-slate-500" />
                  <span>Server {server.id.slice(0, 4).toUpperCase()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedServer}
        onClose={() => setSelectedServer(null)}
        title={selectedServer?.name || 'Server Details'}
        subtitle="Server configuration and status"
      >
        {selectedServer && (
          <div className="space-y-6">
            {/* Status & Type */}
            <div className="flex items-center gap-3">
              <DotStatus status={selectedServer.status} />
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{selectedServer.status}</span>
              <span className={getTypeBadge(selectedServer.type)}>{selectedServer.type.toUpperCase()}</span>
              <span className="mg-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>PORT {selectedServer.port}</span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 modal-info-grid">
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Globe size={12} /> Hostname</p>
                <p className="font-mono font-bold text-blue-400 break-all">{selectedServer.hostname}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Zap size={12} /> IP Address</p>
                <p className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{selectedServer.ip}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Wifi size={12} /> Protocol</p>
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{selectedServer.type.toUpperCase()}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Hash size={12} /> Port</p>
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{selectedServer.port}</p>
              </div>
            </div>

            {/* Monitoring */}
            <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Monitoring Active</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                <Cpu size={12} /> ID: {selectedServer.id.slice(0, 8).toUpperCase()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2 modal-actions">
              <motion.button
                onClick={() => { openEditModal(selectedServer); setSelectedServer(null); }}
                className="mg-btn-primary flex-1"
                whileTap={{ scale: 0.96 }}
              >
                <Pencil size={14} /> Edit Server
              </motion.button>
              <motion.button
                onClick={() => setSelectedServer(null)}
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
        title={editingServer ? 'Edit Server' : 'Add Server'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="mg-label">Server Name</label>
            <input required placeholder="Primary SMTP" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mg-input font-bold" />
          </div>

          <div className="space-y-2">
            <label className="mg-label">Hostname</label>
            <input required placeholder="smtp.domain.io" value={formData.hostname} onChange={e => setFormData({ ...formData, hostname: e.target.value })} className="mg-input font-mono text-blue-400" />
          </div>

          <div className="space-y-2">
            <label className="mg-label">IP Address</label>
            <input required placeholder="0.0.0.0" value={formData.ip} onChange={e => setFormData({ ...formData, ip: e.target.value })} className="mg-input font-mono" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="mg-label">Protocol</label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as ServerType['type'] })} className="mg-select font-bold">
                <option value="smtp">SMTP</option>
                <option value="imap">IMAP</option>
                <option value="pop3">POP3</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="mg-label">Port</label>
              <input type="number" required value={formData.port} onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })} className="mg-input font-bold" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="mg-label">Status</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ServerType['status'] })} className="mg-select font-bold">
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <motion.button type="button" onClick={closeModal} className="mg-btn-secondary flex-1" whileTap={{ scale: 0.96 }}>Cancel</motion.button>
            <motion.button type="submit" className="mg-btn-primary flex-1" whileTap={{ scale: 0.96 }}>
              {editingServer ? 'Save Changes' : 'Add Server'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
