'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Plus, Receipt, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';

interface ReceiptItem {
  id: string;
  store_name: string;
  total_amount: number;
  category: string;
  date: string;
  image_url?: string;
}

export default function Dashboard() {
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState<number>(0);

  useEffect(() => {
    fetchReceipts();
  }, []);

  async function fetchReceipts() {
  try {
    setLoading(false);
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Kod błędu Supabase:', error.code, error.message, error.details);
      return;
    }

    if (data) {
      setReceipts(data);
      const total = data.reduce((acc, item) => acc + Number(item.total_amount), 0);
      setTotalSpent(total);
    }
  } catch (err) {
    console.error('Wystąpił wyjątek:', err);
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 pt-6 px-4 max-w-md mx-auto">
      {/* Nagłówek */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mój Koszyk</h1>
          <p className="text-xs text-slate-400">Twoje wydatki pod kontrolą</p>
        </div>
        <Link
          href="/skanuj"
          className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </Link>
      </header>

      {/* Karty podsumowania */}
      <section className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Suma (ostatnie)</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">
            {totalSpent.toFixed(2)} <span className="text-xs font-normal text-slate-400">PLN</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-2">
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <span>Liczba paragonów</span>
          </div>
          <p className="text-xl font-bold text-slate-100">{receipts.length}</p>
        </div>
      </section>

      {/* Szybki przycisk dodawania */}
      <section className="mb-6">
        <Link
          href="/skanuj"
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-semibold text-slate-950 shadow-md hover:opacity-95 transition-all"
        >
          <span className="flex items-center gap-2 text-slate-950 font-bold">
            <Plus className="w-5 h-5" /> Dodaj nowy paragon
          </span>
          <span className="text-xs bg-slate-950/20 px-2.5 py-1 rounded-full text-slate-950">Szybki skan</span>
        </Link>
      </section>

      {/* Ostatnie paragony */}
      <section className="space-y-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-slate-300">Ostatnie paragony</h2>
          <Link href="/paragony" className="text-xs text-emerald-400 hover:underline">
            Zobacz wszystkie
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Ładowanie paragonów...</div>
        ) : receipts.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Brak dodanych paragonów</p>
            <p className="text-xs mt-1">Kliknij przycisk wyżej, aby dodać pierwszy paragon.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {receipts.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-900 border border-slate-800/80 rounded-xl flex justify-between items-center hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-800/80 text-emerald-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100">{item.store_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.date}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-slate-100">
                    {Number(item.total_amount).toFixed(2)} zł
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}