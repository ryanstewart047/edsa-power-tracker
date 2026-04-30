'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, ShieldCheck } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Show the global bottom nav on auth pages (like /admin/login)
  // Hide it on the protected admin dashboards (/admin, /admin/manage) to prevent UI conflicts
  const isProtectedAdminRoute = pathname === '/admin' || pathname?.startsWith('/admin/manage');

  if (isProtectedAdminRoute) return null;

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Tracker', href: '/tracker', icon: Map },
    { name: 'Admin', href: '/admin', icon: ShieldCheck },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      <div className="flex justify-around items-center bg-[#020305]/90 backdrop-blur-xl border-t border-white/10 px-2 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          // Exact match for Home, prefix match for others
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full space-y-1.5 transition-all ${
                isActive ? 'text-yellow-400 scale-110' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <item.icon strokeWidth={2.5} className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : ''}`} />
              <span className="text-[9px] font-bold tracking-widest uppercase">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
