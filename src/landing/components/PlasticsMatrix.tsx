'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, Sparkles, ChevronRight, Scale } from 'lucide-react';

const PLASTICS = [
  {
    code: 'PET 1',
    name: 'Polyethylene Terephthalate',
    category: 'Rigid Container',
    recyclability: '98% Recyclable',
    marketValue: 'High Value (₹28–35/kg)',
    meltingPoint: '260°C',
    examples: 'Water bottles, soda bottles, food jars',
    sortingAdvice: 'Rinse, crush bottle, keep cap separate (PP 5).',
    color: 'border-sky-500/40 bg-sky-950/30 text-sky-300',
    badge: 'bg-sky-500 text-black',
  },
  {
    code: 'HDPE 2',
    name: 'High-Density Polyethylene',
    category: 'Rigid Heavy Plastic',
    recyclability: '95% Recyclable',
    marketValue: 'High Value (₹30–38/kg)',
    meltingPoint: '130°C',
    examples: 'Milk jugs, shampoo bottles, detergent tubs, pipes',
    sortingAdvice: 'Drain completely. Excellent for re-granulation.',
    color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
    badge: 'bg-emerald-500 text-black',
  },
  {
    code: 'PVC 3',
    name: 'Polyvinyl Chloride',
    category: 'Industrial / Structural',
    recyclability: 'Special Handling Only',
    marketValue: 'Specialized (₹15–20/kg)',
    meltingPoint: '100–260°C',
    examples: 'Plumbing pipes, cable sheathing, blister packs',
    sortingAdvice: 'Keep strict isolation. Contains chlorine.',
    color: 'border-rose-500/40 bg-rose-950/30 text-rose-300',
    badge: 'bg-rose-500 text-black',
  },
  {
    code: 'LDPE 4',
    name: 'Low-Density Polyethylene',
    category: 'Flexible Film',
    recyclability: '85% Recyclable (Aggregated)',
    marketValue: 'Medium Value (₹18–24/kg)',
    meltingPoint: '110°C',
    examples: 'Grocery covers, bubble wrap, squeeze bottles',
    sortingAdvice: 'Bundle together in Digital Bin to reach weight floor.',
    color: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
    badge: 'bg-amber-500 text-black',
  },
  {
    code: 'PP 5',
    name: 'Polypropylene',
    category: 'Durable Container',
    recyclability: '90% Recyclable',
    marketValue: 'High Value (₹25–32/kg)',
    meltingPoint: '160°C',
    examples: 'Yogurt containers, bottle caps, medicine bottles',
    sortingAdvice: 'Clean off food residues. Highly sought by recyclers.',
    color: 'border-violet-500/40 bg-violet-950/30 text-violet-300',
    badge: 'bg-violet-500 text-black',
  },
  {
    code: 'PS 6',
    name: 'Polystyrene',
    category: 'Foam & Rigids',
    recyclability: '20% Recyclable',
    marketValue: 'Low Value (₹8–12/kg)',
    meltingPoint: '240°C',
    examples: 'Styrofoam cups, takeaway boxes, plastic cutlery',
    sortingAdvice: 'Requires compaction. Low local scrap demand.',
    color: 'border-orange-500/40 bg-orange-950/30 text-orange-300',
    badge: 'bg-orange-500 text-black',
  },
  {
    code: 'OTHER 7',
    name: 'Multilayer & Composites',
    category: 'Complex Packaging',
    recyclability: 'Refuses Guess (<0.60 Conf)',
    marketValue: 'Variable / Refuse-derived',
    meltingPoint: 'Varies',
    examples: 'Chip bags, foil wrappers, composite pouches',
    sortingAdvice: 'AI Safety Guard activates. Refuses incorrect verdict.',
    color: 'border-slate-700 bg-slate-900/60 text-slate-300',
    badge: 'bg-slate-700 text-white',
  },
];

export default function PlasticsMatrix() {
  const [activeResin, setActiveResin] = useState(PLASTICS[0]);

  return (
    <section id="matrix" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-950 px-3 py-1 text-xs font-black uppercase text-emerald-400 border border-emerald-800/40 mb-3">
            Interactive Technical Specification
          </div>
          <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">
            All 7 Resin Codes Recognized By AI Vision
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            Detailed material properties, commercial scrap value, and sorting rules evaluated by our Gemini 3.1 Multimodal engine.
          </p>
        </div>

        {/* Code Buttons Row */}
        <div className="flex flex-wrap gap-3 mb-10">
          {PLASTICS.map((p) => (
            <button
              key={p.code}
              onClick={() => setActiveResin(p)}
              className={`rounded-2xl px-5 py-3 text-xs font-black transition-all ${
                activeResin.code === p.code
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black shadow-lg shadow-emerald-500/25 scale-105'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {p.code}
            </button>
          ))}
        </div>

        {/* Active Resin Detailed Display Card */}
        <div className={`bkk-card rounded-3xl p-8 border ${activeResin.color}`}>
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-emerald-900/40 pb-6 lg:pb-0 lg:pr-8">
              <span className={`inline-block rounded-lg px-3 py-1 text-xs font-black ${activeResin.badge}`}>
                {activeResin.code}
              </span>
              <h3 className="text-2xl font-black text-white mt-4">{activeResin.name}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{activeResin.category}</p>
            </div>

            <div className="lg:col-span-8 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Recyclability Rating</span>
                  <span className="font-extrabold text-white text-sm">{activeResin.recyclability}</span>
                </div>
                <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Market Scrap Value</span>
                  <span className="font-extrabold text-emerald-400 text-sm">{activeResin.marketValue}</span>
                </div>
                <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Thermal Melting Point</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">{activeResin.meltingPoint}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800">
                <span className="text-slate-400 block mb-1">Typical Real-World Items:</span>
                <span className="text-slate-200 font-medium">{activeResin.examples}</span>
              </div>

              <div className="rounded-2xl bg-emerald-950/60 p-4 border border-emerald-800/60 text-emerald-300">
                <span className="font-bold block mb-1">Nirvaha Automated Sorting Advice:</span>
                <span>{activeResin.sortingAdvice}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
