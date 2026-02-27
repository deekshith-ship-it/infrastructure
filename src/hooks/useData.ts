import { useState, useEffect, useCallback } from 'react';
import { turso } from '@/lib/turso';
import type {
  Domain, Server, Email, DomainRow, ServerRow, EmailRow,
  Vendor, VendorRow, Invoice, InvoiceRow,
  ActivityLog, ActivityLogRow, Notification, NotificationRow,
  User
} from '@/types';

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
    registrarName: row.registrar_name || '',
    autoRenew: Boolean(row.auto_renew),
    sslExpiryDate: row.ssl_expiry_date || '',
    dnsProvider: row.dns_provider || '',
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
    ipAddress: row.ip_address || row.ip,
    osType: row.os_type || '',
    cpuUsage: Number(row.cpu_usage) || 0,
    ramUsage: Number(row.ram_usage) || 0,
    diskUsage: Number(row.disk_usage) || 0,
    uptimeStatus: row.uptime_status as Server['uptimeStatus'],
    backupStatus: row.backup_status || '',
    backupDate: row.backup_date || '',
    environmentTag: row.environment_tag as Server['environmentTag'],
    expiryDate: row.expiry_date || '',
    downtimeSimulation: Boolean(row.downtime_simulation),
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
    storageLimit: Number(row.storage_limit) || Number(row.quota),
    storageUsed: Number(row.storage_used) || Number(row.used),
    accountStatus: row.account_status as Email['accountStatus'],
    adminPasswordReset: Boolean(row.admin_password_reset),
  };
}

function toVendor(row: VendorRow): Vendor {
  return {
    id: String(row.id),
    name: row.name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    serviceType: row.service_type,
    status: row.status as Vendor['status'],
  };
}

function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    amount: Number(row.amount),
    billingCycle: row.billing_cycle as Invoice['billingCycle'],
    paymentStatus: row.payment_status as Invoice['paymentStatus'],
    issueDate: row.issue_date,
    dueDate: row.due_date,
    paymentDate: row.payment_date || '',
    invoiceUrl: row.invoice_url,
    invoiceUpload: row.invoice_upload || '',
  };
}

function toActivityLog(row: ActivityLogRow): ActivityLog {
  return {
    id: String(row.id),
    module: row.module as ActivityLog['module'],
    action: row.action as ActivityLog['action'],
    title: row.title,
    description: row.description,
    status: row.status as ActivityLog['status'],
    relatedId: row.related_id,
    createdAt: row.created_at || '',
    userRole: row.user_role || 'System',
  };
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: String(row.id),
    title: row.title,
    message: row.message,
    type: row.type as Notification['type'],
    severity: row.severity as Notification['severity'],
    isRead: Boolean(row.is_read),
    timestamp: row.timestamp,
  };
}

