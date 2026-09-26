'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { GoogleGenAI, Type } from '@google/genai';
import { Camera, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export default function ScanPage() {
  const router = useRouter();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [storeName, setStoreName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [category, setCategory] = useState('Spożywcze');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Konwersja pliku do formatu Base64 dla Gemini API
  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  // Automatyczny odczyt z Gemini API
  const processImageWithAI = async (file: File) => {
    setAnalyzing(true);
    setErrorMsg(null);

    try {
      if (!apiKey) {
        throw new Error('Brak klucza NEXT_PUBLIC_GEMINI_API_KEY w pliku .env.local');
      }

      const imagePart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash', // <-- Aktualny model wskazany przez Gemini API
        contents: [
          imagePart,
          'Przeanalizuj to zdjęcie paragonu i wyciągnij: 1. Nazwę sklepu, 2. Łączną kwotę do zapłaty (total_amount jako liczba), 3. Datę w formacie YYYY-MM-DD, 4. Dopasowaną kategorię z listy: [Spożywcze, Dom i Ogród, Elektronika, Odzież, Paliwo / Transport, Zdrowie i Uroda, Rozrywka, Inne]. Odpowiedz WYŁĄCZNIE czystym obiektem JSON.',
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
      setErrorMsg('Nie udało się automatycznie odczytać paragonu. Możesz uzupełnić dane ręcznie.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      processImageWithAI(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !totalAmount) return;

    try {
      setLoading(true);
      let imageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, imageFile);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);
          imageUrl = publicUrlData.publicUrl;
        }
      }

      await supabase.from('receipts').insert([
        {
          store_name: storeName,
          total_amount: parseFloat(totalAmount.replace(',', '.')),
          category,
          date,
          image_url: imageUrl || null,
        },
      ]);

      setSuccess(true);
      setTimeout(() => router.push('/'), 1200);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 pt-6 px-4 max-w-md mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/" className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            Automatyczny Skaner <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-xs text-slate-400">Zrób zdjęcie, a AI odczyta paragon</p>
        </div>
      </header>

      {/* Wybór/Zdjęcie Paragonu */}
      <div className="mb-6">
        <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/50 bg-emerald-950/20 hover:bg-emerald-950/40 rounded-3xl p-8 text-center transition-all">
          <div className="p-4 bg-emerald-500 text-slate-950 rounded-full mb-3 shadow-lg shadow-emerald-500/20">
            <Camera className="w-8 h-8" />
          </div>
          <span className="text-base font-bold text-slate-100">Zrób zdjęcie paragonu</span>
          <span className="text-xs text-slate-400 mt-1">AI automatycznie wyciągnie sumę, sklep i datę</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Pasek postępu analizy AI */}
      {analyzing && (
        <div className="p-4 mb-6 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300 flex items-center gap-3 animate-pulse">
          <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
          <div>
            <p className="font-semibold text-sm">Analizowanie przez Gemini AI...</p>
            <p className="text-xs opacity-80">Odczytywanie kwoty, nazwy sklepu i daty</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 mb-6 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Podgląd i szybkie zatwierdzenie */}
      {storeName && !analyzing && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> AI Odczytało dane:
            </span>
            {imagePreview && (
              <img src={imagePreview} alt="Paragon" className="w-10 h-10 object-cover rounded-lg" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[10px] text-slate-400 block">Sklep</span>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-medium text-sm"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Kwota (PLN)</span>
              <input
                type="text"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-emerald-400 font-bold text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[10px] text-slate-400 block">Data</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Kategoria</span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Zatwierdź i Zapisz'}
          </button>
        </form>
      )}
    </div>
  );
}