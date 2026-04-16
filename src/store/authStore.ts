import { create } from 'zustand';
import { apiRequest } from '../lib/api/client';
import type { User, KaryoSession } from '../types';

const SESSION_KEY = 'karyo_session';
const CRYPTO_KEY_SESSION = 'karyo_session_key';
const SESSION_DURATION_HOURS = 8;

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (nrp: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateOnlineStatus: (status: boolean) => Promise<void>;
  clearError: () => void;
}

// ── Crypto helpers ───────────────────────────────────────────────

const encodeBase64 = (data: Uint8Array | ArrayBuffer): string => {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  // Use Array.from to avoid spread-operator stack overflow on large buffers
  return btoa(String.fromCharCode(...Array.from(bytes)));
};

const decodeBase64 = (str: string): Uint8Array =>
  Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

const generateAndStoreKey = async (): Promise<CryptoKey> => {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  sessionStorage.setItem(CRYPTO_KEY_SESSION, encodeBase64(new Uint8Array(raw)));
  return key;
};

const loadStoredKey = async (): Promise<CryptoKey | null> => {
  const stored = sessionStorage.getItem(CRYPTO_KEY_SESSION);
  if (!stored) return null;
  try {
    const raw = decodeBase64(stored);
    return await crypto.subtle.importKey(
      'raw',
      raw,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );
  } catch {
    return null;
  }
};

const makeSessionExpiry = (): string => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);
  return expiresAt.toISOString();
};


// The encryption key lives in sessionStorage (tab-scoped, cleared on tab
// close) while the ciphertext lives in localStorage.  An XSS script that
// can only exfiltrate localStorage cannot decrypt the session without also
// obtaining the sessionStorage key from the same tab.

export const saveSession = async (session: KaryoSession): Promise<void> => {
  const key = await generateAndStoreKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(session));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ iv: encodeBase64(iv), data: encodeBase64(new Uint8Array(ciphertext)) }),
  );
};

export const loadSession = async (): Promise<KaryoSession | null> => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const key = await loadStoredKey();
  if (!key) {
    // Key missing (new tab or cleared storage) — treat session as gone
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  try {
    const { iv: ivStr, data: dataStr } = JSON.parse(raw) as { iv: string; data: string };
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decodeBase64(ivStr) },
      key,
      decodeBase64(dataStr),
    );
    const session = JSON.parse(new TextDecoder().decode(decrypted)) as KaryoSession;
    if (new Date(session.expires_at) < new Date()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
};

const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(CRYPTO_KEY_SESSION);
};

interface AuthLoginResponse {
  user: User;
  session: {
    user_id: string;
    role: User['role'];
  };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (nrp: string, pin: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest<AuthLoginResponse>('/auth/login', {
        method: 'POST',
        body: { nrp, pin },
      });

      await saveSession({
        user_id: data.session.user_id,
        role: data.session.role,
        expires_at: makeSessionExpiry(),
      });
      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem. Coba lagi nanti.';
      set({ isLoading: false, error: message, isAuthenticated: false, user: null });
      throw err;
    }
  },

  logout: async () => {
    const { user } = get();
    if (user) {
      await apiRequest<void>('/auth/logout', {
        method: 'POST',
        body: { user_id: user.id },
      });
    }
    clearSession();
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    const session = await loadSession();
    if (!session) {
      set({ isLoading: false, isInitialized: true });
      return;
    }
    try {
      const user = await apiRequest<User>('/auth/session', {
        method: 'POST',
        body: {
          user_id: session.user_id,
          role: session.role,
        },
      });
      set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
    } catch {
      clearSession();
      set({ isLoading: false, isInitialized: true });
    }
  },

  updateOnlineStatus: async (status: boolean) => {
    const { user } = get();
    if (!user) return;
    await apiRequest<void>('/auth/online-status', {
      method: 'POST',
      body: {
        user_id: user.id,
        is_online: status,
      },
    });
    set({ user: { ...user, is_online: status } });
  },
}));
