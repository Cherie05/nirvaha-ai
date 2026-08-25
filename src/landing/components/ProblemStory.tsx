'use client';

import React from 'react';
import { AlertCircle, Clock, MapPin, Truck, ShieldX } from 'lucide-react';

export default function ProblemStory() {
  return (
    <section id="problem" className="py-20 bg-slate-950/40 relative border-t border-b border-emerald-950/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-950/80 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-800/40 mb-4">
              <MapPin className="h-3.5 w-3.5" />
              Field Research · Warangal, Telangana
            </div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl leading-tight">
              The 36-Hour Field Insight: <br />
              <span className="text-emerald-400">Knowledge is useless without logistics.</span>
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Vineeth runs a general store. He keeps PET bottles aside because he recognizes them. 
              Everything else goes to general waste because he can't identify resin codes.
            </p>
            
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 text-amber-200">
              <p className="font-mono text-sm italic">
                "If sorting takes around 30 minutes, I'll ignore it. One shop's plastic isn't worth a scrap dealer driving down."
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-400">— Vineeth, Shop Owner</p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-lg bg-red-950/60 p-2 text-red-400 border border-red-900/40">
                  <ShieldX className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">The Single-Shop Trap</h4>
                  <p className="text-sm text-slate-400">Scrap dealers burn more fuel driving to a single 200g plastic pickup than the plastic is worth.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-lg bg-emerald-950/60 p-2 text-emerald-400 border border-emerald-900/40">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">The Nirvaha Solution</h4>
                  <p className="text-sm text-slate-400">Hold scans in a virtual <strong>Digital Bin</strong>. At 2.0 KG, trigger an aggregated neighborhood pickup route on the vendor dashboard.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Card */}
          <div className="glass-card rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <h3 className="text-xl font-bold text-white mb-6">The Threshold Breakthrough</h3>
            
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                  <span>UNECONOMIC SINGLE PICKUP</span>
                  <span className="text-red-400">0.2 KG (Loss)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full w-[10%] bg-red-500" />
                </div>
                <p className="mt-2 text-xs text-slate-500">Scrap dealer cost: ₹45 fuel vs ₹4 plastic value.</p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4">
                <div className="flex justify-between text-xs font-bold text-emerald-400 mb-2">
                  <span>NIRVAHA DIGITAL BIN THRESHOLD</span>
                  <span className="text-emerald-400 font-extrabold">2.0 KG (Profitable)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full w-[100%] bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse" />
                </div>
                <p className="mt-2 text-xs text-emerald-300">Scrap dealer cost: Route aggregated across 8 shops → ₹180 profit.</p>
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-slate-900/60 p-4 text-center text-xs text-slate-400 border border-slate-800">
              <span className="font-bold text-white">Result:</span> Zero friction for shopkeepers, economic logistics for recyclers.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
