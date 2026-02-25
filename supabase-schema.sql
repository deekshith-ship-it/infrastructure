-- ============================================
-- MailGuardian - CLEAN REBUILD v2
-- Updated with full domain fields
-- ============================================

-- Step 1: Drop tables (cascade drops policies + foreign keys)
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS servers CASCADE;
DROP TABLE IF EXISTS domains CASCADE;

-- Step 2: Create tables
CREATE TABLE domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  service TEXT NOT NULL DEFAULT 'domain',
  seats INTEGER NOT NULL DEFAULT 0,
  phone TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  money NUMERIC(10,2) DEFAULT 0,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  provider TEXT NOT NULL DEFAULT '',
  server TEXT DEFAULT '',
  inserted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  hostname TEXT NOT NULL,
  ip TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  type TEXT NOT NULL DEFAULT 'smtp',
  port INTEGER NOT NULL DEFAULT 587,
  inserted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  quota INTEGER NOT NULL DEFAULT 5120,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies (allow all operations for anon)
CREATE POLICY "domains_select" ON domains FOR SELECT USING (true);
CREATE POLICY "domains_insert" ON domains FOR INSERT WITH CHECK (true);
CREATE POLICY "domains_update" ON domains FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "domains_delete" ON domains FOR DELETE USING (true);

CREATE POLICY "servers_select" ON servers FOR SELECT USING (true);
CREATE POLICY "servers_insert" ON servers FOR INSERT WITH CHECK (true);
CREATE POLICY "servers_update" ON servers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "servers_delete" ON servers FOR DELETE USING (true);

CREATE POLICY "emails_select" ON emails FOR SELECT USING (true);
CREATE POLICY "emails_insert" ON emails FOR INSERT WITH CHECK (true);
CREATE POLICY "emails_update" ON emails FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "emails_delete" ON emails FOR DELETE USING (true);

-- Step 5: Seed data
INSERT INTO domains (name, status, service, seats, money, start_date, end_date, provider) VALUES
  ('akengineers.org', 'expire', 'email', 2, 1711.00, '2025-10-03', '2025-11-03', 'Squarespace'),
  ('anandkcontractor.com', 'active', 'domain', 1, 855.50, '2026-01-17', '2026-02-17', 'Squarespace'),
  ('byraveshwaraelectricals.com', 'active', 'domain', 1, 855.50, '2026-02-13', '2026-03-13', 'Squarespace'),
  ('slrelectricals.co.in', 'active', 'domain', 1, 855.50, '2026-02-03', '2026-03-03', 'Squarespace'),
  ('srivinayakaa.com', 'active', 'domain', 2, 1711.00, '2026-02-10', '2026-03-11', 'Squarespace'),
  ('thebarcon.org', 'active', 'domain', 0, 1014.80, '2025-09-13', '2025-09-13', 'Squarespace'),
  ('unhive.in', 'active', 'domain', 0, 1656.00, '2025-12-29', '2026-12-15', 'Squarespace'),
  ('jayasrienterprises.com', 'active', 'domain', 0, 1221.30, '2024-04-18', '2026-04-18', 'receller'),
  ('nagelectricals.com', 'active', 'domain', 0, 1221.30, '2024-05-24', '2026-05-24', 'receller');

INSERT INTO servers (name, hostname, ip, status, type, port) VALUES
  ('SMTP Primary', 'smtp.example.com', '192.168.1.10', 'online', 'smtp', 587),
  ('IMAP Server', 'imap.example.com', '192.168.1.11', 'online', 'imap', 993),
  ('Backup SMTP', 'smtp-backup.example.com', '192.168.1.12', 'maintenance', 'smtp', 587);

INSERT INTO emails (address, domain_id, status, quota, used, created_at)
  SELECT 'admin@example.com', id, 'active', 10240, 2048, '2024-01-15' FROM domains WHERE name = 'anandkcontractor.com' LIMIT 1;
INSERT INTO emails (address, domain_id, status, quota, used, created_at)
  SELECT 'info@slrelectricals.co.in', id, 'active', 5120, 1024, '2024-02-03' FROM domains WHERE name = 'slrelectricals.co.in' LIMIT 1;
