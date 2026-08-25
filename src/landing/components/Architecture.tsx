'use client';

import React from 'react';
import { Database, Server, Cpu, Globe, Lock, RefreshCw } from 'lucide-react';

const STACK_ITEMS = [
  { name: 'NestJS 10', category: 'Backend API', desc: 'TypeORM, WebSockets, JWT Authentication' },
  { name: 'Google Gemini 3.1', category: 'Primary AI', desc: 'Multimodal Vision Classification' },
  { name: 'Ollama (qwen2.5vl:3b)', category: 'Fallback AI', desc: 'Host-bound fallback engine for offline/quota backup' },
  { name: 'PostgreSQL & Redis', category: 'Database & Cache', desc: 'Seeded test accounts, image-hash caching' },
  { name: 'Flutter', category: 'Mobile App', desc: 'Android APK with bandwidth-optimized image compression' },
  { name: 'React 18 & Vite', category: 'Vendor Dashboard', desc: 'Tailwind CSS, Leaflet Maps, Socket.io Realtime' },
];

export default function Architecture() {
  return (
    <section id="tech" className="py-20 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            System Architecture
          </h2>
          <p className="mt-3 text-slate-400">
            Resilient, multi-cloud stack built for low-latency field performance.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {STACK_ITEMS.map((item) => (
            <div key={item.name} className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-900">
                {item.category}
              </span>
              <h3 className="text-xl font-bold text-white mt-4">{item.name}</h3>
              <p className="text-xs text-slate-400 mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
