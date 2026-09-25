'use client';

import Link from 'next/link';
import { Home, Scan, Receipt, Settings } from 'lucide-react';

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-main)] bg-[var(--card-main)] px-4 py-2 flex justify-around items-center z-50">
      <Link href="/" className="flex flex-col items-center gap-1 text-xs text-slate-600 hover:text-emerald-600">
        <Home className="w-5 h-5" />
        <span>Główna</span>
      </Link>
      <Link href="/skanuj" className="flex flex-col items-center gap-1 text-xs text-slate-600 hover:text-emerald-600">
        <Scan className="w-5 h-5" />
        <span>Skanuj</span>
      </Link>
      <Link href="/paragony" className="flex flex-col items-center gap-1 text-xs text-slate-600 hover:text-emerald-600">
        <Receipt className="w-5 h-5" />
        <span>Paragony</span>
      </Link>
      <Link href="/ustawienia" className="flex flex-col items-center gap-1 text-xs text-slate-600 hover:text-emerald-600">
        <Settings className="w-5 h-5" />
        <span>Ustawienia</span>
      </Link>
    </nav>
  );
}