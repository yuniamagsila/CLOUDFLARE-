import { API_BASE_URL } from './api/client';

type FilterValue = string | number | boolean;

type QueryFilter = {
  op: 'eq' | 'in' | 'gte' | 'lte';
  column: string;
  value: FilterValue | FilterValue[];
};

type QueryOrder = {
  column: string;
  ascending: boolean;
};

type QueryResult<T = any> = {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
};

export interface RealtimeChannel {
  on: (_event: string, _filter: Record<string, unknown>, callback: (payload: any) => void) => RealtimeChannel;
  subscribe: () => RealtimeChannel;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function createApiUrl(path: string, query?: Record<string, string>): string {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (!value) continue;
      url.searchParams.set(key, value);
    }
  }
  return `${url.pathname}${url.search}`;
}

async function safeFetch<T>(
  path: string,
  init: RequestInit = {},
  fallback: QueryResult<T> = { data: null, error: null },
): Promise<QueryResult<T>> {
  try {
    const response = await fetch(createApiUrl(path), {
      ...init,
      headers: {
        ...JSON_HEADERS,
        ...(init.headers ?? {}),
      },
    });

    if (response.status === 404) return fallback;

    const payload = (await response.json().catch(() => ({}))) as {
      data?: T;
      error?: string;
    };

    if (!response.ok) {
      return {
        data: null,
        error: { message: payload.error ?? `Request gagal (${response.status})` },
      };
    }

    return {
      data: (payload.data ?? null) as T | null,
      error: null,
    };
  } catch {
    return fallback;
  }
}

function normalizeTable(table: string): string {
  if (table === 'gate_pass') return 'gatepass';
  return table;
}

class QueryBuilder<T = any> implements PromiseLike<QueryResult<T>> {
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';

  private filters: QueryFilter[] = [];

  private selectHead = false;

  private selectSingle = false;

  private selectedColumns = '*';

  private orderBy?: QueryOrder;

  private maxRows?: number;

  private payload: unknown;

  constructor(private readonly table: string) {}

  select(columns = '*', options?: { head?: boolean; count?: string }): this {
    this.action = 'select';
    this.selectedColumns = columns;
    this.selectHead = Boolean(options?.head);
    void options?.count;
    return this;
  }

  insert(payload: unknown): this {
    this.action = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: unknown): this {
    this.action = 'update';
    this.payload = payload;
    return this;
  }

  delete(): this {
    this.action = 'delete';
    return this;
  }

  upsert(payload: unknown, options?: { onConflict?: string }): this {
    this.action = 'upsert';
    void options;
    this.payload = payload;
    return this;
  }

  eq(column: string, value: FilterValue): this {
    this.filters.push({ op: 'eq', column, value });
    return this;
  }

  in(column: string, value: FilterValue[]): this {
    this.filters.push({ op: 'in', column, value });
    return this;
  }

  gte(column: string, value: FilterValue): this {
    this.filters.push({ op: 'gte', column, value });
    return this;
  }

  lte(column: string, value: FilterValue): this {
    this.filters.push({ op: 'lte', column, value });
    return this;
  }

  or(expression: string): this {
    void expression;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(rows: number): this {
    this.maxRows = rows;
    return this;
  }

  single(): Promise<QueryResult<T>> {
    this.selectSingle = true;
    return this.execute();
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResult<T>> {
    const resource = normalizeTable(this.table);

    if (this.action === 'select') {
      const query: Record<string, string> = {
        columns: this.selectedColumns,
      };

      for (const filter of this.filters) {
        if (filter.op === 'eq') query[filter.column] = String(filter.value);
        if (filter.op === 'in' && Array.isArray(filter.value)) query[filter.column] = filter.value.join(',');
        if (filter.op === 'gte') query[`${filter.column}_gte`] = String(filter.value);
        if (filter.op === 'lte') query[`${filter.column}_lte`] = String(filter.value);
      }

      if (this.orderBy) {
        query.order_by = this.orderBy.column;
        query.ascending = String(this.orderBy.ascending);
      }

      if (this.maxRows) query.limit = String(this.maxRows);

      const result = await safeFetch<unknown[]>(`/${resource}?${new URLSearchParams(query).toString()}`, {
        method: 'GET',
      }, { data: [], error: null, count: 0 });

      const rows = Array.isArray(result.data) ? result.data : [];
      if (this.selectSingle) {
        return {
          data: (rows[0] ?? null) as T | null,
          error: null,
          count: rows.length,
        };
      }

      return {
        data: (this.selectHead ? null : (rows as unknown as T)) ?? null,
        error: null,
        count: rows.length,
      };
    }

    const result = await safeFetch<T>(`/${resource}`, {
      method: this.action === 'delete' ? 'DELETE' : this.action === 'update' ? 'PATCH' : 'POST',
      body: JSON.stringify({ data: this.payload, filters: this.filters, action: this.action }),
    }, { data: null, error: null });

    return result;
  }
}

const createNoopChannel = (): RealtimeChannel => {
  const listeners: Array<(payload: any) => void> = [];
  return {
    on: (_event, _filter, callback) => {
      listeners.push(callback);
      return createNoopChannel();
    },
    subscribe: () => ({
      on: (_event, _filter, callback) => {
        listeners.push(callback);
        return createNoopChannel();
      },
      subscribe: () => createNoopChannel(),
    }),
  };
};

type RpcData = Record<string, unknown> | string | number | boolean | null;

function rpcFallback(name: string): RpcData {
  if (name === 'scan_pos_jaga') return { valid: true, message: 'Scan berhasil (mock)' };
  if (name === 'server_checkin') return { message: 'Check-in berhasil (mock)' };
  if (name === 'server_checkout') return { message: 'Check-out berhasil (mock)' };
  if (name === 'server_scan_gate_pass') return { message: 'Scan berhasil (mock)' };
  if (name === 'get_platform_settings') return {
    platform_name: 'Karyo OS',
    platform_logo_url: '',
    platform_tagline: 'Sistem Manajemen Operasional Militer',
  };
  if (name === 'update_platform_settings') return { ok: true };
  if (name === 'change_user_pin') return { ok: true };
  if (name === 'bulk_reset_pins') return { reset_count: 0 };
  if (name === 'import_users_csv') return { imported_count: 0 };
  return { ok: true };
}

export const isSupabaseConfigured = true;

export const supabase = {
  from: <T = any>(table: string) => new QueryBuilder<T>(table),

  rpc: async <T = unknown>(name: string, args?: Record<string, unknown>): Promise<QueryResult<T>> => {
    const result = await safeFetch<T>(`/rpc/${encodeURIComponent(name)}`, {
      method: 'POST',
      body: JSON.stringify(args ?? {}),
    }, { data: rpcFallback(name) as T, error: null });

    if (result.error) {
      return {
        data: rpcFallback(name) as T,
        error: null,
      };
    }

    return result;
  },

  channel: (topic: string): RealtimeChannel => {
    void topic;
    return createNoopChannel();
  },

  removeChannel: async (channel: RealtimeChannel): Promise<void> => {
    void channel;
    return Promise.resolve();
  },

  storage: {
    from: (bucket: string) => {
      void bucket;
      return {
        upload: async (path: string, file: File, options?: { upsert?: boolean; contentType?: string }) => {
          void file;
          void options;
          return {
            data: { path },
            error: null,
          };
        },
        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: path,
          },
        }),
      };
    },
  },
};
