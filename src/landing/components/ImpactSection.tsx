'use client';
import React from 'react';

export default function ImpactSection() {
  return (
    <section className="bg-[#10b981] py-24 px-8 border-t-4 border-black">
      <div className="max-w-7xl mx-auto text-black">
        <p className="font-mono-label mb-6">PROJECTED ENVIRONMENTAL IMPACT</p>
        <h2 className="text-[clamp(2rem,4vw,4.5rem)] font-black leading-[1.0] tracking-tighter uppercase mb-16 max-w-4xl">
          WHAT HAPPENS WHEN 100 USERS JOIN A NEIGHBORHOOD CLUSTER?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 border-t border-black/20 pt-8">
          <div>
            <p className="text-5xl font-black mb-2">2,400*<span className="text-2xl">KG</span></p>
            <p className="font-mono-label text-black/70 text-xs">PLASTIC DIVERTED FROM LANDFILLS MONTHLY</p>
          </div>
          <div>
            <p className="text-5xl font-black mb-2">3.6<span className="text-2xl">TONS*</span></p>
            <p className="font-mono-label text-black/70 text-xs">CO₂ EMISSIONS PREVENTED MONTHLY</p>
          </div>
          <div>
            <p className="text-5xl font-black mb-2">39<span className="text-2xl">BARRELS*</span></p>
            <p className="font-mono-label text-black/70 text-xs">OF CRUDE OIL CONSERVED MONTHLY</p>
          </div>
        </div>

        <div className="mt-6 text-right">
          <p className="font-mono-label text-black/50 text-[10px]">*ESTIMATES BASED ON 24KG PLASTIC/USER/MONTH. RECYCLING 1 TON OF PLASTIC SAVES ~1.5 TONS CO₂ AND 16.3 BARRELS OF OIL.</p>
        </div>
      </div>
    </section>
  );
}
