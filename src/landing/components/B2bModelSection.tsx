'use client';

import React from 'react';
import { Truck, ShieldCheck, Database, Layers, ArrowRight, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Shopkeeper Snap Scan',
    desc: 'Shopkeeper photographs plastic waste in 2.2s. Gemini 3.1 Flash identifies exact resin code (PET 1 - OTHER 7) and estimated weight.',
    highlight: 'No knowledge required',
  },
  {
    step: '02',
    title: 'Virtual Digital Bin',
    desc: 'Each scanned item enters a Digital Bin. Weight accumulates over days without requiring immediate pickup visits.',
    highlight: 'Zero daily friction',
  },
  {
    step: '03',
    title: '2.0 KG Pickup Threshold',
    desc: 'At 2.0 KG — the exact point a trip becomes profitable for scrap dealers — the bin unlocks a pickup request.',
    highlight: 'Economic viability floor',
  },
  {
    step: '04',
    title: 'Neighborhood Route Claim',
    desc: 'Vendors view whole neighborhood clusters on an interactive map and claim entire routes in one click with OpenStreetMap road routing.',
    highlight: 'High-density B2B collection',
  },
];

export default function B2bModelSection() {
  return (
    <section id="model" className="py-24 bg-slate-950/60 border-t border-b border-emerald-900/30 relative">
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-950 px-3 py-1 text-xs font-black uppercase text-emerald-400 border border-emerald-800/40 mb-3">
            B2B Unit Economics
          </div>
          <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">
            How The B2B Logistics Pipeline Operates
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            Eliminating the single-shop collection trap by aggregating neighborhood volume into high-density commercial routes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.step} className="bkk-card bkk-card-hover rounded-3xl p-6 relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-3xl font-black text-emerald-400 font-mono">{s.step}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800/60">
                    {s.highlight}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-emerald-950 flex items-center text-xs font-bold text-emerald-400 gap-1">
                <span>Phase {s.step} active</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
