// src/components/Layout/Footer.jsx
import React, { useState } from 'react';
import { ExternalLink, BookOpen, Info, Link2 } from 'lucide-react';
import UserGuideModal from './UserGuideModal';

const Footer = () => {
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);

  const quickLinks = [
    { name: 'Path of Exile Official', url: 'https://www.pathofexile.com/', isPoE: true },
    { name: 'PoE Trade', url: 'https://www.pathofexile.com/trade', isPoE: true },
    { name: 'poe2scout', url: 'https://poe2scout.com/', isPrimary: true },
    { name: 'poe.ninja', url: 'https://poe.ninja/', isPrimary: true },
    { name: 'Path of Building', url: 'https://pathofbuilding.community/' },
    { name: 'pobb.in', url: 'https://pobb.in/' },
  ];

  return (
    <>
      <UserGuideModal isOpen={isUserGuideOpen} onClose={() => setIsUserGuideOpen(false)} />
    <footer className="mt-16 pt-12 border-t-2 border-slate-700/50 bg-gradient-to-b from-transparent to-slate-950/50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row md:justify-between gap-8 mb-8">

          {/* About Section */}
          <div className="space-y-3 md:flex-1 md:max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <Info size={20} className="text-cyan-400" />
              <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-wide">About</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              PoE Build Analyzer automates item searches from your Path of Building builds.
              Paste your PoB code or pobb.in URL, and instantly generate trade searches for all
              your items with customizable filters.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">The application is still under development and subject to change.</p>
          </div>

          {/* User Guide Section */}
          <div className="space-y-3 md:flex-1 md:max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={20} className="text-cyan-400" />
              <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-wide">Resources</h3>
            </div>
            <button
              onClick={() => setIsUserGuideOpen(true)}
              className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors text-sm group"
            >
              <BookOpen size={16} className="group-hover:scale-110 transition-transform" />
              <span>User Guide & FAQ</span>
            </button>
            <p className="text-slate-400 text-xs leading-relaxed">
              Learn how to use all features, troubleshoot issues, and get pro tips for efficient item searching.
            </p>
            <div className="pt-2 space-y-1.5 text-xs text-slate-400">
              <div>• Supports PoB codes & pobb.in URLs</div>
              <div>• Real-time currency prices</div>
              <div>• Customizable search filters</div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="space-y-3 md:flex-1 md:max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <Link2 size={20} className="text-cyan-400" />
              <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-wide">Quick Links</h3>
            </div>
            <div className="space-y-2">
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm transition-colors group ${
                    link.isPrimary
                      ? 'text-cyan-300 hover:text-cyan-200 font-medium'
                      : link.isPoE
                      ? 'text-amber-300 hover:text-amber-200 font-medium'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ExternalLink
                    size={14}
                    className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0"
                  />
                  <span>{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700/50 pt-6 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Disclaimer */}
            <p className="text-slate-400 text-xs text-center md:text-left">
              This site is fan-made and not affiliated with Grinding Gear Games in any way.
            </p>

            {/* Cherry Icon */}
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 512 512"
                className="w-6 h-6 opacity-70"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Tallo */}
                <path
                  fill="#8B4513"
                  d="M256 32c-8 0-16 4-20 12l-48 96c-4 8-2 18 6 22s18 2 22-6l40-80c4-8 2-18-6-22-4-4-8-6-2-6z"
                />
                <path
                  fill="#8B4513"
                  d="M256 32c8 0 16 4 20 12l48 96c4 8 2 18-6 22s-18 2-22-6l-40-80c-4-8-2-18 6-22 4-4 8-6 2-6z"
                />

                {/* Cereza izquierda */}
                <circle cx="200" cy="260" r="130" fill="#DC143C"/>
                <ellipse cx="180" cy="240" rx="40" ry="50" fill="#FF6B6B" opacity="0.4"/>

                {/* Cereza derecha */}
                <circle cx="312" cy="300" r="110" fill="#C41E3A"/>
                <ellipse cx="295" cy="285" rx="35" ry="40" fill="#FF6B6B" opacity="0.3"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;