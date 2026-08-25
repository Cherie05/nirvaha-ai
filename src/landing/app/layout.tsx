import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NIRVAHA — Don\'t Toss It, Sort It',
  description: 'AI-powered plastic waste classification and B2B neighborhood logistics. Built at Build with AI 2026.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#e8e4df] text-[#0c0c0c] antialiased selection:bg-[#10b981] selection:text-black">
        {children}
      </body>
    </html>
  );
}
