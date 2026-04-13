import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import GlobalSearch from '../ui/GlobalSearch';

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const { user } = useAuthStore();
  const { toggleSidebar, toggleDarkMode, isDarkMode } = useUIStore();
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAvatarDropdownOpen(false);
      }
    };

    if (isAvatarDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAvatarDropdownOpen]);

  const handleAvatarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsAvatarDropdownOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-surface/70 bg-bg-card/88 px-4 backdrop-blur-xl sm:px-5 lg:px-8" data-print-hide>
      <div className="flex h-16 items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden rounded-xl p-2 text-text-muted transition-colors hover:bg-slate-100 hover:text-text-primary dark:hover:bg-surface/75"
          aria-label="Toggle sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-text-primary sm:text-base">{title}</h1>
          <p className="hidden text-xs text-text-muted sm:block">Workspace operasional terintegrasi</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Global search */}
          <GlobalSearch />

          {/* NRP display */}
          <span className="hidden rounded-xl border border-surface bg-slate-50 px-2.5 py-1 text-xs text-text-muted sm:block dark:bg-surface/45">
            {user?.nrp}
          </span>

          <button
            className="rounded-xl border border-surface bg-slate-50 p-2 text-text-muted transition-colors hover:text-text-primary dark:bg-surface/45"
            aria-label="Notifikasi"
            title="Notifikasi"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.17V11a6 6 0 1 0-12 0v3.17a2 2 0 0 1-.6 1.43L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9" />
            </svg>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="rounded-xl border border-surface bg-slate-50 p-2 text-text-muted transition-colors hover:text-text-primary dark:bg-surface/45"
            aria-label={isDarkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
          >
            {isDarkMode ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.7.7M5.63 18.37l-.7.7m0-12.74.7.7M18.37 18.37l.7.7M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Avatar dropdown with touch & keyboard support */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
              onKeyDown={handleAvatarKeyDown}
              className="flex items-center gap-2 rounded-xl border border-surface bg-slate-50 px-2 py-1.5 text-left transition-colors hover:bg-slate-100 focus:border-primary focus:bg-blue-50 dark:bg-surface/40 dark:hover:bg-surface/60 dark:focus:bg-primary/10"
              aria-label="Profil pengguna"
              aria-expanded={isAvatarDropdownOpen}
              aria-haspopup="menu"
            >
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                {user?.nama?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="max-w-[120px] truncate text-xs font-medium text-text-primary">{user?.nama}</p>
                <p className="text-[10px] text-text-muted">{user?.role}</p>
              </div>
            </button>
            <div 
              className={`absolute right-0 top-[calc(100%+6px)] w-44 rounded-xl border border-surface bg-bg-card p-2 shadow-lg transition-opacity ${
                isAvatarDropdownOpen 
                  ? 'pointer-events-auto opacity-100' 
                  : 'pointer-events-none opacity-0'
              }`}
              role="menu"
            >
              <p className="px-2 py-1 text-xs text-text-muted">Status</p>
              <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-primary">
                <span className="h-2 w-2 rounded-full bg-success" /> Online
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
