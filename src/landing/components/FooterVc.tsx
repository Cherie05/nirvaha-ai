'use client';

import React from 'react';
import { ArrowUpRight, FileText, Building2 } from 'lucide-react';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function FooterVc() {
  return (
    <footer className="py-20 bg-white border-t-2 border-black">
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="bkk-light-card rounded-3xl p-8 md:p-12 bg-[#fafafa]">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7">
              <span className="bkk-badge text-xs mb-3 inline-block">FOR VENTURE CAPITALISTS & INCUBATORS</span>
              <h2 className="text-3xl font-black text-black sm:text-5xl uppercase tracking-tighter leading-tight">
                Ready to Scale Circular Waste Logistics
              </h2>
              <p className="mt-4 text-xs font-medium text-slate-700 leading-relaxed max-w-xl">
                Nirvaha is applying for pre-incubation programs including Microsoft for Startups, NSRCEL (IIM Bangalore), and IIT Madras. 
                We are actively seeking strategic climate-tech backing and mentorship.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="https://github.com/Cherie05/nirvaha-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border-2 border-black bg-black px-6 py-3.5 text-xs font-black text-white shadow-[4px_4px_0px_0px_#10b981] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                >
                  <GithubIcon className="h-4 w-4" />
                  GitHub Codebase
                </a>

                <a
                  href="https://health-team-109-the-tesseractis-production.up.railway.app/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border-2 border-black bg-white px-6 py-3.5 text-xs font-black text-black shadow-[4px_4px_0px_0px_#000] hover:bg-slate-100 transition-all"
                >
                  <FileText className="h-4 w-4" />
                  Railway API Status
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_#000]">
                <h3 className="text-xs font-black uppercase text-black mb-4 border-b-2 border-black pb-2">
                  Seeded Test Credentials
                </h3>
                <div className="space-y-3 text-xs font-bold text-slate-900">
                  <div className="p-2.5 bg-slate-100 border border-black">
                    <span className="text-slate-500 block text-[10px]">Household App Login:</span>
                    <span className="font-mono text-emerald-800">test@gmail.com</span> / <span className="font-mono">test@1234</span>
                  </div>
                  <div className="p-2.5 bg-slate-100 border border-black">
                    <span className="text-slate-500 block text-[10px]">Vendor Dashboard Login:</span>
                    <span className="font-mono text-emerald-800">vendor@gmail.com</span> / <span className="font-mono">vendor@1234</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-12 pt-6 border-t-2 border-black flex flex-wrap justify-between items-center text-xs font-bold text-slate-700">
            <span>© 2026 NIRVAHA PLATFORM · Team The Tesseractis (TEAM-109)</span>
            <span>GDG Coimbatore · TiE KovaiCon</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
