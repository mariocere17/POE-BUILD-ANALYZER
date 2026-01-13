// src/components/Layout/Header.jsx
import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const Header = () => {
  const { t } = useLanguage();

  return (
    <div className="text-center mb-10">
      <h1 className="text-5xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 tracking-tight">
        PoE Build Analyzer
      </h1>
      <p className="text-slate-400 text-lg">{t('header.subtitle')}</p>
    </div>
  );
};

export default Header;
