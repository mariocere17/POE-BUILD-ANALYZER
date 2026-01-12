// src/services/statsAPI.js
import { API_ENDPOINTS } from '../config/apiConfig';

/**
 * Fetches stat IDs from the local proxy server
 * @param {string} game - 'poe2' or 'poe1'
 * @param {object} statCache - Current cached stats
 * @returns {Promise<object|null>} Stats data or null if failed
 */
export const fetchStatIds = async (game, statCache) => {
  if (statCache) {
    console.log('[STATS] Using cached stats');
    return statCache;
  }

  try {
    const gameParam = game === 'poe2' ? 'poe2' : 'poe1';
    console.log('[STATS] Fetching stats from proxy server for game:', gameParam);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${API_ENDPOINTS.stats}?realm=${gameParam}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[STATS] API error:', response.status);
      return null;
    }

    const statsData = await response.json();
    console.log('[STATS] Response structure:', Object.keys(statsData));

    if (statsData.error) {
      console.error('[STATS] API returned error:', JSON.stringify(statsData.error));
      return null;
    }

    if (!statsData.result) {
      console.error('[STATS] ERROR: No result field in response!', statsData);
      return null;
    }

    console.log('[STATS] ✅ Stats fetched successfully:', statsData.result.length, 'categories');
    return statsData;
  } catch (error) {
    console.error('[STATS] Error fetching stat IDs:', error.message);
    console.log('[STATS] ⚠️ Stats API not available - URL will work without mod filters');
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
