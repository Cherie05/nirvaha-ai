'use client';

import React from 'react';
import Image from 'next/image';

export default function ProblemSection() {
  return (
    <section id="problem" className="bg-[#e8e4df] py-24 px-8">
      <div className="max-w-7xl mx-auto">

        {/* Big editorial heading */}
        <h2 className="text-[clamp(2rem,5vw,5.5rem)] font-black leading-[1.0] tracking-tighter text-black uppercase mb-20">
          PAUSE BEFORE<br />YOU TOSS
        </h2>

        {/* 3-column numbered cards — exactly like BKKDW */}
        <div className="grid md:grid-cols-3 gap-12">

          <div>
            <p className="font-mono-label text-[#10b981] text-sm mb-6">01</p>
            <h3 className="text-xl font-black uppercase leading-tight mb-4">
              UNSORTED PLASTIC FROM SHOPS ENDS UP IN{' '}
              <span className="highlight-text">LANDFILLS AND RIVERS</span>
            </h3>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Small shopkeepers in India generate 200–500g of mixed plastic daily. Without sorting knowledge, it all goes to general waste — contaminating recyclable batches and entering waterways.
            </p>
          </div>

          <div>
            <p className="font-mono-label text-[#10b981] text-sm mb-6">02</p>
            <h3 className="text-xl font-black uppercase leading-tight mb-4">
              SINGLE-SHOP COLLECTION IS{' '}
              <span className="highlight-text">ECONOMICALLY IMPOSSIBLE</span>
            </h3>
            <p className="text-sm text-neutral-700 leading-relaxed">
              A scrap dealer spends ₹45 in fuel to collect 200g of plastic worth ₹4. No rational vendor will make that trip. The plastic stays unsorted and uncollected.
            </p>
          </div>

          <div>
            <p className="font-mono-label text-[#10b981] text-sm mb-6">03</p>
            <h3 className="text-xl font-black uppercase leading-tight mb-4">
              PLASTIC IS A{' '}
              <span className="highlight-text">VALUABLE RESOURCE, NOT WASTE</span>
            </h3>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Sorted PET bottles fetch ₹28–35/kg. HDPE containers reach ₹30–38/kg. When aggregated and classified correctly, neighborhood plastic becomes a profitable B2B commodity.
            </p>
          </div>

        </div>

        {/* 3-column images below — BKKDW shows color palette strips, we show real photos */}
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          <div className="relative h-56 overflow-hidden">
            <Image src="/hero.jpg" alt="Plastic waste" fill className="object-cover" />
          </div>
          <div className="relative h-56 overflow-hidden">
            <Image src="/sorted.jpg" alt="Sorted plastic bales" fill className="object-cover" />
          </div>
          <div className="relative h-56 overflow-hidden">
            <Image src="/store.jpg" alt="Indian general store" fill className="object-cover" />
          </div>
        </div>

      </div>
    </section>
  );
}
