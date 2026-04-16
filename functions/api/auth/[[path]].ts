interface Env {
  DB?: {
    prepare: (query: string) => {
      bind: (...values: unknown[]) => {
        first: <T = unknown>() => Promise<T | null>;
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

function inferRoleFromNrp(nrp: string): 'admin' | 'komandan' | 'prajurit' | 'guard' {
  if (nrp.startsWith('1')) return 'admin';
  if (nrp.startsWith('2')) return 'komandan';
  if (nrp.startsWith('9')) return 'guard';
  return 'prajurit';
}

async function parseBody(request: Request): Promise<Record<string, unknown>> {
  return (await request.json().catch(() => ({}))) as Record<string, unknown>;
}

export const onRequest = async (context: FunctionContext): Promise<Response> => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/auth\/?/, '');

  if (request.method === 'POST' && path === 'login') {
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

  if (request.method === 'POST' && path === 'session') {
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

  if (request.method === 'POST' && path === 'logout') {
    return json({ ok: true });
  }

  if (request.method === 'POST' && path === 'online-status') {
    return json({ ok: true });
  }

  return fail('Route auth tidak ditemukan', 404);
};
