// src/components/Layout/UserGuideModal.jsx
import React from 'react';
import { X, ExternalLink, BookOpen, Zap, Search, Edit3, Copy, Globe } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const UserGuideModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-slate-700 bg-gradient-to-r from-cyan-900/20 to-slate-900">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-cyan-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">{t('userGuide.title')}</h2>
              <p className="text-sm text-slate-400">{t('userGuide.gettingStarted')}</p>
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
              {t('userGuide.gettingStarted')}
            </h3>
            <div className="space-y-4 text-slate-300">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-white mb-2">{t('userGuide.step1Title')}</h4>
                <p className="text-sm">{t('userGuide.step1Desc')}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-white mb-2">{t('userGuide.step2Title')}</h4>
                <p className="text-sm">{t('userGuide.step2Desc')}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-white mb-2">{t('userGuide.step3Title')}</h4>
                <p className="text-sm">{t('userGuide.step3Desc')}</p>
              </div>
            </div>
          </section>

          {/* Main Features */}
          <section>
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <Search size={20} />
              {t('userGuide.featuresTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Edit3 size={18} className="text-amber-400" />
                  <h4 className="font-semibold text-white">{t('userGuide.feature1Title')}</h4>
                </div>
                <p className="text-sm text-slate-300">
                  {t('userGuide.feature1Desc')}
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Copy size={18} className="text-green-400" />
                  <h4 className="font-semibold text-white">{t('userGuide.feature2Title')}</h4>
                </div>
                <p className="text-sm text-slate-300">
                  {t('userGuide.feature2Desc')}
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={18} className="text-cyan-400" />
                  <h4 className="font-semibold text-white">{t('userGuide.feature3Title')}</h4>
                </div>
                <p className="text-sm text-slate-300">
                  {t('userGuide.feature3Desc')}
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink size={18} className="text-cyan-400" />
                  <h4 className="font-semibold text-white">{t('userGuide.feature4Title')}</h4>
                </div>
                <p className="text-sm text-slate-300">
                  {t('userGuide.feature4Desc')}
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h3 className="text-xl font-bold text-cyan-400 mb-4">{t('userGuide.faqTitle')}</h3>
            <div className="space-y-4">

              <details className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 cursor-pointer group">
                <summary className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {t('userGuide.faq1Question')}
                </summary>
                <div className="mt-3 text-sm text-slate-300">
                  <p>{t('userGuide.faq1Answer')}</p>
                </div>
              </details>

              <details className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 cursor-pointer group">
                <summary className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {t('userGuide.faq2Question')}
                </summary>
                <div className="mt-3 text-sm text-slate-300">
                  <p>{t('userGuide.faq2Answer')}</p>
                </div>
              </details>

              <details className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 cursor-pointer group">
                <summary className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {t('userGuide.faq3Question')}
                </summary>
                <div className="mt-3 text-sm text-slate-300">
                  <p>{t('userGuide.faq3Answer')}</p>
                </div>
              </details>

              <details className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 cursor-pointer group">
                <summary className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {t('userGuide.faq4Question')}
                </summary>
                <div className="mt-3 text-sm text-slate-300">
                  <p>{t('userGuide.faq4Answer')}</p>
                </div>
              </details>

            </div>
          </section>

          {/* Troubleshooting */}
          <section>
            <h3 className="text-xl font-bold text-cyan-400 mb-4">{t('userGuide.troubleshootingTitle')}</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="bg-gradient-to-r from-amber-900/20 to-transparent p-4 rounded-lg border-l-4 border-amber-500">
                <h4 className="font-semibold text-amber-300 mb-1">{t('userGuide.trouble1Title')}</h4>
                <p>{t('userGuide.trouble1Desc')}</p>
              </div>
              <div className="bg-gradient-to-r from-green-900/20 to-transparent p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-300 mb-1">{t('userGuide.trouble2Title')}</h4>
                <p>{t('userGuide.trouble2Desc')}</p>
              </div>
              <div className="bg-gradient-to-r from-cyan-900/20 to-transparent p-4 rounded-lg border-l-4 border-cyan-500">
                <h4 className="font-semibold text-cyan-300 mb-1">{t('userGuide.trouble3Title')}</h4>
                <p>{t('userGuide.trouble3Desc')}</p>
              </div>
            </div>
          </section>

          {/* External Resources */}
          <section>
            <h3 className="text-xl font-bold text-cyan-400 mb-4">{t('userGuide.externalResources')}</h3>
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
            Version 2.4.0 •{' '}
            <a
              href="https://github.com/mariocere17/POE-BUILD-ANALYZER"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModal;