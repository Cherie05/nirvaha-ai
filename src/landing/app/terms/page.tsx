'use client';
import React from 'react';
import Link from 'next/link';

export default function Terms() {
  return (
    <main className="bg-[#e8e4df] min-h-screen text-black py-24 px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="font-mono-label text-[#10b981] hover:underline mb-12 inline-block">&larr; BACK TO HOME</Link>
        <h1 className="text-[clamp(2.5rem,5vw,5rem)] font-black leading-[1.0] tracking-tighter uppercase mb-12">TERMS & CONDITIONS</h1>
        
        <div className="space-y-8 font-mono text-sm leading-relaxed">
          <p><strong>LAST UPDATED: AUGUST 2026</strong></p>
          <section>
            <h2 className="text-xl font-bold mb-2">1. ACCEPTANCE OF TERMS</h2>
            <p>By accessing and using the Nirvaha AI Plastic Aggregation platform (the "Service"), you agree to be bound by these Terms and Conditions. The Service is provided by Team The Tesseractis as part of the GDG Coimbatore Build With AI 2026 Hackathon prototype.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">2. USE OF AI & ACCURACY</h2>
            <p>The Service utilizes Gemini 1.5 Flash for plastic resin identification. While the system operates at an estimated 82% accuracy under optimal lighting, we do not guarantee perfect classification. Final sorting and pricing are determined by physical validation at the point of vendor collection.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">3. VENDOR AGGREGATION</h2>
            <p>B2B vendors utilizing the dashboard are subject to route claiming rules. A minimum threshold of 2.0 KG must be met across a neighborhood cluster before a pickup route is authorized via the platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">4. LIMITATION OF LIABILITY</h2>
            <p>This is a hackathon prototype currently in pre-incubation. We provide the platform "as-is" without any warranties, express or implied. We are not liable for logistical delays, incorrect AI classifications, or financial disputes between households and scrap vendors.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
