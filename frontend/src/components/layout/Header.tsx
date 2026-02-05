'use client';

import { HardHat, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  return (
    <header className="md:hidden sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/" className="flex items-center gap-2">
          <HardHat className="h-6 w-6 text-primary" />
          <span className="font-bold">obraTask</span>
        </Link>
        <div className="flex items-center gap-2">
          {title && (
            <span className="text-sm font-medium truncate max-w-[150px]">
              {title}
            </span>
          )}
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
    </header>
  );
}
