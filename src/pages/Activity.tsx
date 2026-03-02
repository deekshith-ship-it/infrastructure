import { useState } from 'react';
import {
    History, Search, Filter, Globe, Server as ServerIcon, Mail, DollarSign,
    AlertTriangle, CheckCircle2, XCircle, Info, Calendar, ArrowUpRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityLog } from '@/types';

interface ActivityProps {
    logs: ActivityLog[];
    onViewAsset: (module: string, id: string) => void;
}

export function Activity({ logs, onViewAsset }: ActivityProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [moduleFilter, setModuleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const getModuleIcon = (module: string) => {
        switch (module) {
            case 'domain': return <Globe size={16} className="text-blue-400" />;
            case 'email': return <Mail size={16} className="text-purple-400" />;
            case 'server': return <ServerIcon size={16} className="text-emerald-400" />;
            case 'cost': return <DollarSign size={16} className="text-amber-400" />;
            default: return <Info size={16} className="text-slate-400" />;
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'success': return { icon: <CheckCircle2 size={12} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
            case 'warning': return { icon: <AlertTriangle size={12} />, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
            case 'error': return { icon: <XCircle size={12} />, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
            default: return { icon: <Info size={12} />, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
        const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
        return matchesSearch && matchesModule && matchesStatus;
    });

    const stats = {
        total: logs.length,
        today: logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
        warnings: logs.filter(l => l.status === 'warning').length,
        errors: logs.filter(l => l.status === 'error').length
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-gray-100">Activity Intelligence</h1>
                    <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">Complete audit trail of system events and administrative maneuvers.</p>
                </div>
                <div className="hidden md:flex items-center gap-2 p-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-[10px] font-bold shadow-sm">
                    <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-400">Live Sync Active</div>
                    <div className="mg-dot" />
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Events', value: stats.total, icon: History, color: 'text-slate-400' },
                    { label: 'Activity Today', value: stats.today, icon: Calendar, color: 'text-blue-400' },
                    { label: 'Warnings', value: stats.warnings, icon: AlertTriangle, color: 'text-amber-400' },
                    { label: 'Fatal Errors', value: stats.errors, icon: XCircle, color: 'text-red-400' },
                ].map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between transition-all hover:border-gray-300 dark:hover:border-gray-700">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-1">{s.label}</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{s.value}</p>
                        </div>
                        <s.icon size={24} className={s.color + " opacity-20"} />
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Scan event titles or descriptions..."
                        className="mg-input pl-10 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        className="mg-input py-2 text-xs font-bold min-w-[120px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        value={moduleFilter}
                        onChange={(e) => setModuleFilter(e.target.value)}
                    >
                        <option value="all">All Modules</option>
                        <option value="domain">Domains</option>
                        <option value="server">Servers</option>
                        <option value="email">Emails</option>
                        <option value="cost">Billing</option>
                    </select>
                    <select
                        className="mg-input py-2 text-xs font-bold min-w-[120px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                    </select>
                    <button className="mg-secondary-btn py-2 px-4 flex items-center gap-2 dark:border-gray-700 dark:text-gray-300">
                        <Filter size={14} />
                        <span className="text-xs font-bold">More Filters</span>
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800 hidden md:block" />

                <div className="space-y-4">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => {
                            const status = getStatusStyles(log.status);
                            return (
                                <div
                                    key={log.id}
                                    className="relative flex flex-col md:flex-row gap-4 md:items-start group"
                                >
                                    {/* Icon Column */}
                                    <div className="hidden md:flex relative z-10 w-16 items-center justify-center">
                                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                                            {getModuleIcon(log.module)}
                                        </div>
                                    </div>

                                    {/* Card Column */}
                                    <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-5 transition-colors hover:border-gray-300 dark:hover:border-gray-700">
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="md:hidden">
                                                    {getModuleIcon(log.module)}
                                                </div>
                                                <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">{log.title}</h3>
                                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${status.bg} ${status.color} ${status.border} dark:bg-opacity-20`}>
                                                    {status.icon}
                                                    {log.status}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                                <History size={10} />
                                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                            </div>
                                        </div>

                                        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-300">
                                            {log.description}
                                        </p>

                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                    <span className="text-[8px] font-black text-blue-400 capitalize">{log.userRole[0]}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                                    {log.userRole}
                                                </span>
                                            </div>
                                            {log.relatedId && (
                                                <button
                                                    onClick={() => onViewAsset(log.module, log.relatedId!)}
                                                    className="text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest flex items-center gap-1"
                                                >
                                                    View Asset <ArrowUpRight size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                            <History size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                            <p className="text-lg font-black text-gray-800 dark:text-gray-100">No Matching Intelligence</p>
                            <p className="text-sm max-w-xs mx-auto mt-2 text-gray-500 dark:text-gray-400">We couldn't find any activities matching your current filters. Try refining your search parameters.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Placeholder */}
            {filteredLogs.length > 0 && (
                <div className="flex justify-center pt-4">
                    <button className="mg-secondary-btn py-2 px-8 text-xs font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity dark:border-gray-700 dark:text-gray-400">
                        Load More Entries
                    </button>
                </div>
            )}
        </div>
    );
}
