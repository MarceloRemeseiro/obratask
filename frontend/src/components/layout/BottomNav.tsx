'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  Calendar,
  Users,
  Home,
  AlertCircle,
  ClipboardList,
  HardHat,
} from 'lucide-react';
import { revisionApi, encargadosApi } from '@/lib/api';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/obras', label: 'Obras', icon: Building2 },
  { href: '/revision', label: 'Revision', icon: AlertCircle, showBadge: true },
  { href: '/planificacion', label: 'Planif.', icon: ClipboardList },
  { href: '/calendario', label: 'Calendario', icon: Calendar },
  { href: '/trabajadores', label: 'Equipo', icon: Users },
  { href: '/encargados', label: 'Encarg.', icon: HardHat, showEncargadoBadge: true },
];

export function BottomNav() {
  const pathname = usePathname();
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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const showBadge = (item as any).showBadge && revisionCount > 0;
          const showEncargadoBadge = (item as any).showEncargadoBadge && encargadoUnread > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full px-1 text-[10px] relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 mb-0.5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[9px] font-medium rounded-full">
                    {revisionCount > 99 ? '99+' : revisionCount}
                  </span>
                )}
                {showEncargadoBadge && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[9px] font-medium rounded-full">
                    {encargadoUnread > 99 ? '99+' : encargadoUnread}
                  </span>
                )}
              </div>
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
