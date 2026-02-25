export interface Domain {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending' | 'expire';
  service: 'domain' | 'email' | 'server';
  seats: number;
  phone: string;
  contactEmail: string;
  money: number;
  startDate: string;
  endDate: string;
  provider: string;
  server: string;
}

export interface Server {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  status: 'online' | 'offline' | 'maintenance';
  type: 'smtp' | 'imap' | 'pop3';
  port: number;
}

export interface Email {
  id: string;
  address: string;
  domainId: string;
  status: 'active' | 'suspended' | 'disabled';
  quota: number;
  used: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  clientName: string;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
}

export type ViewType = 'dashboard' | 'projects' | 'domains' | 'servers' | 'emails' | 'infra';

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
}

export interface ProjectRow {
  id: string;
  name: string;
  description: string;
  status: string;
  client_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  progress: number;
  inserted_at: string;
}
