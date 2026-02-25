import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Globe, Plus, Search, Pencil, Trash2, Phone, Mail as MailIcon, Hash, ShieldCheck, Database, Calendar, DollarSign, Server as ServerIcon, Cpu, Activity, Zap, HardDrive } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { MagneticButton } from '@/components/MagneticButton';
import type { Domain, Server, Email } from '@/types';

// ─── Unified entry type for display ────────────────────────────
interface InfraEntry {
    id: string;
    name: string;
    status: string;
    type: 'domain' | 'server' | 'email';
    // Domain-specific
    service?: string;
    seats?: number;
    phone?: string;
    contactEmail?: string;
    money?: number;
    startDate?: string;
    endDate?: string;
    provider?: string;
    server?: string;
    // Server-specific
    hostname?: string;
    ip?: string;
    serverType?: string;
    port?: number;
    // Email-specific
    address?: string;
    domainId?: string;
    quota?: number;
    used?: number;
    createdAt?: string;
}

interface InfraProps {
    domains: Domain[];
    servers: Server[];
    emails: Email[];
    initialFilter?: string | null;
    onAdd: (domain: Omit<Domain, 'id'>) => void | Promise<unknown>;
    onUpdate: (id: string, updates: Partial<Domain>) => void | Promise<unknown>;
    onDelete: (id: string) => void | Promise<unknown>;
}

function getTypeBadge(type: string) {
    const map: Record<string, string> = {
        domain: 'mg-badge mg-badge-domain',
        email: 'mg-badge mg-badge-email',
        server: 'mg-badge mg-badge-cloud',
    };
    return map[type.toLowerCase()] || 'mg-badge mg-badge-domain';
}

