import { useState } from 'react';
import { Plus, Search, DollarSign, Tag, Clock, FileText, Upload, Trash2, PieChart as PieIcon, Eye, Pencil, Check, TrendingUp } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useData } from '@/hooks/useData';
import { Modal } from '@/components/Modal';
import { MagneticButton } from '@/components/MagneticButton';
import type { Vendor, Invoice } from '@/types';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function Finance() {
    const { vendors, invoices, addVendor, updateVendor, deleteVendor, addInvoice, updateInvoice, deleteInvoice } = useData();
    const [activeTab, setActiveTab] = useState<'vendors' | 'invoices'>('vendors');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isVendorModal, setIsVendorModal] = useState(true);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Form states
    const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({ name: '', contactName: '', email: '', phone: '', serviceType: '', status: 'active' });
    const [invoiceForm, setInvoiceForm] = useState<Partial<Invoice>>({ vendorId: '', amount: 0, billingCycle: 'monthly', paymentStatus: 'Pending', issueDate: '', dueDate: '' });

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // ─── Financial Calculations ───────────────────────────
    const monthlyTotal = invoices
        .filter((i: Invoice) => {
            const d = new Date(i.issueDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((acc: number, i: Invoice) => acc + i.amount, 0);

    const prevMonthTotal = invoices
        .filter((i: Invoice) => {
            const d = new Date(i.issueDate);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === lastMonth && d.getFullYear() === yearOfLastMonth;
        })
        .reduce((acc: number, i: Invoice) => acc + i.amount, 0);

    const monthDiff = prevMonthTotal === 0 ? 0 : ((monthlyTotal - prevMonthTotal) / prevMonthTotal) * 100;

    const yearlyTotal = invoices
        .filter((i: Invoice) => new Date(i.issueDate).getFullYear() === currentYear)
        .reduce((acc: number, i: Invoice) => acc + i.amount, 0);

    const pendingInvoices = invoices.filter(i => i.paymentStatus === 'Pending' || i.paymentStatus === 'Overdue');
    const overdueCount = invoices.filter(i => i.paymentStatus === 'Overdue').length;

    // ─── Trends Data (Last 6 months) ──────────────────────
    const trendData = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        const total = invoices
            .filter((inv: Invoice) => {
                const invD = new Date(inv.issueDate);
                return invD.getMonth() === d.getMonth() && invD.getFullYear() === d.getFullYear();
            })
            .reduce((acc: number, inv: Invoice) => acc + inv.amount, 0);
        return { name: monthLabel, amount: total };
    });

    // ─── Vendor Breakdown ──────────────────────────────────
    const vendorBreakdown = vendors.map(v => {
        const vInvoices = invoices.filter((i: Invoice) => i.vendorId === v.id);
        const weekly = vInvoices.reduce((acc: number, i: Invoice) => acc + i.amount, 0); // Simplified for visual
        return { name: v.name, value: weekly };
    }).filter(v => v.value > 0);

    const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredInvoices = invoices.filter(i => {
        const vendorName = vendors.find(v => v.id === i.vendorId)?.name || '';
        return vendorName.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleOpenAdd = () => {
        setEditingItem(null);
        if (activeTab === 'vendors') {
            setVendorForm({ name: '', contactName: '', email: '', phone: '', serviceType: '', status: 'active' });
            setIsVendorModal(true);
        } else {
            setInvoiceForm({ vendorId: vendors[0]?.id || '', amount: 0, billingCycle: 'monthly', paymentStatus: 'Pending', issueDate: today.toISOString().split('T')[0], dueDate: '' });
            setIsVendorModal(false);
        }
        setIsModalOpen(true);
    };

    const handleEditVendor = (v: Vendor) => {
        setEditingItem(v);
        setVendorForm(v);
        setIsVendorModal(true);
        setIsModalOpen(true);
    };

    const handleEditInvoice = (i: Invoice) => {
        setEditingItem(i);
        setInvoiceForm(i);
        setIsVendorModal(false);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isVendorModal) {
            if (editingItem) updateVendor(editingItem.id, vendorForm);
            else addVendor(vendorForm as any);
        } else {
            if (editingItem) updateInvoice(editingItem.id, invoiceForm);
            else addInvoice(invoiceForm as any);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <DollarSign className="text-blue-500" /> Cost Intelligence
                    </h1>
                    <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">Real-time billing analytics and vendor financial management.</p>
                </div>
                <MagneticButton onClick={handleOpenAdd} className="mg-btn-primary shadow-sm hover:shadow-md transition-shadow">
                    <Plus size={18} />
                    <span>Add {activeTab === 'vendors' ? 'Vendor' : 'Invoice'}</span>
                </MagneticButton>
            </div>

            {/* Financial Overview & Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Monthly Summary */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 relative overflow-hidden h-fit min-h-[100px] space-y-2 transition-all hover:border-gray-300 dark:hover:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <div className="max-w-[70%]">
                                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Monthly Expenditure</p>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">${monthlyTotal.toLocaleString()}</h2>
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${monthDiff >= 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                {monthDiff >= 0 ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                                {Math.abs(monthDiff).toFixed(1)}%
                            </div>
                        </div>
                        <div className="h-24 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-2">6-Month Spending Velocity</p>
                    </div>

                    {/* Yearly Summary */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between min-h-[100px] space-y-2 transition-all hover:border-gray-300 dark:hover:border-gray-700">
                        <div className="max-w-[80%]">
                            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Annual Fiscal Projection</p>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">${yearlyTotal.toLocaleString()}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">Total for FY {currentYear}</p>
                        </div>
                        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-500 dark:text-gray-400">Pending Payments</span>
                                <span className="text-orange-500">${pendingInvoices.reduce((acc, i) => acc + i.amount, 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-500 dark:text-gray-400">Overdue Invoices</span>
                                <span className="text-red-500">{overdueCount} Alerts</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vendor Distribution */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col min-h-[100px] space-y-2 transition-all hover:border-gray-300 dark:hover:border-gray-700">
                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Vendor Distribution</p>
                    <div className="flex-1 min-h-[150px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={vendorBreakdown.length > 0 ? vendorBreakdown : [{ name: 'None', value: 1 }]}
                                    innerRadius={45}
                                    outerRadius={65}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(vendorBreakdown.length > 0 ? vendorBreakdown : [{ name: 'None', value: 1 }]).map((_, idx) => (
                                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#111827', border: '1px solid #1E293B', borderRadius: '8px', fontSize: '10px', color: '#E5E7EB' }}
                                    itemStyle={{ fontWeight: '900' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <PieIcon size={20} className="text-gray-400 dark:text-gray-600" />
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {vendorBreakdown.slice(0, 4).map((v, i) => (
                            <div key={v.name} className="flex items-center gap-1.5 overflow-hidden">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500 dark:text-gray-400 truncate">{v.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Tabs & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
                <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-fit border border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setActiveTab('vendors')}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'vendors' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
                    >
                        Vendor Registry
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'invoices' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
                    >
                        Invoice Ledger
                    </button>
                </div>

                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder={`Find ${activeTab === 'vendors' ? 'partners' : 'receipts'}...`}
                        className="mg-input pl-12 w-full !py-2 text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Asset Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                    {activeTab === 'vendors' ? 'Identity' : 'Transaction ID'}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                    {activeTab === 'vendors' ? 'Sector' : 'Origin'}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 text-center">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                    {activeTab === 'vendors' ? 'Contact Axis' : 'Settlement Timeline'}
                                </th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {activeTab === 'vendors' ? (
                                filteredVendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-sm text-gray-800 dark:text-gray-100">{vendor.name}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter mt-0.5">{vendor.id.slice(0, 8).toUpperCase()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 uppercase">
                                                {vendor.serviceType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${vendor.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{vendor.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><FileText size={12} className="text-gray-400" /> {vendor.email}</p>
                                                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5"><Tag size={12} className="text-gray-300 dark:text-gray-600" /> {vendor.phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEditVendor(vendor)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-all"><Pencil size={14} /></button>
                                                <button onClick={() => deleteVendor(vendor.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                filteredInvoices.map((inv) => {
                                    const vName = vendors.find(v => v.id === inv.vendorId)?.name || 'Unknown';
                                    return (
                                        <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                                                        <FileText size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm text-gray-800 dark:text-gray-100">INV-{inv.id.slice(0, 6).toUpperCase()}</p>
                                                        <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-tighter">${inv.amount.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{vName}</p>
                                                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">{inv.billingCycle}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${inv.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    inv.paymentStatus === 'Overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' :
                                                        'bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20'
                                                    }`}>
                                                    {inv.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                        <Clock size={11} className="text-gray-400" /> Due {new Date(inv.dueDate).toLocaleDateString()}
                                                    </p>
                                                    {inv.paymentStatus === 'Paid' && inv.paymentDate && (
                                                        <p className="text-[10px] font-bold text-emerald-500/50 flex items-center gap-1.5">
                                                            <Check size={11} /> Settled {new Date(inv.paymentDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {(inv.invoiceUrl || inv.invoiceUpload) && (
                                                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-emerald-500 transition-all" title="View Document"><Eye size={14} /></button>
                                                    )}
                                                    <button onClick={() => handleEditInvoice(inv)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-all"><Pencil size={14} /></button>
                                                    <button onClick={() => deleteInvoice(inv.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Asset Modals */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? `Edit ${isVendorModal ? 'Vendor' : 'Invoice'}` : `Register New ${isVendorModal ? 'Vendor' : 'Invoice'}`}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {isVendorModal ? (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Corporate Identity</label>
                                <input required placeholder="Vendor Name" value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} className="mg-input font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Liaison Name</label>
                                    <input placeholder="Contact Person" value={vendorForm.contactName} onChange={e => setVendorForm({ ...vendorForm, contactName: e.target.value })} className="mg-input text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Service Category</label>
                                    <select value={vendorForm.serviceType} onChange={e => setVendorForm({ ...vendorForm, serviceType: e.target.value })} className="mg-select text-xs font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                        <option value="Cloud Provider">Cloud Provider</option>
                                        <option value="SaaS Subscription">SaaS Subscription</option>
                                        <option value="Infrastructure">Infrastructure</option>
                                        <option value="Consulting">Consulting</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Communication Axis</label>
                                <div className="flex gap-2">
                                    <input placeholder="Email Address" value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} className="mg-input text-xs flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                                    <input placeholder="Phone" value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} className="mg-input text-xs flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Origin Vendor</label>
                                <select required value={invoiceForm.vendorId} onChange={e => setInvoiceForm({ ...invoiceForm, vendorId: e.target.value })} className="mg-select font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Amount (USD)</label>
                                    <input type="number" step="0.01" required value={invoiceForm.amount} onChange={e => setInvoiceForm({ ...invoiceForm, amount: parseFloat(e.target.value) })} className="mg-input font-black text-blue-600 dark:text-blue-400 dark:bg-gray-800 dark:border-gray-700" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Cycle</label>
                                    <select value={invoiceForm.billingCycle} onChange={e => setInvoiceForm({ ...invoiceForm, billingCycle: e.target.value as any })} className="mg-select text-xs font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Issue Date</label>
                                    <input type="date" value={invoiceForm.issueDate} onChange={e => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })} className="mg-input text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Due Date</label>
                                    <input type="date" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} className="mg-input text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">SaaS Settlement Status</label>
                                <select value={invoiceForm.paymentStatus} onChange={e => setInvoiceForm({ ...invoiceForm, paymentStatus: e.target.value as any })} className="mg-select text-xs font-black uppercase tracking-widest dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                    <option value="Pending">Pending Audit</option>
                                    <option value="Paid">Settled (Paid)</option>
                                    <option value="Overdue">Overdue Failure</option>
                                </select>
                            </div>
                            <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2 group hover:border-blue-500/50 transition-colors cursor-pointer">
                                <Upload size={20} className="text-gray-400 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 group-hover:text-blue-400">Reference Document Upload (PDF/IMG)</p>
                            </div>
                        </>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="mg-btn-secondary flex-1 dark:border-gray-700 dark:text-gray-300">Cancel</button>
                        <button type="submit" className="mg-btn-primary flex-1">
                            {editingItem ? 'Save Protocol' : 'Register Entry'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
