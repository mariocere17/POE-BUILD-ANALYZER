// src/i18n/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

const STORAGE_KEY = 'poe_analyzer_language';
const DEFAULT_LANGUAGE = 'en';

export const LanguageProvider = ({ children }) => {
  // Initialize language from localStorage or browser preference
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === 'en' || stored === 'es')) {
      return stored;
    }

    // // Check browser language
    // const browserLang = navigator.language?.split('-')[0];
    // if (browserLang === 'es') {
    //   return 'es';
    // }

    return DEFAULT_LANGUAGE;
  });

  // Persist language to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const changeLanguage = (newLang) => {
    if (newLang === 'en' || newLang === 'es') {
      setLanguage(newLang);
    }
  };

  const t = (key, params = {}) => {
    if (typeof key !== 'string' || key.length === 0) {
      return '';
    }

    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // Fallback to English if translation missing
        value = translations['en'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object') {
            value = value[fallbackKey];
          } else {
            return key; // Return key if all else fails
          }
        }
        break;
      }
    }

    let result = value || key;

    // Replace {{param}} with actual values
    if (typeof result === 'string' && Object.keys(params).length > 0) {
      for (const [param, paramValue] of Object.entries(params)) {
        const escapedParam = param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp(`\\{\\{${escapedParam}\\}\\}`, 'g'), paramValue);
      }
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
