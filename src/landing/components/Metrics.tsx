'use client';

import React from 'react';
import { ShieldCheck, Zap, Activity, Scale } from 'lucide-react';

export default function Metrics() {
  return (
    <section id="metrics" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-950 px-3 py-1 text-xs font-black uppercase text-emerald-400 border border-emerald-800/40 mb-3">
            Empirical Performance
          </div>
          <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">
            Measured Benchmarks, Not Estimates
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            Real data measured on our deployed test set during hackathon evaluation checks.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bkk-card bkk-card-hover rounded-3xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-4xl font-black text-white">18 / 22</div>
            <div className="mt-1 text-xs font-extrabold uppercase tracking-wider text-emerald-400">Exact Matches</div>
            <p className="mt-2 text-xs text-slate-400">Across all 7 resin codes on labelled dataset</p>
          </div>

          <div className="bkk-card bkk-card-hover rounded-3xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-950 text-teal-400 border border-teal-800">
              <Zap className="h-6 w-6" />
            </div>
            <div className="text-4xl font-black text-white">2.2s</div>
            <div className="mt-1 text-xs font-extrabold uppercase tracking-wider text-teal-400">Scan Latency</div>
            <p className="mt-2 text-xs text-slate-400">From camera snap to classification output</p>
          </div>

          <div className="bkk-card bkk-card-hover rounded-3xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-950 text-amber-400 border border-amber-800">
              <Activity className="h-6 w-6" />
            </div>
            <div className="text-4xl font-black text-white">&lt; 0.60</div>
            <div className="mt-1 text-xs font-extrabold uppercase tracking-wider text-amber-400">Confidence Cutoff</div>
            <p className="mt-2 text-xs text-slate-400">Refuses to guess if uncertain to prevent batch contamination</p>
          </div>

          <div className="bkk-card bkk-card-hover rounded-3xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800">
              <Scale className="h-6 w-6" />
            </div>
            <div className="text-4xl font-black text-white">2.0 KG</div>
            <div className="mt-1 text-xs font-extrabold uppercase tracking-wider text-indigo-400">Pickup Floor</div>
            <p className="mt-2 text-xs text-slate-400">Minimum threshold unlocking profitable vendor routes</p>
          </div>
        </div>

      </div>
    </section>
  );
}
