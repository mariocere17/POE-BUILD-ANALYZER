// src/components/Layout/UserGuideModal.jsx
import React from 'react';
import { X, ExternalLink, BookOpen, Zap, Search, Edit3, Copy, Globe } from 'lucide-react';

const UserGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-slate-700 bg-gradient-to-r from-cyan-900/20 to-slate-900">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-cyan-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">User Guide & FAQ</h2>
              <p className="text-sm text-slate-400">Learn how to use PoE Build Analyzer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-8 flex-1">

          {/* Quick Start */}
          <section>
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <Zap size={20} />
              Quick Start
            </h3>
            <div className="space-y-4 text-slate-300">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-white mb-2">Step 1: Get Your Build Code</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>From Path of Building: Click "Import/Export Build" → "Generate"</li>
                  <li>From pobb.in: Copy the URL (e.g., https://pobb.in/VVZy6u-NrRUi)</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-white mb-2">Step 2: Analyze Your Build</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Select your game (PoE1 or PoE2) and league</li>
                  <li>Paste the code or URL</li>
                  <li>Click "Analyze Build"</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-white mb-2">Step 3: Search for Items</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Click "Edit filters" to customize searches</li>
                  <li>Click "Copy URL" to share or save</li>
                  <li>Click "Search in Trade" to buy items</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Main Features */}
          <section>
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <Search size={20} />
              Main Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Edit3 size={18} className="text-amber-400" />
                  <h4 className="font-semibold text-white">Edit Filters</h4>
                </div>
                <p className="text-sm text-slate-300">
                  Customize which mods to search for and set min/max values
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Copy size={18} className="text-green-400" />
                  <h4 className="font-semibold text-white">Copy URL</h4>
                </div>
                <p className="text-sm text-slate-300">
                  Save trade searches to compare prices or share with friends
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={18} className="text-cyan-400" />
                  <h4 className="font-semibold text-white">Open Trade</h4>
                </div>
                <p className="text-sm text-slate-300">
                  Instantly search on the official PoE trade site
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">

              <details className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 cursor-pointer group">
                <summary className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  What formats does the app accept?
                </summary>
                <div className="mt-3 text-sm text-slate-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Raw PoB codes (base64): <code className="text-cyan-300">eNrtXW1z27gR...</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>pobb.in URLs: <code className="text-cyan-300">https://pobb.in/VVZy6u-NrRUi</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">✗</span>
                    <span>poe.ninja URLs (copy the code from the page instead)</span>
                  </div>
                </div>
              </details>

              <details className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 cursor-pointer group">
                <summary className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  What does "Edit filters" do?
                </summary>
                <div className="mt-3 text-sm text-slate-300">
                  <p>The Edit modal allows you to:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Select which mods to search for (uncheck ones you don't care about)</li>
                    <li>Set value ranges (e.g., search for 40-60% Fire Resistance instead of exactly 50%)</li>
                    <li>Adjust minimum item level</li>
                    <li>Change rarity filters</li>
                  </ul>
                </div>
              </details>

              <details className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 cursor-pointer group">
                <summary className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  What's the difference between "Any" and "Instant Buyout"?
                </summary>
                <div className="mt-3 text-sm text-slate-300">
                  <ul className="space-y-2">
                    <li><strong className="text-white">Any:</strong> Shows all items, including those from offline players</li>
                    <li><strong className="text-white">Instant Buyout:</strong> Only shows items available in async trade</li>
                  </ul>
                  <p className="mt-2 text-amber-400 text-xs">
                    💡 Tip: Use "Any" when u want to see multiple options, be aware of possible pricefixing.
                  </p>
                </div>
              </details>

              <details className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 cursor-pointer group">
                <summary className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  What if I get "No items found" on trade?
                </summary>
                <div className="mt-3 text-sm text-slate-300">
                  <p>This can happen if your filters are too strict. Try:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Disable some mods in "Edit filters"</li>
                    <li>Widen the min/max value ranges</li>
                    <li>Lower the minimum item level</li>
                    <li>Switch from "Instant Buyout" to "Any"</li>
                  </ul>
                </div>
              </details>

              <details className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 cursor-pointer group">
                <summary className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  How often do currency prices update?
                </summary>
                <div className="mt-3 text-sm text-slate-300">
                  <p>Currency prices are fetched in real-time when you load the page:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong className="text-cyan-300">PoE2:</strong> Data from poe2scout.com (official GGG Currency Exchange)</li>
                    <li><strong className="text-amber-300">PoE1:</strong> Data from poe.ninja (community data)</li>
                  </ul>
                </div>
              </details>

            </div>
          </section>

          {/* Pro Tips */}
          <section>
            <h3 className="text-xl font-bold text-cyan-400 mb-4">💡 Pro Tips</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="bg-gradient-to-r from-amber-900/20 to-transparent p-4 rounded-lg border-l-4 border-amber-500">
                <h4 className="font-semibold text-amber-300 mb-1">Start Broad, Then Narrow</h4>
                <p>Disable most mods first to check the price range, then enable more mods if needed.</p>
              </div>
              <div className="bg-gradient-to-r from-green-900/20 to-transparent p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-300 mb-1">Use Copy URL for Shopping</h4>
                <p>Copy URLs for all items to a notepad, compare prices, and buy the best value items first.</p>
              </div>
              <div className="bg-gradient-to-r from-cyan-900/20 to-transparent p-4 rounded-lg border-l-4 border-cyan-500">
                <h4 className="font-semibold text-cyan-300 mb-1">Check the Currency Panel</h4>
                <p>Before buying, check Divine to Chaos ratios to calculate if paying in Divines or Chaos is better.</p>
              </div>
            </div>
          </section>

          {/* External Resources */}
          <section>
            <h3 className="text-xl font-bold text-cyan-400 mb-4">📚 External Resources</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="https://www.pathofexile.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-amber-500 transition-colors group">
                <ExternalLink size={16} className="text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-sm text-slate-300 group-hover:text-white">PoE Official</span>
              </a>
              <a href="https://www.pathofexile.com/trade" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-amber-500 transition-colors group">
                <ExternalLink size={16} className="text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-sm text-slate-300 group-hover:text-white">PoE Trade</span>
              </a>
              <a href="https://poe2scout.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500 transition-colors group">
                <ExternalLink size={16} className="text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-sm text-slate-300 group-hover:text-white">poe2scout</span>
              </a>
              <a href="https://poe.ninja/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500 transition-colors group">
                <ExternalLink size={16} className="text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-sm text-slate-300 group-hover:text-white">poe.ninja</span>
              </a>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t-2 border-slate-700 p-4 bg-slate-900/50 text-center">
          <p className="text-xs text-slate-400">
            Version 1.8.0 • For more detailed documentation, visit the{' '}
            <a
              href="https://github.com/your-repo/poe-build-analyzer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              GitHub repository
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModal;
