import { useState, useEffect } from 'react';
import { Server as ServerIcon, Plus, Search, Pencil, Trash2, Cpu, Activity, Globe, Zap, Wifi, Hash, HardDrive, Layers, Shield, Monitor, AlertCircle, ShieldCheck, Calendar, Info } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { MagneticButton } from '@/components/MagneticButton';
import type { Server } from '@/types';

type ServerType = Server;

interface ServersProps {
  servers: ServerType[];
  onAdd: (server: Omit<ServerType, 'id'>) => void | Promise<unknown>;
  onUpdate: (id: string, updates: Partial<ServerType>) => void | Promise<unknown>;
  onDelete: (id: string) => void | Promise<unknown>;
  initialSelectedId?: string | null;
}

function getTypeBadge(type: string) {
  const map: Record<string, string> = {
    smtp: 'mg-badge mg-badge-domain',
    imap: 'mg-badge mg-badge-email',
    pop3: 'mg-badge mg-badge-cloud',
  };
  return map[type] || 'mg-badge mg-badge-domain';
}

const initialForm: Omit<ServerType, 'id'> = {
  name: '',
  hostname: '',
  ip: '',
  type: 'smtp',
  port: 587,
  status: 'online',
  ipAddress: '',
  osType: 'Ubuntu 22.04 LTS',
  cpuUsage: 0,
  ramUsage: 0,
  diskUsage: 0,
  uptimeStatus: 'Running',
  backupStatus: 'Healthy',
  backupDate: new Date().toISOString().split('T')[0],
  environmentTag: 'Production',
  expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  downtimeSimulation: false,
};

