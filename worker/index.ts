interface Env {
  DB?: {
    prepare: (query: string) => {
      bind: (...values: unknown[]) => {
        all: <T = unknown>() => Promise<{ results: T[] }>;
        first: <T = unknown>() => Promise<T | null>;
        run: () => Promise<unknown>;
      };
    };
  };
}

const JSON_HEADERS = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ data }), { status, headers: JSON_HEADERS });
}

function fail(error: string, status = 400): Response {
  return new Response(JSON.stringify({ error }), { status, headers: JSON_HEADERS });
}

async function parseBody(request: Request): Promise<Record<string, unknown>> {
  return (await request.json().catch(() => ({}))) as Record<string, unknown>;
}

function inferRoleFromNrp(nrp: string): 'admin' | 'komandan' | 'prajurit' | 'guard' {
  if (nrp.startsWith('1')) return 'admin';
  if (nrp.startsWith('2')) return 'komandan';
  if (nrp.startsWith('9')) return 'guard';
  return 'prajurit';
}

function placeholderUser(id = 'u-1', role = 'prajurit') {
  const now = new Date().toISOString();
  return {
    id,
    nrp: `N-${id.slice(0, 6)}`,
    nama: 'Placeholder User',
    role,
    satuan: 'Batalyon 1',
    is_active: true,
    is_online: false,
    login_attempts: 0,
    created_at: now,
    updated_at: now,
  };
}

function placeholderGatePass(id = 'gp-1') {
  const now = new Date().toISOString();
  return {
    id,
    user_id: 'u-1',
    keperluan: 'Izin keluar sementara',
    tujuan: 'Klinik',
    waktu_keluar: now,
    waktu_kembali: now,
    status: 'pending',
    qr_token: `QR-${id}`,
    created_at: now,
  };
}

function mapPath(pathname: string): string {
  return pathname.replace(/^\/api\/?/, '');
}

async function handleHealth(env: Env): Promise<Response> {
  const hasDb = Boolean(env.DB);
  if (!hasDb) return json({ ok: true, db: 'mock' });

  const ping = await env.DB?.prepare('SELECT 1 as ok').first<{ ok: number }>();
  return json({ ok: Boolean(ping?.ok), db: 'd1' });
}

async function handleUsers(request: Request, env: Env, path: string): Promise<Response> {
  const url = new URL(request.url);
  const segments = path.replace(/^users\/?/, '').split('/').filter(Boolean);

  if (request.method === 'GET' && segments.length === 0) {
    const role = url.searchParams.get('role');
    const satuan = url.searchParams.get('satuan');

    if (env.DB) {
      const where: string[] = [];
      const params: unknown[] = [];

      if (role) {
        where.push('role = ?');
        params.push(role);
      }
      if (satuan) {
        where.push('satuan = ?');
        params.push(satuan);
      }

      const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
      const query = `SELECT id, nrp, nama, role, pangkat, jabatan, satuan, is_active, is_online, login_attempts, created_at, updated_at FROM users ${whereSql} ORDER BY nama ASC`;
      const result = await env.DB.prepare(query).bind(...params).all();
      return json((result.results ?? []) as unknown[]);
    }

    return json([placeholderUser('u-1', role ?? 'prajurit')]);
  }

  if (request.method === 'GET' && segments.length === 1) {
    const userId = segments[0];

    if (env.DB) {
      const row = await env.DB
        .prepare('SELECT id, nrp, nama, role, pangkat, jabatan, satuan, is_active, is_online, login_attempts, created_at, updated_at FROM users WHERE id = ? LIMIT 1')
        .bind(userId)
        .first();
      if (!row) return fail('User tidak ditemukan', 404);
      return json(row);
    }

    return json(placeholderUser(userId));
  }

  if (request.method === 'POST' && segments.length === 0) {
    const body = await parseBody(request);

    if (!body.nrp || !body.nama || !body.role || !body.satuan) {
      return fail('Field wajib: nrp, nama, role, satuan', 400);
    }

    if (env.DB) {
      const id = crypto.randomUUID();
      await env.DB
        .prepare('INSERT INTO users (id, nrp, nama, role, pangkat, jabatan, satuan, pin_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          id,
          String(body.nrp),
          String(body.nama),
          String(body.role),
          String(body.pangkat ?? ''),
          String(body.jabatan ?? ''),
          String(body.satuan),
          String(body.pin ?? '123456'),
        )
        .run();
      return json({ id }, 201);
    }

    return json({ id: crypto.randomUUID() }, 201);
  }

  if (request.method === 'PATCH' && segments.length === 1) {
    return json({ ok: true });
  }

  if (request.method === 'PATCH' && segments.length === 2 && segments[1] === 'profile') {
    return json({ ok: true });
  }

  if (request.method === 'POST' && segments.length === 2 && segments[1] === 'reset-pin') {
    return json({ ok: true });
  }

  return fail('Route users tidak ditemukan', 404);
}

