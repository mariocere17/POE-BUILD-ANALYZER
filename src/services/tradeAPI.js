// src/services/tradeAPI.js
import { JEWEL_TYPES, TRADE_BASE_URLS } from '../utils/constants';
import { findStatId, validateStatId, transformReducedMod } from './statsAPI';

/**
 * Stats that have both global and local versions in PoE2
 * When searching for these, we use a COUNT group with both versions
 * so items with either version will be found
 */
const STATS_WITH_LOCAL_VARIANTS = {
  // +# to maximum Energy Shield
  'explicit.stat_3489782002': {
    global: 'explicit.stat_3489782002',
    local: 'explicit.stat_4052037485',
    name: 'maximum Energy Shield'
  },
  'explicit.stat_4052037485': {
    global: 'explicit.stat_3489782002',
    local: 'explicit.stat_4052037485',
    name: 'maximum Energy Shield'
  },
  // +# to Armour
  'explicit.stat_809229260': {
    global: 'explicit.stat_809229260',
    local: 'explicit.stat_3484657501',
    name: 'Armour'
  },
  'explicit.stat_3484657501': {
    global: 'explicit.stat_809229260',
    local: 'explicit.stat_3484657501',
    name: 'Armour'
  },
  // +# to Evasion Rating
  'explicit.stat_2144192055': {
    global: 'explicit.stat_2144192055',
    local: 'explicit.stat_53045048',
    name: 'Evasion Rating'
  },
  'explicit.stat_53045048': {
    global: 'explicit.stat_2144192055',
    local: 'explicit.stat_53045048',
    name: 'Evasion Rating'
  }
};

/**
 * Generates a trade URL for a given item
 * @param {object} item - Item data
 * @param {string} game - 'poe2' or 'poe1'
 * @param {string} league - League name
 * @param {string} sellerStatus - 'any' or 'online'
 * @param {object} stats - Stats data from API
 * @returns {string} Trade URL
 */
