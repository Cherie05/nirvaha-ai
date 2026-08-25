'use client';

import React from 'react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden flex flex-col justify-between">
      {/* Background */}
      <Image src="/hero.jpg" alt="Plastic waste across Indian communities" fill sizes="100vw" className="object-cover" priority />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Top Navbar area - brings balance */}
      <div className="relative z-10 flex items-start justify-between p-8">
        <div>
          <h2 className="text-white font-black text-2xl tracking-tighter">NIRVAHA</h2>
          <p className="font-mono-label text-[#10b981] text-[10px] mt-1">AI WASTE AGGREGATION</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="font-mono-label text-white/70 text-[10px] mb-1">TEAM THE TESSERACTIS (TEAM-109)</p>
          <p className="font-mono-label text-white/70 text-[10px]">BUILD WITH AI 2026 · GDG COIMBATORE</p>
        </div>
      </div>

      {/* Main Text - Left aligned, huge, anchored to container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 pb-12 flex flex-col justify-end h-full">
        <h1 className="text-[clamp(3.5rem,9vw,9rem)] font-black leading-[0.95] tracking-tighter text-[#10b981] uppercase">
          SCAN IT,
        </h1>
        <h1 className="text-[clamp(3.5rem,9vw,9rem)] font-black leading-[0.95] tracking-tighter text-white uppercase">
          SORT IT,
        </h1>
        <h1 className="text-[clamp(3.5rem,9vw,9rem)] font-black leading-[0.95] tracking-tighter text-[#10b981] uppercase">
          COLLECT IT.
        </h1>
        
        {/* Supporting description right next to the massive text on desktop */}
        <div className="mt-8 max-w-md border-l-2 border-[#10b981] pl-4">
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            Eliminating the 30-minute sorting barrier for households, restaurants, and neighborhood shops. Identifying 7 resin codes instantly with Gemini AI.
          </p>
        </div>
      </div>
    </section>
  );
}
