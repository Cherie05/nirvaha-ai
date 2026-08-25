'use client';

import React from 'react';
import { ArrowUpRight, FileText, Mail, Sparkles, Building2 } from 'lucide-react';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function VcSection() {
  return (
    <section className="py-24 relative bg-gradient-to-b from-[#040d08] to-[#020604] border-t border-emerald-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="bkk-card rounded-3xl p-8 md:p-12 relative overflow-hidden border-emerald-500/30">
          <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-800/40 mb-4">
                <Building2 className="h-3.5 w-3.5" />
                Venture & Incubator Hub
              </div>
              <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">
                Ready to Scale Circular Waste Management
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed text-sm">
                Nirvaha is applying for pre-incubation and startup grant programs including Microsoft for Startups, NSRCEL (IIMB), and IIT Madras. 
                We are actively seeking mentors, strategic partners, and early-stage climate tech backing.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="https://github.com/Cherie05/nirvaha-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-6 py-3.5 text-xs font-black text-black hover:brightness-110 shadow-lg shadow-emerald-500/20"
                >
                  <GithubIcon className="h-4 w-4" />
                  View GitHub Codebase
                </a>

                <a
                  href="https://health-team-109-the-tesseractis-production.up.railway.app/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-xs font-bold text-slate-200 hover:bg-slate-800"
                >
                  <FileText className="h-4 w-4 text-emerald-400" />
                  Railway API Status
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Live Credentials & Demo Information
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Household App Credentials:</span>
                  <span className="font-mono text-emerald-400 font-bold">test@gmail.com</span> / <span className="font-mono text-slate-300">test@1234</span>
                </div>

                <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Vendor Dashboard Credentials:</span>
                  <span className="font-mono text-emerald-400 font-bold">vendor@gmail.com</span> / <span className="font-mono text-slate-300">vendor@1234</span>
                </div>

                <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Team & Track:</span>
                  <span className="text-slate-200 font-bold">Team The Tesseractis (TEAM-109)</span> · Sustainable Cities Track
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <span>© 2026 Nirvaha Platform · Built with ❤️ for Indian Communities</span>
            <span>GDG Coimbatore · TiE KovaiCon</span>
          </div>
        </div>
      </div>
    </section>
  );
}
