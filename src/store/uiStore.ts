import { create } from 'zustand';

type NotificationType = 'success' | 'error' | 'info' | 'warning';
type DisplayDensity = 'comfortable' | 'compact';

const NOTIFICATION_DURATION_MS = 4000;
const DARK_MODE_KEY = 'karyo_dark_mode';
const SIDEBAR_OPEN_KEY = 'karyo_sidebar_open';
const NOTIFICATIONS_ENABLED_KEY = 'karyo_notifications_enabled';
const DISPLAY_DENSITY_KEY = 'karyo_display_density';
const DASHBOARD_AUTO_REFRESH_ENABLED_KEY = 'karyo_dashboard_auto_refresh_enabled';
const DASHBOARD_AUTO_REFRESH_MINUTES_KEY = 'karyo_dashboard_auto_refresh_minutes';

interface Notification {
  message: string;
  type: NotificationType;
}

interface UIStore {
  isDarkMode: boolean;
  sidebarOpen: boolean;
  notificationsEnabled: boolean;
  displayDensity: DisplayDensity;
  dashboardAutoRefreshEnabled: boolean;
  dashboardAutoRefreshMinutes: number;
  notification: Notification | null;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setDisplayDensity: (density: DisplayDensity) => void;
  toggleDisplayDensity: () => void;
  setDashboardAutoRefreshEnabled: (enabled: boolean) => void;
  setDashboardAutoRefreshMinutes: (minutes: number) => void;
  showNotification: (message: string, type: NotificationType) => void;
  clearNotification: () => void;
}

const loadBoolean = (key: string, fallback: boolean): boolean => {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    return stored === 'true';
  } catch {
    return fallback;
  }
};

const loadNumber = (key: string, fallback: number): number => {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    const parsed = Number(stored);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const loadDarkMode = (): boolean => loadBoolean(DARK_MODE_KEY, true);
const loadSidebarOpen = (): boolean => loadBoolean(SIDEBAR_OPEN_KEY, true);
const loadNotificationsEnabled = (): boolean => loadBoolean(NOTIFICATIONS_ENABLED_KEY, true);
const loadDisplayDensity = (): DisplayDensity => {
  try {
    const stored = localStorage.getItem(DISPLAY_DENSITY_KEY);
    return stored === 'compact' ? 'compact' : 'comfortable';
  } catch {
    return 'comfortable';
  }
};
const loadDashboardAutoRefreshEnabled = (): boolean => loadBoolean(DASHBOARD_AUTO_REFRESH_ENABLED_KEY, true);
const loadDashboardAutoRefreshMinutes = (): number => loadNumber(DASHBOARD_AUTO_REFRESH_MINUTES_KEY, 3);

const savePreference = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
};

const applyTheme = (isDark: boolean) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
};

const applyDensity = (density: DisplayDensity) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.density = density;
};

export const useUIStore = create<UIStore>((set) => ({
  isDarkMode: loadDarkMode(),
  sidebarOpen: loadSidebarOpen(),
  notificationsEnabled: loadNotificationsEnabled(),
  displayDensity: loadDisplayDensity(),
  dashboardAutoRefreshEnabled: loadDashboardAutoRefreshEnabled(),
  dashboardAutoRefreshMinutes: loadDashboardAutoRefreshMinutes(),
  notification: null,

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode;
      savePreference(DARK_MODE_KEY, String(next));
      applyTheme(next);
      return { isDarkMode: next };
    }),

  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarOpen;
      savePreference(SIDEBAR_OPEN_KEY, String(next));
      return { sidebarOpen: next };
    }),

  setSidebarOpen: (open: boolean) => {
    savePreference(SIDEBAR_OPEN_KEY, String(open));
    set({ sidebarOpen: open });
  },

  setNotificationsEnabled: (enabled: boolean) => {
    savePreference(NOTIFICATIONS_ENABLED_KEY, String(enabled));
    set({ notificationsEnabled: enabled });
  },

  setDisplayDensity: (density: DisplayDensity) => {
    savePreference(DISPLAY_DENSITY_KEY, density);
    applyDensity(density);
    set({ displayDensity: density });
  },

  toggleDisplayDensity: () =>
    set((state) => {
      const next = state.displayDensity === 'compact' ? 'comfortable' : 'compact';
      savePreference(DISPLAY_DENSITY_KEY, next);
      applyDensity(next);
      return { displayDensity: next };
    }),

  setDashboardAutoRefreshEnabled: (enabled: boolean) => {
    savePreference(DASHBOARD_AUTO_REFRESH_ENABLED_KEY, String(enabled));
    set({ dashboardAutoRefreshEnabled: enabled });
  },

  setDashboardAutoRefreshMinutes: (minutes: number) => {
    const next = Math.max(1, Math.min(60, Math.round(minutes)));
    savePreference(DASHBOARD_AUTO_REFRESH_MINUTES_KEY, String(next));
    set({ dashboardAutoRefreshMinutes: next });
  },

  showNotification: (message: string, type: NotificationType) => {
    set({ notification: { message, type } });
    setTimeout(() => set({ notification: null }), NOTIFICATION_DURATION_MS);
  },

  clearNotification: () => set({ notification: null }),
}));

// Apply theme on module load (before first render)
applyTheme(loadDarkMode());
applyDensity(loadDisplayDensity());
