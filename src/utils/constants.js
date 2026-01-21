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

// Item categories for filtering
export const ITEM_CATEGORIES = {
  all: 'all',
  weapons: 'weapons',
  armour: 'armour',
  accessories: 'accessories',
  flasks: 'flasks',
  jewels: 'jewels',
  grafts: 'grafts', // PoE1 Keepers of the Flame league items
  charms: 'charms' // PoE2 charm items
};

// Graft base types from PoE1 Keepers of the Flame league
export const GRAFT_TYPES = ['eshgraft', 'tulgraft', 'uulgraft', 'xophgraft', 'fleshgraft'];

// PoE2 jewel base types (they don't have "jewel" in the name)
export const POE2_JEWEL_TYPES = [
  'emerald', 'ruby', 'sapphire', 'diamond',
  'time-lost emerald', 'time-lost ruby', 'time-lost sapphire', 'time-lost diamond',
  'timeless jewel'
];

// Map slot names from PoB to categories
const SLOT_TO_CATEGORY = {
  // Weapons
  'Weapon 1': ITEM_CATEGORIES.weapons,
  'Weapon 2': ITEM_CATEGORIES.weapons,
  'Weapon 1 Swap': ITEM_CATEGORIES.weapons,
  'Weapon 2 Swap': ITEM_CATEGORIES.weapons,
  'Main Hand': ITEM_CATEGORIES.weapons,
  'Off Hand': ITEM_CATEGORIES.weapons,

  // Armour
  'Helmet': ITEM_CATEGORIES.armour,
  'Body Armour': ITEM_CATEGORIES.armour,
  'Gloves': ITEM_CATEGORIES.armour,
  'Boots': ITEM_CATEGORIES.armour,

  // Accessories
  'Amulet': ITEM_CATEGORIES.accessories,
  'Ring 1': ITEM_CATEGORIES.accessories,
  'Ring 2': ITEM_CATEGORIES.accessories,
  'Belt': ITEM_CATEGORIES.accessories,

  // Flasks
  'Flask 1': ITEM_CATEGORIES.flasks,
  'Flask 2': ITEM_CATEGORIES.flasks,
  'Flask 3': ITEM_CATEGORIES.flasks,
  'Flask 4': ITEM_CATEGORIES.flasks,
  'Flask 5': ITEM_CATEGORIES.flasks,

  // Jewels - PoB uses various slot names for jewels
  'Jewel 1': ITEM_CATEGORIES.jewels,
  'Jewel 2': ITEM_CATEGORIES.jewels,
};

/**
 * Get the category of an item based on its slot and baseType
 * @param {Object} item - The parsed item object
 * @returns {string} - The category key from ITEM_CATEGORIES
 */
export const getItemCategory = (item) => {
  // First try to match by slot
  if (item.slot && SLOT_TO_CATEGORY[item.slot]) {
    return SLOT_TO_CATEGORY[item.slot];
  }

  if (item.baseType) {
    const baseTypeLower = item.baseType.toLowerCase();

    // Check for grafts FIRST (PoE1 Keepers of the Flame league items)
    if (GRAFT_TYPES.some(g => baseTypeLower.includes(g))) {
      return ITEM_CATEGORIES.grafts;
    }

    // Check for charms (PoE2 items)
    if (baseTypeLower.includes('charm')) {
      return ITEM_CATEGORIES.charms;
    }

    // Check for flasks (before jewels, because "Amethyst Flask" contains "Amethyst" which is a jewel type)
    if (baseTypeLower.includes('flask')) {
      return ITEM_CATEGORIES.flasks;
    }

    // Check for accessories BEFORE jewels (because "Amethyst Ring" contains "Amethyst")
    if (baseTypeLower.includes('ring') || baseTypeLower.includes('amulet') || baseTypeLower.includes('belt')) {
      return ITEM_CATEGORIES.accessories;
    }

    // Check for jewels - PoE1 has "jewel" in name, PoE2 uses gem names (emerald, ruby, etc.)
    if (baseTypeLower.includes('jewel')) {
      return ITEM_CATEGORIES.jewels;
    }

    // Check for PoE2 jewels (they use gem names without "jewel" suffix)
    // Must be exact match to avoid false positives (e.g., "Ruby Ring" shouldn't match)
    if (POE2_JEWEL_TYPES.some(j => baseTypeLower === j)) {
      return ITEM_CATEGORIES.jewels;
    }

    // Check for weapons (common weapon types) - includes quivers as off-hand
    const weaponTypes = ['sword', 'axe', 'mace', 'staff', 'wand', 'dagger', 'claw', 'bow', 'sceptre', 'flail', 'crossbow', 'spear', 'quarterstaff', 'trap', 'focus', 'quiver'];
    if (weaponTypes.some(w => baseTypeLower.includes(w))) {
      return ITEM_CATEGORIES.weapons;
    }

    // Check for armour (common armour types)
    const armourTypes = ['helmet', 'helm', 'cap', 'hood', 'crown', 'mask', 'circlet', 'cage', 'tricorne', 'burgonet', 'bascinet', 'sallet', 'coif',
                         'body armour', 'plate', 'vest', 'robe', 'garb', 'tunic', 'jacket', 'coat', 'armour', 'regalia', 'vestment', 'brigandine', 'doublet', 'hauberk', 'lamellar', 'raiment', 'wrap', 'silks', 'wyrmscale', 'dragonscale',
                         'gloves', 'gauntlets', 'mitts', 'bracers', 'gages',
                         'boots', 'greaves', 'slippers', 'shoes', 'leggings'];
    if (armourTypes.some(a => baseTypeLower.includes(a))) {
      return ITEM_CATEGORIES.armour;
    }
  }

  // Default fallback - try to infer from slot name patterns
  if (item.slot) {
    const slotLower = item.slot.toLowerCase();
    if (slotLower.includes('jewel') || slotLower.includes('socket')) {
      return ITEM_CATEGORIES.jewels;
    }
    if (slotLower.includes('flask')) {
      return ITEM_CATEGORIES.flasks;
    }
  }

  // If we can't determine, default to armour (most common)
  return ITEM_CATEGORIES.armour;
};
