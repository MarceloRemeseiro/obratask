'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const publicPaths = ['/login'];
    const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/encargado/');

    if (!isPublicPath && !isAuthenticated()) {
      router.push('/login');
    } else if (isPublicPath && isAuthenticated()) {
      router.push('/');
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  if (isChecking && pathname !== '/login' && !pathname.startsWith('/encargado/')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Cargando...</div>
      </div>
    );
  }

  return <>{children}</>;
}
