'use client';
import React from 'react';

export default function TechStack() {
  return (
    <section className="bg-white py-24 px-8 border-t border-neutral-300">
      <div className="max-w-7xl mx-auto">
        <p className="font-mono-label text-[#10b981] mb-6">UNDER THE HOOD</p>
        <h2 className="text-[clamp(2rem,4vw,4.5rem)] font-black leading-[1.0] tracking-tighter uppercase mb-16 text-black">
          THE TECHNOLOGY STACK
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-neutral-300 p-6 hover:border-[#10b981] transition-colors">
            <h3 className="text-xl font-bold mb-2">Flutter & Dart</h3>
            <p className="text-sm text-neutral-600">Cross-platform mobile application providing the fast camera UI and scanning experience for end users.</p>
          </div>
          <div className="border border-neutral-300 p-6 hover:border-[#10b981] transition-colors">
            <h3 className="text-xl font-bold mb-2">Gemini 1.5 Flash</h3>
            <p className="text-sm text-neutral-600">Multimodal Vision AI acting as the brain of the app, instantly classifying 7 resin codes with 82% real-world accuracy.</p>
          </div>
          <div className="border border-neutral-300 p-6 hover:border-[#10b981] transition-colors">
            <h3 className="text-xl font-bold mb-2">NestJS & PostgreSQL</h3>
            <p className="text-sm text-neutral-600">Robust backend architecture handling user authentication, digital bin logic, and cluster aggregation logic.</p>
          </div>
          <div className="border border-neutral-300 p-6 hover:border-[#10b981] transition-colors">
            <h3 className="text-xl font-bold mb-2">Socket.io & Leaflet</h3>
            <p className="text-sm text-neutral-600">Real-time WebSocket data feed powering the live vendor dashboard and OpenStreetMap routing integrations.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
