'use client';

import React from 'react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative w-full h-[90vh] min-h-[600px] overflow-hidden">
      <Image src="/hero.jpg" alt="Plastic waste across Indian communities" fill sizes="100vw" className="object-cover" priority />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      <div className="absolute bottom-8 left-8 z-10">
        <p className="font-mono-label text-white/70 text-xs">
          NIRVAHA<br/>AI PLASTIC<br/>AGGREGATION
        </p>
      </div>

      <div className="absolute bottom-8 right-8 left-[30%] z-10">
        <h1 className="text-[clamp(2.5rem,7vw,7rem)] font-black leading-[0.95] tracking-tighter text-[#c5e017] uppercase">
          SCAN IT,<br/>SORT IT,<br/>COLLECT IT
        </h1>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-3 border-t border-white/20">
        <p className="font-mono-label text-white/60 text-[10px]">
          TEAM THE TESSERACTIS · TEAM-109
        </p>
        <p className="font-mono-label text-white/60 text-[10px]">
          BUILD WITH AI 2026 · GDG COIMBATORE
        </p>
        <p className="font-mono-label text-white/60 text-[10px]">
          SUSTAINABLE CITIES TRACK
        </p>
      </div>
    </section>
  );
}
