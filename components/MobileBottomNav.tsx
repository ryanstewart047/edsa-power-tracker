'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Zap, ShieldCheck } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Show the global bottom nav on auth pages (like /admin/login)
  // Hide it on the protected admin dashboards (/admin, /admin/manage) to prevent UI conflicts
  const isProtectedAdminRoute = pathname === '/admin' || pathname?.startsWith('/admin/manage');

  if (isProtectedAdminRoute) return null;

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Tracker', href: '/tracker', icon: Map },
    { name: 'Meter Top-Up', href: '/topup', icon: Zap },
    { name: 'Admin', href: '/admin', icon: ShieldCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[360px] md:max-w-md z-50 pb-safe">
      <div className="flex justify-around items-center bg-[#020305]/95 backdrop-blur-2xl border-t md:border border-white/10 md:rounded-2xl px-4 py-2.5 md:py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] md:shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
        {navItems.map((item) => {
          // Exact match for Home, prefix match for others
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center px-4 py-1 space-y-1 transition-all ${
                isActive ? 'text-yellow-400 font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <item.icon strokeWidth={2.5} className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : ''}`} />
              <span className="text-[10px] md:text-[11px] font-bold tracking-wider uppercase">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
