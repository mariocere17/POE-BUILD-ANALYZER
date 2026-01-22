// src/services/statsAPI.js
import { API_ENDPOINTS } from '../config/apiConfig';

const STATS_CACHE_KEY = 'poe_stats_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// FEATURE FLAG: Toggle between exact matching (legacy) and fuzzy matching (new)
// Set to true to enable fuzzy matching, false to use the original exact matching
// ============================================================================
const USE_FUZZY_MATCHING = true;
const FUZZY_MIN_SCORE = 0.75; // Minimum similarity score to accept a match (0-1)

/**
 * Mappings for terminology differences between PoB/PoE2 and Trade API
 * PoB uses certain terms that differ from the official Trade API
 */
const STAT_ALIASES = [
  // Critical Hit Chance -> Critical Strike Chance (basic transformation)
  { from: /Critical Hit Chance/gi, to: 'Critical Strike Chance' },
  // Critical Hit Multiplier -> Critical Strike Multiplier
  { from: /Critical Hit Multiplier/gi, to: 'Critical Strike Multiplier' },
  // "for Spells" at the end -> "Spell X" at the beginning
  { from: /#% increased Critical Strike Chance for Spells/gi, to: '#% increased Spell Critical Strike Chance' },
  { from: /#% increased Critical Strike Multiplier for Spells/gi, to: '+#% to Critical Strike Multiplier for Spell Damage' },
  // PoB uses "maximum Mana/Life" but API uses just "Mana/Life"
  { from: /of maximum Mana/gi, to: 'of Mana' },
  { from: /of maximum Life/gi, to: 'of Life' },
  // PoE2: Local defence stats need "(Local)" suffix for trade API
  { from: /^#% increased Energy Shield$/i, to: '#% increased Energy Shield (Local)' },
  { from: /^#% increased Armour$/i, to: '#% increased Armour (Local)' },
  { from: /^#% increased Evasion$/i, to: '#% increased Evasion (Local)' },
  { from: /^#% increased Evasion Rating$/i, to: '#% increased Evasion Rating (Local)' },
];

/**
 * Mods that are LOCAL to items and cannot be searched in trade stats
 * These should be excluded from stat searches (return null immediately)
 * Includes flask local mods that modify the flask itself
 */
const UNSEARCHABLE_MODS = [
  // Flask trigger enchants - these are local and not searchable
  'Used when Charges reach full',
  'Used when you Hit a Rare or Unique Enemy, if not already in effect',
  'Used when you use a Skill',
  'Used when you take a Savage Hit',
  'Reused at the end of this Flask\'s Effect',
  // Charm trigger implicits (PoE2) - not in stats API
  'Used when you kill a Rare or Unique enemy',
  'Used when you become Frozen',
  'Used when you become Chilled',
  'Used when you become Shocked',
  'Used when you become Ignited',
  'Used when you become Poisoned',
  'Used when you start Bleeding',
  // Charm mods (PoE2) - not in stats API
  'Recover # Mana when Used',
  'Recover # Life when Used',
  'Recover # Energy Shield when Used',
  '#% increased Charges gained', // Charm-specific, API only has "Flask Charges gained"
  '#% Chance to gain a Charge when you kill an enemy', // Charm-specific, API only has specific charge types
  'Energy Shield Recharge starts on use', // Charm-specific, stat exists but doesn't work for charms in trade
];

/**
 * Mods where "reduced X" should be transformed to "increased X" with negative value
 * In PoE, some mods only exist as "increased" and "reduced" is represented as negative values
 * Format: { pattern: regex to match, replacement: string to replace with }
 */
const REDUCED_TO_INCREASED_MODS = [
  { pattern: /^#% reduced Duration$/i, replacement: '#% increased Duration' },
  { pattern: /^#% reduced effect$/i, replacement: '#% increased effect' },
  { pattern: /^#% reduced Amount Recovered$/i, replacement: '#% increased Amount Recovered' },
];

/**
 * Additional direct stat ID mappings for stats that have different IDs in PoE2
 * or are not in the stats API endpoint but exist in trade searches
 * These are checked FIRST before text matching
 */
const DIRECT_STAT_MAPPINGS = {
  // Basic Critical Hit/Strike Chance uses Global stat ID in PoE2 for jewels
  '#% increased Critical Hit Chance': 'explicit.stat_587431675',
  '#% increased Critical Strike Chance': 'explicit.stat_587431675',
  // Essence of Horror mod - not in stats API but exists in trade
  '#% increased effect of Socketed Items': 'explicit.stat_2081918629',
  // Spirit stat - PoE2 specific, not in stats API
  '# to Spirit': 'explicit.stat_3981240776',
  '+# to Spirit': 'explicit.stat_3981240776',

  // =========================================================================
  // Time-Lost Jewel stats - not in stats API but exist in trade
  // =========================================================================
  // Radius upgrade (note: |2 suffix indicates "Large" tier)
  'Upgrades Radius to Large': 'explicit.stat_3891355829|2',
  // Notable Passive Skills in Radius grants
  'Notable Passive Skills in Radius also grant #% increased Critical Hit Chance': 'explicit.stat_2077117738',
  'Notable Passive Skills in Radius also grant #% increased Critical Strike Chance': 'explicit.stat_2077117738',
  'Notable Passive Skills in Radius also grant #% increased Critical Hit Chance for Spells': 'explicit.stat_2704905000',
  'Notable Passive Skills in Radius also grant #% increased Critical Strike Chance for Spells': 'explicit.stat_2704905000',
  // Small Passive Skills in Radius grants
  'Small Passive Skills in Radius also grant #% increased maximum Energy Shield': 'explicit.stat_3665922113',
};

// ============================================================================
// FUZZY MATCHING SYSTEM
// ============================================================================

/**
 * Word synonyms for normalization - maps PoB terminology to common forms
 * These are applied during tokenization to normalize different phrasings
 */
const WORD_SYNONYMS = {
  'hit': 'strike',           // Critical Hit -> Critical Strike
  'multiplier': 'multi',     // Normalize multiplier
  'maximum': '',             // "maximum Life" -> "Life"
  'max': '',                 // "max Life" -> "Life"
};

/**
 * Stop words to remove during tokenization (common words that don't help matching)
 */
const STOP_WORDS = new Set([
  'to', 'the', 'a', 'an', 'of', 'for', 'with', 'on', 'by', 'per', 'and', 'or'
]);

/**
 * Normalizes text for fuzzy matching:
 * - Lowercase
 * - Remove numbers and special characters
 * - Apply synonyms
 * - Remove stop words
 * @param {string} text - Text to normalize
 * @returns {string[]} Array of normalized tokens
 */
const tokenizeAndNormalize = (text) => {
  // Replace # placeholders and numbers, lowercase
  let normalized = text
    .toLowerCase()
    .replace(/#/g, ' ')
    // eslint-disable-next-line security/detect-unsafe-regex
    .replace(/[+-]?\d+(?:\.\d+)?%?/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .trim();

  // Split into words
  let tokens = normalized.split(/\s+/).filter(t => t.length > 0);

  // Apply synonyms
  tokens = tokens.map(token => {
    if (WORD_SYNONYMS.hasOwnProperty(token)) {
      return WORD_SYNONYMS[token];
    }
    return token;
  }).filter(t => t.length > 0); // Remove empty strings from synonym replacement

  // Remove stop words
  tokens = tokens.filter(token => !STOP_WORDS.has(token));

  return tokens;
};

/**
 * Calculates similarity score between two token arrays
 * Uses a bidirectional matching approach to ensure both sets are well-represented
 * @param {string[]} searchTokens - Tokens from the search query (PoB mod)
 * @param {string[]} candidateTokens - Tokens from the API stat entry
 * @returns {number} Similarity score between 0 and 1
 */
const calculateTokenSimilarity = (searchTokens, candidateTokens) => {
  if (searchTokens.length === 0 || candidateTokens.length === 0) return 0;

  const searchSet = new Set(searchTokens);
  const candidateSet = new Set(candidateTokens);

  // Count how many search tokens are found in candidate (with partial matching)
  let searchMatches = 0;
  for (const token of searchSet) {
    if (candidateSet.has(token)) {
      searchMatches++;
    } else {
      // Partial match for similar words (e.g., "spell" matches "spells")
      for (const candToken of candidateSet) {
        if (token.length > 3 && candToken.length > 3) {
          if (token.startsWith(candToken) || candToken.startsWith(token)) {
            searchMatches += 0.8; // Partial credit for prefix match
            break;
          }
        }
      }
    }
  }

  // Count how many candidate tokens are found in search (reverse check)
  let candidateMatches = 0;
  for (const token of candidateSet) {
    if (searchSet.has(token)) {
      candidateMatches++;
    } else {
      for (const searchToken of searchSet) {
        if (token.length > 3 && searchToken.length > 3) {
          if (token.startsWith(searchToken) || searchToken.startsWith(token)) {
            candidateMatches += 0.8;
            break;
          }
        }
      }
    }
  }

  // Calculate bidirectional coverage
  // searchCoverage: how much of the search query is covered by the candidate
  // candidateCoverage: how much of the candidate is covered by the search query
  const searchCoverage = searchMatches / searchSet.size;
  const candidateCoverage = candidateMatches / candidateSet.size;

  // Use geometric mean to require BOTH directions to be good
  // This prevents matching "#% increased effect" (2 tokens) to "#% increased effect of Socketed Items" (4 tokens)
  // because while candidateCoverage would be 100%, searchCoverage would only be 50%
  const score = Math.sqrt(searchCoverage * candidateCoverage);

  // Additional penalty for large size differences
  // If the candidate has way fewer tokens, it's probably too generic
  const sizeDiff = Math.abs(searchSet.size - candidateSet.size);
  const maxSize = Math.max(searchSet.size, candidateSet.size);
  const sizePenalty = (sizeDiff / maxSize) * 0.15;

  return Math.max(0, score - sizePenalty);
};

/**
 * Finds the best matching stat using fuzzy token matching
 * @param {object} stats - Stats data from API
 * @param {string} normalizedMod - Normalized mod text from PoB
 * @param {string} modType - 'enchant', 'implicit', or 'explicit'
 * @returns {{id: string, score: number, text: string}|null} Best match or null
 */
const findStatIdFuzzy = (stats, normalizedMod, modType) => {
  if (!stats || !stats.result) return null;

  const searchTokens = tokenizeAndNormalize(normalizedMod);

  if (searchTokens.length === 0) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const category of stats.result) {
    const categoryId = category.id?.toLowerCase() || '';

    // Filter categories based on mod type
    if (modType === 'enchant') {
      if (!categoryId.includes('enchant')) continue;
    } else if (modType === 'implicit') {
      if (!categoryId.includes('implicit')) continue;
    } else if (modType === 'explicit') {
      if (!categoryId.includes('explicit') && !categoryId.includes('fractured') && !categoryId.includes('crafted')) continue;
    }

    for (const entry of category.entries || []) {
      const entryTokens = tokenizeAndNormalize(entry.text);
      const score = calculateTokenSimilarity(searchTokens, entryTokens);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          id: entry.id,
          score: score,
          text: entry.text
        };
      }
    }
  }

  // Only return if score meets minimum threshold
  if (bestMatch && bestScore >= FUZZY_MIN_SCORE) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[STATS] Fuzzy match: "${normalizedMod}" -> "${bestMatch.text}" (score: ${bestScore.toFixed(2)}) = ${bestMatch.id}`);
    }
    return bestMatch;
  }

  if (process.env.NODE_ENV === 'development' && bestMatch) {
    console.log(`[STATS] Fuzzy match rejected (score too low): "${normalizedMod}" -> "${bestMatch.text}" (score: ${bestScore.toFixed(2)}, min: ${FUZZY_MIN_SCORE})`);
  }

  return null;
};

/**
 * Applies terminology mappings to convert PoB stat text to Trade API format
 * @param {string} modText - The mod text to transform
 * @returns {string[]} Array of possible variations to try
 */
const applyStatAliases = (modText) => {
  const variations = [modText]; // Always include original

  let transformed = modText;
  for (const alias of STAT_ALIASES) {
    const newTransformed = transformed.replace(alias.from, alias.to);
    if (newTransformed !== transformed) {
      transformed = newTransformed;
      if (!variations.includes(transformed)) {
        variations.push(transformed);
      }
    }
  }

  return variations;
};

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${API_ENDPOINTS.stats}?realm=${gameParam}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const statsData = await response.json();

    if (statsData.error) {
      throw new Error('API returned error response');
    }

    if (!statsData.result) {
      throw new Error('No result field in response');
    }

    // Save to localStorage for future use
    setCachedStats(game, statsData);

    return statsData;
  } catch (error) {
    // Fallback: try direct request to PoE API (CORS might block, but worth trying)
    try {
      const directResponse = await fetch(`https://www.pathofexile.com/api/trade/data/stats?realm=${gameParam}`, {
        mode: 'cors',
        credentials: 'omit'
      });

      if (directResponse.ok) {
        const directData = await directResponse.json();
        if (directData.result) {
          setCachedStats(game, directData);
          return directData;
        }
      }
    } catch (directError) {
      // Silently continue to static fallback
    }

    // Final fallback: try to load static JSON file
    try {
      const fallbackResponse = await fetch(`/data/${gameParam}-stats.json`);

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.result) {
          setCachedStats(game, fallbackData);
          return fallbackData;
        }
      }
    } catch (fallbackError) {
      // All methods failed
    }

    return null;
  }
};

/**
 * Finds the stat ID for a given normalized mod text (LEGACY - exact matching only)
 * @param {object} stats - Stats data from API
 * @param {string} normalizedMod - Normalized mod text
 * @param {string} modType - 'enchant', 'implicit', or 'explicit'
 * @returns {string|null} Stat ID or null if not found
 */
const findStatIdExact = (stats, normalizedMod, modType) => {
  if (!stats || !stats.result) return null;

  // Get all possible variations of the mod text (original + aliased versions)
  const modVariations = applyStatAliases(normalizedMod);

  if (process.env.NODE_ENV === 'development' && modVariations.length > 1) {
    console.log(`[STATS] Trying variations for "${normalizedMod}":`, modVariations);
  }

  for (const modVariant of modVariations) {
    const cleanMod = modVariant
      .replace(/\+/g, '')
      .replace(/^#% /, '#% ')
      .replace(/^# /, '# ')
      .trim();

    if (process.env.NODE_ENV === 'development') {
      console.log(`[STATS] Searching for cleanMod: "${cleanMod}"`);
    }

    for (const category of stats.result) {
      const categoryId = category.id?.toLowerCase() || '';
      const categoryLabel = category.label?.toLowerCase() || '';

      // Filter categories based on mod type - be strict to avoid pseudo/wrong matches
      if (modType === 'enchant') {
        if (!categoryId.includes('enchant') && !categoryLabel.includes('enchant')) continue;
      } else if (modType === 'implicit') {
        if (!categoryId.includes('implicit') && !categoryLabel.includes('implicit')) continue;
      } else if (modType === 'explicit') {
        // For explicit, only search in explicit/fractured/crafted categories, NOT pseudo
        if (!categoryId.includes('explicit') && !categoryId.includes('fractured') && !categoryId.includes('crafted')) continue;
      }

      for (const entry of category.entries || []) {
        let entryText = entry.text
          // eslint-disable-next-line security/detect-unsafe-regex
          .replace(/[+-]?\d+(?:\.\d+)?/g, '#')
          .replace(/#%/g, '#%')
          .replace(/\+/g, '')
          .trim();

        // Only do exact matching - partial matching causes false positives
        if (entryText === cleanMod || entryText === modVariant) {
          if (process.env.NODE_ENV === 'development' && modVariant !== normalizedMod) {
            console.log(`[STATS] Alias match: "${normalizedMod}" -> "${modVariant}" = ${entry.id}`);
          }
          return entry.id;
        }
      }
    }
  }

  return null;
};

/**
 * Transforms "reduced X" mods to "increased X" format for trade search
 * In PoE, some mods only exist as "increased" version, and "reduced" is negative value
 * @param {string} normalizedMod - The normalized mod text
 * @param {number} value - The original mod value (positive number from "reduced" mod)
 * @returns {{mod: string, value: number, transformed: boolean}} Transformed mod and value
 */
export const transformReducedMod = (normalizedMod, value) => {
  for (const { pattern, replacement } of REDUCED_TO_INCREASED_MODS) {
    if (pattern.test(normalizedMod)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[STATS] Transforming reduced->increased: "${normalizedMod}" (${value}) -> "${replacement}" (${-value})`);
      }
      return {
        mod: replacement,
        value: -value, // Negate the value for "reduced" -> "increased" transformation
        transformed: true
      };
    }
  }
  return { mod: normalizedMod, value, transformed: false };
};

/**
 * Finds the stat ID for a given normalized mod text
 * Uses direct mappings first, then exact matching, then fuzzy matching (if enabled)
 * @param {object} stats - Stats data from API
 * @param {string} normalizedMod - Normalized mod text
 * @param {string} modType - 'enchant', 'implicit', or 'explicit'
 * @returns {string|null} Stat ID or null if not found
 */
export const findStatId = (stats, normalizedMod, modType) => {
  if (!stats || !stats.result) return null;

  // 0. Check if this is an unsearchable local mod (flask mods, etc.)
  if (UNSEARCHABLE_MODS.some(mod => normalizedMod === mod || normalizedMod.includes(mod.replace('#', '')))) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[STATS] Skipping unsearchable local mod: "${normalizedMod}"`);
    }
    return null;
  }

  // 1. Check direct mappings FIRST (for stats with known different IDs in PoE2)
  if (modType === 'explicit' && DIRECT_STAT_MAPPINGS[normalizedMod]) {
    const directId = DIRECT_STAT_MAPPINGS[normalizedMod];
    if (process.env.NODE_ENV === 'development') {
      console.log(`[STATS] Direct mapping: "${normalizedMod}" -> ${directId}`);
    }
    return directId;
  }

  // 2. Try exact matching (legacy system with aliases)
  const exactMatch = findStatIdExact(stats, normalizedMod, modType);
  if (exactMatch) {
    return exactMatch;
  }

  // 3. If fuzzy matching is enabled, try fuzzy matching as fallback
  if (USE_FUZZY_MATCHING) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[STATS] Exact match failed, trying fuzzy matching for: "${normalizedMod}"`);
    }
    const fuzzyMatch = findStatIdFuzzy(stats, normalizedMod, modType);
    if (fuzzyMatch) {
      return fuzzyMatch.id;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[STATS] No match found for: "${normalizedMod}" (type: ${modType})`);
  }

  return null;
};

/**
 * Validates if a stat ID exists in the stats data or in direct mappings
 * @param {object} stats - Stats data from API
 * @param {string} statId - Stat ID to validate
 * @returns {boolean} True if stat exists
 */
export const validateStatId = (stats, statId) => {
  // Check if the stat ID is in our direct mappings (these are valid but not in the API)
  const directMappingIds = Object.values(DIRECT_STAT_MAPPINGS);
  if (directMappingIds.includes(statId)) {
    return true;
  }

  if (!stats || !stats.result) return false;

  for (const category of stats.result) {
    if (category.entries.some(e => e.id === statId)) {
      return true;
    }
  }

  return false;
};
