import {
    Globe,
    Server,
    Mail,
    DollarSign,
    Bell
} from 'lucide-react';
import { useData } from '@/hooks/useData';


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

    // Unified Recent Activity logic (latest 8 records)
    const allRecent = [
        ...domains.map(d => ({ ...d, type: 'Domain', mainName: d.name, subInfo: d.endDate, updated: d.startDate, rawDate: d.startDate, target: 'domains' as const })),
        ...servers.map(s => ({ ...s, type: 'Server', mainName: s.name, subInfo: s.uptimeStatus || 'Stable', updated: s.expiryDate || new Date().toISOString(), rawDate: s.expiryDate || new Date().toISOString(), target: 'servers' as const })),
        ...emails.map(e => ({ ...e, type: 'Email', mainName: e.address, subInfo: 'Active', updated: e.createdAt, rawDate: e.createdAt, target: 'emails' as const }))
    ].sort((a, b) => new Date(b.rawDate || 0).getTime() - new Date(a.rawDate || 0).getTime())
        .slice(0, 8);

    // Upcoming Expiry logic (next 5 domains)
    const upcomingExpiries = domains
        .filter(d => d.endDate && new Date(d.endDate) > new Date())
        .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
        .slice(0, 5);

    const statsList = [
        { label: 'Domains', value: stats.totalDomains, icon: Globe, color: 'blue', view: 'domains' },
        { label: 'Servers', value: stats.totalServers, icon: Server, color: 'emerald', view: 'servers' },
        { label: 'Emails', value: stats.totalEmails, icon: Mail, color: 'purple', view: 'emails' },
        { label: 'Monthly Cost', value: `₹${stats.monthlyCost.toFixed(0)}`, icon: DollarSign, color: 'emerald', view: 'cost' },
        { label: 'Expiring', value: stats.alerts, icon: Bell, color: 'orange', view: 'activity' },
    ];

    const iconColors: Record<string, { bg: string; text: string }> = {
        blue: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
        emerald: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
        purple: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7' },
        orange: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black uppercase tracking-widest text-gray-800 dark:text-gray-100">Dashboard</h1>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border py-1 px-3 flex items-center gap-2 border-gray-200 dark:border-gray-800 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-black text-gray-700 dark:text-gray-300">{stats.activeDomains} ACTIVE</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {statsList.map((stat) => {
                    const colors = iconColors[stat.color] || iconColors.blue;
                    return (
                        <div
                            key={stat.label}
                            onClick={() => onViewChange(stat.view)}
                            className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-3 flex flex-col gap-2 group transition-all cursor-pointer hover:border-blue-500/50 min-w-0"
                        >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: colors.bg, color: colors.text }}>
                                <stat.icon size={14} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-tighter truncate text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <h2 className="text-lg font-extrabold truncate text-gray-900 dark:text-gray-100">{stat.value}</h2>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Unified Recent Activity */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Recent Activity</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-x-auto">
                        <table className="w-full text-left min-w-[500px]">
                            <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-gray-800">
                                <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3">Asset Name</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Context</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {allRecent.map((item: any) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer group"
                                        onClick={() => onViewChange(item.target, item.id)}
                                    >
                                        <td className="px-5 py-3">
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${item.type === 'Domain' ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' :
                                                item.type === 'Server' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' :
                                                    'bg-purple-500/10 text-purple-400 border-purple-500/10'
                                                }`}>
                                                {item.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-400 transition-colors">{item.mainName}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(item.status) }} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{item.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-[10px] font-medium text-gray-500 dark:text-gray-400">{item.subInfo || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Expiry Timeline */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Upcoming Expiries</h3>
                    <div className="space-y-3">
                        {upcomingExpiries.length === 0 ? (
                            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 text-center italic text-xs text-gray-500 dark:text-gray-400">No upcoming expiries</div>
                        ) : (
                            upcomingExpiries.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => onViewChange('activity')}
                                    className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-3 flex items-center justify-between group hover:border-blue-500/30 transition-all border-l-2 border-l-orange-500/50 cursor-pointer border border-gray-100 dark:border-gray-800"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate text-gray-800 dark:text-gray-100 group-hover:text-blue-400">{item.name}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{item.registrarName || 'External'}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <p className="text-[11px] font-black text-orange-400">{item.endDate}</p>
                                        <p className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500">RENEWAL DUE</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
