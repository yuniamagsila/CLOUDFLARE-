import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-10 h-14 bg-bg-card/80 backdrop-blur-md border-b border-surface flex items-center px-4 gap-4">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
        aria-label="Toggle sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="flex-1 text-base font-semibold text-text-primary">{title}</h1>

      <div className="flex items-center gap-3">
        {/* NRP display */}
        <span className="hidden sm:block font-mono text-xs text-text-muted bg-surface px-2 py-1 rounded">
          {user?.nrp}
        </span>
        {/* Online indicator */}
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="hidden sm:block text-xs text-text-muted">Online</span>
        </div>
      </div>
    </header>
  );
}