async function handleGatepass(request: Request, env: Env, path: string): Promise<Response> {
  const url = new URL(request.url);
  const segments = path.replace(/^gatepass\/?/, '').split('/').filter(Boolean);

  if (request.method === 'GET' && segments.length === 0) {
    const userId = url.searchParams.get('user_id');
    const status = url.searchParams.get('status');

    if (env.DB) {
      const where: string[] = [];
      const params: unknown[] = [];

      if (userId) {
        where.push('user_id = ?');
        params.push(userId);
      }
      if (status) {
        where.push('status = ?');
        params.push(status);
      }

      const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
      const result = await env.DB
        .prepare(`SELECT id, user_id, keperluan, tujuan, waktu_keluar, waktu_kembali, actual_keluar, actual_kembali, status, approved_by, qr_token, created_at FROM gatepass ${whereSql} ORDER BY created_at DESC`)
        .bind(...params)
        .all();
      return json((result.results ?? []) as unknown[]);
    }

    return json([placeholderGatePass()]);
  }

  if (request.method === 'GET' && segments.length === 2 && segments[0] === 'qr') {
    const qrToken = decodeURIComponent(segments[1]);

    if (env.DB) {
      const gatepass = await env.DB
        .prepare('SELECT id, user_id, keperluan, tujuan, waktu_keluar, waktu_kembali, actual_keluar, actual_kembali, status, approved_by, qr_token, created_at FROM gatepass WHERE qr_token = ? LIMIT 1')
        .bind(qrToken)
        .first();
      if (!gatepass) return fail('Gate pass tidak ditemukan', 404);
      return json(gatepass);
    }

    return json({ ...placeholderGatePass('gp-qr'), qr_token: qrToken });
  }

  if (request.method === 'POST' && segments.length === 0) {
    const body = await parseBody(request);

    if (env.DB) {
      const id = crypto.randomUUID();
      await env.DB
        .prepare('INSERT INTO gatepass (id, user_id, keperluan, tujuan, waktu_keluar, waktu_kembali, status, qr_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          id,
          String(body.user_id ?? ''),
          String(body.keperluan ?? ''),
          String(body.tujuan ?? ''),
          String(body.waktu_keluar ?? new Date().toISOString()),
          String(body.waktu_kembali ?? new Date().toISOString()),
          String(body.status ?? 'pending'),
          String(body.qr_token ?? `QR-${id}`),
        )
        .run();
      return json({ id }, 201);
    }

    return json({ id: crypto.randomUUID() }, 201);
  }

  if (request.method === 'PATCH' && segments.length === 2 && segments[1] === 'status') {
    return json({ ok: true });
  }

  if (request.method === 'POST' && segments.length === 1 && segments[0] === 'scan') {
    return json({ message: 'Scan berhasil (mock)' });
  }

  return fail('Route gatepass tidak ditemukan', 404);
}

