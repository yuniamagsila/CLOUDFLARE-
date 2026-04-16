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

async function handleRpc(path: string): Promise<Response> {
  const fn = decodeURIComponent(path.replace(/^rpc\/?/, ''));

  if (fn === 'server_scan_gate_pass') return json({ message: 'Scan berhasil (mock)' });
  if (fn === 'server_checkin') return json({ message: 'Check-in berhasil (mock)' });
  if (fn === 'server_checkout') return json({ message: 'Check-out berhasil (mock)' });
  if (fn === 'scan_pos_jaga') return json({ valid: true, message: 'Scan berhasil (mock)' });
  if (fn === 'get_platform_settings') {
    return json({
      platform_name: 'Karyo OS',
      platform_logo_url: '',
      platform_tagline: 'Sistem Manajemen Operasional Militer',
    });
  }
  if (fn === 'update_platform_settings') return json({ ok: true });
  if (fn === 'change_user_pin') return json({ ok: true });
  if (fn === 'bulk_reset_pins') return json({ reset_count: 0 });
  if (fn === 'import_users_csv') return json({ imported_count: 0 });

  return json({ ok: true });
}

async function handleGenericTable(request: Request, path: string): Promise<Response> {
  const table = path.split('/')[0];
  if (!table) return fail('Route tidak ditemukan', 404);

  if (request.method === 'GET') return json([]);
  if (request.method === 'POST') return json({ ok: true }, 201);
  if (request.method === 'PATCH') return json({ ok: true });
  if (request.method === 'DELETE') return json({ ok: true });

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
    if (path.startsWith('rpc')) return handleRpc(path);

    return handleGenericTable(request, path);
  },
};
