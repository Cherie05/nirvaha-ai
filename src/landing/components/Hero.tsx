'use client';

import React from 'react';
import { ArrowUpRight, Download, Play, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Glow overlays */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[450px] w-[800px] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full bg-teal-500/10 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-6 relative">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-4 py-1.5 text-xs font-semibold text-emerald-300 shadow-sm backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Built at Build with AI 2026 · GDG Coimbatore & TiE KovaiCon
          </div>

          {/* Main Title */}
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl leading-[1.1]">
            AI Plastic Waste Classification Meets <span className="text-gradient">B2B Logistics</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg text-slate-300 sm:text-xl leading-relaxed">
            One shopkeeper's plastic is never worth a scrap dealer's trip. 
            Nirvaha combines multimodal AI waste identification with neighborhood-level 
            digital bin aggregation to create economically viable B2B pickup routes.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://nirvaha-vendor.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-black shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:scale-[1.02]"
            >
              Launch Live Vendor Dashboard
              <ArrowUpRight className="h-4 w-4" />
            </a>

            <a
              href="https://github.com/Cherie05/nirvaha-ai/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 px-6 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-emerald-500/50 hover:bg-slate-800"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              Download Android APK (v1.0)
            </a>
          </div>

          {/* Live Deployment Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-slate-800/80 pt-8 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Netlify Vendor Frontend</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Railway Postgres + Redis Stack</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Gemini 3.1 Flash + Ollama Fallback</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
