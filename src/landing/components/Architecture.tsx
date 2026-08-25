'use client';

import React from 'react';
import { Database, Server, Cpu, Globe, Lock, Code2 } from 'lucide-react';

const STACK_ITEMS = [
  { name: 'NestJS 10', category: 'Backend API', desc: 'TypeORM, WebSockets, JWT Authentication, OpenAPI' },
  { name: 'Google Gemini 3.1', category: 'Primary AI', desc: 'Multimodal Vision Classification & Weight Estimation' },
  { name: 'Ollama (qwen2.5vl:3b)', category: 'Fallback AI', desc: 'Host-bound fallback engine for offline/quota backup' },
  { name: 'PostgreSQL & Redis', category: 'Database & Cache', desc: 'Seeded test accounts, image-hash caching' },
  { name: 'Flutter', category: 'Mobile App', desc: 'Android APK with bandwidth-optimized image compression' },
  { name: 'React 18 & Vite', category: 'Vendor Dashboard', desc: 'Tailwind CSS, Leaflet Maps, Socket.io Realtime' },
];

export default function Architecture() {
  return (
    <section id="architecture" className="py-24 bg-slate-950/60 border-t border-b border-emerald-900/30 relative">
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-950 px-3 py-1 text-xs font-black uppercase text-emerald-400 border border-emerald-800/40 mb-3">
            Engineering Infrastructure
          </div>
          <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">
            System Architecture
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            Resilient, multi-cloud stack built for low-latency field performance across rural & urban centers.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {STACK_ITEMS.map((item) => (
            <div key={item.name} className="bkk-card bkk-card-hover rounded-3xl p-6">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-900">
                {item.category}
              </span>
              <h3 className="text-xl font-bold text-white mt-4">{item.name}</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
