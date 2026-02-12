'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  Calendar,
  Users,
  Home,
  HardHat,
  ClipboardList,
  AlertCircle,
  LogOut,
  Settings,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { revisionApi, encargadosApi, authApi } from '@/lib/api';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/obras', label: 'Obras', icon: Building2 },
  { href: '/revision', label: 'Revision', icon: AlertCircle, showBadge: true },
  { href: '/planificacion', label: 'Planificacion', icon: ClipboardList },
  { href: '/calendario', label: 'Calendario', icon: Calendar },
  { href: '/trabajadores', label: 'Trabajadores', icon: Users },
  { href: '/encargados', label: 'Encargados', icon: HardHat, showEncargadoBadge: true },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [revisionCount, setRevisionCount] = useState(0);
  const [encargadoUnread, setEncargadoUnread] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [counts, unread] = await Promise.all([
          revisionApi.getCounts(),
          encargadosApi.getUnreadCount(),
        ]);
        setRevisionCount(counts.total);
        setEncargadoUnread(unread.total);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-background border-r h-screen fixed left-0 top-0">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <HardHat className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">obraTask</span>
        </Link>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const showBadge = (item as any).showBadge && revisionCount > 0;
            const showEncargadoBadge = (item as any).showEncargadoBadge && encargadoUnread > 0;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {showBadge && (
                    <Badge
                      variant={isActive ? 'secondary' : 'destructive'}
                      className="ml-auto h-5 px-1.5 text-xs"
                    >
                      {revisionCount}
                    </Badge>
                  )}
                  {showEncargadoBadge && (
                    <Badge
                      variant="destructive"
                      className="ml-auto h-5 px-1.5 text-xs"
                    >
                      {encargadoUnread}
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
