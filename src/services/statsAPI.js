// src/services/statsAPI.js
import { API_ENDPOINTS } from '../config/apiConfig';

/**
 * Fetches stat IDs from the local proxy server
 * @param {string} game - 'poe2' or 'poe1'
 * @param {object} statCache - Current cached stats
 * @returns {Promise<object|null>} Stats data or null if failed
 */
export const fetchStatIds = async (game, statCache) => {
  if (statCache) return statCache;

  try {
    const gameParam = game === 'poe2' ? 'poe2' : 'poe1';

    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching stats from proxy server...');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${API_ENDPOINTS.stats}?realm=${gameParam}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Proxy error:', response.status);
      }
      return null;
    }

    const statsData = await response.json();
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Stats fetched successfully:', statsData.result?.length, 'categories');
    }
    return statsData;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching stat IDs:', error);
      console.log('⚠️ Stats API not available - URL will work without mod filters');
    }
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
        if (process.env.NODE_ENV === 'development') {
          console.log(`✓ Found: "${normalizedMod}" -> ${entry.id}`);
        }
        return entry.id;
      }

      if (cleanMod.length > 10 && entryText.includes(cleanMod.replace(/^# /, '').replace(/^#% /, ''))) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✓ Found (partial): "${normalizedMod}" -> ${entry.id}`);
        }
        return entry.id;
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`✗ Not found: "${normalizedMod}" (${modType})`);
  }
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
