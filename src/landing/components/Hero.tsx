'use client';

import React from 'react';
import { ArrowUpRight, Download, CheckCircle2, ShieldAlert, Cpu, Truck, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-12 pb-24 md:pt-20 md:pb-36 overflow-hidden">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-10 top-1/4 h-[350px] w-[350px] rounded-full bg-teal-500/10 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-6 relative">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-4 py-1.5 text-xs font-bold text-emerald-300 shadow-inner backdrop-blur-md mb-6">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Build with AI 2026 Winner · Sustainable Cities Track
            </div>

            <h1 className="text-4xl font-black tracking-tighter text-white sm:text-6xl md:text-7xl leading-[1.02]">
              CIRCULAR PLASTIC <br />
              <span className="text-editorial-gradient">LOGISTICS ENGINE</span>
            </h1>

            <p className="mt-6 text-base text-slate-300 sm:text-lg leading-relaxed max-w-2xl font-medium">
              Small shopkeepers throw away recyclable plastic because single-item collection trips burn more fuel than the plastic is worth. 
              Nirvaha pairs <strong>multimodal AI resin classification</strong> with <strong>2.0 KG Digital Bin aggregation</strong> to unlock economic B2B pickup routes for scrap dealers.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="https://nirvaha-vendor.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-6 py-4 text-sm font-black text-black shadow-2xl shadow-emerald-500/25 transition-all hover:scale-[1.02] hover:shadow-emerald-500/40"
              >
                Launch Vendor Dashboard
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <a
                href="https://github.com/Cherie05/nirvaha-ai/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-emerald-900/60 bg-slate-900/90 px-6 py-4 text-sm font-bold text-slate-200 transition-all hover:bg-slate-800 hover:border-emerald-500/40"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                Download Android APK (v1.0)
              </a>
            </div>

            {/* Micro stats */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-emerald-900/40 pt-8 max-w-xl">
              <div>
                <div className="text-2xl font-black text-white">18 / 22</div>
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">Resin Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-black text-white">2.0 KG</div>
                <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider mt-0.5">Pickup Floor</div>
              </div>
              <div>
                <div className="text-2xl font-black text-white">2.2s</div>
                <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5">Scan Latency</div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="lg:col-span-5">
            <div className="bkk-card bkk-card-active rounded-3xl p-6 relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black tracking-wider text-emerald-400 uppercase">Live B2B Route Stream</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">RS Puram Zone #109</span>
              </div>

              {/* Aggregation Card Mock */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Vineeth's General Store</span>
                    <span className="text-emerald-400 font-mono">1,980g / 2,000g</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden p-0.5 border border-slate-800">
                    <div className="h-full w-[99%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                  </div>
                  <div className="mt-3 flex justify-between text-[11px] text-slate-400">
                    <span>Scans: PET 1, LDPE 4, PP 5</span>
                    <span className="text-emerald-400 font-bold">1 Scan Away (+25g)</span>
                  </div>
                </div>

                {/* Real-time Socket Event Simulation */}
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-emerald-300">⚡ WebSocket Route Unlocked</span>
                    <span className="text-[10px] font-mono bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded">0.2s push</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Neighborhood digital bin threshold crossed (2.005 KG). Pick-up route pushed live to Scrap Trader Dashboard.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-900/40 flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Deployed Engine: Railway + Netlify</span>
                <a href="https://nirvaha-vendor.netlify.app" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                  View App →
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
