'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Szybka kompresja zdjęcia na canvasie do max 1024px (stabilność na telefonach)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX) {
          height *= MAX / width;
          width = MAX;
        } else if (height > MAX) {
          width *= MAX / height;
          height = MAX;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function SkanujPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dane odczytane przez AI – do ewentualnej edycji przez użytkownika
  const [formData, setFormData] = useState<{
    sklep: string;
    kwota: string;
    data: string;
    kategoria: string;
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError('Brak klucza API Gemini! Upewnij się, że dodano go w GitHub Secrets.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base64Image = await compressImage(file);

      // Bezpośrednie wywołanie Gemini REST API (działa niezawodnie na GitHub Pages)
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64Image,
                    },
                  },
                  {
                    text: `Odczytaj dane z tego paragonu i zwróć WYŁĄCZNIE czysty JSON w formacie:
{
  "sklep": "Nazwa sklepu",
  "kwota": "0.00",
  "data": "YYYY-MM-DD",
  "kategoria": "Spożywcze"
}
Dostępne kategorie: Spożywcze, Dom, Transport, Odzież, Elektronika, Inne. Zwróć sam JSON, bez opisu ani znaków markdown.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(cleanJson);

      setFormData({
        sklep: parsed.sklep || '',
        kwota: parsed.kwota ? String(parsed.kwota) : '',
        data: parsed.data || new Date().toISOString().split('T')[0],
        kategoria: parsed.kategoria || 'Spożywcze',
      });
    } catch (err) {
      console.error(err);
      setError('Nie udało się odczytać paragonu. Wybierz inne zdjęcie lub uzupełnij dane ręcznie.');
      // W razie błędu dajemy czysty formularz do wpisania
      setFormData({ sklep: '', kwota: '', data: new Date().toISOString().split('T')[0], kategoria: 'Spożywcze' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Zapis do localStorage
    const existing = JSON.parse(localStorage.getItem('paragony') || '[]');
    const newReceipt = { id: Date.now().toString(), ...formData };
    localStorage.setItem('paragony', JSON.stringify([newReceipt, ...existing]));

    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col justify-center">
      {/* UKRYTY INPUT - działa na aparacie i galerii bez blokowania */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!formData && !loading && (
        <div className="text-center space-y-6">
          <h1 className="text-2xl font-bold">Mój Koszyk</h1>
          <p className="text-slate-400 text-sm">Zrób zdjęcie lub wgraj paragon z telefonu – AI sama wyciągnie dane.</p>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-xs rounded-xl">{error}</div>}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-3"
          >
            📷 Wybierz / Zrób zdjęcie
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-indigo-400 font-medium animate-pulse">Skanowanie i odczytywanie danych...</p>
        </div>
      )}

      {/* WIDOK PO SKANOWANIU: Wypełnione dane do ew. szybkiej korekty */}
      {formData && !loading && (
        <form onSubmit={handleSave} className="space-y-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            ✓ Odczytano dane z paragonu
          </h2>
          <p className="text-xs text-slate-400 mb-4">Sprawdź czy wszystko się zgadza. Możesz edytować dowolne pole.</p>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Sklep</label>
            <input
              type="text"
              value={formData.sklep}
              onChange={(e) => setFormData({ ...formData, sklep: e.target.value })}
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Kwota (zł)</label>
            <input
              type="number"
              step="0.01"
              value={formData.kwota}
              onChange={(e) => setFormData({ ...formData, kwota: e.target.value })}
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Kategoria</label>
            <select
              value={formData.kategoria}
              onChange={(e) => setFormData({ ...formData, kategoria: e.target.value })}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500"
            >
              <option value="Spożywcze">Spożywcze</option>
              <option value="Dom">Dom</option>
              <option value="Transport">Transport</option>
              <option value="Odzież">Odzież</option>
              <option value="Elektronika">Elektronika</option>
              <option value="Inne">Inne</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Data</label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFormData(null)}
              className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-sm font-medium"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white text-sm shadow-lg shadow-indigo-500/25"
            >
              Zapisz wydatek
            </button>
          </div>
        </form>
      )}
    </div>
  );
}