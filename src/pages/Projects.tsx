import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Search, Pencil, Trash2, Calendar, Target, User, BarChart3 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { MagneticButton } from '@/components/MagneticButton';
import type { Project } from '@/types';

interface ProjectsProps {
    projects: Project[];
    onAdd: (project: Omit<Project, 'id'>) => void | Promise<unknown>;
    onUpdate: (id: string, updates: Partial<Project>) => void | Promise<unknown>;
    onDelete: (id: string) => void | Promise<unknown>;
}

function getStatusBadge(status: string) {
    const map: Record<string, string> = {
        active: 'mg-badge mg-badge-active',
        on_hold: 'mg-badge mg-badge-pending',
        completed: 'mg-badge mg-badge-domain',
        archived: 'mg-badge mg-badge-inactive',
    };
    return map[status] || 'mg-badge mg-badge-inactive';
}

const initialForm: Omit<Project, 'id'> = {
    name: '',
    description: '',
    status: 'active',
    clientName: '',
    startDate: '',
    endDate: '',
    budget: 0,
    progress: 0,
};

const cardVariants: any = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: (i: number) => ({
        opacity: 1, scale: 1, y: 0,
        transition: { delay: i * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] as any }
    })
};

export function Projects({ projects, onAdd, onUpdate, onDelete }: ProjectsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState<Omit<Project, 'id'>>(initialForm);

    const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProject) {
            onUpdate(editingProject.id, formData);
        } else {
            onAdd(formData);
        }
        closeModal();
    };

    const openAddModal = () => {
        setEditingProject(null);
        setFormData(initialForm);
        setIsModalOpen(true);
    };

    const openEditModal = (project: Project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            description: project.description,
            status: project.status,
            clientName: project.clientName,
            startDate: project.startDate,
            endDate: project.endDate,
            budget: project.budget,
            progress: project.progress,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
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
                <h1 className="mg-page-title">Projects</h1>
                <div className="domain-actions">
                    <div className="mg-search-wrap">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
                        <input
                            type="text"
                            placeholder="Search initiatives..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="mg-input pl-12"
                        />
                    </div>
                    <MagneticButton onClick={openAddModal} className="mg-btn-primary shadow-lg shadow-blue-500/20">
                        <Plus size={18} />
                        <span>New Initiative</span>
                    </MagneticButton>
                </div>
            </motion.div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <motion.div
                    className="mg-card p-12 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="mg-empty-icon w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-glass)' }}>
                        <Briefcase size={32} style={{ color: 'var(--text-subtle)' }} />
                    </div>
                    <p className="mg-empty-title text-lg">No business projects found</p>
                    <p className="mg-empty-text mx-auto">Initialize a new initiative to begin tracking deployment milestones</p>
                </motion.div>
            ) : (
                <div className="card-container">
                    {filtered.map((project, i) => (
                        <motion.div
                            key={project.id}
                            className="mg-card p-6 flex flex-col h-full"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            whileHover={{ y: -6, scale: 1.01 }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Target size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
                                        <span className={getStatusBadge(project.status)} style={{ fontSize: '9px' }}>{project.status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <motion.button onClick={() => openEditModal(project)} className="mg-icon-btn p-1.5" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                        <Pencil size={14} />
                                    </motion.button>
                                    <motion.button onClick={() => onDelete(project.id)} className="mg-icon-btn danger p-1.5" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                        <Trash2 size={14} />
                                    </motion.button>
                                </div>
                            </div>

                            <p className="text-xs mb-6 line-clamp-2 min-h-[32px]" style={{ color: 'var(--text-muted)' }}>
                                {project.description || 'No strategic description provided for this active initiative.'}
                            </p>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight" style={{ color: 'var(--text-subtle)' }}>
                                    <span className="flex items-center gap-1.5"><User size={12} /> Client</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{project.clientName || 'Open Source'}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight" style={{ color: 'var(--text-subtle)' }}>
                                    <span className="flex items-center gap-1.5"><Calendar size={12} /> Timeline</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{project.startDate || 'TBD'} — {project.endDate || 'TBD'}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight" style={{ color: 'var(--text-subtle)' }}>
                                    <span className="flex items-center gap-1.5"><BarChart3 size={12} /> Budget</span>
                                    <span className="text-blue-400">₹{project.budget.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mt-auto space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
                                    <span>Progress Matrix</span>
                                    <span>{project.progress}%</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                                    <motion.div
                                        className="h-full bg-blue-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${project.progress}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingProject ? 'Modify Initiative' : 'Initialize Initiative'}
                subtitle="Manage business project milestones and resource allocation"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="mg-label">Initiative Name</label>
                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mg-input" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="mg-label">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="mg-input h-20 py-3 resize-none"
                            placeholder="Strategic goals..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="mg-label">Client Entity</label>
                            <input value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} className="mg-input" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="mg-label">Status Pulse</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as Project['status'] })} className="mg-select">
                                <option value="active">Active</option>
                                <option value="on_hold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="mg-label">Start Cycle</label>
                            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="mg-input" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="mg-label">End Cycle</label>
                            <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="mg-input" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="mg-label">Budget (INR)</label>
                            <input type="number" value={formData.budget} onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })} className="mg-input" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="mg-label">Progress (%)</label>
                            <input type="number" min="0" max="100" value={formData.progress} onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })} className="mg-input" />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={closeModal} className="mg-btn-secondary flex-1">Cancel</button>
                        <button type="submit" className="mg-btn-primary flex-1">{editingProject ? 'Commit Changes' : 'Launch Initiative'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
