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
        },
        equipment_filters: {
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

  // Añadir filtros de defensa (equipment_filters)
  if (item.filters?.defenceFilters) {
    const { defenceFilters } = item.filters;

    // Energy Shield
    if (defenceFilters.energyShield?.enabled) {
      const esFilter = {};
      if (defenceFilters.energyShield.min) esFilter.min = defenceFilters.energyShield.min;
      if (defenceFilters.energyShield.max) esFilter.max = defenceFilters.energyShield.max;
      if (Object.keys(esFilter).length > 0) {
        query.query.filters.equipment_filters.filters.es = esFilter;
      }
    }

    // Armour
    if (defenceFilters.armour?.enabled) {
      const arFilter = {};
      if (defenceFilters.armour.min) arFilter.min = defenceFilters.armour.min;
      if (defenceFilters.armour.max) arFilter.max = defenceFilters.armour.max;
      if (Object.keys(arFilter).length > 0) {
        query.query.filters.equipment_filters.filters.ar = arFilter;
      }
    }

    // Evasion
    if (defenceFilters.evasion?.enabled) {
      const evFilter = {};
      if (defenceFilters.evasion.min) evFilter.min = defenceFilters.evasion.min;
      if (defenceFilters.evasion.max) evFilter.max = defenceFilters.evasion.max;
      if (Object.keys(evFilter).length > 0) {
        query.query.filters.equipment_filters.filters.ev = evFilter;
      }
    }

    if (process.env.NODE_ENV === 'development' && Object.keys(query.query.filters.equipment_filters.filters).length > 0) {
      console.log('[TRADE] Equipment filters:', query.query.filters.equipment_filters.filters);
    }
  }

  // Añadir filtros de sockets (PoE1 only)
  if (item.filters?.socketFilters && item.socketInfo) {
    const { socketFilters } = item.filters;
    const socketFilter = {};
    const linkFilter = {};

    // Socket colors
    if (socketFilters.r?.enabled && socketFilters.r.min) {
      socketFilter.r = socketFilters.r.min;
    }
    if (socketFilters.g?.enabled && socketFilters.g.min) {
      socketFilter.g = socketFilters.g.min;
    }
    if (socketFilters.b?.enabled && socketFilters.b.min) {
      socketFilter.b = socketFilters.b.min;
    }
    if (socketFilters.w?.enabled && socketFilters.w.min) {
      socketFilter.w = socketFilters.w.min;
    }

    // Links
    if (socketFilters.links?.enabled && socketFilters.links.min) {
      linkFilter.min = socketFilters.links.min;
    }

    // Add socket_filters to query if any filters are set
    if (Object.keys(socketFilter).length > 0 || Object.keys(linkFilter).length > 0) {
      query.query.filters.socket_filters = { filters: {} };

      if (Object.keys(socketFilter).length > 0) {
        query.query.filters.socket_filters.filters.sockets = socketFilter;
      }
      if (Object.keys(linkFilter).length > 0) {
        query.query.filters.socket_filters.filters.links = linkFilter;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[TRADE] Socket filters:', query.query.filters.socket_filters.filters);
      }
    }
  }

  // Nota: No filtramos por corrupted ni fractured_item por defecto
  // para que la búsqueda sea más amplia y muestre todos los items

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
    const fracturedModIndex = item.filters.fracturedModIndex;
    let hasFracturedMod = false;

    item.explicitMods.forEach((mod, i) => {
      if (item.filters.selectedExplicits[i]) {
        // Transform "reduced X" mods to "increased X" with negative value
        const minKey = `explicit_${i}`;
        const originalValue = item.filters.minValues[minKey] || mod.value;
        const { mod: transformedMod, value: transformedValue, transformed } = transformReducedMod(mod.normalized, originalValue);

        // Check if this mod should be searched as fractured
        const isFractured = fracturedModIndex === i;

        // Always search as explicit first, then convert to fractured prefix if needed
        let statId = findStatId(stats, transformedMod, 'explicit');

        // If fractured, replace explicit prefix with fractured prefix
        if (isFractured && statId && statId.startsWith('explicit.')) {
          statId = statId.replace('explicit.', 'fractured.');
        }
        if (process.env.NODE_ENV === 'development') {
          const fracturedLabel = isFractured ? ' [FRACTURED]' : '';
          if (transformed) {
            console.log(`[EXPLICIT ${i}]${fracturedLabel} "${mod.normalized}" (${originalValue}) -> transformed to "${transformedMod}" (${transformedValue}) -> ${statId || '❌ NOT FOUND'}`);
          } else {
            console.log(`[EXPLICIT ${i}]${fracturedLabel} "${mod.normalized}" -> ${statId || '❌ NOT FOUND'}`);
          }
        }
        if (statId) {
          const maxKey = `explicit_${i}`;

          // Use transformed value if mod was transformed, otherwise use original
          const minValue = transformed ? transformedValue : item.filters.minValues[minKey];
          const maxValue = item.filters.maxValues[maxKey];

          // Check if this stat has local/global variants (use explicit ID for lookup)
          const explicitStatId = isFractured ? statId.replace('fractured.', 'explicit.') : statId;
          const variantInfo = STATS_WITH_LOCAL_VARIANTS[explicitStatId];

          if (variantInfo) {
            // Create a COUNT group with both global and local versions
            const countFilters = [];

            // Determine prefix based on whether mod is fractured
            const prefix = isFractured ? 'fractured.' : 'explicit.';
            const globalId = variantInfo.global.replace('explicit.', prefix);
            const localId = variantInfo.local.replace('explicit.', prefix);

            if (isFractured) {
              hasFracturedMod = true;
            }

            // Add global version
            const globalFilter = { id: globalId, disabled: false };
            if (minValue !== undefined || maxValue !== undefined) {
              globalFilter.value = {};
              if (minValue !== undefined) globalFilter.value.min = minValue;
              if (maxValue !== undefined) globalFilter.value.max = maxValue;
            }
            countFilters.push(globalFilter);

            // Add local version
            const localFilter = { id: localId, disabled: false };
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
              const fracturedLabel = isFractured ? ' [FRACTURED]' : '';
              console.log(`[EXPLICIT ${i}]${fracturedLabel} Created COUNT group for ${variantInfo.name} (global: ${globalId}, local: ${localId})`);
            }
          } else {
            // Normal stat without local/global variants
            if (isFractured) {
              hasFracturedMod = true;
            }

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

    // If a mod is marked as fractured, add the fractured_item filter
    if (hasFracturedMod) {
      query.query.filters.misc_filters.filters.fractured_item = { option: true };
    }

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

  // Clean up empty filters to avoid "Failed to load search state" errors
  // Some trade sites (especially PoE1) don't accept empty filter objects
  const cleanFilters = (filters) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value && typeof value === 'object') {
        if (value.filters && Object.keys(value.filters).length === 0) {
          // Skip empty filter groups
          continue;
        }
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  query.query.filters = cleanFilters(query.query.filters);

  // Remove empty stats array
  if (query.query.stats.length === 0) {
    delete query.query.stats;
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
