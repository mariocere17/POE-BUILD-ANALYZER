// src/services/statsAPI.js
import { API_ENDPOINTS } from '../config/apiConfig';

const STATS_CACHE_KEY = 'poe_stats_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Gets cached stats from localStorage
 */
const getCachedStats = (game) => {
  try {
    const cached = localStorage.getItem(`${STATS_CACHE_KEY}_${game}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > CACHE_DURATION) {
      console.log('[STATS] Cache expired, needs refresh');
      localStorage.removeItem(`${STATS_CACHE_KEY}_${game}`);
      return null;
    }

    console.log(`[STATS] Using localStorage cache (age: ${Math.floor(age / 1000 / 60)} minutes)`);
    return data;
  } catch (error) {
    console.error('[STATS] Error reading cache:', error);
    return null;
  }
};

/**
 * Saves stats to localStorage
 */
const setCachedStats = (game, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${STATS_CACHE_KEY}_${game}`, JSON.stringify(cacheData));
    console.log('[STATS] Stats cached to localStorage');
  } catch (error) {
    console.error('[STATS] Error saving to cache:', error);
  }
};

/**
 * Fetches stat IDs from the local proxy server
 * @param {string} game - 'poe2' or 'poe1'
 * @param {object} statCache - Current cached stats (in-memory)
 * @returns {Promise<object|null>} Stats data or null if failed
 */
export const fetchStatIds = async (game, statCache) => {
  // Check in-memory cache first
  if (statCache) {
    console.log('[STATS] Using in-memory cache');
    return statCache;
  }

  // Check localStorage cache
  const cachedStats = getCachedStats(game);
  if (cachedStats) {
    return cachedStats;
  }

  const gameParam = game === 'poe2' ? 'poe2' : 'poe1';

  try {
    console.log('[STATS] Fetching stats from proxy server for game:', gameParam);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${API_ENDPOINTS.stats}?realm=${gameParam}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[STATS] API error:', response.status);
      throw new Error(`API returned ${response.status}`);
    }

    const statsData = await response.json();
    console.log('[STATS] Response structure:', Object.keys(statsData));

    if (statsData.error) {
      console.error('[STATS] API returned error:', JSON.stringify(statsData.error));
      throw new Error('API returned error response');
    }

    if (!statsData.result) {
      console.error('[STATS] ERROR: No result field in response!', statsData);
      throw new Error('No result field in response');
    }

    console.log('[STATS] ✅ Stats fetched successfully:', statsData.result.length, 'categories');

    // Save to localStorage for future use
    setCachedStats(game, statsData);

    return statsData;
  } catch (error) {
    console.error('[STATS] Proxy request failed:', error.message);

    // Fallback: try direct request to PoE API (CORS might block, but worth trying)
    try {
      console.log('[STATS] Attempting direct API call as fallback...');
      const directResponse = await fetch(`https://www.pathofexile.com/api/trade/data/stats?realm=${gameParam}`, {
        mode: 'cors',
        credentials: 'omit'
      });

      if (directResponse.ok) {
        const directData = await directResponse.json();
        if (directData.result) {
          console.log('[STATS] ✅ Direct API call succeeded!', directData.result.length, 'categories');
          setCachedStats(game, directData);
          return directData;
        }
      }
    } catch (directError) {
      console.error('[STATS] Direct API call also failed:', directError.message);
    }

    // Final fallback: try to load static JSON file
    try {
      console.log('[STATS] Attempting to load static fallback file...');
      const fallbackResponse = await fetch(`/data/${gameParam}-stats.json`);

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.result) {
          console.log('[STATS] ✅ Static fallback loaded successfully!', fallbackData.result.length, 'categories');
          setCachedStats(game, fallbackData);
          return fallbackData;
        }
      }
    } catch (fallbackError) {
      console.error('[STATS] Static fallback also failed:', fallbackError.message);
    }

    console.log('[STATS] ⚠️ All methods failed - URL will work without mod filters');
    return null;
  }
};

/**
 * Finds the stat ID for a given normalized mod text
 * @param {object} stats - Stats data from API
 * @param {string} normalizedMod - Normalized mod text
 * @param {string} modType - 'enchant', 'implicit', or 'explicit'
 * @returns {string|null} Stat ID or null if not found
 */
export const findStatId = (stats, normalizedMod, modType) => {
  if (!stats || !stats.result) return null;

  const cleanMod = normalizedMod
    .replace(/\+/g, '')
    .replace(/^#% /, '#% ')
    .replace(/^# /, '# ')
    .trim();

  for (const category of stats.result) {
    const categoryLabel = category.label.toLowerCase();

    if (modType === 'enchant' && !categoryLabel.includes('enchant')) continue;
    if (modType === 'implicit' && categoryLabel.includes('explicit')) continue;
    if (modType === 'explicit' && categoryLabel.includes('implicit')) continue;

    for (const entry of category.entries || []) {
      let entryText = entry.text
        .replace(/[+-]?\d+(\.\d+)?/g, '#')
        .replace(/#%/g, '#%')
        .replace(/\+/g, '')
        .trim();

      if (entryText === cleanMod || entryText === normalizedMod) {
        console.log(`[STATS] ✓ Found: "${normalizedMod}" -> ${entry.id}`);
        return entry.id;
      }

      if (cleanMod.length > 10 && entryText.includes(cleanMod.replace(/^# /, '').replace(/^#% /, ''))) {
        console.log(`[STATS] ✓ Found (partial): "${normalizedMod}" -> ${entry.id}`);
        return entry.id;
      }
    }
  }

  console.log(`[STATS] ✗ Not found: "${normalizedMod}" (${modType})`);
  return null;
};

/**
 * Validates if a stat ID exists in the stats data
 * @param {object} stats - Stats data from API
 * @param {string} statId - Stat ID to validate
 * @returns {boolean} True if stat exists
 */
export const validateStatId = (stats, statId) => {
  if (!stats || !stats.result) return false;

  for (const category of stats.result) {
    if (category.entries.some(e => e.id === statId)) {
      return true;
    }
  }

  return false;
};
