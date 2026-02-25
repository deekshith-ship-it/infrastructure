import { useState, useEffect, useCallback } from 'react';
import { turso } from '@/lib/turso';
import type { Domain, Server, Email, Project, DomainRow, ServerRow, EmailRow, ProjectRow } from '@/types';

// ─── Transform helpers (snake_case DB → camelCase frontend) ────────
function toDomain(row: DomainRow): Domain {
  return {
    id: String(row.id),
    name: row.name,
    status: row.status as Domain['status'],
    service: (row.service || 'domain') as Domain['service'],
    seats: Number(row.seats) || 0,
    phone: row.phone || '',
    contactEmail: row.contact_email || '',
    money: Number(row.money) || 0,
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    provider: row.provider || '',
    server: row.server || '',
  };
}

function toServer(row: ServerRow): Server {
  return {
    id: String(row.id),
    name: row.name,
    hostname: row.hostname,
    ip: row.ip,
    status: row.status as Server['status'],
    type: row.type as Server['type'],
    port: Number(row.port),
  };
}

function toEmail(row: EmailRow): Email {
  return {
    id: String(row.id),
    address: row.address,
    domainId: String(row.domain_id),
    status: row.status as Email['status'],
    quota: Number(row.quota),
    used: Number(row.used),
    createdAt: row.created_at,
  };
}

function toProject(row: ProjectRow): Project {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description || '',
    status: row.status as Project['status'],
    clientName: row.client_name || '',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    budget: Number(row.budget) || 0,
    progress: Number(row.progress) || 0,
  };
}

