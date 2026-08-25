'use client';

import React from 'react';
import { Activity, ShieldCheck, Zap, Scale } from 'lucide-react';

export default function Metrics() {
  return (
    <section id="metrics" className="py-20 bg-slate-950/60 border-t border-b border-slate-900">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            Empirical Validation, Not Estimates
          </h2>
          <p className="mt-3 text-slate-400">
            Real data measured on our deployed test set during hackathon evaluations.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-3xl font-black text-white">18 / 22</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-400">Exact Matches</div>
            <p className="mt-2 text-xs text-slate-400">Across all 7 resin codes on labelled dataset</p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-950 text-teal-400 border border-teal-800">
              <Zap className="h-6 w-6" />
            </div>
            <div className="text-3xl font-black text-white">2.2s</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-teal-400">Scan Latency</div>
            <p className="mt-2 text-xs text-slate-400">From camera snap to classification output</p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-950 text-amber-400 border border-amber-800">
              <Activity className="h-6 w-6" />
            </div>
            <div className="text-3xl font-black text-white">&lt; 0.60</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-amber-400">Confidence Cutoff</div>
            <p className="mt-2 text-xs text-slate-400">Refuses to guess if uncertain to prevent batch contamination</p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
              <Scale className="h-6 w-6" />
            </div>
            <div className="text-3xl font-black text-white">2.0 KG</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider text-indigo-400">Pickup Floor</div>
            <p className="mt-2 text-xs text-slate-400">Minimum threshold unlocking profitable vendor routes</p>
          </div>
        </div>
      </div>
    </section>
  );
}
