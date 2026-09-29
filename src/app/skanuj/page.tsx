'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
// @ts-ignore
import { GoogleGenerativeAI } from '@google/generative-ai';

// Kompresja obrazu przed wysłaniem do Gemini API
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Zwraca Base64 (JPEG, jakość 0.7)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function SkanujPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError('Brak klucza API! Upewnij się, że NEXT_PUBLIC_GEMINI_API_KEY jest ustawiony na GitHub Actions.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base64Image = await compressImage(file);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Przeanalizuj ten paragon i zwróć WYŁĄCZNIE prawidłowy obiekt JSON bez żadnego formatowania markdown (bez \`\`\`json).
Format JSON:
{
  "sklep": "Nazwa sklepu",
  "data": "YYYY-MM-DD",
  "suma": 0.00,
  "kategoria": "Jedzenie" | "Transport" | "Dom" | "Rozrywka" | "Inne"
}`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
          },
        },
      ]);

      const responseText = result.response.text().trim();
      const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanedJson);

      // Zapisujemy odczytany paragon do localStorage lub przechodzimy dalej
      const existingReceipts = JSON.parse(localStorage.getItem('paragony') || '[]');
      const newReceipt = {
        id: Date.now().toString(),
        ...parsedData,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('paragony', JSON.stringify([newReceipt, ...existingReceipts]));

      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError('Nie udało się odczytać paragonu. Upewnij się, że zdjęcie jest wyraźne.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col justify-between max-w-md mx-auto">
      {/* Ukryte inputy do przechwytywania zdjęć */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <header className="py-4">
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white transition flex items-center gap-2"
        >
          ← Wróć
        </button>
        <h1 className="text-2xl font-bold mt-4">Zeskanuj paragon</h1>
        <p className="text-slate-400 text-sm">Zrób zdjęcie lub wybierz plik z galerii, a AI przeanalizuje dane.</p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 my-8">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-indigo-400 font-medium text-center">AI analizuje paragon...</p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition rounded-2xl font-semibold flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/25"
            >
              📷 Zrób zdjęcie aparatem
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 active:scale-95 transition rounded-2xl font-medium text-slate-200 border border-slate-700 flex items-center justify-center gap-3"
            >
              🖼️ Wybierz z galerii
            </button>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-500 pb-4">
        System automatycznie wykryje sklep, datę, kwotę i kategorię.
      </footer>
    </div>
  );
}