export interface Domain {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending' | 'expire' | 'suspended';
  service: 'domain' | 'email' | 'server';
  seats: number;
  phone: string;
  contactEmail: string;
  money: number;
  startDate: string;
  endDate: string;
  provider: string;
  server: string;
  // SaaS Extensions
  registrarName?: string;
  autoRenew?: boolean;
  sslExpiryDate?: string;
  dnsProvider?: string;
}

export interface Server {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  status: 'online' | 'offline' | 'maintenance' | 'running' | 'down';
  type: 'smtp' | 'imap' | 'pop3';
  port: number;
  // SaaS Extensions
  ipAddress?: string; // New field as requested
  osType?: string;
  cpuUsage?: number;
  ramUsage?: number;
  diskUsage?: number;
  uptimeStatus?: 'Running' | 'Down';
  backupStatus?: string;
  backupDate?: string;
  environmentTag?: 'Production' | 'Staging' | 'Dev';
  expiryDate?: string;
  downtimeSimulation?: boolean;
}

export interface Email {
  id: string;
  address: string;
  domainId: string;
  status: 'active' | 'suspended' | 'disabled' | 'disabled_saas';
  quota: number;
  used: number;
  createdAt: string;
  // SaaS Extensions
  storageLimit?: number;
  storageUsed?: number;
  accountStatus?: 'Active' | 'Suspended' | 'Expired';
  sslExpiryDate?: string;
  spfStatus?: 'Valid' | 'Invalid' | 'Missing';
  dkimStatus?: 'Valid' | 'Invalid' | 'Missing';
  adminPasswordReset?: boolean;
  resetRequested?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  serviceType: string;
  status: 'active' | 'inactive';
}

export interface Invoice {
  id: string;
  vendorId: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  issueDate: string;
  dueDate: string;
  paymentDate?: string;
  invoiceUrl?: string;
  invoiceUpload?: string;
}

export interface ActivityLog {
  id: string;
  module: 'domain' | 'email' | 'server' | 'cost' | 'system';
  action: 'created' | 'updated' | 'deleted' | 'expired' | 'renewed' | 'alert' | 'restart' | 'backup';
  title: string;
  description: string;
  status: 'success' | 'warning' | 'error';
  relatedId?: string;
  createdAt: string;
  userRole: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'expiry' | 'ssl' | 'payment' | 'downtime' | 'storage' | 'info';
  severity: 'low' | 'medium' | 'high';
  isRead: boolean;
  timestamp: string;
}

export type UserRole = 'Admin' | 'Manager' | 'Viewer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export type ViewType = 'dashboard' | 'projects' | 'domains' | 'servers' | 'emails' | 'infra' | 'cost' | 'activity' | 'settings';

// DB row types (snake_case from Turso/LibSQL)
export interface DomainRow {
  id: string;
  name: string;
  status: string;
  service: string;
  seats: number;
  phone: string;
  contact_email: string;
  money: number;
  start_date: string;
  end_date: string;
  provider: string;
  server: string;
  inserted_at: string;
  // SaaS Extensions
  registrar_name?: string;
  auto_renew?: number; // sqlite boolean
  ssl_expiry_date?: string;
  dns_provider?: string;
}

export interface ServerRow {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  status: string;
  type: string;
  port: number;
  inserted_at: string;
  // SaaS Extensions
  ip_address?: string;
  os_type?: string;
  cpu_usage?: number;
  ram_usage?: number;
  disk_usage?: number;
  uptime_status?: string;
  backup_status?: string;
  backup_date?: string;
  environment_tag?: string;
  expiry_date?: string;
  downtime_simulation?: number;
}

export interface EmailRow {
  id: string;
  address: string;
  domain_id: string;
  status: string;
  quota: number;
  used: number;
  created_at: string;
  inserted_at: string;
  // SaaS Extensions
  storage_limit?: number;
  storage_used?: number;
  account_status?: string;
  ssl_expiry_date?: string;
  spf_status?: string;
  dkim_status?: string;
  admin_password_reset?: number;
  reset_requested?: number;
}

export interface VendorRow {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  service_type: string;
  status: string;
  inserted_at: string;
}

export interface InvoiceRow {
  id: string;
  vendor_id: string;
  amount: number;
  billing_cycle: string;
  payment_status: string;
  issue_date: string;
  due_date: string;
  payment_date?: string;
  invoice_url: string;
  invoice_upload?: string;
  inserted_at: string;
}

export interface ActivityLogRow {
  id: string;
  module: string;
  action: string;
  title: string;
  description: string;
  status: string;
  related_id: string;
  created_at: string;
  user_role: string;
}

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  is_read: number;
  timestamp: string;
}
