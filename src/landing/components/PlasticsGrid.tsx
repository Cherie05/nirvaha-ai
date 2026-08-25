'use client';

import React from 'react';

const PLASTICS = [
  { code: 'PET 1', name: 'Polyethylene Terephthalate', value: '₹28–35/kg', rate: '98%', items: 'Water bottles, soda bottles, food jars', color: 'bg-sky-100' },
  { code: 'HDPE 2', name: 'High-Density Polyethylene', value: '₹30–38/kg', rate: '95%', items: 'Milk jugs, shampoo bottles, detergent tubs', color: 'bg-emerald-100' },
  { code: 'PVC 3', name: 'Polyvinyl Chloride', value: '₹15–20/kg', rate: 'Special', items: 'Plumbing pipes, cable sheathing, blister packs', color: 'bg-rose-100' },
  { code: 'LDPE 4', name: 'Low-Density Polyethylene', value: '₹18–24/kg', rate: '85%', items: 'Grocery bags, shrink wrap, squeeze bottles', color: 'bg-amber-100' },
  { code: 'PP 5', name: 'Polypropylene', value: '₹25–32/kg', rate: '90%', items: 'Yogurt cups, bottle caps, medicine bottles', color: 'bg-violet-100' },
  { code: 'PS 6', name: 'Polystyrene', value: '₹8–12/kg', rate: '20%', items: 'Styrofoam cups, takeaway boxes, cutlery', color: 'bg-orange-100' },
  { code: 'OTHER 7', name: 'Multilayer Composites', value: 'Refuses Guess', rate: '<0.60', items: 'Chip packets, foil wrappers, composite pouches', color: 'bg-neutral-200' },
];

export default function PlasticsGrid() {
  return (
    <section id="plastics" className="bg-[#e8e4df] py-24 px-8">
      <div className="max-w-7xl mx-auto">

        {/* Big editorial heading — BKKDW "MORE THAN GROUNDS" style */}
        <h2 className="text-[clamp(2rem,5vw,5.5rem)] font-black leading-[1.0] tracking-tighter text-black uppercase mb-16">
          MORE THAN WASTE
        </h2>

        {/* 4-column grid — tall image cards like BKKDW stories section */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLASTICS.slice(0, 4).map((p) => (
            <div key={p.code} className="group">
              <div className={`${p.color} h-72 flex items-end p-6 relative overflow-hidden transition-all group-hover:scale-[1.02]`}>
                <span className="absolute top-4 left-4 bg-black text-white font-mono-label text-xs px-2 py-1">{p.code}</span>
                <span className="absolute top-4 right-4 bg-[#10b981] text-black font-mono-label text-xs px-2 py-1">{p.rate} RECYCLABLE</span>
              </div>
              <div className="pt-3">
                <h3 className="text-base font-bold">{p.name}</h3>
                <p className="font-mono-label text-neutral-500 mt-1">{p.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Second row — 3 columns */}
        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          {PLASTICS.slice(4).map((p) => (
            <div key={p.code} className="group">
              <div className={`${p.color} h-56 flex items-end p-6 relative overflow-hidden transition-all group-hover:scale-[1.02]`}>
                <span className="absolute top-4 left-4 bg-black text-white font-mono-label text-xs px-2 py-1">{p.code}</span>
                <span className="absolute top-4 right-4 bg-[#10b981] text-black font-mono-label text-xs px-2 py-1">{p.rate} RECYCLABLE</span>
              </div>
              <div className="pt-3">
                <h3 className="text-base font-bold">{p.name}</h3>
                <p className="font-mono-label text-neutral-500 mt-1">{p.value}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
