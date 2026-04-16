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

export const onRequest = async ({ request, env }: FunctionContext): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/gatepass\/?/, '');
  const segments = path ? path.split('/') : [];

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
      const query = `SELECT id, user_id, keperluan, tujuan, waktu_keluar, waktu_kembali, actual_keluar, actual_kembali, status, approved_by, qr_token, created_at FROM gatepass ${whereSql} ORDER BY created_at DESC`;
      const result = await env.DB.prepare(query).bind(...params).all();
      const rows = ((result as { results?: unknown[] })?.results ?? []) as Record<string, unknown>[];
      return json(rows);
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

    return json({ ok: true }, 201);
  }

  if (request.method === 'PATCH' && segments.length === 2 && segments[1] === 'status') {
    return json({ ok: true });
  }

  if (request.method === 'POST' && segments.length === 1 && segments[0] === 'scan') {
    return json({ message: 'Scan berhasil (placeholder)' });
  }

  return fail('Route gatepass tidak ditemukan', 404);
};