async function handleAuth(request: Request, env: Env, path: string): Promise<Response> {
  const route = path.replace(/^auth\/?/, '');
  if (request.method === 'POST' && route === 'login') {
    const body = await parseBody(request);
    const nrp = String(body.nrp ?? '');
    const pin = String(body.pin ?? '');
    if (!nrp || !pin) return fail('NRP dan PIN wajib diisi', 400);

    const userFromDb = await env.DB
      ?.prepare('SELECT id, nrp, nama, role, pangkat, jabatan, satuan, is_active, is_online, login_attempts, created_at, updated_at FROM users WHERE nrp = ? LIMIT 1')
      .bind(nrp)
      .first();

    const role = inferRoleFromNrp(nrp);
    const user = (userFromDb as Record<string, unknown> | null) ?? {
      id: crypto.randomUUID(),
      nrp,
      nama: `User ${nrp}`,
      role,
      pangkat: 'Prajurit',
      jabatan: 'Anggota',
      satuan: 'Batalyon 1',
      is_active: true,
      is_online: true,
      login_attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return json({
      user,
      session: {
        user_id: String(user.id),
        role: String(user.role),
      },
    });
  }

  if (request.method === 'POST' && route === 'session') {
    const body = await parseBody(request);
    const userId = String(body.user_id ?? '');
    if (!userId) return fail('Session tidak valid', 401);

    const user = await env.DB
      ?.prepare('SELECT id, nrp, nama, role, pangkat, jabatan, satuan, is_active, is_online, login_attempts, created_at, updated_at FROM users WHERE id = ? LIMIT 1')
      .bind(userId)
      .first();

    if (!user) {
      return json({
        id: userId,
        nrp: '0000000',
        nama: 'Placeholder User',
        role: body.role ?? 'prajurit',
        satuan: 'Batalyon 1',
        is_active: true,
        is_online: true,
        login_attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return json(user);
  }

  if (request.method === 'POST' && route === 'logout') return json({ ok: true });
  if (request.method === 'POST' && route === 'online-status') return json({ ok: true });
  return fail('Route auth tidak ditemukan', 404);
}

async function handleRpc(request: Request, env: Env, path: string): Promise<Response> {
  const fn = decodeURIComponent(path.replace(/^rpc\/?/, ''));
  const body = request.method === 'POST' ? await parseBody(request) : {};

  if (fn === 'server_checkin') {
    const userId = String(body.p_user_id ?? '');
    if (userId && env.DB) {
      const today = new Date().toISOString().slice(0, 10);
      const existing = await env.DB
        .prepare('SELECT id FROM attendance WHERE user_id = ? AND tanggal = ?')
        .bind(userId, today)
        .first<{ id: string }>();
      const now = new Date().toISOString();
      if (!existing) {
        await env.DB
          .prepare('INSERT INTO attendance (id, user_id, tanggal, waktu_masuk, status) VALUES (?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), userId, today, now, 'hadir')
          .run();
      } else {
        await env.DB
          .prepare('UPDATE attendance SET waktu_masuk = ? WHERE id = ?')
          .bind(now, existing.id)
          .run();
      }
      await env.DB.prepare('UPDATE users SET is_online = 1 WHERE id = ?').bind(userId).run();
    }
    return json({ message: 'Check-in berhasil' });
  }

  if (fn === 'server_checkout') {
    const userId = String(body.p_user_id ?? '');
    if (userId && env.DB) {
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toISOString();
      await env.DB
        .prepare('UPDATE attendance SET waktu_keluar = ? WHERE user_id = ? AND tanggal = ?')
        .bind(now, userId, today)
        .run();
      await env.DB.prepare('UPDATE users SET is_online = 0 WHERE id = ?').bind(userId).run();
    }
    return json({ message: 'Check-out berhasil' });
  }

  if (fn === 'server_scan_gate_pass') {
    const qrToken = String(body.p_qr_token ?? '');
    if (qrToken && env.DB) {
      const gp = await env.DB
        .prepare('SELECT id, status FROM gatepass WHERE qr_token = ? LIMIT 1')
        .bind(qrToken)
        .first<{ id: string; status: string }>();
      if (!gp) return fail('QR tidak valid', 400);
      const nextStatus = gp.status === 'approved' ? 'out' : gp.status === 'out' ? 'returned' : gp.status;
      await env.DB
        .prepare('UPDATE gatepass SET status = ?, updated_at = ? WHERE id = ?')
        .bind(nextStatus, new Date().toISOString(), gp.id)
        .run();
    }
    return json({ message: 'Scan berhasil' });
  }

  if (fn === 'scan_pos_jaga') {
    const posToken = String(body.p_pos_token ?? '');
    const userId = String(body.p_user_id ?? '');
    if (posToken && userId && env.DB) {
      const pos = await env.DB
        .prepare('SELECT id, is_active FROM pos_jaga WHERE pos_token = ? LIMIT 1')
        .bind(posToken)
        .first<{ id: string; is_active: number }>();
      if (!pos || !pos.is_active) return fail('QR pos jaga tidak valid', 400);
      await env.DB
        .prepare('INSERT INTO pos_jaga_logs (id, pos_jaga_id, user_id) VALUES (?, ?, ?)')
        .bind(crypto.randomUUID(), pos.id, userId)
        .run();
    }
    return json({ valid: true, message: 'Scan berhasil' });
  }

  if (fn === 'get_platform_settings') {
    if (env.DB) {
      const rows = await env.DB
        .prepare('SELECT key, value FROM platform_settings')
        .bind()
        .all<{ key: string; value: string }>();
      const settings: Record<string, string> = {};
      for (const row of rows.results ?? []) settings[row.key] = row.value;
      return json(settings);
    }
    return json({ platform_name: 'Karyo OS', platform_logo_url: '', platform_tagline: 'Sistem Manajemen Operasional Militer' });
  }

  if (fn === 'update_platform_settings') {
    if (env.DB) {
      const now = new Date().toISOString();
      for (const [key, value] of Object.entries(body)) {
        await env.DB
          .prepare('INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
          .bind(key, String(value), now)
          .run();
      }
    }
    return json({ ok: true });
  }

  if (fn === 'change_user_pin') {
    const userId = String(body.p_user_id ?? '');
    const newPin = String(body.p_new_pin ?? '');
    if (userId && newPin && env.DB) {
      await env.DB.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').bind(newPin, userId).run();
    }
    return json({ ok: true });
  }

  if (fn === 'bulk_reset_pins') return json({ reset_count: 0, message: 'Reset PIN selesai (stub)' });
  if (fn === 'import_users_csv') return json({ imported_count: 0, message: 'Import selesai (stub)' });

  return json({ ok: true });
}

// ── Generic D1 table handler ─────────────────────────────────────────────────
// Handles simple CRUD for tables not covered by dedicated handlers.
// Reads/writes rows as JSON; supports ?order_by, ?ascending, plus column filters.

const ALLOWED_TABLES = new Set([
  'announcements', 'attendance', 'tasks', 'task_reports',
  'leave_requests', 'messages', 'logistics_requests', 'logistics_items',
  'pos_jaga', 'pos_jaga_logs', 'audit_logs', 'documents',
  'discipline_notes', 'shift_schedules', 'platform_settings',
]);

// Columns whitelisted for equality filter on each table to prevent SQL injection
const TABLE_FILTER_COLS: Record<string, string[]> = {
  announcements: ['is_pinned', 'created_by', 'target_satuan'],
  attendance: ['user_id', 'tanggal', 'status'],
  tasks: ['assigned_to', 'assigned_by', 'status', 'satuan'],
  task_reports: ['task_id', 'user_id'],
  leave_requests: ['user_id', 'status', 'jenis_izin'],
  messages: ['from_user', 'to_user', 'is_read'],
  logistics_requests: ['requested_by', 'satuan', 'status'],
  logistics_items: ['kategori', 'kondisi'],
  pos_jaga: ['is_active'],
  pos_jaga_logs: ['pos_jaga_id', 'user_id'],
  audit_logs: ['user_id', 'action'],
  documents: ['uploaded_by', 'satuan', 'kategori'],
  discipline_notes: ['user_id', 'created_by'],
  shift_schedules: ['user_id', 'tanggal', 'satuan'],
  platform_settings: [],
};

// Columns allowed for ORDER BY
const ALLOWED_ORDER_COLS = new Set([
  'created_at', 'updated_at', 'submitted_at', 'tanggal', 'nama', 'is_pinned', 'jumlah', 'nama_item',
]);

function safeOrderBy(col: string | null, asc: string | null): string {
  const col2 = col && ALLOWED_ORDER_COLS.has(col) ? col : 'created_at';
  const dir = asc === 'false' ? 'DESC' : 'ASC';
  return `ORDER BY ${col2} ${dir}`;
}

async function handleTable(request: Request, env: Env, rawPath: string): Promise<Response> {
  const url = new URL(request.url);
  const segments = rawPath.split('/').filter(Boolean);
  const table = segments[0];

  if (!table || !ALLOWED_TABLES.has(table)) return fail('Route tidak ditemukan', 404);

  const filterCols = TABLE_FILTER_COLS[table] ?? [];

  // ── GET list ──────────────────────────────────────────────────────────────
  if (request.method === 'GET' && segments.length === 1) {
    if (!env.DB) return json([]);

    const where: string[] = [];
    const params: unknown[] = [];

    for (const col of filterCols) {
      const val = url.searchParams.get(col);
      if (val !== null && val !== '') {
        where.push(`${col} = ?`);
        params.push(val);
      }
    }

    // date-range for attendance / audit_logs
    const dateFrom = url.searchParams.get('tanggal_gte') ?? url.searchParams.get('created_at_gte');
    const dateTo = url.searchParams.get('tanggal_lte') ?? url.searchParams.get('created_at_lte');
    if (dateFrom) { where.push('created_at >= ?'); params.push(dateFrom); }
    if (dateTo) { where.push('created_at <= ?'); params.push(dateTo); }

    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 100, 500) : 100;
    const orderSql = safeOrderBy(url.searchParams.get('order_by'), url.searchParams.get('ascending'));
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const result = await env.DB
      .prepare(`SELECT * FROM ${table} ${whereSql} ${orderSql} LIMIT ?`)
      .bind(...params, limit)
      .all();

    return json(result.results ?? []);
  }

  // ── GET /messages/inbox and /messages/sent ────────────────────────────────
  if (request.method === 'GET' && segments.length === 2 &&
      table === 'messages' && (segments[1] === 'inbox' || segments[1] === 'sent')) {
    if (!env.DB) return json([]);
    const dir = segments[1] === 'inbox' ? 'to_user' : 'from_user';
    const userId = url.searchParams.get('user_id');
    if (!userId) return fail('user_id diperlukan', 400);
    const result = await env.DB
      .prepare(`SELECT * FROM messages WHERE ${dir} = ? ORDER BY created_at DESC LIMIT 100`)
      .bind(userId)
      .all();
    return json(result.results ?? []);
  }

  // ── GET /task_reports/latest ──────────────────────────────────────────────
  if (request.method === 'GET' && segments.length === 2 &&
      table === 'task_reports' && segments[1] === 'latest') {
    if (!env.DB) return json(null);
    const taskId = url.searchParams.get('task_id');
    if (!taskId) return fail('task_id diperlukan', 400);
    const row = await env.DB
      .prepare('SELECT * FROM task_reports WHERE task_id = ? ORDER BY submitted_at DESC LIMIT 1')
      .bind(taskId)
      .first();
    return json(row ?? null);
  }

  // ── GET single row ────────────────────────────────────────────────────────
  if (request.method === 'GET' && segments.length === 2) {
    if (!env.DB) return fail('Tidak ditemukan', 404);
    const row = await env.DB
      .prepare(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`)
      .bind(segments[1])
      .first();
    if (!row) return fail('Tidak ditemukan', 404);
    return json(row);
  }

  // ── POST insert ───────────────────────────────────────────────────────────
  if (request.method === 'POST' && segments.length === 1) {
    const body = await parseBody(request);
    const id = (body.id as string | undefined) ?? crypto.randomUUID();

    if (!env.DB) return json({ id }, 201);

    const cols = ['id', ...Object.keys(body).filter((k) => k !== 'id')];
    const vals = [id, ...cols.slice(1).map((k) => body[k] ?? null)];
    const placeholders = cols.map(() => '?').join(', ');

    await env.DB
      .prepare(`INSERT OR IGNORE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`)
      .bind(...vals)
      .run();

    return json({ id }, 201);
  }

  // ── PATCH /messages/:id/read ──────────────────────────────────────────────
  if (request.method === 'PATCH' && segments.length === 3 &&
      table === 'messages' && segments[2] === 'read') {
    if (!env.DB) return json({ ok: true });
    await env.DB
      .prepare('UPDATE messages SET is_read = 1 WHERE id = ?')
      .bind(segments[1])
      .run();
    return json({ ok: true });
  }

  // ── PATCH /messages/read-all ──────────────────────────────────────────────
  if (request.method === 'PATCH' && segments.length === 2 &&
      table === 'messages' && segments[1] === 'read-all') {
    if (!env.DB) return json({ ok: true });
    const body = await parseBody(request);
    const toUser = String(body.to_user ?? '');
    if (!toUser) return fail('to_user diperlukan', 400);
    await env.DB
      .prepare('UPDATE messages SET is_read = 1 WHERE to_user = ?')
      .bind(toUser)
      .run();
    return json({ ok: true });
  }

  // ── PATCH /:table/:id/status ──────────────────────────────────────────────
  if (request.method === 'PATCH' && segments.length === 3 && segments[2] === 'status') {
    if (!env.DB) return json({ ok: true });
    const body = await parseBody(request);
    const id = segments[1];
    const entries = Object.entries(body).filter(([k]) => k !== 'id');
    if (!entries.length) return fail('Tidak ada field yang diperbarui', 400);
    const sets = entries.map(([k]) => `${k} = ?`).join(', ');
    const vals = [...entries.map(([, v]) => v), id];
    await env.DB
      .prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`)
      .bind(...vals)
      .run();
    return json({ ok: true });
  }

  // ── PATCH /:table/:id ─────────────────────────────────────────────────────
  if (request.method === 'PATCH' && segments.length === 2) {
    if (!env.DB) return json({ ok: true });
    const body = await parseBody(request);
    const id = segments[1];
    const entries = Object.entries(body).filter(([k]) => k !== 'id');
    if (!entries.length) return fail('Tidak ada field yang diperbarui', 400);
    const sets = entries.map(([k]) => `${k} = ?`).join(', ');
    const vals = [...entries.map(([, v]) => v), id];
    await env.DB
      .prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`)
      .bind(...vals)
      .run();
    return json({ ok: true });
  }

  // ── DELETE /:table/:id ────────────────────────────────────────────────────
  if (request.method === 'DELETE' && segments.length === 2) {
    if (!env.DB) return json({ ok: true });
    await env.DB
      .prepare(`DELETE FROM ${table} WHERE id = ?`)
      .bind(segments[1])
      .run();
    return json({ ok: true });
  }

  return fail('Method tidak didukung', 405);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return fail('Not Found', 404);

    const path = mapPath(url.pathname);

    if (path === 'health') return handleHealth(env);
    if (path.startsWith('users')) return handleUsers(request, env, path);
    if (path.startsWith('gatepass')) return handleGatepass(request, env, path);
    if (path.startsWith('auth')) return handleAuth(request, env, path);
    if (path.startsWith('rpc')) return handleRpc(request, env, path);

    return handleTable(request, env, path);
  },
};
