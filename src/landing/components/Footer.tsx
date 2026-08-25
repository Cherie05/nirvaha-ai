'use client';

import React from 'react';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-[#10b981] border-t-4 border-black">
      {/* Main CTA */}
      <div className="max-w-7xl mx-auto px-8 pt-16 pb-8">
        <h2 className="text-[clamp(2rem,5vw,5rem)] font-black leading-[1.0] tracking-tighter text-black uppercase mb-4">
          DON'T FORGET,<br />YOUR PLASTIC CAN DO MORE
        </h2>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-black/20 px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono-label text-black/60 text-[10px]">
            ©2026 NIRVAHA PLATFORM. TEAM THE TESSERACTIS (TEAM-109).
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Cherie05/nirvaha-ai" target="_blank" rel="noopener noreferrer"
              className="font-mono-label text-black/80 text-[10px] border border-black/40 px-3 py-1 hover:bg-black hover:text-[#10b981] transition-colors flex items-center gap-2">
              <GithubIcon className="h-3 w-3" />
              GITHUB
            </a>
            <a href="https://nirvaha-vendor.netlify.app" target="_blank" rel="noopener noreferrer"
              className="font-mono-label text-black/80 text-[10px] border border-black/40 px-3 py-1 hover:bg-black hover:text-[#10b981] transition-colors">
              VENDOR DASHBOARD
            </a>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-black/10 px-8 py-2">
        <p className="font-mono-label text-black/50 text-[10px] max-w-7xl mx-auto">
          THIS PROJECT WAS BUILT DURING A 36-HOUR HACKATHON FOR COMMUNITY IMPACT, NOT COMMERCIAL USE.
        </p>
      </div>
    </footer>
  );
}