export function Servers({ servers, onAdd, onUpdate, onDelete, initialSelectedId }: ServersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerType | null>(null);
  const [formData, setFormData] = useState<Omit<ServerType, 'id'>>(initialForm);
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'expired' | 'suspended' | 'running' | 'down'>('all');

  useEffect(() => {
    if (initialSelectedId) {
      const match = servers.find(s => s.id === initialSelectedId);
      if (match) setSelectedServer(match);
    }
  }, [initialSelectedId, servers]);

  const today = new Date();

  const serverStats = {
    active: servers.filter(s => s.status === 'online' || s.status === 'running').length,
    expired: servers.filter(s => s.expiryDate && new Date(s.expiryDate) < today).length,
    suspended: servers.filter(s => s.status === 'maintenance' || s.status === 'offline').length,
    running: servers.filter(s => s.uptimeStatus === 'Running' && !s.downtimeSimulation).length,
    down: servers.filter(s => s.uptimeStatus === 'Down' || s.downtimeSimulation).length,
  };

  const filtered = servers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.ipAddress && s.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterMode === 'active') return s.status === 'online' || s.status === 'running';
    if (filterMode === 'expired') return s.expiryDate && new Date(s.expiryDate) < today;
    if (filterMode === 'suspended') return s.status === 'maintenance' || s.status === 'offline';
    if (filterMode === 'running') return s.uptimeStatus === 'Running' && !s.downtimeSimulation;
    if (filterMode === 'down') return s.uptimeStatus === 'Down' || s.downtimeSimulation;

    return true;
  });

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
      ipAddress: server.ipAddress || server.ip,
      osType: server.osType || 'Ubuntu 22.04 LTS',
      cpuUsage: server.cpuUsage || 0,
      ramUsage: server.ramUsage || 0,
      diskUsage: server.diskUsage || 0,
      uptimeStatus: server.uptimeStatus || 'Running',
      backupStatus: server.backupStatus || 'Healthy',
      backupDate: server.backupDate || '',
      environmentTag: server.environmentTag || 'Production',
      expiryDate: server.expiryDate || '',
      downtimeSimulation: !!server.downtimeSimulation,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingServer(null);
  };

  const getBackupBadge = (status?: string, date?: string) => {
    if (status === 'Failed') return { label: 'CRITICAL', color: 'bg-red-500/10 text-red-500', icon: AlertCircle };
    if (date) {
      const lastBackup = new Date(date);
      const diffDays = Math.floor((today.getTime() - lastBackup.getTime()) / (1000 * 3600 * 24));
      if (diffDays > 7) return { label: 'STALE', color: 'bg-orange-500/10 text-orange-500', icon: AlertCircle };
    }
    return { label: 'HEALTHY', color: 'bg-emerald-500/10 text-emerald-500', icon: ShieldCheck };
  };

  return (
    <div className="space-y-6">
      {/* Server Dashboard Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'active', label: 'Active', count: serverStats.active, icon: Wifi, color: 'emerald' },
          { id: 'expired', label: 'Expired', count: serverStats.expired, icon: Calendar, color: 'red' },
          { id: 'suspended', label: 'Suspended', count: serverStats.suspended, icon: Shield, color: 'orange' },
          {
            id: 'running',
            label: 'Availability',
            count: `${serverStats.running}/${servers.length}`,
            icon: Activity,
            color: 'blue',
            subtitle: serverStats.down > 0 ? `${serverStats.down} Critical Outages` : 'All Systems Operational'
          },
        ].map((stat) => {
          const isActive = filterMode === stat.id || (stat.id === 'running' && filterMode === 'down');
          return (
            <div
              key={stat.id}
              onClick={() => {
                if (stat.id === 'running') {
                  setFilterMode(filterMode === 'running' ? 'all' : 'running');
                } else {
                  setFilterMode(filterMode === stat.id ? 'all' : stat.id as any);
                }
              }}
              className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 cursor-pointer transition-all border-l-4 ${isActive ? 'ring-2 ring-blue-500/50' : ''}`}
              style={{ borderLeftColor: `var(--${stat.color}-500)` }}
            >
              <div className="flex justify-between items-start mb-2">
                <stat.icon size={16} className={`text-${stat.color}-500`} />
                <span className="text-xl font-black text-gray-900 dark:text-gray-100">{stat.count}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{stat.label}</p>
              {stat.subtitle && (
                <p className={`text-[9px] font-bold mt-1 ${serverStats.down > 0 && stat.id === 'running' ? 'text-red-400' : 'text-gray-600 dark:text-gray-500'}`}>
                  {stat.subtitle}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Servers</h1>
          {filterMode !== 'all' && (
            <button
              onClick={() => setFilterMode('all')}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 uppercase tracking-widest"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="mg-input pl-12 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
            />
          </div>
          <MagneticButton onClick={openAddModal} className="mg-btn-primary shadow-sm">
            <Plus size={18} />
            <span>Add Server</span>
          </MagneticButton>
        </div>
      </div>

      {/* Grid of Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
            <ServerIcon size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">No servers found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
            {searchQuery ? 'Identifier mismatch search' : 'Add your first server to start monitoring'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((server) => (
            <div
              key={server.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col h-full cursor-pointer hover:border-blue-500/20 dark:hover:border-blue-500/40 hover:shadow-md transition-all"
              onClick={() => setSelectedServer(server)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <ServerIcon size={18} className="text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {server.name}
                      {server.downtimeSimulation && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${server.downtimeSimulation ? 'bg-red-500' : (server.status === 'online' || server.status === 'running' ? 'bg-emerald-500' : 'bg-red-500')}`} />
                      <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                        {server.downtimeSimulation ? 'DOWN (SIM)' : server.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(server); }}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(server.id); }}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className={getTypeBadge(server.type)}>{server.type.toUpperCase()}</span>
                <span className="mg-badge bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">{server.environmentTag || 'Production'}</span>
                <span className={`mg-badge flex items-center gap-1 ${server.downtimeSimulation || server.uptimeStatus === 'Down' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                  {server.downtimeSimulation ? <AlertCircle size={10} /> : <Zap size={10} />}
                  {server.downtimeSimulation ? 'OFFLINE' : 'ONLINE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-[11px] font-bold uppercase tracking-wider">
                <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                  <p className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500"><Monitor size={12} /> OS Distro</p>
                  <p className="truncate text-gray-800 dark:text-gray-300">{server.osType || 'Unknown'}</p>
                </div>
                <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                  <p className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500"><Zap size={12} /> Public IP</p>
                  <p className="font-mono text-blue-600 dark:text-blue-400">{server.ipAddress || server.ip}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span className="flex items-center gap-1"><Cpu size={10} /> CPU Load</span>
                    <span className={(server.cpuUsage || 0) > 80 ? 'text-red-500' : ''}>{server.cpuUsage || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${(server.cpuUsage || 0) > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${server.cpuUsage || 0}%`, transition: 'width 1s ease-in-out' }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span className="flex items-center gap-1"><Layers size={10} /> RAM Usage</span>
                    <span className={(server.ramUsage || 0) > 85 ? 'text-orange-500' : ''}>{server.ramUsage || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${(server.ramUsage || 0) > 85 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                      style={{ width: `${server.ramUsage || 0}%`, transition: 'width 1s ease-in-out' }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span className="flex items-center gap-1"><HardDrive size={10} /> Disk Space</span>
                    <span className={(server.diskUsage || 0) > 90 ? 'text-red-500' : ''}>{server.diskUsage || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${(server.diskUsage || 0) > 90 ? 'bg-red-500' : 'bg-blue-400'}`}
                      style={{ width: `${server.diskUsage || 0}%`, transition: 'width 1s ease-in-out' }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-blue-500 dark:text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monitoring Active</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  <Cpu size={12} />
                  <span>Server {server.id.slice(0, 4).toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedServer}
        onClose={() => setSelectedServer(null)}
        title={selectedServer?.name || 'Server Details'}
        subtitle="Full diagnostic parameters"
      >
        {selectedServer && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className={`mg-badge ${selectedServer.status === 'online' || selectedServer.status === 'running' ? 'mg-badge-active' : 'mg-badge-inactive'}`}>{selectedServer.status}</span>
              <span className={getTypeBadge(selectedServer.type)}>{selectedServer.type.toUpperCase()}</span>
              <span className="mg-badge bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">PORT {selectedServer.port}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><Globe size={11} /> Hostname</p>
                <p className="font-mono font-bold text-blue-600 dark:text-blue-400 break-all">{selectedServer.hostname}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><Zap size={11} /> IP Address</p>
                <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{selectedServer.ip}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><Wifi size={11} /> Protocol</p>
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{selectedServer.type.toUpperCase()}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500"><Hash size={11} /> Port</p>
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{selectedServer.port}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'CPU', value: selectedServer.cpuUsage, icon: Cpu, color: (selectedServer.cpuUsage || 0) > 80 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400' },
                { label: 'RAM', value: selectedServer.ramUsage, icon: Layers, color: (selectedServer.ramUsage || 0) > 85 ? 'text-orange-500' : 'text-emerald-600 dark:text-emerald-400' },
                { label: 'DISK', value: selectedServer.diskUsage, icon: HardDrive, color: (selectedServer.diskUsage || 0) > 90 ? 'text-red-500' : 'text-blue-500 dark:text-blue-300' },
              ].map(res => (
                <div key={res.label} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-center">
                  <res.icon size={14} className={`mx-auto mb-1 ${res.color}`} />
                  <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">{res.label}</p>
                  <p className="text-sm font-black text-gray-800 dark:text-gray-100">{res.value || 0}%</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">Snapshot: {selectedServer.backupStatus}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400">
                <Calendar size={12} /> Due: {selectedServer.expiryDate || 'N/A'}
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { openEditModal(selectedServer); setSelectedServer(null); }}
                className="mg-btn-primary flex-1"
              >
                <Pencil size={14} /> Update Node
              </button>
              <button
                onClick={() => setSelectedServer(null)}
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
        title={editingServer ? 'Update Node Attributes' : 'Register New Node'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Identifiable Name</label>
            <input required placeholder="eg: Primary API Cluster" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mg-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">FQDN Hostname</label>
              <input required placeholder="node.domain.io" value={formData.hostname} onChange={e => setFormData({ ...formData, hostname: e.target.value })} className="mg-input font-mono text-blue-600 dark:text-blue-400 dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Network IPv4</label>
              <input required placeholder="127.0.0.1" value={formData.ip} onChange={e => setFormData({ ...formData, ip: e.target.value })} className="mg-input font-mono dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transmission Protocol</label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as ServerType['type'] })} className="mg-select font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="smtp">SMTP (Outbound)</option>
                <option value="imap">IMAP (Inbound)</option>
                <option value="pop3">POP3 (Legacy)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Service Port</label>
              <input type="number" required value={formData.port} onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })} className="mg-input font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Operational Integrity</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ServerType['status'] })} className="mg-select font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
              <option value="online">Online (Active)</option>
              <option value="offline">Offline (Internal)</option>
              <option value="maintenance">Maintenance (Lockdown)</option>
            </select>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400">Extended Node Telemetry</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Public Interface Override</label>
                <input placeholder="Interface IP" value={formData.ipAddress} onChange={e => setFormData({ ...formData, ipAddress: e.target.value })} className="mg-input !bg-blue-500/5 !border-blue-500/10 dark:!bg-gray-800 dark:!border-gray-700 font-mono" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Operating Environment</label>
                <input placeholder="Linux / Unix / Win" value={formData.osType} onChange={e => setFormData({ ...formData, osType: e.target.value })} className="mg-input !bg-blue-500/5 !border-blue-500/10 dark:!bg-gray-800 dark:!border-gray-700" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registry Timeline</label>
                <input type="date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} className="mg-input !bg-blue-500/5 !border-blue-500/10 dark:!bg-gray-800 dark:!border-gray-700" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Backup Policy</label>
                <select value={formData.backupStatus} onChange={e => setFormData({ ...formData, backupStatus: e.target.value })} className="mg-select !bg-blue-500/5 !border-blue-500/10 dark:!bg-gray-800 dark:!border-gray-700">
                  <option value="Healthy">Systemic (Healthy)</option>
                  <option value="Warning">Fragmented (Warning)</option>
                  <option value="Failed">Failed (Immediate Action)</option>
                  <option value="Not Configured">No Policy</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">CPU %</label>
                <input type="number" min="0" max="100" value={formData.cpuUsage} onChange={e => setFormData({ ...formData, cpuUsage: parseInt(e.target.value) })} className="mg-input !p-2 !text-xs !bg-blue-500/5 dark:!bg-gray-800" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">RAM %</label>
                <input type="number" min="0" max="100" value={formData.ramUsage} onChange={e => setFormData({ ...formData, ramUsage: parseInt(e.target.value) })} className="mg-input !p-2 !text-xs !bg-blue-500/5 dark:!bg-gray-800" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">DK %</label>
                <input type="number" min="0" max="100" value={formData.diskUsage} onChange={e => setFormData({ ...formData, diskUsage: parseInt(e.target.value) })} className="mg-input !p-2 !text-xs !bg-blue-500/5 dark:!bg-gray-800" />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
              <input
                type="checkbox"
                id="downtimeSimulation"
                checked={formData.downtimeSimulation}
                onChange={e => setFormData({ ...formData, downtimeSimulation: e.target.checked })}
                className="w-4 h-4 rounded appearance-none border border-red-500/30 bg-red-500/5 checked:bg-red-500 transition-colors cursor-pointer"
              />
              <label htmlFor="downtimeSimulation" className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 cursor-pointer flex-1">
                Trigger Node Integrity Failure (Downtime Simulation)
              </label>
              <Info size={14} className="text-red-500/30" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={closeModal} className="mg-btn-secondary flex-1 dark:border-gray-800 dark:text-gray-300">Abort</button>
            <button type="submit" className="mg-btn-primary flex-1">
              {editingServer ? 'Finalize Axis' : 'Commit Registry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
