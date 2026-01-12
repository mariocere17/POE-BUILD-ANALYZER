// src/utils/constants.js
import { API_ENDPOINTS } from '../config/apiConfig';

// Ligas por defecto (fallback si la API falla)
// IMPORTANTE: Solo 3 ligas - Liga actual + Hardcore + Standard
export const DEFAULT_LEAGUES = {
  poe2: [
    { display: 'Fate of the Vaal', value: 'Fate of the Vaal' },
    { display: 'HC Fate of the Vaal', value: 'HC Fate of the Vaal' },
    { display: 'Standard', value: 'Standard' }
  ],
  poe1: [
    { display: 'Keepers of the Flame', value: 'Keepers of the Flame' },
    { display: 'Hardcore Keepers', value: 'Hardcore Keepers of the Flame' },
    { display: 'Standard', value: 'Standard' }
  ]
};

// Función para obtener ligas activas desde la API
export const fetchActiveLeagues = async (game = 'poe1') => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_ENDPOINTS.leagues}?game=${game}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch leagues');
    }
    const leagues = await response.json();

    // Convertir al formato esperado
    return leagues.map(league => ({
      display: league.id,
      value: league.id
    }));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching leagues, using defaults:', error);
    }
    return DEFAULT_LEAGUES[game];
  }
};

// Exportar también como LEAGUES para mantener compatibilidad
export const LEAGUES = DEFAULT_LEAGUES;

export const JEWEL_TYPES = ['Sapphire', 'Diamond', 'Ruby', 'Emerald', 'Topaz', 'Amethyst'];

export const RARITY_OPTIONS = ['normal', 'magic', 'rare', 'unique'];

export const SELLER_STATUS_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'online', label: 'Instant Buyout' }
];

export const TRADE_BASE_URLS = {
  poe2: 'https://www.pathofexile.com/trade2/search/poe2',
  poe1: 'https://www.pathofexile.com/trade/search'
};
