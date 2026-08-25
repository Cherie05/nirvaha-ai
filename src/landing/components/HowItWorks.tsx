'use client';

import React from 'react';
import Image from 'next/image';

const STEPS = [
  { label: 'SCAN', desc: 'Shopkeeper photographs plastic waste with the Nirvaha Flutter app. Gemini 1.5 Flash identifies the exact resin code in 2.2 seconds.' },
  { label: 'CLASSIFY', desc: 'AI returns resin type (PET 1 through OTHER 7), estimated weight, recyclability index, and automated sorting advice.' },
  { label: 'AGGREGATE', desc: 'Each classified item enters a virtual Digital Bin. Weight accumulates across days — no daily collection trips needed.' },
  { label: 'ROUTE', desc: 'At 2.0 KG, the bin triggers a pickup. Vendors claim entire neighborhood clusters via the live dashboard with OpenStreetMap routing.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative w-full overflow-hidden">
      <div className="relative min-h-[700px]">
        <Image src="/sorted.jpg" alt="Sorted plastic bales" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-black/85" />

        <div className="relative z-10 max-w-5xl mx-auto px-8 py-24">
          <h2 className="text-center text-[clamp(2rem,5vw,5rem)] font-black leading-[1.0] tracking-tighter text-[#c5e017] uppercase mb-4">
            HOW NIRVAHA WORKS
          </h2>

          <p className="text-center mb-16">
            <span className="font-mono-label text-black bg-[#c5e017] px-4 py-2 inline-block">
              FROM WASTE TO ROUTE IN 4 STEPS
            </span>
          </p>

          {/* Clean vertical timeline */}
          <div className="relative">
            {/* Center line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-[#c5e017]/40 md:-translate-x-[1px]" />

            <div className="space-y-12">
              {STEPS.map((step, i) => (
                <div key={i} className="relative flex items-start">
                  {/* Dot on timeline */}
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-[#c5e017] border-2 border-black rounded-full -translate-x-1/2 mt-1 z-10" />

                  {/* Content card */}
                  <div className={`ml-16 md:ml-0 md:w-[45%] ${i % 2 === 0 ? 'md:pr-12' : 'md:ml-[55%] md:pl-12'}`}>
                    <span className="inline-block bg-[#c5e017] text-black font-mono-label px-3 py-1 text-xs font-bold mb-3">
                      {step.label}
                    </span>
                    <p className="text-white/80 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
