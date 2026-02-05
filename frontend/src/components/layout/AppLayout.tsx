'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className="md:ml-64 pb-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] md:pb-0">
        <div className="p-4 md:p-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
