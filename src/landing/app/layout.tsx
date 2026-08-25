import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nirvaha — AI Plastic Waste Aggregation & B2B Logistics Platform',
  description: 'Turning unsorted household plastic into economic B2B pickup routes. Built at Build with AI 2026.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#060e0a] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
