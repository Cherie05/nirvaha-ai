'use client';

import React, { useState } from 'react';
import { Smartphone, LayoutDashboard, Check, AlertTriangle, Layers, Cpu } from 'lucide-react';

const RESIN_CODES = [
  { code: 'PET 1', name: 'Polyethylene Terephthalate', status: 'Recyclable', desc: 'Water bottles, soda bottles. Highly recyclable.', color: 'bg-sky-950 text-sky-300 border-sky-800' },
  { code: 'HDPE 2', name: 'High-Density Polyethylene', status: 'Recyclable', desc: 'Shampoo bottles, milk jugs. Excellent recyclability.', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  { code: 'PVC 3', name: 'Polyvinyl Chloride', status: 'Special Handling', desc: 'Pipes, blister packs. Specialized collection only.', color: 'bg-rose-950 text-rose-300 border-rose-800' },
  { code: 'LDPE 4', name: 'Low-Density Polyethylene', status: 'Recyclable', desc: 'Grocery bags, shrink wrap. Recyclable via aggregation.', color: 'bg-amber-950 text-amber-300 border-amber-800' },
  { code: 'PP 5', name: 'Polypropylene', status: 'Recyclable', desc: 'Yogurt cups, bottle caps. Durable & valuable.', color: 'bg-violet-950 text-violet-300 border-violet-800' },
  { code: 'PS 6', name: 'Polystyrene', status: 'Avoid / Special', desc: 'Styrofoam takeaway boxes. Fragile recyclability.', color: 'bg-orange-950 text-orange-300 border-orange-800' },
  { code: 'OTHER 7', name: 'Multilayer / Polycarbonate', status: 'Non-Recyclable', desc: 'Chip bags, multilayer wrappers. Refuses guess below 0.60 confidence.', color: 'bg-slate-900 text-slate-300 border-slate-700' },
];

export default function DemoShowcase() {
  const [selectedResin, setSelectedResin] = useState(RESIN_CODES[0]);

  return (
    <section id="showcase" className="py-20 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            Dual-Product Architecture
          </h2>
          <p className="mt-3 text-slate-400">
            Household scanning app connected via WebSockets to the B2B logistics routing engine.
          </p>
        </div>

        {/* Dual Cards */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Card 1: Household App */}
          <div className="glass-card glass-card-hover rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-400 border border-emerald-500/30">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">1. Household Mobile App</h3>
                <p className="text-xs text-slate-400">Flutter · Multimodal AI Vision</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6">
              Photograph plastic waste in 2.2s. Identifies exact resin code, estimated weight, and advice.
            </p>

            {/* Interactive Resin Code Selector */}
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
                7 Resin Codes Recognized by Multimodal Vision
              </label>
              <div className="flex flex-wrap gap-2">
                {RESIN_CODES.map((r) => (
                  <button
                    key={r.code}
                    onClick={() => setSelectedResin(r)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      selectedResin.code === r.code
                        ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 scale-105'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {r.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Resin Info Box */}
            <div className={`rounded-xl border p-4 ${selectedResin.color}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-extrabold text-sm">{selectedResin.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40">
                  {selectedResin.status}
                </span>
              </div>
              <p className="text-xs opacity-90">{selectedResin.desc}</p>
            </div>

            {/* AI Safety Banner */}
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-center gap-3 text-amber-300 text-xs">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              <span>
                <strong>0.60 Confidence Threshold Guard:</strong> Refuses to answer if uncertain. Wrong classification ruins recyclers' whole batch.
              </span>
            </div>
          </div>

          {/* Card 2: B2B Vendor Dashboard */}
          <div className="glass-card glass-card-hover rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-teal-500/20 p-3 text-teal-400 border border-teal-500/30">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">2. Vendor Logistics Dashboard</h3>
                <p className="text-xs text-slate-400">React 18 · Leaflet Maps · WebSockets</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6">
              Real-time map routing from scrap vendor warehouses to neighborhood digital bins reaching 2.0 KG.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between rounded-lg bg-slate-900/80 p-3 text-xs border border-slate-800">
                <span className="text-slate-400">Realtime Push Protocol</span>
                <span className="font-bold text-emerald-400">Socket.io (WebSocket)</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-900/80 p-3 text-xs border border-slate-800">
                <span className="text-slate-400">Route Calculation</span>
                <span className="font-bold text-teal-400">OpenStreetMap Road Routing</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-900/80 p-3 text-xs border border-slate-800">
                <span className="text-slate-400">Neighbourhood Claiming</span>
                <span className="font-bold text-indigo-400">One-click Zone Sweep</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
              <a
                href="https://nirvaha-vendor.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                Try the Live Deployed Dashboard →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
