'use client';

import React from 'react';
import Image from 'next/image';

export default function FieldStory() {
  return (
    <section id="story" className="bg-white py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Big editorial image */}
          <div className="relative h-[500px] overflow-hidden">
            <Image src="/store.jpg" alt="General store near Warangal" fill className="object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <p className="font-mono-label text-white/80 text-[10px]">FIELD RESEARCH · WARANGAL, TELANGANA</p>
            </div>
          </div>

          {/* Right: Editorial text */}
          <div>
            <p className="font-mono-label text-[#10b981] mb-4">THE 30-MINUTE BARRIER</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-black uppercase leading-tight mb-6">
              "IF SORTING TAKES 30 MINUTES, I'LL IGNORE IT"
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-6">
              Vineeth runs a general store. He keeps PET bottles aside because he recognizes them. Everything else goes to general waste because he can't identify resin codes. No scrap dealer will drive down for one shop's 200g of unsorted plastic.
            </p>
            <p className="text-neutral-700 leading-relaxed mb-8">
              Nirvaha eliminates this barrier completely. Shopkeepers scan waste in 2.2 seconds — no knowledge required. Items accumulate in a virtual Digital Bin. At 2.0 KG, the system triggers aggregated neighborhood pickup routes that are actually profitable for vendors.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 border-t border-neutral-300 pt-6">
              <div>
                <p className="text-2xl font-black text-black">2.2s</p>
                <p className="font-mono-label text-neutral-500">SCAN TIME</p>
              </div>
              <div>
                <p className="text-2xl font-black text-black">2.0 KG</p>
                <p className="font-mono-label text-neutral-500">PICKUP FLOOR</p>
              </div>
              <div>
                <p className="text-2xl font-black text-black">18/22</p>
                <p className="font-mono-label text-neutral-500">ACCURACY</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