function DotStatus({ status }: { status: string }) {
    const colors: Record<string, string> = {
        active: '#22c55e',
        online: '#22c55e',
        expire: '#ef4444',
        inactive: '#ef4444',
        offline: '#ef4444',
        suspended: '#ef4444',
        disabled: '#94a3b8',
        pending: '#f59e0b',
        maintenance: '#f59e0b',
    };
    return (
        <span className="mg-dot" style={{
            width: 7, height: 7, borderRadius: '50%',
            background: colors[status.toLowerCase()] || '#94a3b8',
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
    provider: '',
    server: '',
};

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: (i: number) => ({
        opacity: 1, y: 0, scale: 1,
        transition: { delay: i * 0.06, duration: 0.45, ease: [0.4, 0, 0.2, 1] as any }
    }),
};

export function Infra({ domains, servers, emails, initialFilter, onAdd, onUpdate, onDelete }: InfraProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<string | null>(initialFilter || null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
    const [formData, setFormData] = useState<Omit<Domain, 'id'>>(initialForm);
    const [selectedEntry, setSelectedEntry] = useState<InfraEntry | null>(null);

    useEffect(() => {
        if (initialFilter) {
            setActiveFilter(initialFilter);
        }
    }, [initialFilter]);

    // ─── Merge all data into unified entries ───────────────────
    const allEntries: InfraEntry[] = useMemo(() => {
        const domainEntries: InfraEntry[] = domains.map(d => ({
            id: d.id,
            name: d.name,
            status: d.status,
            type: 'domain' as const,
            service: d.service,
            seats: d.seats,
            phone: d.phone,
            contactEmail: d.contactEmail,
            money: d.money,
            startDate: d.startDate,
            endDate: d.endDate,
            provider: d.provider,
            server: d.server,
        }));

        const serverEntries: InfraEntry[] = servers.map(s => ({
            id: s.id,
            name: s.name,
            status: s.status,
            type: 'server' as const,
            hostname: s.hostname,
            ip: s.ip,
            serverType: s.type,
            port: s.port,
            provider: s.type.toUpperCase(),
        }));

        const emailEntries: InfraEntry[] = emails.map(e => ({
            id: e.id,
            name: e.address,
            status: e.status,
            type: 'email' as const,
            address: e.address,
            domainId: e.domainId,
            quota: e.quota,
            used: e.used,
            createdAt: e.createdAt,
        }));

        return [...domainEntries, ...serverEntries, ...emailEntries];
    }, [domains, servers, emails]);

    // ─── Counts for filter tabs ──────────────────────────────
    const counts = useMemo(() => ({
        all: allEntries.length,
        domain: allEntries.filter(e => e.type === 'domain').length,
        server: allEntries.filter(e => e.type === 'server').length,
        email: allEntries.filter(e => e.type === 'email').length,
    }), [allEntries]);

    // ─── Filtered results ─────────────────────────────────────
    const filtered = allEntries.filter(d => {
        const matchesSearch =
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.provider || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.hostname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.address || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = !activeFilter || d.type === activeFilter.toLowerCase();

        return matchesSearch && matchesFilter;
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
        setFormData(initialForm);
        setIsModalOpen(true);
    };

    const openEditModalForDomain = (domain: Domain) => {
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

    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return '₹0.00';
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (date: string | undefined) => {
        if (!date) return '—';
        try {
            return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
        } catch {
            return date;
        }
    };

    // ─── Card icon based on entry type ────────────────────────
    const getEntryIcon = (type: string) => {
        switch (type) {
            case 'server': return <Cpu size={18} className="text-emerald-400" />;
            case 'email': return <MailIcon size={18} className="text-purple-400" />;
            default: return <ShieldCheck size={18} className="text-blue-400" />;
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'server': return 'rgba(16, 185, 129, 0.1)';
            case 'email': return 'rgba(168, 85, 247, 0.1)';
            default: return 'rgba(59, 130, 246, 0.1)';
        }
    };

    // ─── Render card content based on entry type ──────────────
    const renderCardContent = (entry: InfraEntry) => {
        switch (entry.type) {
            case 'server':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-y-4 mb-6 text-[12px]">
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Globe size={12} /> Hostname</p>
                                <p className="font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{entry.hostname || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Zap size={12} /> IP</p>
                                <p className="font-mono" style={{ color: 'var(--text-secondary)' }}>{entry.ip || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Activity size={12} /> Protocol</p>
                                <p className="font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>{entry.serverType || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Hash size={12} /> Port</p>
                                <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>{entry.port || '—'}</p>
                            </div>
                        </div>
                    </>
                );
            case 'email':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-y-4 mb-6 text-[12px]">
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><HardDrive size={12} /> Quota</p>
                                <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>{((entry.quota || 0) / 1024).toFixed(0)} GB</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Database size={12} /> Used</p>
                                <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>{((entry.used || 0) / 1024).toFixed(1)} GB</p>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Calendar size={12} /> Created</p>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                </p>
                            </div>
                        </div>
                    </>
                );
            default: // domain
                return (
                    <>
                        <div className="grid grid-cols-2 gap-y-4 mb-6 text-[12px]">
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Hash size={12} /> Seats</p>
                                <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>{entry.seats || '0'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Globe size={12} /> Node</p>
                                <p className="font-mono truncate uppercase" style={{ color: 'var(--text-secondary)' }}>{entry.server || 'LOCAL'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><Phone size={12} /> Phone</p>
                                <p style={{ color: 'var(--text-secondary)' }}>{entry.phone || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5" style={{ color: 'var(--text-subtle)' }}><MailIcon size={12} /> Contact</p>
                                <p className="truncate" style={{ color: 'var(--text-secondary)' }}>{entry.contactEmail || '—'}</p>
                            </div>
                        </div>
                        <div className="mt-auto pt-4 space-y-4" style={{ borderTop: '1px solid var(--border-default)' }}>
                            <div className="flex justify-between items-center text-[11px]">
                                <div className="space-y-0.5">
                                    <p className="uppercase tracking-tighter" style={{ color: 'var(--text-subtle)' }}>Investment</p>
                                    <p className="text-blue-400 font-black text-sm">{formatCurrency(entry.money)}</p>
                                </div>
                                <div className="text-right space-y-0.5">
                                    <p className="uppercase tracking-tighter" style={{ color: 'var(--text-subtle)' }}>Timeline</p>
                                    <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>{formatDate(entry.startDate)} - {formatDate(entry.endDate)}</p>
                                </div>
                            </div>
                        </div>
                    </>
                );
        }
    };

    // ─── Render detail modal content ──────────────────────────
    const renderDetailContent = (entry: InfraEntry) => {
        switch (entry.type) {
            case 'server':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <DotStatus status={entry.status} />
                            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{entry.status}</span>
                            <span className={getTypeBadge('server')}>SERVER</span>
                            <span className="mg-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>PORT {entry.port}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 modal-info-grid">
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Globe size={12} /> Hostname</p>
                                <p className="font-mono font-bold text-blue-400 break-all">{entry.hostname}</p>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Zap size={12} /> IP Address</p>
                                <p className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{entry.ip}</p>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Activity size={12} /> Protocol</p>
                                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{(entry.serverType || '').toUpperCase()}</p>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Hash size={12} /> Port</p>
                                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{entry.port}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'email':
                const usedPct = entry.quota ? Math.min(100, ((entry.used || 0) / entry.quota) * 100) : 0;
                const usageColor = usedPct > 80 ? '#ef4444' : usedPct > 60 ? '#f59e0b' : '#22c55e';
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <DotStatus status={entry.status} />
                            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{entry.status}</span>
                            <span className={getTypeBadge('email')}>EMAIL</span>
                        </div>
                        <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                            <div className="flex justify-between items-end">
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}><HardDrive size={12} /> Storage</p>
                                <p className="text-sm font-black" style={{ color: 'var(--text-secondary)' }}>
                                    {((entry.used || 0) / 1024).toFixed(1)} <span style={{ color: 'var(--text-subtle)' }}>/</span> {((entry.quota || 0) / 1024).toFixed(0)} GB
                                </p>
                            </div>
                            <div className="h-3 rounded-full overflow-hidden shadow-inner" style={{ background: 'var(--bg-tertiary)' }}>
                                <motion.div
                                    style={{ height: '100%', background: usageColor, borderRadius: '9999px' }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${usedPct}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
                                <span>Allocation</span>
                                <span style={{ color: usageColor }}>{usedPct.toFixed(0)}%</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 modal-info-grid">
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><HardDrive size={12} /> Quota</p>
                                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{((entry.quota || 0) / 1024).toFixed(0)} GB</p>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Calendar size={12} /> Created</p>
                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            default: // domain
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <DotStatus status={entry.status} />
                            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{entry.status}</span>
                            <span className={getTypeBadge('domain')}>DOMAIN</span>
                            <span className="mg-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>{entry.provider || 'Generic'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 modal-info-grid">
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Hash size={12} /> Seats</p>
                                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{entry.seats || '0'}</p>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><ServerIcon size={12} /> Node</p>
                                <p className="font-mono font-bold truncate uppercase" style={{ color: 'var(--text-primary)' }}>{entry.server || 'LOCAL'}</p>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Phone size={12} /> Phone</p>
                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{entry.phone || '—'}</p>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><MailIcon size={12} /> Contact</p>
                                <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{entry.contactEmail || '—'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 modal-info-grid">
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><DollarSign size={12} /> Investment</p>
                                <p className="text-blue-400 font-black text-lg">{formatCurrency(entry.money)}</p>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}><Calendar size={12} /> Timeline</p>
                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatDate(entry.startDate)} — {formatDate(entry.endDate)}</p>
                            </div>
                        </div>
                    </div>
                );
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
                <h1 className="mg-page-title">Infra Management</h1>

                <div className="domain-actions">
                    {/* Filter Tabs with Counts */}
                    <div className="infra-filter-tabs flex flex-wrap p-1 rounded-xl gap-1" style={{ background: 'var(--bg-glass)' }}>
                        {[
                            { label: 'All', key: null, count: counts.all },
                            { label: 'Domain', key: 'domain', count: counts.domain },
                            { label: 'Server', key: 'server', count: counts.server },
                            { label: 'Email', key: 'email', count: counts.email },
                        ].map((f) => {
                            const isActive = activeFilter === f.key;
                            return (
                                <button
                                    key={f.label}
                                    onClick={() => setActiveFilter(f.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${isActive
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                        : ''
                                        }`}
                                    style={!isActive ? { color: 'var(--text-muted)' } : undefined}
                                >
                                    {f.label}
                                    <span
                                        className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-black"
                                        style={isActive
                                            ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                                            : { background: 'var(--bg-glass)', color: 'var(--text-subtle)', border: '1px solid var(--border-default)' }
                                        }
                                    >
                                        {f.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

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
                        <span>Add Entry</span>
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
                        <Database size={32} style={{ color: 'var(--text-subtle)' }} />
                    </div>
                    <p className="mg-empty-title text-lg">No records found</p>
                    <p className="mg-empty-text mx-auto">
                        {activeFilter
                            ? `No ${activeFilter} entries found matching your query.`
                            : 'Add your first infrastructure entry to begin tracking.'}
                    </p>
                    {activeFilter && (
                        <button onClick={() => setActiveFilter(null)} className="mt-4 text-xs font-bold text-blue-500 uppercase tracking-widest hover:underline">
                            Clear Filters
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="card-container">
                    {filtered.map((entry, i) => (
                        <motion.div
                            key={`${entry.type}-${entry.id}`}
                            className="mg-card p-6 flex flex-col h-full cursor-pointer"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            whileHover={{ y: -6, scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            onClick={() => setSelectedEntry(entry)}
                        >
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: getIconBg(entry.type) }}
                                        whileHover={{ rotate: 8, scale: 1.1 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        {getEntryIcon(entry.type)}
                                    </motion.div>
                                    <div>
                                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{entry.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <DotStatus status={entry.status} />
                                            <span className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--text-subtle)' }}>{entry.status}</span>
                                        </div>
                                    </div>
                                </div>
                                {entry.type === 'domain' && (
                                    <div className="flex gap-1">
                                        <motion.button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const dom = domains.find(d => d.id === entry.id);
                                                if (dom) openEditModalForDomain(dom);
                                            }}
                                            className="mg-icon-btn p-1.5 rounded-lg"
                                            whileHover={{ scale: 1.15, background: 'var(--bg-glass)' }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Pencil size={14} />
                                        </motion.button>
                                        <motion.button
                                            onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                                            className="mg-icon-btn danger p-1.5 rounded-lg"
                                            whileHover={{ scale: 1.15, background: 'rgba(239, 68, 68, 0.1)' }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Trash2 size={14} />
                                        </motion.button>
                                    </div>
                                )}
                            </div>

                            {/* Badges */}
                            <div className="flex gap-2 mb-6">
                                <span className={getTypeBadge(entry.type)}>{entry.type}</span>
                                {entry.provider && (
                                    <span className="mg-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>{entry.provider}</span>
                                )}
                            </div>

                            {/* Type-specific content */}
                            {renderCardContent(entry)}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Details Modal */}
            <Modal
                isOpen={!!selectedEntry}
                onClose={() => setSelectedEntry(null)}
                title={selectedEntry?.name || 'Entry Details'}
                subtitle={`${selectedEntry?.type?.toUpperCase() || ''} infrastructure entry`}
                size="lg"
            >
                {selectedEntry && (
                    <div className="space-y-6">
                        {renderDetailContent(selectedEntry)}
                        {/* Actions */}
                        <div className="flex gap-4 pt-2 modal-actions">
                            {selectedEntry.type === 'domain' && (
                                <motion.button
                                    onClick={() => {
                                        const dom = domains.find(d => d.id === selectedEntry.id);
                                        if (dom) { openEditModalForDomain(dom); setSelectedEntry(null); }
                                    }}
                                    className="mg-btn-primary flex-1"
                                    whileTap={{ scale: 0.96 }}
                                >
                                    <Pencil size={14} /> Edit Entry
                                </motion.button>
                            )}
                            <motion.button
                                onClick={() => setSelectedEntry(null)}
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
                title={editingDomain ? 'Edit Entry' : 'Add Entry'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="mg-label">Entry Name</label>
                            <input required placeholder="system.io" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mg-input" />
                        </div>
                        <div className="space-y-2">
                            <label className="mg-label">Service Module</label>
                            <select value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value as any })} className="mg-select font-bold">
                                <option value="domain">Domain</option>
                                <option value="email">Email</option>
                                <option value="server">Server</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="mg-label">Status</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="mg-select font-bold">
                                <option value="active">Active</option>
                                <option value="expire">Expire</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="mg-label">Capacity / Seats</label>
                            <input type="number" min={0} value={formData.seats} onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) || 0 })} className="mg-input font-bold" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="mg-label">Phone</label>
                            <input placeholder="+91…" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mg-input" />
                        </div>
                        <div className="space-y-2">
                            <label className="mg-label">Contact Link</label>
                            <input placeholder="@link" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} className="mg-input" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="mg-label">Investment (₹)</label>
                            <input type="number" min={0} step={0.01} value={formData.money} onChange={e => setFormData({ ...formData, money: parseFloat(e.target.value) || 0 })} className="mg-input font-bold text-blue-400" />
                        </div>
                        <div className="space-y-2">
                            <label className="mg-label">Provider Name</label>
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
                            {editingDomain ? 'Save Changes' : 'Add Entry'}
                        </motion.button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
