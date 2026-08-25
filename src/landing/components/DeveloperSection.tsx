'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const GithubIcon = () => (
  <svg className="w-5 h-5 group-hover:text-[#10b981] transition-colors" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-5 h-5 group-hover:text-[#10b981] transition-colors" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-5 h-5 group-hover:text-[#10b981] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);


export default function DeveloperSection() {
  return (
    <section id="developer" className="bg-black text-white py-24 px-8 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          
          <div className="max-w-2xl">
            <p className="font-mono-label text-[#10b981] mb-4">THE DEVELOPER</p>
            <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-black leading-[1.0] tracking-tighter uppercase mb-8">
              BUILT BY<br/>TEAM THE TESSERACTIS
            </h2>
            <p className="text-neutral-400 leading-relaxed mb-6">
              Nirvaha was rapidly prototyped and developed during the 36-hour GDG Coimbatore Build With AI 2026 Hackathon (Sustainable Cities Track). The platform integrates a Flutter mobile app, NestJS backend, WebSockets for real-time routing, and Gemini 1.5 Flash for vision AI.
            </p>
            <p className="font-mono-label text-neutral-500 text-xs">
              DEVELOPER: ARUN V (TEAM-109)
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-4 min-w-[300px]">
            <p className="font-mono-label text-neutral-500 text-xs mb-2">CONNECT & COLLABORATE</p>
            
            <a href="https://github.com/Cherie05" target="_blank" rel="noopener noreferrer" 
               className="group flex items-center justify-between p-4 border border-neutral-800 hover:border-[#10b981] hover:bg-white/5 transition-all text-neutral-400 hover:text-white">
              <div className="flex items-center gap-4">
                <GithubIcon />
                <span className="font-bold tracking-wide">GitHub Profile</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-[#10b981] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>

            <a href="https://linkedin.com/in/arunv" target="_blank" rel="noopener noreferrer" 
               className="group flex items-center justify-between p-4 border border-neutral-800 hover:border-[#10b981] hover:bg-white/5 transition-all text-neutral-400 hover:text-white">
              <div className="flex items-center gap-4">
                <LinkedinIcon />
                <span className="font-bold tracking-wide">LinkedIn</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-[#10b981] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>

            <a href="https://your-portfolio.com" target="_blank" rel="noopener noreferrer" 
               className="group flex items-center justify-between p-4 border border-neutral-800 hover:border-[#10b981] hover:bg-white/5 transition-all text-neutral-400 hover:text-white">
              <div className="flex items-center gap-4">
                <GlobeIcon />
                <span className="font-bold tracking-wide">Portfolio Website</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-[#10b981] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
