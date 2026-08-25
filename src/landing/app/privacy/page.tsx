'use client';
import React from 'react';
import Link from 'next/link';

export default function Privacy() {
  return (
    <main className="bg-[#e8e4df] min-h-screen text-black py-24 px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="font-mono-label text-[#10b981] hover:underline mb-12 inline-block">&larr; BACK TO HOME</Link>
        <h1 className="text-[clamp(2.5rem,5vw,5rem)] font-black leading-[1.0] tracking-tighter uppercase mb-12">PRIVACY POLICY</h1>
        
        <div className="space-y-8 font-mono text-sm leading-relaxed">
          <p><strong>LAST UPDATED: AUGUST 2026</strong></p>
          <section>
            <h2 className="text-xl font-bold mb-2">1. DATA COLLECTION</h2>
            <p>Nirvaha collects images of plastic waste captured through our mobile application for the sole purpose of AI classification via the Gemini API. We also collect basic geolocation data to group users into neighborhood clusters for efficient vendor routing.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">2. IMAGE PROCESSING</h2>
            <p>Images uploaded for scanning are processed ephemerally. We do not permanently store photos of your household or surroundings. Only the extracted resin code, confidence score, and estimated weight are saved to your Digital Bin profile.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">3. LOCATION DATA</h2>
            <p>Your exact coordinates are obfuscated on the public vendor dashboard. Vendors only see aggregated cluster zones and weights. Exact addresses are only revealed to a vendor once they formally claim a route and are en route for pickup.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">4. CONTACT</h2>
            <p>For inquiries regarding data privacy or to request account deletion, please contact the development team via the developer links provided on the homepage.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
