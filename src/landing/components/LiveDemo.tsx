'use client';

import React from 'react';
import { ArrowUpRight, Download } from 'lucide-react';

export default function LiveDemo() {
  return (
    <section id="demo" className="bg-[#e8e4df] py-24 px-8 border-t border-neutral-400">
      <div className="max-w-7xl mx-auto">

        <p className="font-mono-label text-[#c5e017] mb-4">LIVE DEPLOYED ENDPOINTS</p>
        <h2 className="text-[clamp(2rem,4vw,4rem)] font-black tracking-tighter text-black uppercase mb-12">
          TRY THE LIVE PLATFORM
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <a
            href="https://nirvaha-vendor.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-black text-white p-8 hover:bg-neutral-900 transition-colors group"
          >
            <div className="flex justify-between items-start mb-8">
              <span className="font-mono-label text-[#c5e017] text-xs">VENDOR DASHBOARD</span>
              <ArrowUpRight className="h-5 w-5 text-[#c5e017] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-3">B2B Logistics Dashboard</h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              Real-time map routing, neighborhood zone claiming, and WebSocket aggregation feed. Built with React 18, Leaflet maps, and Socket.io.
            </p>
            <div className="border-t border-neutral-700 pt-4 font-mono-label text-neutral-500 text-xs">
              LOGIN: vendor@gmail.com / vendor@1234
            </div>
          </a>

          <a
            href="https://github.com/Cherie05/nirvaha-ai/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#c5e017] text-black p-8 hover:bg-[#d4eb2e] transition-colors group"
          >
            <div className="flex justify-between items-start mb-8">
              <span className="font-mono-label text-black/60 text-xs">HOUSEHOLD SCANNER APP</span>
              <Download className="h-5 w-5 text-black group-hover:translate-y-1 transition-transform" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-3">Android APK (v1.0)</h3>
            <p className="text-black/70 text-sm leading-relaxed mb-6">
              Flutter app with Gemini 1.5 Flash multimodal vision. Scan any plastic item, get resin code, weight estimate, and sorting advice in 2.2 seconds.
            </p>
            <div className="border-t border-black/20 pt-4 font-mono-label text-black/50 text-xs">
              LOGIN: test@gmail.com / test@1234 · OTP: 123456
            </div>
          </a>
        </div>

        <div className="mt-6 bg-white border border-neutral-300 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-mono-label text-neutral-500 text-xs">BACKEND API · RAILWAY</span>
            <p className="text-base font-bold mt-1">NestJS 10 + PostgreSQL + Redis + Gemini 1.5 Flash</p>
          </div>
          <a
            href="https://health-team-109-the-tesseractis-production.up.railway.app/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-label text-[#c5e017] text-xs hover:underline flex items-center gap-2"
          >
            CHECK API STATUS <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>

      </div>
    </section>
  );
}
