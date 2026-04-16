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

interface FunctionContext {
  request: Request;
  env: Env;
}

const JSON_HEADERS = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
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

function placeholderUser(id: string = crypto.randomUUID(), role = 'prajurit') {
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

export const onRequest = async ({ request, env }: FunctionContext): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/users\/?/, '');
  const segments = path ? path.split('/') : [];

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
      const rows = ((result as { results?: unknown[] })?.results ?? []) as Record<string, unknown>[];
      return json(rows);
    }

    return json([placeholderUser('u-1', role ?? 'prajurit')]);
  }

  if (request.method === 'GET' && segments.length === 1) {
    const userId = segments[0];

    if (env.DB) {
      const user = await env.DB
        .prepare('SELECT id, nrp, nama, role, pangkat, jabatan, satuan, is_active, is_online, login_attempts, created_at, updated_at FROM users WHERE id = ? LIMIT 1')
        .bind(userId)
        .first();

      if (!user) return fail('User tidak ditemukan', 404);
      return json(user);
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
};
