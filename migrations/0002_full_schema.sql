-- Full schema: all remaining tables for Karyo OS
PRAGMA foreign_keys = ON;

-- ── Extended user fields ────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tempat_lahir TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tanggal_lahir TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS no_telepon TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tanggal_masuk_dinas TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pendidikan_terakhir TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agama TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_pernikahan TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS golongan_darah TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kontak_darurat_nama TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kontak_darurat_telp TEXT;

-- ── Extended gatepass: updated_at column ───────────────────────────────────
ALTER TABLE gatepass ADD COLUMN IF NOT EXISTS updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── Announcements ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  created_by TEXT,
  target_role TEXT,          -- JSON array or comma-sep e.g. '["prajurit","komandan"]'
  target_satuan TEXT,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);

-- ── Attendance ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  waktu_masuk TEXT,
  waktu_keluar TEXT,
  status TEXT NOT NULL DEFAULT 'hadir',   -- hadir | izin | sakit | alpha
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_tanggal ON attendance(tanggal);

-- ── Tasks ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  assigned_to TEXT,
  assigned_by TEXT,
  deadline TEXT,
  prioritas INTEGER NOT NULL DEFAULT 2,  -- 1=high 2=normal 3=low
  status TEXT NOT NULL DEFAULT 'pending', -- pending | in_progress | done | cancelled
  satuan TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE TABLE IF NOT EXISTS task_reports (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  user_id TEXT,
  isi_laporan TEXT NOT NULL,
  file_url TEXT,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_task_reports_task_id ON task_reports(task_id);

-- ── Leave Requests ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  jenis_izin TEXT NOT NULL,   -- cuti | sakit | dinas_luar
  tanggal_mulai TEXT NOT NULL,
  tanggal_selesai TEXT NOT NULL,
  alasan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- ── Messages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  isi TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user);

-- ── Documents ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  kategori TEXT,
  file_url TEXT NOT NULL,
  satuan TEXT,
  file_size INTEGER,
  uploaded_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_kategori ON documents(kategori);

-- ── Logistics Requests ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logistics_requests (
  id TEXT PRIMARY KEY,
  nama_item TEXT NOT NULL,
  jumlah INTEGER NOT NULL,
  satuan_item TEXT,
  alasan TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  satuan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  admin_note TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_logistics_requests_status ON logistics_requests(status);

-- ── Logistics Items (inventory) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logistics_items (
  id TEXT PRIMARY KEY,
  nama_item TEXT NOT NULL,
  jumlah INTEGER NOT NULL DEFAULT 0,
  kondisi TEXT NOT NULL DEFAULT 'baik',   -- baik | rusak | perlu_perbaikan
  kategori TEXT,
  lokasi TEXT,
  satuan_item TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_logistics_items_kategori ON logistics_items(kategori);

-- ── Pos Jaga ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_jaga (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  pos_token TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_jaga_logs (
  id TEXT PRIMARY KEY,
  pos_jaga_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  waktu_scan TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pos_jaga_id) REFERENCES pos_jaga(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pos_jaga_logs_pos ON pos_jaga_logs(pos_jaga_id);

-- ── Audit Logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  details TEXT,    -- JSON string
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ── Discipline Notes ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discipline_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  jenis TEXT NOT NULL,
  keterangan TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_discipline_notes_user_id ON discipline_notes(user_id);

-- ── Shift Schedules ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shift_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  shift TEXT NOT NULL,
  satuan TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_tanggal ON shift_schedules(tanggal);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_user ON shift_schedules(user_id);

-- ── Platform Settings ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO platform_settings (key, value) VALUES
  ('platform_name', 'Karyo OS'),
  ('platform_logo_url', ''),
  ('platform_tagline', 'Sistem Manajemen Operasional Militer');
