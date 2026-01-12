// src/config/apiConfig.js

/**
 * API Configuration
 * Configura las URLs base según el entorno (desarrollo/producción)
 */

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// URL del proxy server según el entorno
// En producción (Vercel), las funciones serverless están en la misma URL que el frontend
// En desarrollo, usar el proxy-server local
export const API_BASE_URL = isDevelopment
  ? 'http://localhost:3001'
  : (process.env.REACT_APP_API_URL || '');

// Endpoints de la API
export const API_ENDPOINTS = {
  stats: `${API_BASE_URL}/api/stats`,
  pobFetch: `${API_BASE_URL}/api/pob/fetch`,
  leagues: `${API_BASE_URL}/api/leagues`,
  currency: `${API_BASE_URL}/api/poe2scout/currency`,
  currencyMulti: `${API_BASE_URL}/api/poe2scout/items-multi`,
};

// Validación de URLs
export const isValidURL = (string) => {
  try {
    const url = new URL(string);
    // Solo permitir HTTPS y HTTP
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Validación específica para URLs de PoB
export const isValidPoBURL = (url) => {
  if (!isValidURL(url)) return false;

  try {
    const urlObj = new URL(url);
    // Solo permitir dominios confiables
    const allowedDomains = ['pobb.in', 'www.pobb.in'];
    return allowedDomains.includes(urlObj.hostname);
  } catch (_) {
    return false;
  }
};

// Sanitizar URLs antes de abrir en nueva ventana
export const sanitizeTradeURL = (url) => {
  try {
    const urlObj = new URL(url);
    // Solo permitir URLs del dominio oficial de PoE
    const allowedDomains = ['pathofexile.com', 'www.pathofexile.com'];
    if (!allowedDomains.includes(urlObj.hostname)) {
      throw new Error('Invalid trade URL domain');
    }
    return url;
  } catch (error) {
    console.error('URL sanitization failed:', error);
    throw new Error('Invalid trade URL');
  }
};

// Timeout por defecto para requests
export const DEFAULT_TIMEOUT = 10000; // 10 segundos

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  isValidURL,
  isValidPoBURL,
  sanitizeTradeURL,
  DEFAULT_TIMEOUT
};
