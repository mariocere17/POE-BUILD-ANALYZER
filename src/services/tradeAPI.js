// src/services/tradeAPI.js
import { JEWEL_TYPES, TRADE_BASE_URLS } from '../utils/constants';
import { findStatId, validateStatId } from './statsAPI';

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

  // Para uniques, buscar por nombre y tipo exacto
  if (item.rarity === 'unique') {
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
  if (item.rarity && item.rarity !== 'normal') {
    query.query.filters.type_filters.filters.rarity = {
      option: item.rarity
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

    // Procesar enchants
    item.enchantMods.forEach((mod, i) => {
      if (item.filters.selectedEnchants[i]) {
        const statId = findStatId(stats, mod.normalized, 'enchant');
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
        const statId = findStatId(stats, mod.normalized, 'explicit');
        if (statId) {
          const filter = { id: statId, disabled: false };
          const minKey = `explicit_${i}`;
          const maxKey = `explicit_${i}`;

          if (item.filters.minValues[minKey] || item.filters.maxValues[maxKey]) {
            filter.value = {};
            if (item.filters.minValues[minKey]) filter.value.min = item.filters.minValues[minKey];
            if (item.filters.maxValues[maxKey]) filter.value.max = item.filters.maxValues[maxKey];
          }

          statFilters.push(filter);
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

    // Añadir stats válidos al query
    if (validStatFilters.length > 0) {
      query.query.stats.push({
        type: "and",
        filters: validStatFilters,
        disabled: false
      });
    }
  }
  const encodedQuery = encodeURIComponent(JSON.stringify(query));
  const leagueParam = league.replace(/ /g, '%20');

  // Construir URL final
  const finalURL = `${baseURL}/${leagueParam}?q=${encodedQuery}`;
  if (process.env.NODE_ENV === 'development') {
    console.log('Generated URL:', finalURL);
  }

  return finalURL;
};
