'use client';

import React from 'react';
import Image from 'next/image';

export default function ProblemSection() {
  return (
    <section id="problem" className="bg-[#e8e4df] py-24 px-8">
      <div className="max-w-7xl mx-auto">

        <h2 className="text-[clamp(2rem,5vw,5.5rem)] font-black leading-[1.0] tracking-tighter text-black uppercase mb-20">
          WHY PLASTIC<br/>STAYS UNSORTED
        </h2>

        <div className="grid md:grid-cols-3 gap-12">

          <div>
            <p className="font-mono-label text-[#10b981] text-sm mb-6">01</p>
            <h3 className="text-xl font-black uppercase leading-tight mb-4">
              SHOPKEEPERS CAN'T TELL{' '}
              <span className="highlight-text">PET FROM HDPE</span>
            </h3>
            <p className="text-sm text-neutral-700 leading-relaxed">
              India has 7 plastic resin codes. A shopkeeper recognizes water bottles but can't distinguish LDPE film from PP containers. Without identification, everything goes to general waste.
            </p>
          </div>

          <div>
            <p className="font-mono-label text-[#10b981] text-sm mb-6">02</p>
            <h3 className="text-xl font-black uppercase leading-tight mb-4">
              ONE SHOP'S PLASTIC{' '}
              <span className="highlight-text">ISN'T WORTH A TRIP</span>
            </h3>
            <p className="text-sm text-neutral-700 leading-relaxed">
              A scrap dealer burns ₹45 in fuel driving to collect 200g of mixed plastic worth ₹4. The economics don't work for single-shop pickups. Dealers simply refuse.
            </p>
          </div>

          <div>
            <p className="font-mono-label text-[#10b981] text-sm mb-6">03</p>
            <h3 className="text-xl font-black uppercase leading-tight mb-4">
              AGGREGATED PLASTIC IS{' '}
              <span className="highlight-text">A PROFITABLE COMMODITY</span>
            </h3>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Sorted PET fetches ₹28–35/kg. HDPE reaches ₹38/kg. When 8 shops in a neighborhood each cross the 2.0 KG Digital Bin threshold, a single route yields ₹400+ profit for vendors.
            </p>
          </div>

        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-12">
          <div className="relative h-56 overflow-hidden">
            <Image src="/hero.jpg" alt="Mixed plastic waste from shops" fill sizes="100vw" className="object-cover" />
          </div>
          <div className="relative h-56 overflow-hidden">
            <Image src="/sorted.jpg" alt="Sorted plastic bales ready for recyclers" fill sizes="100vw" className="object-cover" />
          </div>
          <div className="relative h-56 overflow-hidden">
            <Image src="/store.jpg" alt="Indian general store generating daily plastic" fill sizes="100vw" className="object-cover" />
          </div>
        </div>

      </div>
    </section>
  );
}
