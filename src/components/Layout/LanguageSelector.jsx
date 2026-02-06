// src/components/Layout/LanguageSelector.jsx
import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const FlagGB = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 60 40" className="rounded-sm">
    <rect width="60" height="40" fill="#012169" />
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="6" />
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="2" />
    <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="10" />
    <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

const FlagES = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 60 40" className="rounded-sm">
    <rect width="60" height="10" fill="#AA151B" />
    <rect y="10" width="60" height="20" fill="#F1BF00" />
    <rect y="30" width="60" height="10" fill="#AA151B" />
  </svg>
);

const FLAGS = {
  en: FlagGB,
  es: FlagES,
};

const LanguageSelector = () => {
  const { language, changeLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', label: t('language.english') },
    { code: 'es', label: t('language.spanish') }
  ];

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  const CurrentFlag = FLAGS[language];

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {/* Language Options Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-900 border-2 border-cyan-500/50 rounded-lg shadow-lg shadow-cyan-500/20 overflow-hidden">
          {languages.map((lang) => {
            const Flag = FLAGS[lang.code];
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-cyan-500/20 transition-colors ${
                  language === lang.code ? 'bg-cyan-500/30 text-cyan-300' : 'text-white'
                }`}
              >
                <Flag size={28} />
                <span className="font-medium whitespace-nowrap">{lang.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-cyan-600 hover:bg-cyan-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 group"
        aria-label={t('language.changeLanguage')}
        title={t('language.changeLanguage')}
      >
        <div className="flex items-center gap-2">
          <Languages size={24} />
          <CurrentFlag size={24} />
        </div>
        <span className="absolute bottom-full left-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {t('language.changeLanguage')}
        </span>
      </button>
    </div>
  );
};

export default LanguageSelector;
