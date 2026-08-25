'use client';

import React from 'react';
import { ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';


const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);


export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-900/30 bg-[#060e0a]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20">
            <Sparkles className="h-5 w-5 text-black" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white">Nirvaha</span>
            <span className="ml-2 rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400 border border-emerald-800/50">
              AI Circularity
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-8 md:flex text-sm font-medium text-slate-300">
          <a href="#problem" className="hover:text-emerald-400 transition-colors">The Problem</a>
          <a href="#showcase" className="hover:text-emerald-400 transition-colors">How It Works</a>
          <a href="#metrics" className="hover:text-emerald-400 transition-colors">Validation</a>
          <a href="#tech" className="hover:text-emerald-400 transition-colors">Architecture</a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Cherie05/nirvaha-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800 hover:border-emerald-500/40"
          >
            <GithubIcon className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://nirvaha-vendor.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-black transition-all hover:bg-emerald-400 shadow-lg shadow-emerald-500/25"
          >
            Vendor Dashboard
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