// ─── LocalStorage helpers ────────────────────────────────────────
const DATA_VERSION = 'vSaaS_1';
const STORAGE_KEYS = {
  domains: `mg_domains_${DATA_VERSION}`,
  servers: `mg_servers_${DATA_VERSION}`,
  emails: `mg_emails_${DATA_VERSION}`,
  vendors: `mg_vendors_${DATA_VERSION}`,
  invoices: `mg_invoices_${DATA_VERSION}`,
  activity: `mg_activity_${DATA_VERSION}`,
  notifications: `mg_notify_${DATA_VERSION}`,
  user: `mg_user_${DATA_VERSION}`,
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
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(() => loadFromStorage<User>(STORAGE_KEYS.user, {
    id: 'u1',
    name: 'Admin User',
    role: 'Admin',
    email: 'admin@mailguardian.io'
  }));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Initialize Schema & Migrations ───────────────────────────
  const initSchema = useCallback(async () => {
    try {
      // 1. Create Base Tables
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
        `CREATE TABLE IF NOT EXISTS vendors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          contact_name TEXT,
          email TEXT,
          phone TEXT,
          service_type TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          vendor_id TEXT NOT NULL,
          amount REAL NOT NULL DEFAULT 0,
          billing_cycle TEXT NOT NULL DEFAULT 'monthly',
          payment_status TEXT NOT NULL DEFAULT 'Pending',
          issue_date TEXT,
          due_date TEXT,
          payment_date TEXT,
          invoice_url TEXT,
          invoice_upload TEXT,
          inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS activity_logs (
          id TEXT PRIMARY KEY,
          module TEXT NOT NULL,
          action TEXT NOT NULL,
          title TEXT,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'success',
          related_id TEXT,
          user_role TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          message TEXT,
          type TEXT NOT NULL DEFAULT 'info',
          severity TEXT NOT NULL DEFAULT 'low',
          is_read INTEGER DEFAULT 0,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ], "write");

      // 2. SaaS Column Migrations (Silent Fail if exists)
      const migrations = [
        // Domains
        "ALTER TABLE domains ADD COLUMN registrar_name TEXT",
        "ALTER TABLE domains ADD COLUMN auto_renew INTEGER DEFAULT 0",
        "ALTER TABLE domains ADD COLUMN ssl_expiry_date TEXT",
        "ALTER TABLE domains ADD COLUMN dns_provider TEXT",
        // Servers
        "ALTER TABLE servers ADD COLUMN ip_address TEXT",
        "ALTER TABLE servers ADD COLUMN os_type TEXT",
        "ALTER TABLE servers ADD COLUMN cpu_usage REAL DEFAULT 0",
        "ALTER TABLE servers ADD COLUMN ram_usage REAL DEFAULT 0",
        "ALTER TABLE servers ADD COLUMN disk_usage REAL DEFAULT 0",
        "ALTER TABLE servers ADD COLUMN uptime_status TEXT DEFAULT 'Running'",
        "ALTER TABLE servers ADD COLUMN backup_status TEXT",
        "ALTER TABLE servers ADD COLUMN backup_date TEXT",
        "ALTER TABLE servers ADD COLUMN environment_tag TEXT DEFAULT 'Production'",
        "ALTER TABLE servers ADD COLUMN expiry_date TEXT",
        "ALTER TABLE servers ADD COLUMN downtime_simulation INTEGER DEFAULT 0",
        // Emails
        "ALTER TABLE emails ADD COLUMN storage_limit INTEGER",
        "ALTER TABLE emails ADD COLUMN storage_used INTEGER",
        "ALTER TABLE emails ADD COLUMN account_status TEXT DEFAULT 'Active'",
        "ALTER TABLE emails ADD COLUMN admin_password_reset INTEGER DEFAULT 0",
        // Invoices
        "ALTER TABLE invoices ADD COLUMN payment_date TEXT",
        "ALTER TABLE invoices ADD COLUMN invoice_upload TEXT",
        "ALTER TABLE activity_logs ADD COLUMN module TEXT",
        "ALTER TABLE activity_logs ADD COLUMN title TEXT",
        "ALTER TABLE activity_logs ADD COLUMN description TEXT",
        "ALTER TABLE activity_logs ADD COLUMN status TEXT",
        "ALTER TABLE activity_logs ADD COLUMN related_id TEXT",
        "ALTER TABLE activity_logs ADD COLUMN created_at DATETIME",
        "CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_activity_module ON activity_logs(module)",
        "CREATE INDEX IF NOT EXISTS idx_activity_status ON activity_logs(status)"
      ];

      for (const sql of migrations) {
        try {
          await turso.execute(sql);
        } catch {
          // Column likely exists, skip
        }
      }

    } catch (err) {
      console.error('Failed to initialize SaaS schema:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await initSchema();

      const [
        domainsRes, serversRes, emailsRes,
        vendorsRes, invoicesRes, logsRes, notifyRes
      ] = await Promise.all([
        turso.execute("SELECT * FROM domains ORDER BY inserted_at DESC"),
        turso.execute("SELECT * FROM servers ORDER BY inserted_at DESC"),
        turso.execute("SELECT * FROM emails ORDER BY inserted_at DESC"),
        turso.execute("SELECT * FROM vendors ORDER BY inserted_at DESC"),
        turso.execute("SELECT * FROM invoices ORDER BY inserted_at DESC"),
        turso.execute("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100"),
        turso.execute("SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50")
      ]);

      setDomains((domainsRes.rows as any).map(toDomain));
      setServers((serversRes.rows as any).map(toServer));
      setEmails((emailsRes.rows as any).map(toEmail));
      setVendors((vendorsRes.rows as any).map(toVendor));
      setInvoices((invoicesRes.rows as any).map(toInvoice));
      setActivityLogs((logsRes.rows as any).map(toActivityLog));
      setNotifications((notifyRes.rows as any).map(toNotification));

      // ─── Post-Fetch Intelligence (Overdue check & Spike check) ───
      const todayStr = new Date().toISOString().split('T')[0];
      const fetchedInvoices = (invoicesRes.rows as any).map(toInvoice);

      for (const inv of fetchedInvoices) {
        if (inv.paymentStatus !== 'Paid' && inv.dueDate < todayStr && inv.paymentStatus !== 'Overdue') {
          await turso.execute({
            sql: "UPDATE invoices SET payment_status = 'Overdue' WHERE id = ?",
            args: [inv.id]
          });
          inv.paymentStatus = 'Overdue';
          await addNotification({
            title: 'Payment Overdue',
            message: `Invoice from vendor ${inv.vendorId} for $${inv.amount} is overdue.`,
            type: 'payment',
            severity: 'high'
          });
        }

        // Due within 7 days alert
        const dueDate = new Date(inv.dueDate);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        if (inv.paymentStatus === 'Pending' && dueDate <= sevenDaysFromNow && dueDate > new Date()) {
          await addNotification({
            title: 'Payment Approaching',
            message: `Invoice for ${inv.vendorId} ($${inv.amount}) is due in less than 7 days (${inv.dueDate}).`,
            type: 'payment',
            severity: 'medium'
          });
        }
      }
      setInvoices(fetchedInvoices);

      // Cost Spike Alert (>20%)
      const monthlyNow = fetchedInvoices
        .filter((i: Invoice) => {
          const d = new Date(i.issueDate);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((acc: number, i: Invoice) => acc + i.amount, 0);

      const monthlyPrev = fetchedInvoices
        .filter((i: Invoice) => {
          const d = new Date(i.issueDate);
          const now = new Date();
          const lastM = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const lastY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          return d.getMonth() === lastM && d.getFullYear() === lastY;
        })
        .reduce((acc: number, i: Invoice) => acc + i.amount, 0);

      if (monthlyPrev > 0 && ((monthlyNow - monthlyPrev) / monthlyPrev) > 0.2) {
        await addNotification({
          title: 'Expenditure Spike Detected',
          message: `Monthly costs have increased by more than 20% ($${monthlyNow.toLocaleString()} vs $${monthlyPrev.toLocaleString()}).`,
          type: 'payment',
          severity: 'high'
        });
      }

      console.log('✅ SaaS Infrastructure data synced');
    } catch (err) {
      console.warn('⚠️ Turso sync failed, local fallback:', err);
      setError('Database sync failed — using local storage.');

      setDomains(loadFromStorage<Domain[]>(STORAGE_KEYS.domains, []));
      setServers(loadFromStorage<Server[]>(STORAGE_KEYS.servers, []));
      setEmails(loadFromStorage<Email[]>(STORAGE_KEYS.emails, []));
      setVendors(loadFromStorage<Vendor[]>(STORAGE_KEYS.vendors, []));
      setInvoices(loadFromStorage<Invoice[]>(STORAGE_KEYS.invoices, []));
      setActivityLogs(loadFromStorage<ActivityLog[]>(STORAGE_KEYS.activity, []));
      setNotifications(loadFromStorage<Notification[]>(STORAGE_KEYS.notifications, []));
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
      saveToStorage(STORAGE_KEYS.vendors, vendors);
      saveToStorage(STORAGE_KEYS.invoices, invoices);
      saveToStorage(STORAGE_KEYS.activity, activityLogs);
      saveToStorage(STORAGE_KEYS.notifications, notifications);
      saveToStorage(STORAGE_KEYS.user, currentUser);
    }
  }, [domains, servers, emails, vendors, invoices, activityLogs, notifications, currentUser, loading]);

  // ─── Internal Logging Helper ─────────────────────────────────
  const logActivity = async (log: Omit<ActivityLog, 'id' | 'createdAt' | 'userRole'>) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const newLog: ActivityLog = { ...log, id, createdAt, userRole: currentUser.role };

    // Update state immediately for "real-time" feel
    setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]);

    // Fire and forget - never block main action
    (async () => {
      try {
        await turso.execute({
          sql: `INSERT INTO activity_logs (id, module, action, title, description, status, related_id, user_role, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [id, log.module, log.action, log.title, log.description, log.status, log.relatedId || null, currentUser.role, createdAt]
        });
      } catch (err) {
        console.error('Silent Activity Log Error:', err);
      }
    })();
  };

  // ─── Domain operations ─────────────────────────────────────
  const addDomain = async (domain: Omit<Domain, 'id'>) => {
    const id = crypto.randomUUID();
    const newDomain: Domain = { ...domain, id };

    try {
      await turso.execute({
        sql: `INSERT INTO domains (id, name, status, service, seats, phone, contact_email, money, start_date, end_date, provider, server, registrar_name, auto_renew, ssl_expiry_date, dns_provider) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, domain.name, domain.status, domain.service, domain.seats,
          domain.phone, domain.contactEmail, domain.money, domain.startDate,
          domain.endDate, domain.provider, domain.server,
          domain.registrarName || '', domain.autoRenew ? 1 : 0, domain.sslExpiryDate || '', domain.dnsProvider || ''
        ]
      });
      setDomains(prev => [newDomain, ...prev]);
      logActivity({
        module: 'domain',
        action: 'created',
        title: 'New Domain Registered',
        description: `Domain ${domain.name} added to infrastructure registry.`,
        status: 'success',
        relatedId: id
      });
    } catch (err) {
      console.error('Failed to add domain:', err);
      setDomains(prev => [newDomain, ...prev]);
    }
  };

  const updateDomain = async (id: string, updates: Partial<Domain>) => {
    try {
      const mapping: Record<string, string> = {
        name: 'name', status: 'status', service: 'service', seats: 'seats',
        phone: 'phone', contactEmail: 'contact_email', money: 'money',
        startDate: 'start_date', endDate: 'end_date', provider: 'provider',
        server: 'server', registrarName: 'registrar_name', autoRenew: 'auto_renew',
        sslExpiryDate: 'ssl_expiry_date', dnsProvider: 'dns_provider'
      };

      const keys = Object.keys(updates).filter(k => mapping[k]);
      if (keys.length === 0) return;

      const setClause = keys.map(k => `${mapping[k]} = ?`).join(', ');
      const args = keys.map(k => {
        const val = (updates as any)[k];
        if (k === 'autoRenew') return val ? 1 : 0;
        return val;
      });
      args.push(id);

      await turso.execute({ sql: `UPDATE domains SET ${setClause} WHERE id = ?`, args });
      setDomains(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

      // Contextual Logging
      if (updates.status === 'suspended') {
        logActivity({ module: 'domain', action: 'updated', title: 'Domain Suspended', description: `Administrative suspension triggered for ${updates.name || id}.`, status: 'warning', relatedId: id });
      } else if (updates.endDate) {
        logActivity({ module: 'domain', action: 'renewed', title: 'Domain Renewed', description: `Subscription extended for ${updates.name || id} until ${updates.endDate}.`, status: 'success', relatedId: id });
      } else if (updates.sslExpiryDate) {
        logActivity({ module: 'domain', action: 'updated', title: 'SSL Certificate Updated', description: `New SSL certificate registered for ${updates.name || id}.`, status: 'success', relatedId: id });
      } else if (updates.dnsProvider) {
        logActivity({ module: 'domain', action: 'updated', title: 'DNS Configuration Changed', description: `Nameserver authority updated for ${updates.name || id}.`, status: 'success', relatedId: id });
      } else {
        logActivity({ module: 'domain', action: 'updated', title: 'Domain Updated', description: `Configuration modified for ${updates.name || id}.`, status: 'success', relatedId: id });
      }
    } catch (err) {
      console.error('Failed to update domain:', err);
      setDomains(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    }
  };

  const deleteDomain = async (id: string) => {
    if (currentUser.role === 'Viewer') return;
    try {
      await turso.execute({ sql: "DELETE FROM domains WHERE id = ?", args: [id] });
      setDomains(prev => prev.filter(d => d.id !== id));
      setEmails(prev => prev.filter(e => e.domainId !== id));
      logActivity({
        module: 'domain',
        action: 'deleted',
        title: 'Domain Removed',
        description: `Domain entry and associated records purged from system.`,
        status: 'warning',
        relatedId: id
      });
    } catch (err) {
      console.error('Failed to delete domain:', err);
      setDomains(prev => prev.filter(d => d.id !== id));
    }
  };

  // ─── Server operations ─────────────────────────────────────
  const addServer = async (server: Omit<Server, 'id'>) => {
    const id = crypto.randomUUID();
    const newServer: Server = { ...server, id };

    try {
      await turso.execute({
        sql: `INSERT INTO servers (id, name, hostname, ip, status, type, port, ip_address, os_type, cpu_usage, ram_usage, disk_usage, uptime_status, backup_status, backup_date, environment_tag, expiry_date, downtime_simulation) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, server.name, server.hostname, server.ip, server.status, server.type, server.port,
          server.ipAddress || server.ip, server.osType || '', server.cpuUsage || 0,
          server.ramUsage || 0, server.diskUsage || 0, server.uptimeStatus || 'Running',
          server.backupStatus || 'Healthy', server.backupDate || '', server.environmentTag || 'Production',
          server.expiryDate || '', server.downtimeSimulation ? 1 : 0
        ]
      });
      setServers(prev => [newServer, ...prev]);
      logActivity({
        module: 'server',
        action: 'created',
        title: 'New Server Provisioned',
        description: `Server ${server.name} initialized at ${server.ip}.`,
        status: 'success',
        relatedId: id
      });
    } catch (err) {
      console.error('Failed to add server:', err);
      setServers(prev => [newServer, ...prev]);
    }
  };

  const updateServer = async (id: string, updates: Partial<Server>) => {
    try {
      const mapping: Record<string, string> = {
        name: 'name', hostname: 'hostname', ip: 'ip', status: 'status',
        type: 'type', port: 'port', ipAddress: 'ip_address', osType: 'os_type',
        cpuUsage: 'cpu_usage', ramUsage: 'ram_usage', diskUsage: 'disk_usage',
        uptimeStatus: 'uptime_status', backupStatus: 'backup_status',
        backupDate: 'backup_date', environmentTag: 'environment_tag',
        expiryDate: 'expiry_date', downtimeSimulation: 'downtime_simulation'
      };

      const keys = Object.keys(updates).filter(k => mapping[k]);
      if (keys.length === 0) return;

      const setClause = keys.map(k => `${mapping[k]} = ?`).join(', ');
      const args = keys.map(k => (updates as any)[k]);
      args.push(id);

      await turso.execute({ sql: `UPDATE servers SET ${setClause} WHERE id = ?`, args });
      setServers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

      // Contextual Logging
      if (updates.status === 'online' || updates.status === 'running') {
        logActivity({ module: 'server', action: 'restart', title: 'Server Restarted', description: `System reboot completed for ${updates.name || id}.`, status: 'success', relatedId: id });
      } else if (updates.backupStatus === 'Healthy' || updates.backupDate) {
        logActivity({ module: 'server', action: 'backup', title: 'Backup Completed', description: `System snapshot successfully archived for ${updates.name || id}.`, status: 'success', relatedId: id });
      } else if (updates.status === 'offline') {
        logActivity({ module: 'server', action: 'alert', title: 'Server Down Detected', description: `Critical connectivity loss detected for node ${updates.name || id}.`, status: 'error', relatedId: id });
      } else {
        logActivity({ module: 'server', action: 'updated', title: 'Server Updated', description: `Parameters adjusted for ${updates.name || id}.`, status: 'success', relatedId: id });
      }
    } catch (err) {
      console.error('Failed to update server:', err);
      setServers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const deleteServer = async (id: string) => {
    if (currentUser.role === 'Viewer') return;
    try {
      await turso.execute({ sql: "DELETE FROM servers WHERE id = ?", args: [id] });
      setServers(prev => prev.filter(s => s.id !== id));
      logActivity({
        module: 'server',
        action: 'deleted',
        title: 'Server Decommissioned',
        description: `Host and routing configuration removed.`,
        status: 'warning',
        relatedId: id
      });
    } catch (err) {
      console.error('Failed to delete server:', err);
      setServers(prev => prev.filter(s => s.id !== id));
    }
  };

  // ─── Email operations ──────────────────────────────────────
  const addEmail = async (email: Omit<Email, 'id'>) => {
    const id = crypto.randomUUID();
    const newEmail: Email = { ...email, id };

    try {
      await turso.execute({
        sql: `INSERT INTO emails (id, address, domain_id, status, quota, used, created_at, storage_limit, storage_used, account_status, admin_password_reset) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, email.address, email.domainId, email.status, email.quota, email.used, email.createdAt,
          email.storageLimit || email.quota, email.storageUsed || email.used, email.accountStatus || 'Active', email.adminPasswordReset ? 1 : 0
        ]
      });
      setEmails(prev => [newEmail, ...prev]);
      logActivity({
        module: 'email',
        action: 'created',
        title: 'Email Account Created',
        description: `New endpoint ${email.address} mapped to domain.`,
        status: 'success',
        relatedId: id
      });
    } catch (err) {
      console.error('Failed to add email:', err);
      setEmails(prev => [newEmail, ...prev]);
    }
  };

  const updateEmail = async (id: string, updates: Partial<Email>) => {
    try {
      const mapping: Record<string, string> = {
        address: 'address', domainId: 'domain_id', status: 'status',
        quota: 'quota', used: 'used', createdAt: 'created_at',
        storageLimit: 'storage_limit', storageUsed: 'storage_used',
        accountStatus: 'account_status', adminPasswordReset: 'admin_password_reset'
      };

      const keys = Object.keys(updates).filter(k => mapping[k]);
      if (keys.length === 0) return;

      const setClause = keys.map(k => `${mapping[k]} = ?`).join(', ');
      const args = keys.map(k => {
        const val = (updates as any)[k];
        if (k === 'adminPasswordReset') return val ? 1 : 0;
        return val;
      });
      args.push(id);

      await turso.execute({ sql: `UPDATE emails SET ${setClause} WHERE id = ?`, args });
      setEmails(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));

      // Contextual Logging
      if (updates.adminPasswordReset) {
        logActivity({ module: 'email', action: 'updated', title: 'Security Credentials Reset', description: `Administrative password override performed for ${updates.address || id}.`, status: 'warning', relatedId: id });
      } else if (updates.status === 'suspended' || updates.accountStatus === 'Suspended') {
        logActivity({ module: 'email', action: 'updated', title: 'Email Account Suspended', description: `Access revoked for endpoint ${updates.address || id}.`, status: 'warning', relatedId: id });
      } else {
        logActivity({ module: 'email', action: 'updated', title: 'Email Updated', description: `Quota or status modified for ${updates.address || id}.`, status: 'success', relatedId: id });
      }
    } catch (err) {
      console.error('Failed to update email:', err);
      setEmails(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    }
  };

  const deleteEmail = async (id: string) => {
    if (currentUser.role === 'Viewer') return;
    try {
      await turso.execute({ sql: "DELETE FROM emails WHERE id = ?", args: [id] });
      setEmails(prev => prev.filter(e => e.id !== id));
      logActivity({
        module: 'email',
        action: 'deleted',
        title: 'Email Purged',
        description: `Email account and mailbox references removed.`,
        status: 'warning',
        relatedId: id
      });
    } catch (err) {
      console.error('Failed to delete email:', err);
      setEmails(prev => prev.filter(e => e.id !== id));
    }
  };

  // ─── Vendor operations ─────────────────────────────────────
  const addVendor = async (vendor: Omit<Vendor, 'id'>) => {
    const id = crypto.randomUUID();
    const newVendor: Vendor = { ...vendor, id };
    try {
      await turso.execute({
        sql: `INSERT INTO vendors (id, name, contact_name, email, phone, service_type, status) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, vendor.name, vendor.contactName, vendor.email, vendor.phone, vendor.serviceType, vendor.status]
      });
      setVendors(prev => [newVendor, ...prev]);
      logActivity({
        module: 'cost',
        action: 'created',
        title: 'Vendor Added',
        description: `Service provider ${vendor.name} added to cost management.`,
        status: 'success',
        relatedId: id
      });
    } catch (err) {
      console.error('Failed to add vendor:', err);
      setVendors(prev => [newVendor, ...prev]);
    }
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    try {
      const mapping: Record<string, string> = { name: 'name', contactName: 'contact_name', email: 'email', phone: 'phone', serviceType: 'service_type', status: 'status' };
      const keys = Object.keys(updates).filter(k => mapping[k]);
      if (keys.length === 0) return;
      const setClause = keys.map(k => `${mapping[k]} = ?`).join(', ');
      const args = keys.map(k => (updates as any)[k]);
      args.push(id);
      await turso.execute({ sql: `UPDATE vendors SET ${setClause} WHERE id = ?`, args });
      setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    } catch (err) { console.error('Failed to update vendor:', err); }
  };

  const deleteVendor = async (id: string) => {
    if (currentUser.role === 'Viewer') return;
    try {
      await turso.execute({ sql: "DELETE FROM vendors WHERE id = ?", args: [id] });
      setVendors(prev => prev.filter(v => v.id !== id));
      setInvoices(prev => prev.filter(i => i.vendorId !== id));
    } catch (err) { console.error('Failed to delete vendor:', err); }
  };

  // ─── Invoice operations ─────────────────────────────────────
  const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    const id = crypto.randomUUID();
    const newInvoice: Invoice = { ...invoice, id };
    try {
      await turso.execute({
        sql: `INSERT INTO invoices (id, vendor_id, amount, billing_cycle, payment_status, issue_date, due_date, payment_date, invoice_url, invoice_upload) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, invoice.vendorId, invoice.amount, invoice.billingCycle, invoice.paymentStatus, invoice.issueDate, invoice.dueDate, invoice.paymentDate || '', invoice.invoiceUrl || '', invoice.invoiceUpload || '']
      });
      setInvoices(prev => [newInvoice, ...prev]);
      logActivity({
        module: 'cost',
        action: 'created',
        title: 'Invoice Uploaded',
        description: `Billing document for $${invoice.amount} registered.`,
        status: 'success',
        relatedId: id
      });
    } catch (err) {
      console.error('Failed to add invoice:', err);
      setInvoices(prev => [newInvoice, ...prev]);
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      const mapping: Record<string, string> = {
        vendorId: 'vendor_id', amount: 'amount', billingCycle: 'billing_cycle',
        paymentStatus: 'payment_status', issueDate: 'issue_date', dueDate: 'due_date',
        paymentDate: 'payment_date', invoiceUrl: 'invoice_url', invoiceUpload: 'invoice_upload'
      };
      const keys = Object.keys(updates).filter(k => mapping[k]);
      if (keys.length === 0) return;
      const setClause = keys.map(k => `${mapping[k]} = ?`).join(', ');
      const args = keys.map(k => (updates as any)[k]);
      args.push(id);
      await turso.execute({ sql: `UPDATE invoices SET ${setClause} WHERE id = ?`, args });
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));

      // Contextual Logging
      if (updates.paymentStatus === 'Paid') {
        logActivity({ module: 'cost', action: 'updated', title: 'Invoice Settlement', description: 'Financial document successfully reconciled and marked as Paid.', status: 'success', relatedId: id });
      } else if (updates.paymentStatus === 'Overdue') {
        logActivity({ module: 'cost', action: 'alert', title: 'Payment Overdue', description: 'Invoice payment has exceeded the due date threshold.', status: 'error', relatedId: id });
      }
    } catch (err) { console.error('Failed to update invoice:', err); }
  };

  const deleteInvoice = async (id: string) => {
    if (currentUser.role === 'Viewer') return;
    try {
      await turso.execute({ sql: "DELETE FROM invoices WHERE id = ?", args: [id] });
      setInvoices(prev => prev.filter(i => i.id !== id));
    } catch (err) { console.error('Failed to delete invoice:', err); }
  };

  // ─── Notification Logic ─────────────────────────────────────
  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const newNotify: Notification = { ...notification, id, timestamp, isRead: false };

    setNotifications(prev => [newNotify, ...prev.slice(0, 49)]);

    try {
      await turso.execute({
        sql: `INSERT INTO notifications (id, title, message, type, severity, is_read, timestamp) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, notification.title, notification.message, notification.type, notification.severity, 0, timestamp]
      });

      // Log Alert Triggering
      logActivity({
        module: notification.type === 'payment' ? 'cost' : (notification.type === 'downtime' ? 'server' : 'system'),
        action: 'alert',
        title: `System Alert: ${notification.title}`,
        description: notification.message || 'Automated system alert dispatched.',
        status: notification.severity === 'high' ? 'error' : (notification.severity === 'medium' ? 'warning' : 'success')
      });
    } catch (err) {
      console.error('Failed to save notification:', err);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await turso.execute({ sql: "UPDATE notifications SET is_read = 1 WHERE id = ?", args: [id] });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  // ─── Global Search ──────────────────────────────────────────
  const globalSearch = (query: string) => {
    if (!query) return { domains: [], servers: [], emails: [] };
    const q = query.toLowerCase();
    return {
      domains: domains.filter(d => d.name.toLowerCase().includes(q) || d.provider.toLowerCase().includes(q)),
      servers: servers.filter(s => s.name.toLowerCase().includes(q) || s.hostname.toLowerCase().includes(q) || s.ip.toLowerCase().includes(q)),
      emails: emails.filter(e => e.address.toLowerCase().includes(q)),
    };
  };

  // ─── Enhanced Stats ─────────────────────────────────────────
  const stats = {
    totalDomains: domains.length,
    activeDomains: domains.filter(d => d.status === 'active').length,
    expiredDomains: domains.filter(d => d.status === 'expire').length,
    totalServers: servers.length,
    onlineServers: servers.filter(s => s.status === 'online' || s.status === 'running').length,
    totalEmails: emails.length,
    activeEmails: emails.filter(e => e.status === 'active').length,
    monthlyCost: domains.reduce((acc, d) => acc + (d.money || 0), 0), // Base logic
    yearlyCost: domains.reduce((acc, d) => acc + (d.money || 0), 0) * 12,
    alerts: notifications.filter(n => !n.isRead).length,
  };

  return {
    domains,
    servers,
    emails,
    vendors,
    invoices,
    activityLogs,
    notifications,
    currentUser,
    stats,
    loading,
    error,
    setCurrentUser,
    addDomain,
    updateDomain,
    deleteDomain,
    addServer,
    updateServer,
    deleteServer,
    addEmail,
    updateEmail,
    deleteEmail,
    addVendor,
    updateVendor,
    deleteVendor,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addNotification,
    markNotificationRead,
    globalSearch,
    refetch: fetchData
  };
}
