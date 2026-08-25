import type { Metadata } from 'next';
import { Inter, Space_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-mono',
});

export const metadata: Metadata = {
  title: 'Nirvaha — AI Plastic Aggregation Platform',
  description: 'Eliminating the plastic sorting barrier with Gemini 1.5 Flash. Built during GDG Coimbatore Build With AI 2026.',
  openGraph: {
    title: 'Nirvaha — AI Plastic Aggregation',
    description: 'AI-powered plastic waste aggregation for households and B2B vendors.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${spaceMono.variable}`}>
      <body className="bg-[#e8e4df] text-[#0c0c0c] antialiased selection:bg-[#10b981] selection:text-black font-sans">
        {children}
      </body>
    </html>
  );
}
