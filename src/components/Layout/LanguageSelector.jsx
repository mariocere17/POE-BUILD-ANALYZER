// src/components/Layout/LanguageSelector.jsx
import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const LanguageSelector = () => {
  const { language, changeLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', label: t('language.english'), flag: '🇬🇧' },
    { code: 'es', label: t('language.spanish'), flag: '🇪🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {/* Language Options Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-900 border-2 border-cyan-500/50 rounded-lg shadow-lg shadow-cyan-500/20 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-cyan-500/20 transition-colors ${
                language === lang.code ? 'bg-cyan-500/30 text-cyan-300' : 'text-white'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium whitespace-nowrap">{lang.label}</span>
            </button>
          ))}
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
          <span className="text-lg font-bold">{currentLanguage?.flag}</span>
        </div>
        <span className="absolute bottom-full left-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {t('language.changeLanguage')}
        </span>
      </button>
    </div>
  );
};

export default LanguageSelector;
