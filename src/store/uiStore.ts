import { create } from 'zustand';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  message: string;
  type: NotificationType;
}

interface UIStore {
  isDarkMode: boolean;
  sidebarOpen: boolean;
  notification: Notification | null;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  showNotification: (message: string, type: NotificationType) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isDarkMode: true,
  sidebarOpen: true,
  notification: null,

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  showNotification: (message: string, type: NotificationType) => {
    set({ notification: { message, type } });
    setTimeout(() => set({ notification: null }), 4000);
  },

  clearNotification: () => set({ notification: null }),
}));
