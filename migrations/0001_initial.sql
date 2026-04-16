-- Minimal D1 schema for Cloudflare MVP
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nrp TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  nama TEXT NOT NULL,
  role TEXT NOT NULL,
  pangkat TEXT,
  jabatan TEXT,
  satuan TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_online INTEGER NOT NULL DEFAULT 0,
  login_attempts INTEGER NOT NULL DEFAULT 0,
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role) REFERENCES roles(name)
);

CREATE TABLE IF NOT EXISTS gatepass (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  keperluan TEXT NOT NULL,
  tujuan TEXT NOT NULL,
  waktu_keluar TEXT NOT NULL,
  waktu_kembali TEXT NOT NULL,
  actual_keluar TEXT,
  actual_kembali TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  qr_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_satuan ON users(satuan);
CREATE INDEX IF NOT EXISTS idx_gatepass_user_id ON gatepass(user_id);
CREATE INDEX IF NOT EXISTS idx_gatepass_status ON gatepass(status);

INSERT OR IGNORE INTO roles (id, name) VALUES
  ('r-admin', 'admin'),
  ('r-komandan', 'komandan'),
  ('r-prajurit', 'prajurit'),
  ('r-guard', 'guard');
