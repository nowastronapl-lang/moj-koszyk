import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/layout/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mój Koszyk',
  description: 'Osobista pamięć zakupowa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className={`${inter.className} bg-bg-light text-txt-primary-light antialiased`}>
        <div className="min-h-screen flex flex-col lg:flex-row">
          <Navigation />
          <div className="flex-1 lg:pl-64">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}