export const generateTradeURL = async (item, game, league, sellerStatus, stats) => {
  // Determinar la URL base según el juego
  const baseURL = TRADE_BASE_URLS[game];

  const query = {
    query: {
      status: { option: sellerStatus },
      stats: [],
      filters: {
        type_filters: {
          filters: {}
        },
        misc_filters: {
          filters: {}
        }
      }
    },
    sort: { price: "asc" }
  };

  // Detectar si es una joya
  const isJewel = JEWEL_TYPES.includes(item.baseType);

  // Normalizar rareza - Relic es tratado como unique para búsquedas
  const rarityLower = item.rarity?.toLowerCase();
  const isUnique = rarityLower === 'unique' || rarityLower === 'relic';

  // Para uniques (y relics), buscar por nombre y tipo exacto
  if (isUnique) {
    query.query.name = item.name;
    query.query.type = item.baseType;
  } else if (isJewel) {
    // Para joyas NO-unique, NO especificar type
    // La búsqueda se basará solo en rareza, ilvl y mods
  } else {
    // Para items normales no-únicos
    query.query.type = item.baseType;
  }

  // Añadir filtro de rareza
  if (item.rarity && rarityLower !== 'normal') {
    // Relic se busca como unique en el trade
    const searchRarity = rarityLower === 'relic' ? 'unique' : rarityLower;
    query.query.filters.type_filters.filters.rarity = {
      option: searchRarity
    };
  }

  // Para joyas, añadir filtro de categoría
  if (isJewel) {
    query.query.filters.type_filters.filters.category = {
      option: "jewel"
    };
  }

  // Añadir ilvl
  if (item.ilvl && item.ilvl > 0) {
    query.query.filters.type_filters.filters.ilvl = {
      min: item.ilvl
    };
  }

  // Añadir estado de corrupción
  if (item.corrupted !== undefined) {
    query.query.filters.misc_filters.filters.corrupted = {
      option: item.corrupted ? "true" : "false"
    };
  }

  // Fractured: solo filtrar si especificamente hay mods fracturados Y quieres buscarlos
  if (item.filters.searchFractured) {
    query.query.filters.misc_filters.filters.fractured_item = {
      option: "no"
    };
  }

  // Añadir mods si tenemos stats disponibles
  if (stats && stats.result) {
    const statFilters = [];
    const countGroups = []; // For stats with local/global variants

    // DEBUG: Log para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 [TRADE] Processing item mods');
      console.log('Item:', item.name || item.baseType);
      console.log('Explicit mods:', item.explicitMods);
      console.log('Selected explicits:', item.filters.selectedExplicits);
    }

    // Procesar enchants
    item.enchantMods.forEach((mod, i) => {
      if (item.filters.selectedEnchants[i]) {
        const statId = findStatId(stats, mod.normalized, 'enchant');
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ENCHANT ${i}] "${mod.normalized}" -> ${statId || '❌ NOT FOUND'}`);
        }
        if (statId) {
          const filter = { id: statId, disabled: false };
          const minKey = `enchant_${i}`;
          const maxKey = `enchant_${i}`;

          if (item.filters.minValues[minKey] || item.filters.maxValues[maxKey]) {
            filter.value = {};
            if (item.filters.minValues[minKey]) filter.value.min = item.filters.minValues[minKey];
            if (item.filters.maxValues[maxKey]) filter.value.max = item.filters.maxValues[maxKey];
          }

          statFilters.push(filter);
        }
      }
    });

    // Procesar implícitos
    item.implicitMods.forEach((mod, i) => {
      if (item.filters.selectedImplicits[i]) {
        const statId = findStatId(stats, mod.normalized, 'implicit');
        if (process.env.NODE_ENV === 'development') {
          console.log(`[IMPLICIT ${i}] "${mod.normalized}" -> ${statId || '❌ NOT FOUND'}`);
        }
        if (statId) {
          const filter = { id: statId, disabled: false };
          const minKey = `implicit_${i}`;
          const maxKey = `implicit_${i}`;

          if (item.filters.minValues[minKey] || item.filters.maxValues[maxKey]) {
            filter.value = {};
            if (item.filters.minValues[minKey]) filter.value.min = item.filters.minValues[minKey];
            if (item.filters.maxValues[maxKey]) filter.value.max = item.filters.maxValues[maxKey];
          }

          statFilters.push(filter);
        }
      }
    });

    // Procesar explícitos
    item.explicitMods.forEach((mod, i) => {
      if (item.filters.selectedExplicits[i]) {
        // Transform "reduced X" mods to "increased X" with negative value
        const minKey = `explicit_${i}`;
        const originalValue = item.filters.minValues[minKey] || mod.value;
        const { mod: transformedMod, value: transformedValue, transformed } = transformReducedMod(mod.normalized, originalValue);

        const statId = findStatId(stats, transformedMod, 'explicit');
        if (process.env.NODE_ENV === 'development') {
          if (transformed) {
            console.log(`[EXPLICIT ${i}] "${mod.normalized}" (${originalValue}) -> transformed to "${transformedMod}" (${transformedValue}) -> ${statId || '❌ NOT FOUND'}`);
          } else {
            console.log(`[EXPLICIT ${i}] "${mod.normalized}" -> ${statId || '❌ NOT FOUND'}`);
          }
        }
        if (statId) {
          const maxKey = `explicit_${i}`;

          // Use transformed value if mod was transformed, otherwise use original
          const minValue = transformed ? transformedValue : item.filters.minValues[minKey];
          const maxValue = item.filters.maxValues[maxKey];

          // Check if this stat has local/global variants
          const variantInfo = STATS_WITH_LOCAL_VARIANTS[statId];
          if (variantInfo) {
            // Create a COUNT group with both global and local versions
            const countFilters = [];

            // Add global version
            const globalFilter = { id: variantInfo.global, disabled: false };
            if (minValue !== undefined || maxValue !== undefined) {
              globalFilter.value = {};
              if (minValue !== undefined) globalFilter.value.min = minValue;
              if (maxValue !== undefined) globalFilter.value.max = maxValue;
            }
            countFilters.push(globalFilter);

            // Add local version
            const localFilter = { id: variantInfo.local, disabled: false };
            if (minValue !== undefined || maxValue !== undefined) {
              localFilter.value = {};
              if (minValue !== undefined) localFilter.value.min = minValue;
              if (maxValue !== undefined) localFilter.value.max = maxValue;
            }
            countFilters.push(localFilter);

            countGroups.push({
              type: "count",
              value: { min: 1 },
              filters: countFilters,
              disabled: false
            });

            if (process.env.NODE_ENV === 'development') {
              console.log(`[EXPLICIT ${i}] Created COUNT group for ${variantInfo.name} (global: ${variantInfo.global}, local: ${variantInfo.local})`);
            }
          } else {
            // Normal stat - add to regular filters
            const filter = { id: statId, disabled: false };

            if (minValue !== undefined || maxValue !== undefined) {
              filter.value = {};
              if (minValue !== undefined) filter.value.min = minValue;
              if (maxValue !== undefined) filter.value.max = maxValue;
            }

            statFilters.push(filter);
          }
        }
      }
    });

    // Validar que los stats existen antes de añadirlos
    const validStatFilters = statFilters.filter(filter => {
      const isValid = validateStatId(stats, filter.id);
      if (!isValid && process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Stat ID no válido (omitido): ${filter.id}`);
      }
      return isValid;
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Valid stat filters:', validStatFilters);
      console.log('COUNT groups:', countGroups);
      console.groupEnd();
    }

    // Añadir stats válidos al query (grupo AND)
    if (validStatFilters.length > 0) {
      query.query.stats.push({
        type: "and",
        filters: validStatFilters,
        disabled: false
      });
    }

    // Añadir COUNT groups para stats con variantes local/global
    countGroups.forEach(countGroup => {
      query.query.stats.push(countGroup);
    });
  }
  const encodedQuery = encodeURIComponent(JSON.stringify(query));
  const leagueParam = league.replace(/ /g, '%20');

  // Construir URL final
  const finalURL = `${baseURL}/${leagueParam}?q=${encodedQuery}`;
  if (process.env.NODE_ENV === 'development') {
    console.group('📦 [TRADE] Generated Query');
    console.log('Query object:', JSON.stringify(query, null, 2));
    console.log('Generated URL:', finalURL);
    console.groupEnd();
  }

  return finalURL;
};
