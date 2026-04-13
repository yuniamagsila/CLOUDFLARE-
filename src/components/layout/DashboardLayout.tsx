import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Notification from '../common/Notification';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-military-dark overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
      <Notification />
    </div>
  );
}
