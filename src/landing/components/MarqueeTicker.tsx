'use client';

import React from 'react';

const ITEMS = [
  'AI PLASTIC CLASSIFICATION',
  'B2B NEIGHBORHOOD LOGISTICS',
  '2.0 KG DIGITAL BIN THRESHOLD',
  'REALTIME WEBSOCKET ROUTING',
  'GEMINI 3.1 FLASH + OLLAMA',
  '7 RESIN CODES RECOGNIZED',
  'ZERO FALSE POSITIVE BATCH GUARD',
  'SUSTAINABLE CITIES TRACK',
];

export default function MarqueeTicker() {
  return (
    <div className="border-y border-emerald-900/40 bg-emerald-950/40 py-3 backdrop-blur-md overflow-hidden">
      <div className="marquee-container flex">
        <div className="marquee-content flex gap-8 text-xs font-black tracking-widest text-emerald-400/90 uppercase">
          {ITEMS.concat(ITEMS).map((item, idx) => (
            <span key={idx} className="flex items-center gap-8">
              <span>{item}</span>
              <span className="text-emerald-600">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
