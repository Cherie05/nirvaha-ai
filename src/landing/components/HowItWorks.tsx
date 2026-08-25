'use client';

import React from 'react';
import Image from 'next/image';

const STEPS = [
  {
    label: 'SCAN',
    desc: 'Shopkeeper photographs plastic waste with the Nirvaha app. Gemini 3.1 Flash identifies the exact resin code in 2.2 seconds.',
  },
  {
    label: 'CLASSIFY',
    desc: 'AI returns resin type (PET 1 through OTHER 7), estimated weight, recyclability index, and automated sorting advice.',
  },
  {
    label: 'AGGREGATE',
    desc: 'Each item enters a virtual Digital Bin. Weight accumulates across days without requiring daily collection trips.',
  },
  {
    label: 'ROUTE',
    desc: 'At 2.0 KG, the bin triggers a pickup. Vendors claim entire neighborhood clusters via the live dashboard with OpenStreetMap routing.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative w-full overflow-hidden">
      {/* Dark background with hero image */}
      <div className="relative min-h-[700px]">
        <Image src="/hero.jpg" alt="Plastic waste background" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/80" />

        <div className="relative z-10 max-w-7xl mx-auto px-8 py-24">
          {/* Section heading — neon green, same as BKKDW "BEGIN YOUR COFFEE GROUND ZERO" */}
          <h2 className="text-center text-[clamp(2rem,5vw,5rem)] font-black leading-[1.0] tracking-tighter text-[#10b981] uppercase mb-6">
            BEGIN YOUR<br />PLASTIC GROUND ZERO
          </h2>

          <p className="text-center font-mono-label text-white/60 mb-16 bg-[#10b981] text-black inline-block mx-auto px-4 py-2" style={{display:'table', margin:'0 auto 4rem auto'}}>
            FROM PLASTIC WASTE
          </p>

          {/* Timeline steps — vertical line with nodes */}
          <div className="relative max-w-xl mx-auto">
            {/* Vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#10b981]/50 -translate-x-1/2" />

            <div className="space-y-16">
              {STEPS.map((step, i) => (
                <div key={i} className={`flex items-start gap-8 ${i % 2 === 0 ? '' : 'flex-row-reverse text-right'}`}>
                  <div className="flex-1">
                    <span className="inline-block bg-[#10b981] text-black font-mono-label px-3 py-1 text-xs font-bold mb-3 border border-black/20">
                      {step.label}
                    </span>
                    <span className="inline-block border-t-2 border-dashed border-white/40 w-12 mx-3 align-middle" />
                    <p className="text-white/80 text-sm leading-relaxed mt-2 italic">{step.desc}</p>
                  </div>
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
