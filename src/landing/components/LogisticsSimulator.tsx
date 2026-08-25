'use client';

import React, { useState } from 'react';
import { Calculator, Truck, TrendingUp, CheckCircle, ShieldCheck } from 'lucide-react';

export default function LogisticsSimulator() {
  const [shopCount, setShopCount] = useState(8);
  const [avgWeightKg, setAvgWeightKg] = useState(2.2);

  const totalWeight = (shopCount * avgWeightKg).toFixed(1);
  const unaggregatedFuelCost = (shopCount * 45).toFixed(0);
  const aggregatedFuelCost = (55).toFixed(0);
  const grossPlasticValue = (parseFloat(totalWeight) * 28).toFixed(0);
  const netVendorProfit = (parseFloat(grossPlasticValue) - parseFloat(aggregatedFuelCost)).toFixed(0);

  return (
    <section id="simulator" className="py-24 bg-slate-950/60 border-t border-b border-emerald-900/30 relative">
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-md bg-emerald-950 px-3 py-1 text-xs font-black uppercase text-emerald-400 border border-emerald-800/40 mb-3">
              Interactive B2B Calculator
            </div>
            <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">
              Scrap Trader Route Profitability
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Adjust neighborhood shop count and average digital bin volume to see how aggregation turns loss-making trips into high-margin logistics routes.
            </p>

            {/* Sliders */}
            <div className="mt-8 space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Shops Reaching 2.0 KG Threshold in Zone</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">{shopCount} Shops</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={shopCount}
                  onChange={(e) => setShopCount(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-800 accent-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Average Digital Bin Weight per Shop</span>
                  <span className="text-teal-400 font-mono font-bold text-sm">{avgWeightKg} KG</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="5.0"
                  step="0.1"
                  value={avgWeightKg}
                  onChange={(e) => setAvgWeightKg(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-800 accent-teal-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Results Comparison Box */}
          <div className="lg:col-span-7">
            <div className="bkk-card rounded-3xl p-8 border border-emerald-500/30">
              <h3 className="text-lg font-black text-white mb-6 flex items-center justify-between border-b border-emerald-900/40 pb-4">
                <span>Route Profitability Comparison</span>
                <span className="text-xs font-mono text-emerald-400">Total Volume: {totalWeight} KG</span>
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Traditional Unaggregated */}
                <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400 block mb-2">
                    Traditional (Unaggregated)
                  </span>
                  <div className="text-2xl font-black text-red-300">₹{unaggregatedFuelCost}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Total fuel spent making {shopCount} separate trips.</p>
                  <div className="mt-4 pt-3 border-t border-red-950 text-xs font-bold text-red-400">
                    Outcome: Net Loss / Refused Trips
                  </div>
                </div>

                {/* Nirvaha Aggregated */}
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-5 relative overflow-hidden">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">
                    Nirvaha Aggregated Route
                  </span>
                  <div className="text-2xl font-black text-emerald-300">₹{netVendorProfit}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Net profit after 1 single clustered neighborhood route.</p>
                  <div className="mt-4 pt-3 border-t border-emerald-900/60 text-xs font-black text-emerald-400">
                    Outcome: High Margin B2B Collection
                  </div>
                </div>

              </div>

              <div className="mt-6 rounded-xl bg-slate-950/80 p-4 text-xs text-slate-300 flex items-center justify-between border border-slate-800">
                <span>Estimated Fuel Saved per Route: <strong>{(shopCount * 0.8).toFixed(1)} Liters</strong></span>
                <span className="text-emerald-400 font-bold">CO₂ Reduced: ~{(shopCount * 1.9).toFixed(1)} kg</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
