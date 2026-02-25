import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Globe,
  Server,
  Mail,
  Menu,
  X,
  Shield,
  Sun,
  Moon,
  ChevronRight
} from 'lucide-react';
import type { ViewType } from '@/types';

interface LayoutProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  children: React.ReactNode;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview' },
  { id: 'infra', label: 'Infra Management', icon: Shield, description: 'Assets & Services' },
  { id: 'domains', label: 'Domains', icon: Globe, description: 'Manage domains' },
  { id: 'servers', label: 'Servers', icon: Server, description: 'Mail servers' },
  { id: 'emails', label: 'Emails', icon: Mail, description: 'Email accounts' },
];

function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      className="theme-toggle"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label="Toggle theme"
      whileTap={{ scale: 0.85 }}
      animate={{ rotate: theme === 'dark' ? 180 : 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as any }}
    >
      <AnimatePresence mode="wait">
        {theme === 'light' ? (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Moon size={16} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={16} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function Layout({ currentView, onViewChange, children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mg-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('mg-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNavClick = (id: ViewType) => {
    onViewChange(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex flex-col w-60 fixed h-full z-30 mg-sidebar">
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-6 mb-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-3 group">
            <motion.div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
              whileHover={{ scale: 1.1, rotate: 8 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Shield size={18} className="text-white" />
            </motion.div>
            <div>
              <p className="font-extrabold text-sm tracking-wider" style={{ color: 'var(--text-primary)' }}>
                MAILGUARDIAN
              </p>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                Infrastructure
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`mg-nav-item w-full ${isActive ? 'active' : ''}`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <Icon size={18} />
                <span className="font-semibold text-sm">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="ml-auto"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 0.7, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight size={14} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
          {/* Theme Section */}
          <div className="pt-4 mt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: 'var(--text-subtle)' }}>Theme</p>
            <motion.button
              onClick={toggleTheme}
              className="mg-nav-item w-full"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span className="font-semibold text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </motion.button>
          </div>
        </nav>

        {/* Bottom status */}
        <div className="px-3 pb-6 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <div className="rounded-xl p-4 border" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-default)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="mg-dot"
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}
              />
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>System Status</p>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>All systems operational</p>
          </div>
        </div>
      </aside>

      {/* ===== MOBILE HEADER ===== */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b"
        style={{
          background: 'var(--bg-mobile-header)',
          backdropFilter: 'blur(16px)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
            >
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              MailGuardian
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="theme-toggle"
              aria-label="Toggle menu"
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X size={18} />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu size={18} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as any }}
              className="overflow-hidden border-b"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-default)' }}
            >
              <nav className="px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`mg-nav-item w-full ${isActive ? 'active' : ''}`}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Icon size={18} />
                      <div className="text-left">
                        <p className="font-semibold text-sm">{item.label}</p>
                        <p className="text-[10px] opacity-70">{item.description}</p>
                      </div>
                      {isActive && <ChevronRight size={14} className="ml-auto opacity-70" />}
                    </motion.button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 lg:ml-60 pt-[57px] lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] as any }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setIsMobileMenuOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
