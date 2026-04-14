-- Tambah role guard jika enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'guard';

-- Index untuk gate_pass
CREATE UNIQUE INDEX IF NOT EXISTS idx_gate_pass_qr_token ON gate_pass(qr_token);
CREATE INDEX IF NOT EXISTS idx_gate_pass_status ON gate_pass(status);
