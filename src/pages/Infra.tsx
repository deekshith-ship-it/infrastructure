import { useState, useEffect, useMemo } from 'react';
import { Globe, Plus, Search, Pencil, Trash2, Phone, Mail as MailIcon, Hash, ShieldCheck, Database, Calendar, DollarSign, Server as ServerIcon, Cpu, Activity, Zap, HardDrive, Layers, Shield } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { MagneticButton } from '@/components/MagneticButton';
import { motion } from 'framer-motion';
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
    // SaaS Extensions
    registrarName?: string;
    autoRenew?: boolean;
    sslExpiryDate?: string;
    dnsPlaceholder?: string;
    ipAddress?: string;
    osType?: string;
    cpuUsage?: number;
    ramUsage?: number;
    diskUsage?: number;
    uptimeStatus?: string;
    backupStatus?: string;
    environmentTag?: string;
    accountStatus?: string;
    adminPasswordReset?: boolean;
}

interface InfraProps {
    domains: Domain[];
    servers: Server[];
    emails: Email[];
    initialFilter?: string | null;
    onAddDomain: (domain: Omit<Domain, 'id'>) => void | Promise<unknown>;
    onUpdateDomain: (id: string, updates: Partial<Domain>) => void | Promise<unknown>;
    onDeleteDomain: (id: string) => void | Promise<unknown>;
    onAddServer: (server: Omit<Server, 'id'>) => void | Promise<unknown>;
    onUpdateServer: (id: string, updates: Partial<Server>) => void | Promise<unknown>;
    onDeleteServer: (id: string) => void | Promise<unknown>;
    onAddEmail: (email: Omit<Email, 'id'>) => void | Promise<unknown>;
    onUpdateEmail: (id: string, updates: Partial<Email>) => void | Promise<unknown>;
    onDeleteEmail: (id: string) => void | Promise<unknown>;
}