// ─── LocalStorage helpers ────────────────────────────────────────
const DATA_VERSION = 'vTurso_2';
const STORAGE_KEYS = {
  domains: `mailguardian_domains_${DATA_VERSION}`,
  servers: `mailguardian_servers_${DATA_VERSION}`,
  emails: `mailguardian_emails_${DATA_VERSION}`,
  projects: `mailguardian_projects_${DATA_VERSION}`,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

export function useData() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Initialize Schema ───────────────────────────────────────
  const initSchema = useCallback(async () => {
    try {
      await turso.batch([
        `CREATE TABLE IF NOT EXISTS domains (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          service TEXT NOT NULL DEFAULT 'domain',
          seats INTEGER NOT NULL DEFAULT 0,
          phone TEXT DEFAULT '',
          contact_email TEXT DEFAULT '',
          money REAL DEFAULT 0,
          start_date TEXT DEFAULT '',
          end_date TEXT DEFAULT '',
          provider TEXT NOT NULL DEFAULT '',
          server TEXT DEFAULT '',
          inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS servers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          hostname TEXT NOT NULL,
          ip TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'online',
          type TEXT NOT NULL DEFAULT 'smtp',
          port INTEGER NOT NULL DEFAULT 587,
          inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS emails (
          id TEXT PRIMARY KEY,
          address TEXT NOT NULL,
          domain_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          quota INTEGER NOT NULL DEFAULT 5120,
          used INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          client_name TEXT,
          start_date TEXT,
          end_date TEXT,
          budget REAL DEFAULT 0,
          progress REAL DEFAULT 0,
          inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ], "write");
    } catch (err) {
      console.error('Failed to initialize Turso schema:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await initSchema();

      const [domainsRes, serversRes, emailsRes, projectsRes] = await Promise.all([
        turso.execute("SELECT * FROM domains ORDER BY inserted_at ASC"),
        turso.execute("SELECT * FROM servers ORDER BY inserted_at ASC"),
        turso.execute("SELECT * FROM emails ORDER BY inserted_at ASC"),
        turso.execute("SELECT * FROM projects ORDER BY inserted_at ASC")
      ]);

      setDomains((domainsRes.rows as unknown as DomainRow[]).map(toDomain));
      setServers((serversRes.rows as unknown as ServerRow[]).map(toServer));
      setEmails((emailsRes.rows as unknown as EmailRow[]).map(toEmail));
      setProjects((projectsRes.rows as unknown as ProjectRow[]).map(toProject));

      console.log('✅ Connected to Turso — Infrastructure data synced');
    } catch (err) {
      console.warn('⚠️ Turso unreachable, using local storage fallback:', err);
      setError('Turso database unreachable — using local storage fallback.');

      setDomains(loadFromStorage<Domain[]>(STORAGE_KEYS.domains, []));
      setServers(loadFromStorage<Server[]>(STORAGE_KEYS.servers, []));
      setEmails(loadFromStorage<Email[]>(STORAGE_KEYS.emails, []));
      setProjects(loadFromStorage<Project[]>(STORAGE_KEYS.projects, []));
    } finally {
      setLoading(false);
    }
  }, [initSchema]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Persist to local cache
  useEffect(() => {
    if (!loading) {
      saveToStorage(STORAGE_KEYS.domains, domains);
      saveToStorage(STORAGE_KEYS.servers, servers);
      saveToStorage(STORAGE_KEYS.emails, emails);
      saveToStorage(STORAGE_KEYS.projects, projects);
    }
  }, [domains, servers, emails, projects, loading]);

  // ─── Domain operations ─────────────────────────────────────
  const addDomain = async (domain: Omit<Domain, 'id'>) => {
    const id = crypto.randomUUID();
    const newDomain: Domain = { ...domain, id };

    try {
      await turso.execute({
        sql: `INSERT INTO domains (id, name, status, service, seats, phone, contact_email, money, start_date, end_date, provider, server) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, domain.name, domain.status, domain.service, domain.seats,
          domain.phone, domain.contactEmail, domain.money, domain.startDate,
          domain.endDate, domain.provider, domain.server
        ]
      });
      setDomains(prev => [...prev, newDomain]);
    } catch (err) {
      console.error('Failed to add domain to Turso:', err);
      setDomains(prev => [...prev, newDomain]);
    }
  };

  const updateDomain = async (id: string, updates: Partial<Domain>) => {
    try {
      const mapping: Record<string, string> = {
        name: 'name', status: 'status', service: 'service', seats: 'seats',
        phone: 'phone', contactEmail: 'contact_email', money: 'money',
        startDate: 'start_date', endDate: 'end_date', provider: 'provider',
        server: 'server'
      };

      const keys = Object.keys(updates).filter(k => mapping[k]);
      if (keys.length === 0) return;

      const setClause = keys.map(k => `${mapping[k]} = ?`).join(', ');
      const args = keys.map(k => (updates as any)[k]);
      args.push(id);

      await turso.execute({ sql: `UPDATE domains SET ${setClause} WHERE id = ?`, args });
      setDomains(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    } catch (err) {
      console.error('Failed to update domain in Turso:', err);
      setDomains(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    }
  };

  const deleteDomain = async (id: string) => {
    try {
      await turso.execute({ sql: "DELETE FROM domains WHERE id = ?", args: [id] });
      setDomains(prev => prev.filter(d => d.id !== id));
      setEmails(prev => prev.filter(e => e.domainId !== id));
    } catch (err) {
      console.error('Failed to delete domain from Turso:', err);
      setDomains(prev => prev.filter(d => d.id !== id));
    }
  };

  // ─── Server operations ─────────────────────────────────────
  const addServer = async (server: Omit<Server, 'id'>) => {
    const id = crypto.randomUUID();
    const newServer: Server = { ...server, id };

    try {
      await turso.execute({
        sql: `INSERT INTO servers (id, name, hostname, ip, status, type, port) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, server.name, server.hostname, server.ip, server.status, server.type, server.port]
      });
      setServers(prev => [...prev, newServer]);
    } catch (err) {
      console.error('Failed to add server to Turso:', err);
      setServers(prev => [...prev, newServer]);
    }
  };

  const updateServer = async (id: string, updates: Partial<Server>) => {
    try {
      const mapping: Record<string, string> = {
        name: 'name', hostname: 'hostname', ip: 'ip', status: 'status',
        type: 'type', port: 'port'
      };

      const keys = Object.keys(updates).filter(k => mapping[k]);
      if (keys.length === 0) return;

      const setClause = keys.map(k => `${mapping[k]} = ?`).join(', ');
      const args = keys.map(k => (updates as any)[k]);
      args.push(id);

      await turso.execute({ sql: `UPDATE servers SET ${setClause} WHERE id = ?`, args });
      setServers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (err) {
      console.error('Failed to update server in Turso:', err);
      setServers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const deleteServer = async (id: string) => {
    try {
      await turso.execute({ sql: "DELETE FROM servers WHERE id = ?", args: [id] });
      setServers(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete server from Turso:', err);
      setServers(prev => prev.filter(s => s.id !== id));
    }
  };

  // ─── Email operations ──────────────────────────────────────
  const addEmail = async (email: Omit<Email, 'id'>) => {
    const id = crypto.randomUUID();
    const newEmail: Email = { ...email, id };

    try {
      await turso.execute({
        sql: `INSERT INTO emails (id, address, domain_id, status, quota, used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, email.address, email.domainId, email.status, email.quota, email.used, email.createdAt]
      });
      setEmails(prev => [...prev, newEmail]);
    } catch (err) {
      console.error('Failed to add email to Turso:', err);
      setEmails(prev => [...prev, newEmail]);
    }
  };

  const updateEmail = async (id: string, updates: Partial<Email>) => {
    try {
      const mapping: Record<string, string> = {
        address: 'address', domainId: 'domain_id', status: 'status',
        quota: 'quota', used: 'used', createdAt: 'created_at'
      };

      const keys = Object.keys(updates).filter(k => mapping[k]);
      if (keys.length === 0) return;

      const setClause = keys.map(k => `${mapping[k]} = ?`).join(', ');
      const args = keys.map(k => (updates as any)[k]);
      args.push(id);

      await turso.execute({ sql: `UPDATE emails SET ${setClause} WHERE id = ?`, args });
      setEmails(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    } catch (err) {
      console.error('Failed to update email in Turso:', err);
      setEmails(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    }
  };

  const deleteEmail = async (id: string) => {
    try {
      await turso.execute({ sql: "DELETE FROM emails WHERE id = ?", args: [id] });
      setEmails(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete email from Turso:', err);
      setEmails(prev => prev.filter(e => e.id !== id));
    }
  };

  // ─── Project operations ─────────────────────────────────────
  const addProject = async (project: Omit<Project, 'id'>) => {
    const id = crypto.randomUUID();
    const newProject: Project = { ...project, id };

    try {
      await turso.execute({
        sql: `INSERT INTO projects (id, name, description, status, client_name, start_date, end_date, budget, progress) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, project.name, project.description, project.status,
          project.clientName, project.startDate, project.endDate,
          project.budget, project.progress
        ]
      });
      setProjects(prev => [...prev, newProject]);
    } catch (err) {
      console.error('Failed to add project to Turso:', err);
      setProjects(prev => [...prev, newProject]);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const mapping: Record<string, string> = {
        name: 'name', description: 'description', status: 'status',
        clientName: 'client_name', startDate: 'start_date', endDate: 'end_date',
        budget: 'budget', progress: 'progress'
      };

      const keys = Object.keys(updates).filter(k => mapping[k]);
      if (keys.length === 0) return;

      const setClause = keys.map(k => `${mapping[k]} = ?`).join(', ');
      const args = keys.map(k => (updates as any)[k]);
      args.push(id);

      await turso.execute({ sql: `UPDATE projects SET ${setClause} WHERE id = ?`, args });
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err) {
      console.error('Failed to update project in Turso:', err);
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await turso.execute({ sql: "DELETE FROM projects WHERE id = ?", args: [id] });
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete project from Turso:', err);
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  // Stats
  const stats = {
    totalDomains: domains.length,
    activeDomains: domains.filter(d => d.status === 'active').length,
    totalServers: servers.length,
    onlineServers: servers.filter(s => s.status === 'online').length,
    totalEmails: emails.length,
    activeEmails: emails.filter(e => e.status === 'active').length,
    activeProjects: projects.filter(p => p.status === 'active').length,
  };

  return {
    domains,
    servers,
    emails,
    projects,
    stats,
    loading,
    error,
    addDomain,
    updateDomain,
    deleteDomain,
    addServer,
    updateServer,
    deleteServer,
    addEmail,
    updateEmail,
    deleteEmail,
    addProject,
    updateProject,
    deleteProject,
    refetch: fetchData
  };
}
