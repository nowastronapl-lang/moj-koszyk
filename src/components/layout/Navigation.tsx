'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Receipt, Settings } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Główna', icon: Home },
    { href: '/skanuj/', label: 'Dodaj', icon: PlusCircle },
    { href: '/paragony/', label: 'Paragony', icon: Receipt },
    { href: '/ustawienia/', label: 'Ustawienia', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-t border-slate-800">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}