function getTypeBadge(type: string) {
    const map: Record<string, string> = {
        domain: 'mg-badge mg-badge-domain',
        email: 'mg-badge mg-badge-email',
        server: 'mg-badge mg-badge-cloud',
    };
    return map[type.toLowerCase()] || 'mg-badge mg-badge-domain';
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

export function Infra({
    domains, servers, emails, initialFilter,
    onAddDomain, onUpdateDomain, onDeleteDomain,
    onAddServer, onUpdateServer, onDeleteServer,
    onAddEmail, onUpdateEmail, onDeleteEmail
}: InfraProps) {
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
            registrarName: d.registrarName,
            autoRenew: d.autoRenew,
            sslExpiryDate: d.sslExpiryDate,
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
            osType: s.osType,
            cpuUsage: s.cpuUsage,
            ramUsage: s.ramUsage,
            diskUsage: s.diskUsage,
            uptimeStatus: s.uptimeStatus,
            backupStatus: s.backupStatus,
            environmentTag: s.environmentTag,
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
            accountStatus: e.accountStatus,
            adminPasswordReset: e.adminPasswordReset,
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

    const handleDelete = (id: string, type: 'domain' | 'server' | 'email') => {
        if (type === 'domain') onDeleteDomain(id);
        else if (type === 'server') onDeleteServer(id);
        else if (type === 'email') onDeleteEmail(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDomain) {
            onUpdateDomain(editingDomain.id, formData);
        } else {
            if (formData.service === 'server') {
                onAddServer({
                    name: formData.name,
                    hostname: formData.name,
                    ip: '0.0.0.0', // default/placeholder
                    status: 'online',
                    type: 'smtp',
                    port: 443,
                    osType: 'Linux',
                    ipAddress: '0.0.0.0',
                    cpuUsage: 0,
                    ramUsage: 0,
                    diskUsage: 0,
                    uptimeStatus: 'Running',
                    backupStatus: 'Healthy',
                    backupDate: new Date().toISOString(),
                    environmentTag: 'Production',
                    expiryDate: formData.endDate || new Date().toISOString(),
                    downtimeSimulation: false
                });
            } else if (formData.service === 'email') {
                const parts = formData.name.split('@');
                const domainName = parts.length > 1 ? parts[1] : formData.name;
                const parentDomain = domains.find(d => d.name === domainName);

                onAddEmail({
                    address: formData.name,
                    domainId: parentDomain ? parentDomain.id : 'unknown',
                    status: 'active',
                    quota: 5120, // 5GB default
                    used: 0,
                    createdAt: new Date().toISOString(),
                    storageLimit: 5120,
                    storageUsed: 0,
                    accountStatus: 'Active',
                    adminPasswordReset: false
                });
            } else {
                onAddDomain(formData);
            }
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

    const getEntryIcon = (type: string) => {
        switch (type) {
            case 'server': return <Cpu size={18} className="text-emerald-500" />;
            case 'email': return <MailIcon size={18} className="text-purple-500" />;
            default: return <ShieldCheck size={18} className="text-blue-500" />;
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'server': return 'rgba(16, 185, 129, 0.1)';
            case 'email': return 'rgba(168, 85, 247, 0.1)';
            default: return 'rgba(59, 130, 246, 0.1)';
        }
    };

    const renderCardContent = (entry: InfraEntry) => {
        switch (entry.type) {
            case 'server':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-y-4 mb-6 text-[11px] font-bold uppercase tracking-wider">
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-black dark:text-gray-500"><Globe size={11} className="text-gray-400" /> Hostname</p>
                                <p className="font-mono truncate text-gray-800 dark:text-gray-400">{entry.hostname || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-black dark:text-gray-500"><Zap size={11} className="text-gray-400" /> IP Axis</p>
                                <p className="font-mono text-gray-800 dark:text-gray-400">{entry.ip || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-black dark:text-gray-500"><Activity size={11} className="text-gray-400" /> Protocol</p>
                                <p className="text-gray-800 dark:text-gray-400">{entry.serverType || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-black dark:text-gray-500"><Hash size={11} className="text-gray-400" /> Port</p>
                                <p className="text-gray-800 dark:text-gray-400">{entry.port || '—'}</p>
                            </div>
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500/60" style={{ width: `${entry.cpuUsage || 0}%` }} />
                            </div>
                            <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500/60" style={{ width: `${entry.ramUsage || 0}%` }} />
                            </div>
                        </div>
                    </>
                );
            case 'email':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-y-4 mb-6 text-[11px] font-bold uppercase tracking-wider">
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-black dark:text-gray-500"><HardDrive size={11} className="text-gray-400" /> Quota</p>
                                <p className="text-gray-800 dark:text-gray-400">{((entry.quota || 0) / 1024).toFixed(0)} GB</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-black dark:text-gray-500"><Database size={11} className="text-gray-400" /> Used</p>
                                <p className="text-gray-800 dark:text-gray-400">{((entry.used || 0) / 1024).toFixed(1)} GB</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-purple-500/60" style={{ width: `${entry.quota ? (entry.used || 0) / entry.quota * 100 : 0}%` }} />
                        </div>
                    </>
                );
            default: // domain
                return (
                    <>
                        <div className="grid grid-cols-2 gap-y-4 mb-6 text-[11px] font-bold uppercase tracking-wider">
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-black dark:text-gray-500"><Hash size={11} className="text-gray-400" /> Seats</p>
                                <p className="text-gray-800 dark:text-gray-400">{entry.seats || '0'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-black dark:text-gray-500"><Globe size={11} className="text-gray-400" /> Node</p>
                                <p className="font-mono truncate text-gray-800 dark:text-gray-400">{entry.server || 'LOCAL'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-black dark:text-gray-500"><Phone size={11} className="text-gray-400" /> Phone</p>
                                <p className="text-gray-800 dark:text-gray-400">{entry.phone || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-black dark:text-gray-500"><MailIcon size={11} className="text-gray-400" /> Contact</p>
                                <p className="truncate text-gray-800 dark:text-gray-400">{entry.contactEmail || '—'}</p>
                            </div>
                        </div>
                        <div className="mt-auto pt-4 space-y-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                <div className="space-y-1">
                                    <p className="text-gray-400">Investment</p>
                                    <p className="text-blue-500 dark:text-blue-400 font-black">{formatCurrency(entry.money)}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-gray-400">Registry Timeline</p>
                                    <p className="text-gray-700 dark:text-gray-300">{formatDate(entry.startDate)} — {formatDate(entry.endDate)}</p>
                                </div>
                            </div>
                        </div>
                    </>
                );
        }
    };

    const renderDetailContent = (entry: InfraEntry) => {
        const itemClasses = "p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors hover:border-gray-200 dark:hover:border-gray-700";
        const labelClasses = "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500";
        const valueClasses = "font-bold text-gray-900 dark:text-gray-100";

        switch (entry.type) {
            case 'server':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className={`mg-badge ${entry.status === 'online' ? 'mg-badge-active' : 'mg-badge-inactive'}`}>{entry.status}</span>
                            <span className={getTypeBadge('server')}>SERVER</span>
                            <span className="mg-badge bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">PORT {entry.port}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className={itemClasses}>
                                <p className={labelClasses}><Globe size={11} /> Hostname</p>
                                <p className={`${valueClasses} font-mono text-blue-500 dark:text-blue-400 break-all`}>{entry.hostname}</p>
                            </div>
                            <div className={itemClasses}>
                                <p className={labelClasses}><Zap size={11} /> IP Address</p>
                                <p className={`${valueClasses} font-mono`}>{entry.ip}</p>
                            </div>
                            <div className={itemClasses}>
                                <p className={labelClasses}><Activity size={11} /> Protocol</p>
                                <p className={`${valueClasses} text-lg`}>{(entry.serverType || '').toUpperCase()}</p>
                            </div>
                            <div className={itemClasses}>
                                <p className={labelClasses}><Layers size={11} /> Environment</p>
                                <p className={`${valueClasses} text-lg text-emerald-500`}>{entry.environmentTag || 'Production'}</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-500/5 dark:bg-blue-500/[0.02] border border-blue-500/10 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400">Resource Utilization</p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">CPU</p>
                                    <p className="text-sm font-black text-gray-800 dark:text-gray-100">{entry.cpuUsage || 0}%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">RAM</p>
                                    <p className="text-sm font-black text-gray-800 dark:text-gray-100">{entry.ramUsage || 0}%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">STORAGE</p>
                                    <p className="text-sm font-black text-gray-800 dark:text-gray-100">{entry.diskUsage || 0}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'email':
                const usedPct = entry.quota ? Math.min(100, ((entry.used || 0) / entry.quota) * 100) : 0;
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className={`mg-badge ${entry.status === 'active' ? 'mg-badge-active' : 'mg-badge-inactive'}`}>{entry.status}</span>
                            <span className={getTypeBadge('email')}>EMAIL</span>
                        </div>
                        <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-4">
                            <div className="flex justify-between items-end">
                                <p className={labelClasses}><HardDrive size={11} /> Storage Analytics</p>
                                <p className="text-sm font-black text-gray-800 dark:text-gray-200">
                                    {((entry.used || 0) / 1024).toFixed(1)} <span className="text-gray-400">/</span> {((entry.quota || 0) / 1024).toFixed(0)} GB
                                </p>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${usedPct}%` }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <span>Occupancy</span>
                                <span className="text-blue-500">{usedPct.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                );
            default: // domain
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className={`mg-badge ${entry.status === 'active' ? 'mg-badge-active' : 'mg-badge-inactive'}`}>{entry.status}</span>
                            <span className={getTypeBadge('domain')}>DOMAIN</span>
                            <span className="mg-badge bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">{entry.provider || 'Generic'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className={itemClasses}>
                                <p className={labelClasses}><Hash size={11} /> Seats</p>
                                <p className={`${valueClasses} text-lg`}>{entry.seats || '0'}</p>
                            </div>
                            <div className={itemClasses}>
                                <p className={labelClasses}><ServerIcon size={11} /> Deployment Node</p>
                                <p className={`${valueClasses} font-mono uppercase`}>{entry.server || 'LOCAL'}</p>
                            </div>
                            <div className={itemClasses}>
                                <p className={labelClasses}><Phone size={11} /> Billing Phone</p>
                                <p className={valueClasses}>{entry.phone || '—'}</p>
                            </div>
                            <div className={itemClasses}>
                                <p className={labelClasses}><MailIcon size={11} /> Admin Email</p>
                                <p className={`${valueClasses} truncate`}>{entry.contactEmail || '—'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className={itemClasses}>
                                <p className={labelClasses}><DollarSign size={11} /> Annual Investment</p>
                                <p className="text-blue-500 dark:text-blue-400 font-black text-lg">{formatCurrency(entry.money)}</p>
                            </div>
                            <div className={itemClasses}>
                                <p className={labelClasses}><Calendar size={11} /> Subscription Range</p>
                                <p className={valueClasses}>{formatDate(entry.startDate)} — {formatDate(entry.endDate)}</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                            <Shield className="text-emerald-500" size={18} />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Security Certificate</p>
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">SSL Active. Expires on {formatDate(entry.sslExpiryDate)}</p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Infra Intelligence</h1>
                    </div>
                    <MagneticButton onClick={openAddModal} className="mg-btn-primary shadow-sm">
                        <Plus size={18} />
                        <span>Add Register</span>
                    </MagneticButton>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 w-fit">
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
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isActive
                                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    {f.label}
                                    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[9px] font-black ${isActive ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                        {f.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find infrastructure node..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="mg-input pl-12 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 shadow-none border-gray-200 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
                        <Database size={32} className="text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Zero entries mapped</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                        {activeFilter
                            ? `No ${activeFilter} entities found for your current search criteria.`
                            : 'Initialize your infrastructure records by adding a new entity.'}
                    </p>
                    {activeFilter && (
                        <button onClick={() => setActiveFilter(null)} className="mt-4 text-xs font-black text-blue-500 uppercase tracking-widest hover:underline">
                            Reset Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((entry) => (
                        <div
                            key={`${entry.type}-${entry.id}`}
                            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col h-full cursor-pointer transition-all hover:border-blue-500/20 dark:hover:border-blue-500/40 hover:shadow-md active:scale-[0.98]"
                            onClick={() => setSelectedEntry(entry)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: getIconBg(entry.type) }}
                                    >
                                        {getEntryIcon(entry.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 dark:text-gray-100">{entry.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${entry.status === 'active' || entry.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">{entry.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {entry.type === 'domain' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const dom = domains.find(d => d.id === entry.id);
                                                if (dom) openEditModalForDomain(dom);
                                            }}
                                            className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(entry.id, entry.type); }}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 mb-6">
                                <span className={getTypeBadge(entry.type)}>{entry.type}</span>
                                {entry.provider && (
                                    <span className="mg-badge bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase">{entry.provider}</span>
                                )}
                            </div>

                            {renderCardContent(entry)}
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={!!selectedEntry}
                onClose={() => setSelectedEntry(null)}
                title={selectedEntry?.name || 'Asset Intelligence Detail'}
                subtitle={`Registry ID: ${selectedEntry?.id.toUpperCase()}`}
            >
                {selectedEntry && (
                    <div className="space-y-6">
                        {renderDetailContent(selectedEntry)}
                        <div className="flex gap-4 pt-4 mt-6 border-t border-gray-100 dark:border-gray-800">
                            {selectedEntry.type === 'domain' && (
                                <button
                                    onClick={() => {
                                        const dom = domains.find(d => d.id === selectedEntry.id);
                                        if (dom) { openEditModalForDomain(dom); setSelectedEntry(null); }
                                    }}
                                    className="mg-btn-primary flex-1"
                                >
                                    <Pencil size={14} /> Update Registry
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedEntry(null)}
                                className="mg-btn-secondary flex-1 dark:border-gray-800 dark:text-gray-300"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingDomain ? 'Update Infrastructure Registry' : (formData.service === 'domain' ? 'Add Domains' : formData.service === 'server' ? 'Add Server' : 'Add Email')}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Entry Name (Node FQDN)</label>
                            <input required placeholder="system.io" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mg-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Service Architecture</label>
                            <select value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value as any })} className="mg-select font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                <option value="domain">Domain Controller</option>
                                <option value="email">Mail Server</option>
                                <option value="server">Cloud Infrastructure</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Operational Status</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="mg-select font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                <option value="active">Active (Production)</option>
                                <option value="expire">Expire (Audit)</option>
                                <option value="inactive">Inactive (Staging)</option>
                                <option value="pending">Pending Transition</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Allocation Capacity</label>
                            <input type="number" min={0} value={formData.seats} onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) || 0 })} className="mg-input font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Primary Liaison Phone</label>
                            <input placeholder="+91…" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mg-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Contact Channel</label>
                            <input placeholder="@id / email" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} className="mg-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Asset Investment (₹)</label>
                            <input type="number" min={0} step={0.01} value={formData.money} onChange={e => setFormData({ ...formData, money: parseFloat(e.target.value) || 0 })} className="mg-input font-black text-blue-600 dark:text-blue-400 dark:bg-gray-800 dark:border-gray-700" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Service Provider</label>
                            <input placeholder="Hostinger/AWS/GCP" value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} className="mg-input font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lifecycle Start</label>
                            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="mg-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registry Expiration</label>
                            <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="mg-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={closeModal} className="mg-btn-secondary flex-1 dark:border-gray-800 dark:text-gray-300">
                            Cancel
                        </button>
                        <button type="submit" className="mg-btn-primary flex-1">
                            {editingDomain ? 'Update Register' : 'Add Register'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
