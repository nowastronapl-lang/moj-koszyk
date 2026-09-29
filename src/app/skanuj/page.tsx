'use client';

import { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper do kompresji zdjęcia z telefonu (zmniejsza 15MB pliki z aparatu do max 1600px)
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1600;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataUrl.split(',')[1]);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
}

export default function SkanujPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [storeName, setStoreName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [category, setCategory] = useState('Spożywcze');
  const [date, setDate] = useState('');

  useEffect(() => {
    setErrorMsg(null);
    setAnalyzing(false);
  }, []);

  const processImageWithAI = async (file: File) => {
    setAnalyzing(true);
    setErrorMsg(null);

    try {
      if (!apiKey) {
        throw new Error('Brak klucza API! Upewnij się, że NEXT_PUBLIC_GEMINI_API_KEY jest ustawiony na GitHub Actions.');
      }

      // Kompresja pliku przed wysłaniem do Gemini API
      const base64Data = await compressImage(file);

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
          'Przeanalizuj to zdjęcie paragonu i wyciągnij: 1. Nazwę sklepu (store_name), 2. Łączną kwotę do zapłaty jako liczbę (total_amount), 3. Datę w formacie YYYY-MM-DD (date), 4. Dopasowaną kategorię (category) z listy: [Spożywcze, Dom i Ogród, Elektronika, Odzież, Paliwo / Transport, Zdrowie i Uroda, Rozrywka, Inne]. Odpowiedz WYŁĄCZNIE czystym JSON-em.',
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              store_name: { type: Type.STRING },
              total_amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ['store_name', 'total_amount', 'date', 'category'],
          },
        },
      });

      const jsonText = response.text;
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        
        setStoreName(parsed.store_name || '');
        setTotalAmount(parsed.total_amount ? String(parsed.total_amount) : '');
        setCategory(parsed.category || 'Spożywcze');
        setDate(parsed.date || new Date().toISOString().split('T')[0]);
      }
    } catch (err: any) {
      console.error('Błąd analizy Gemini:', err);
      if (err?.message?.includes('Brak klucza API')) {
        setErrorMsg(err.message);
      } else if (err?.status === 429 || err?.message?.includes('429')) {
        setErrorMsg('Zbyt wiele zapytań naraz (Limit AI). Odczekaj chwilę i spróbuj ponownie.');
      } else {
        setErrorMsg('Błąd podczas odczytywania paragonu. Spróbuj zrobić wyraźniejsze zdjęcie.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(URL.createObjectURL(file));

    processImageWithAI(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Zapisano wydatek:', { storeName, totalAmount, category, date });
    alert('Wydatek został zapisany!');
  };

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Skanuj Paragon</h1>

      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors">
        <label className="cursor-pointer flex flex-col items-center justify-center space-y-2">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Zrób zdjęcie lub wybierz plik z galerii
          </span>
          {/* Usunięto capture="environment", żeby działała galeria oraz aparat */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
      </div>

      {imagePreview && (
        <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <img src={imagePreview} alt="Podgląd paragonu" className="w-full h-full object-contain" />
        </div>
      )}

      {analyzing && (
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center space-x-3">
          <svg className="animate-spin h-5 w-5 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium">Sztuczna inteligencja analizuje paragon...</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nazwa sklepu</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="np. Biedronka, Lidl"
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kwota (zł)</label>
          <input
            type="number"
            step="0.01"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="0.00"
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="Spożywcze">Spożywcze</option>
            <option value="Dom i Ogród">Dom i Ogród</option>
            <option value="Elektronika">Elektronika</option>
            <option value="Odzież">Odzież</option>
            <option value="Paliwo / Transport">Paliwo / Transport</option>
            <option value="Zdrowie i Uroda">Zdrowie i Uroda</option>
            <option value="Rozrywka">Rozrywka</option>
            <option value="Inne">Inne</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={analyzing}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50"
        >
          Zapisz wydatek
        </button>
      </form>
    </main>
  );
}