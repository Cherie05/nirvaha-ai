'use client';

import React from 'react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative w-full h-[90vh] min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <Image
        src="/hero.jpg"
        alt="Plastic waste in India"
        fill
        className="object-cover"
        priority
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Bottom-left small label */}
      <div className="absolute bottom-8 left-8 z-10">
        <p className="font-mono-label text-white/70 text-xs">
          PLASTIC WASTE<br />LOGISTICS<br />ENGINE
        </p>
      </div>

      {/* Main hero text — massive, overlaid at bottom */}
      <div className="absolute bottom-8 right-8 left-[30%] z-10">
        <h1 className="text-[clamp(2.5rem,7vw,7rem)] font-black leading-[0.95] tracking-tighter text-[#10b981] uppercase">
          DON'T TOSS IT,<br />SORT IT
        </h1>
      </div>

      {/* Bottom bar — BKKDW has a credits/date bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-3 border-t border-white/20">
        <p className="font-mono-label text-white/60 text-[10px]">
          DESIGNED AND BUILT BY TEAM THE TESSERACTIS
        </p>
        <p className="font-mono-label text-white/60 text-[10px]">
          BUILD WITH AI 2026 · GDG COIMBATORE · TiE KOVAICON
        </p>
        <p className="font-mono-label text-white/60 text-[10px]">
          36-HOUR HACKATHON · SUSTAINABLE CITIES TRACK
        </p>
      </div>
    </section>
  );
}
