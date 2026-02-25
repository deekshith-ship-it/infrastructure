import { motion } from 'framer-motion';
import {
    Globe,
    Server,
    Mail
} from 'lucide-react';
import { useData } from '@/hooks/useData';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] as any }
    })
};

const iconColors: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
    emerald: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
    purple: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7' },
};

export default function Dashboard({ onViewChange }: { onViewChange: (view: any, filter?: string) => void }) {
    const { domains, servers, emails, stats, loading } = useData();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="spinner" />
            </div>
        );
    }

    // Helper for status dots
    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            active: '#22c55e',
            online: '#22c55e',
            inactive: '#ef4444',
            offline: '#ef4444',
            expire: '#f59e0b',
            pending: '#f59e0b',
            maintenance: '#f59e0b',
            suspended: '#f59e0b'
        };
        return map[status.toLowerCase()] || '#94a3b8';
    };

    // Get latest 5 records
    const recentDomains = [...domains].reverse().slice(0, 5);
    const recentServers = [...servers].reverse().slice(0, 5);
    const recentEmails = [...emails].reverse().slice(0, 5);

    const statsList = [
        { label: 'Total Domains', value: stats.totalDomains, icon: Globe, color: 'blue', filter: 'domain' },
        { label: 'Total Servers', value: stats.totalServers, icon: Server, color: 'emerald', filter: 'server' },
        { label: 'Total Emails', value: stats.totalEmails, icon: Mail, color: 'purple', filter: 'email' },
    ];

    return (
        <div className="space-y-6">

            {/* Page Header — consistent with other pages */}
            <motion.div
                className="domain-header"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ marginBottom: '24px' }}
            >
                <h1 className="mg-page-title">Dashboard</h1>
            </motion.div>

            {/* 1. Summary Count Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statsList.map((stat, i) => {
                    const colors = iconColors[stat.color] || iconColors.blue;
                    return (
                        <motion.div
                            key={stat.label}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ y: -4, scale: 1.02 }}
                            onClick={() => onViewChange('infra', stat.filter)}
                            className="mg-card p-6 flex items-center gap-5 cursor-pointer hover:border-blue-500/30 transition-all"
                        >
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{ background: colors.bg, color: colors.text }}
                            >
                                <stat.icon size={28} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-subtle)' }}>{stat.label}</p>
                                <h2 className="text-3xl font-extrabold tracking-tight">{stat.value}</h2>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* 2. Data Tables */}
            <div className="space-y-8">

                {/* Recent Domains Table */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Globe size={18} className="text-blue-500" />
                        <h3 className="text-lg font-bold">Recent Domains</h3>
                    </div>
                    <div className="mg-table-wrap">
                        <div className="mg-table-scroll">
                            <table className="mg-table">
                                <thead>
                                    <tr>
                                        <th>Domain Name</th>
                                        <th>Expiry Date</th>
                                        <th>Renewal Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentDomains.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10 italic" style={{ color: 'var(--text-subtle)' }}>No domain data available</td>
                                        </tr>
                                    ) : (
                                        recentDomains.map((d) => (
                                            <tr key={d.id}>
                                                <td className="font-bold">{d.name}</td>
                                                <td className="font-medium" style={{ color: 'var(--text-muted)' }}>{d.endDate || '—'}</td>
                                                <td className="font-medium" style={{ color: 'var(--text-muted)' }}>{d.startDate || '—'}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span className="mg-dot" style={{ width: 8, height: 8, background: getStatusColor(d.status), borderRadius: '50%' }} />
                                                        <span className="text-[11px] font-bold uppercase tracking-wider">{d.status}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>

                {/* Recent Servers Table */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Server size={18} className="text-emerald-500" />
                        <h3 className="text-lg font-bold">Recent Servers</h3>
                    </div>
                    <div className="mg-table-wrap">
                        <div className="mg-table-scroll">
                            <table className="mg-table">
                                <thead>
                                    <tr>
                                        <th>Server Name</th>
                                        <th>Hostname</th>
                                        <th>IP Address</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentServers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10 italic" style={{ color: 'var(--text-subtle)' }}>No server data available</td>
                                        </tr>
                                    ) : (
                                        recentServers.map((s) => (
                                            <tr key={s.id}>
                                                <td className="font-bold">{s.name}</td>
                                                <td className="font-mono text-xs text-blue-500">{s.hostname}</td>
                                                <td className="font-mono text-xs font-bold">{s.ip}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span className="mg-dot" style={{ width: 8, height: 8, background: getStatusColor(s.status), borderRadius: '50%' }} />
                                                        <span className="text-[11px] font-bold uppercase tracking-wider">{s.status}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>

                {/* Recent Emails Table */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Mail size={18} className="text-purple-500" />
                        <h3 className="text-lg font-bold">Recent Emails</h3>
                    </div>
                    <div className="mg-table-wrap">
                        <div className="mg-table-scroll">
                            <table className="mg-table">
                                <thead>
                                    <tr>
                                        <th>Email Address</th>
                                        <th>Linked Domain</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentEmails.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="text-center py-10 italic" style={{ color: 'var(--text-subtle)' }}>No email data available</td>
                                        </tr>
                                    ) : (
                                        recentEmails.map((e) => (
                                            <tr key={e.id}>
                                                <td className="font-bold">{e.address}</td>
                                                <td className="font-medium" style={{ color: 'var(--text-muted)' }}>
                                                    {(() => {
                                                        const domain = domains.find(d => d.id === e.domainId);
                                                        return domain ? domain.name : 'Unknown';
                                                    })()}
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span className="mg-dot" style={{ width: 8, height: 8, background: getStatusColor(e.status), borderRadius: '50%' }} />
                                                        <span className="text-[11px] font-bold uppercase tracking-wider">{e.status}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
