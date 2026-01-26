// src/services/pobParser.js
import { API_ENDPOINTS, isValidPoBURL } from '../config/apiConfig';
import pako from 'pako';

/**
 * Fetches raw PoB code from pobb.in URL
 * @param {string} url - pobb.in URL
 * @returns {Promise<string>} Raw PoB code
 */
const fetchPobbinCode = async (url) => {
  // Validar URL antes de hacer la petición
  if (!isValidPoBURL(url)) {
    throw new Error('Invalid pobb.in URL. Please use a valid pobb.in link.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${API_ENDPOINTS.pobFetch}?url=${encodeURIComponent(url)}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || 'Failed to fetch from pobb.in');
    }

    const data = await response.json();
    return data.code;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    throw new Error(`Could not fetch build from URL: ${error.message}`);
  }
};

/**
 * Detects if input is a URL and fetches the code if needed
 * @param {string} input - URL or raw PoB code
 * @returns {Promise<string>} Raw PoB code
 */
const getPobbCode = async (input) => {
  const trimmedInput = input.trim();

  // Detectar si es una URL de pobb.in
  if (trimmedInput.includes('pobb.in')) {
    console.log('Detected pobb.in URL, fetching raw code...');
    return await fetchPobbinCode(trimmedInput);
  }

  // Detectar si es una URL de poe.ninja
  if (trimmedInput.includes('poe.ninja') && trimmedInput.includes('/pob/')) {
    throw new Error(
      'poe.ninja PoB URLs are not directly supported. Please visit the poe.ninja page, click on "Import in PoB" to get the code, and paste it here.'
    );
  }

  // Si no es URL, asumir que es código raw
  return trimmedInput;
};

// Ascendancy names for game detection (unique to each game)
// Note: Deadeye and Pathfinder exist in both games, so they're excluded
const POE1_ASCENDANCIES = [
  // Marauder
  'juggernaut', 'berserker', 'chieftain',
  // Duelist
  'slayer', 'gladiator', 'champion',
  // Shadow
  'assassin', 'saboteur', 'trickster',
  // Templar
  'inquisitor', 'hierophant', 'guardian',
  // Witch (PoE1 versions)
  'necromancer', 'occultist', 'elementalist',
  // Ranger (Raider is unique to PoE1)
  'raider',
  // Scion
  'ascendant',
  // === Legacy of Phrecia Event Ascendancies ===
  // Ranger
  'daughter of oshabi', 'whisperer', 'wildspeaker',
  // Marauder
  'antiquarian', 'behemoth', 'ancestral commander',
  // Shadow
  'surfcaster', 'servant of arakaali', 'blind prophet',
  // Witch
  'harbinger', 'herald', 'bog shaman',
  // Duelist
  'gambler', 'paladin', 'aristocrat',
  // Templar
  'architect of chaos', 'polytheist', 'puppeteer',
  // Scion
  'scavenger'
];

const POE2_ASCENDANCIES = [
  // Mercenary
  'witchhunter', 'gemling legionnaire', 'tactician',
  // Monk
  'invoker', 'acolyte of chayula',
  // Sorceress
  'stormweaver', 'chronomancer', 'disciple of varashta',
  // Warrior
  'warbringer', 'titan', 'smith of kitava',
  // Witch (PoE2 versions)
  'blood mage', 'infernalist', 'lich',
  // Huntress
  'amazon', 'ritualist',
  // Druid
  'oracle', 'shaman'
];

/**
 * Detects the game (poe1 or poe2) from the XML document
 * @param {Document} xmlDoc - Parsed XML document
 * @param {Array} items - Parsed items (for fallback detection)
 * @returns {string|null} 'poe1', 'poe2', or null if unable to detect
 */
const detectGameFromXml = (xmlDoc, items = []) => {
  const buildElement = xmlDoc.querySelector('Build');
  const specElement = xmlDoc.querySelector('Spec');

  // Primary method: Check ascendancy name (most reliable)
  const ascendancy = (
    buildElement?.getAttribute('ascendClassName') ||
    specElement?.getAttribute('ascendClassName') ||
    ''
  ).toLowerCase();

  if (ascendancy) {
    if (POE2_ASCENDANCIES.some(a => ascendancy.includes(a))) {
      return 'poe2';
    }
    if (POE1_ASCENDANCIES.some(a => ascendancy.includes(a))) {
      return 'poe1';
    }
  }

  // Fallback: Check items for game-specific characteristics
  const hasCharms = items.some(item =>
    item.baseType?.toLowerCase().includes('charm') ||
    item.name?.toLowerCase().includes('charm')
  );

  const hasColoredSockets = items.some(item =>
    item.socketInfo?.colors &&
    (item.socketInfo.colors.r > 0 || item.socketInfo.colors.g > 0 || item.socketInfo.colors.b > 0)
  );

  if (hasCharms) {
    return 'poe2';
  }
  if (hasColoredSockets) {
    return 'poe1';
  }

  // Unable to detect
  return null;
};

/**
 * Parses a Path of Building code and extracts item data
 * @param {string} code - PoB code (base64, pobb.in URL, or raw code)
 * @returns {Promise<{items: Array, detectedGame: string|null}>} Parsed items and detected game
 * @throws {Error} If parsing fails
 */
export const parsePoB = async (code) => {
  let xmlText = '';

  // Obtener el código (fetch si es URL, o usar directo si es código)
  const pobCode = await getPobbCode(code);

  // Decodificar base64 y descomprimir
  try {
    // Limpiar y convertir de URL-safe base64 a base64 normal
    let cleanCode = pobCode.trim()
      .replace(/\s+/g, '')  // Remover espacios
      .replace(/-/g, '+')   // URL-safe: - → +
      .replace(/_/g, '/');  // URL-safe: _ → /

    // Añadir padding si falta
    while (cleanCode.length % 4 !== 0) {
      cleanCode += '=';
    }

    const decoded = atob(cleanCode);
    const charData = decoded.split('').map(x => x.charCodeAt(0));
    const binData = new Uint8Array(charData);

    // Usar pako para descomprimir (más robusto que DecompressionStream)
    try {
      // Intentar con inflate (maneja automáticamente zlib y raw deflate)
      xmlText = pako.inflate(binData, { to: 'string' });
    } catch (pakoError) {
      console.error('Pako inflate failed, trying inflateRaw:', pakoError);
      try {
        // Fallback: intentar con inflateRaw (deflate sin headers)
        xmlText = pako.inflateRaw(binData, { to: 'string' });
      } catch (rawError) {
        console.error('Both pako methods failed:', rawError);
        throw new Error('Failed to decompress PoB code. The compression format may be invalid.');
      }
    }
  } catch (err) {
    console.error('Decompression error:', err);
    throw new Error('Código PoB inválido. Asegúrate de copiar el código completo. Error: ' + err.message);
  }

  // Parsear XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Verificar errores de parseo
  if (xmlDoc.querySelector('parsererror')) {
    throw new Error('El XML del build no es válido');
  }

  // Extraer items del elemento Items
  const itemsElement = xmlDoc.querySelector('Items');
  if (!itemsElement) {
    throw new Error('No se encontraron items en el build');
  }

  const itemElements = itemsElement.querySelectorAll('Item');
  const parsedItems = [];

  itemElements.forEach((itemEl, index) => {
    const itemText = itemEl.textContent;
    if (!itemText || itemText.trim().length < 10) return;

    const lines = itemText.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 1) return;

    // Detectar rareza
    let rarity = 'normal';
    let nameLineIdx = 0;

    const rarityLine = lines.find(l => l.startsWith('Rarity:'));
    if (rarityLine) {
      rarity = rarityLine.replace('Rarity:', '').trim().toLowerCase();
      nameLineIdx = lines.indexOf(rarityLine) + 1;
    }

    // Para joyas y otros items sin "Rarity:", detectar por contexto
    if (!rarityLine && lines.some(l => l.match(/^\+?\d+%? to /))) {
      const modCount = lines.filter(l =>
        l.match(/^\+?\d+/) &&
        !l.startsWith('Item Level:') &&
        !l.startsWith('LevelReq:')
      ).length;
      rarity = modCount > 2 ? 'rare' : 'magic';
    }

    // Extraer nombre y tipo base
    let name = lines[nameLineIdx] || lines[0];
    let baseType = lines[nameLineIdx + 1] || lines[1] || name;

    // Fix for magic/rare items where baseType might be "Unique ID:" instead of actual base
    // This happens with charms, flasks and other items that don't have a separate basetype line
    if (baseType.startsWith('Unique ID:') || baseType.startsWith('Item Level:') || baseType.startsWith('Quality:')) {
      // For magic items with prefix/suffix (e.g., "Dabbler's Quicksilver Flask of Penetrating")
      // Extract the base type from the name
      if (rarity === 'magic' || rarity === 'rare') {
        // Try to extract flask base from magic/rare item name
        // Pattern: "Prefix's BaseType Flask of Suffix" or "Prefix BaseType Flask"
        const flaskMatch = name.match(/(Quicksilver Flask|Diamond Flask|Jade Flask|Quartz Flask|Granite Flask|Ruby Flask|Sapphire Flask|Topaz Flask|Amethyst Flask|Bismuth Flask|Aquamarine Flask|Stibnite Flask|Sulphur Flask|Basalt Flask|Silver Flask|Gold Flask|Corundum Flask|Iron Flask|Hallowed Life Flask|Sanctified Life Flask|Divine Life Flask|Eternal Life Flask|Hallowed Mana Flask|Sanctified Mana Flask|Divine Mana Flask|Eternal Mana Flask|Colossal Life Flask|Sacred Life Flask|Large Hybrid Flask|Medium Hybrid Flask|Small Hybrid Flask|Utility Flask)/i);
        if (flaskMatch) {
          baseType = flaskMatch[1];
        } else {
          // Try to extract charm base from magic item name
          const charmMatch = name.match(/(Golden Charm|Silver Charm|Thawing Charm|Iron Charm|Jade Charm|Amber Charm|Cobalt Charm|Crimson Charm|Viridian Charm)/i);
          if (charmMatch) {
            baseType = charmMatch[1];
          } else {
            // Generic fallback: try to find "X Flask" or "X Charm" pattern
            const genericMatch = name.match(/(\w+\s+Flask|\w+\s+Charm)/i);
            if (genericMatch) {
              baseType = genericMatch[1];
            } else {
              // Last resort: take last 2-3 words as base
              const words = name.split(' ');
              baseType = words.length >= 2 ? words.slice(-2).join(' ') : name;
            }
          }
        }
      } else {
        // For other rarities, use the name as baseType
        baseType = name;
      }
    }

    // Extraer ilvl
    const ilvlMatch = itemText.match(/Item Level: (\d+)/);
    const ilvl = ilvlMatch ? parseInt(ilvlMatch[1]) : null;

    // Extraer nivel requerido
    const levelReqMatch = itemText.match(/LevelReq: (\d+)/);
    const levelReq = levelReqMatch ? parseInt(levelReqMatch[1]) : null;

    // Extraer propiedades de defensa (armour items)
    const energyShieldMatch = itemText.match(/Energy Shield: (\d+)/);
    const armourMatch = itemText.match(/Armour: (\d+)/);
    const evasionMatch = itemText.match(/Evasion: (\d+)/);

    const defenceProperties = {
      energyShield: energyShieldMatch ? parseInt(energyShieldMatch[1]) : null,
      armour: armourMatch ? parseInt(armourMatch[1]) : null,
      evasion: evasionMatch ? parseInt(evasionMatch[1]) : null
    };

    // Detectar corrupción
    const corrupted = itemText.includes('Corrupted');

    // Extraer sockets/runas
    const socketsMatch = itemText.match(/Sockets: (.+)/);
    const sockets = socketsMatch ? socketsMatch[1].trim() : null;

    // Parse socket info (PoE1 style: "R-R-B-G-G-G" where - means linked, space means unlinked)
    let socketInfo = null;
    if (sockets && sockets.match(/^[RGBWS\- ]+$/i)) {
      // Count colors
      const colors = { r: 0, g: 0, b: 0, w: 0 };
      const socketChars = sockets.replace(/[\- ]/g, '').toUpperCase();
      for (const char of socketChars) {
        if (char === 'R') colors.r++;
        else if (char === 'G') colors.g++;
        else if (char === 'B') colors.b++;
        else if (char === 'W') colors.w++;
      }

      // Calculate max link group (sockets connected by -)
      // Split by space to get groups, then count each group's length
      const groups = sockets.split(' ').filter(g => g.length > 0);
      let maxLinks = 0;
      for (const group of groups) {
        // Count sockets in this linked group (R-R-B = 3 linked)
        const socketsInGroup = group.split('-').filter(s => s.match(/^[RGBW]$/i)).length;
        if (socketsInGroup > maxLinks) {
          maxLinks = socketsInGroup;
        }
      }

      socketInfo = {
        raw: sockets,
        colors,
        totalSockets: socketChars.length,
        maxLinks
      };
    }

    // Extraer mods diferenciando implícitos, enchants y explícitos
    const implicitMods = [];
    const enchantMods = [];
    const explicitMods = [];
    let inImplicits = false;
    let implicitsCount = 0;
    let implicitsProcessed = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detectar inicio de implicits
      if (line.match(/^Implicits: (\d+)$/)) {
        inImplicits = true;
        implicitsCount = parseInt(line.split(':')[1]);
        continue;
      }

      // Saltar líneas de metadata y propiedades de item (no son mods)
      if (line.startsWith('Unique ID:') ||
        line.startsWith('Item Level:') ||
        line.startsWith('Quality:') ||
        line.startsWith('Sockets:') ||
        line.startsWith('Rune:') ||
        line.startsWith('LevelReq:') ||
        line.startsWith('Implicits:') ||
        line.startsWith('Rarity:') ||
        line.startsWith('Requirements') ||
        line.startsWith('Grants Skill:') ||
        line.startsWith('Radius:') ||
        line.startsWith('Limited to:') ||
        // Item properties (not mods) - these are base stats of the item
        line.startsWith('Energy Shield:') ||
        line.startsWith('Armour:') ||
        line.startsWith('Evasion:') ||
        line.startsWith('Ward:') ||
        line.startsWith('Block:') ||
        line.startsWith('Physical Damage:') ||
        line.startsWith('Elemental Damage:') ||
        line.startsWith('Chaos Damage:') ||
        line.startsWith('Critical Hit Chance:') ||
        line.startsWith('Attacks per Second:') ||
        line.startsWith('Weapon Range:') ||
        line.startsWith('Spirit:') ||
        // PoB internal properties (not actual mods)
        line.startsWith('EvasionBasePercentile:') ||
        line.startsWith('ArmourBasePercentile:') ||
        line.startsWith('EnergyShieldBasePercentile:') ||
        // Item status flags (not mods)
        line === 'Fractured Item' ||
        line === 'Split' ||
        line === 'Mirrored' ||
        line === 'Synthesised Item' ||
        // Influence types (not mods)
        line === 'Searing Exarch Item' ||
        line === 'Eater of Worlds Item' ||
        line === 'Shaper Item' ||
        line === 'Elder Item' ||
        line === 'Crusader Item' ||
        line === 'Redeemer Item' ||
        line === 'Hunter Item' ||
        line === 'Warlord Item' ||
        line === 'Corrupted' ||
        line === name ||
        line === baseType) {
        continue;
      }

      // Capturar mods
      if (line && line.length > 0) {
        // Detectar tipos de mods ANTES de limpiar
        const hasEnchantTag = line.includes('{enchant}');
        const hasRuneTag = line.includes('{rune}');
        const isFractured = line.includes('{fractured}');
        const hasAllocates = line.includes('Allocates');

        // Limpiar tags
        let cleanLine = line
          .replace(/\{enchant\}\{rune\}bonded:/gi, '')
          .replace(/\{enchant\}\{rune\}/g, '')
          .replace(/\{enchant\}/g, '')
          .replace(/\{desecrated\}/g, '')
          .replace(/\{fractured\}/g, '')
          .replace(/\{crafted\}/g, '')
          .replace(/\{mutated\}/g, '')
          .replace(/\{range:[^}]+\}/g, '')
          .trim();

        if (!cleanLine) continue;

        // Normalizar el mod: reemplazar números con #
        const normalizedMod = cleanLine
          // eslint-disable-next-line security/detect-unsafe-regex
          .replace(/[+-]?\d+(?:\.\d+)?/g, '#')
          .replace(/#%/g, '#%')
          .replace(/# to #/g, '# to #');

        // Extraer el valor original
        // eslint-disable-next-line security/detect-unsafe-regex
        const valueMatch = cleanLine.match(/[+-]?(\d+(?:\.\d+)?)/);
        const originalValue = valueMatch ? parseFloat(valueMatch[1]) : null;

        const modData = {
          text: cleanLine,
          normalized: normalizedMod,
          value: originalValue,
          fractured: isFractured,
          isEnchant: hasEnchantTag && !hasRuneTag,
          isRuneEnchant: hasEnchantTag && hasRuneTag,
          hasAllocates: hasAllocates
        };

        if (inImplicits && implicitsProcessed < implicitsCount) {
          // Si tiene tag {enchant}, va a enchantMods
          if (hasEnchantTag) {
            enchantMods.push(modData);
          } else {
            implicitMods.push(modData);
          }
          implicitsProcessed++;
          if (implicitsProcessed >= implicitsCount) {
            inImplicits = false;
          }
        } else if (implicitsProcessed >= implicitsCount || implicitsCount === 0) {
          explicitMods.push(modData);
        }
      }
    }

    // Contar sockets (use socketInfo if available, fallback to old method for PoE2)
    const socketCount = socketInfo ? socketInfo.totalSockets :
                        (sockets ? sockets.split(' ').filter(s => s === 'S').length : 0);

    // Obtener slot
    const slotAttr = itemEl.getAttribute('id');

    // Para items mágicos/raros, guardar el nombre completo para mostrar
    // pero usar baseType para búsquedas de trade
    const displayName = (rarity === 'unique' || rarity === 'relic') ? name :
                        (rarity === 'magic' || rarity === 'rare') ? name : baseType;

    parsedItems.push({
      id: index,
      rarity,
      name: displayName,
      baseType,
      implicitMods,
      enchantMods,
      explicitMods,
      socketCount,
      socketInfo, // PoE1 socket details (colors, links)
      ilvl,
      levelReq,
      corrupted,
      defenceProperties,
      slot: slotAttr,
      rawText: itemText,
      filters: {
        minValues: {
          ...Object.fromEntries(
            [
              ...enchantMods.map((m, i) => [`enchant_${i}`, m.value]),
              ...implicitMods.map((m, i) => [`implicit_${i}`, m.value]),
              ...explicitMods.map((m, i) => [`explicit_${i}`, m.value])
            ].filter(([_, v]) => v !== null)
          )
        },
        maxValues: {},
        selectedImplicits: implicitMods.map(() => false),
        selectedEnchants: enchantMods.map(() => false),
        selectedExplicits: explicitMods.map(() => true),
        fracturedModIndex: null, // Index of the explicit mod to search as fractured (null = none)
        searchFractured: implicitMods.some(m => m.fractured) || explicitMods.some(m => m.fractured),
        // Defence filters (for armour items)
        defenceFilters: {
          energyShield: { min: defenceProperties.energyShield, max: null, enabled: false },
          armour: { min: defenceProperties.armour, max: null, enabled: false },
          evasion: { min: defenceProperties.evasion, max: null, enabled: false }
        },
        // Socket filters (PoE1 only)
        socketFilters: socketInfo ? {
          enabled: false,
          r: { min: null, enabled: false },
          g: { min: null, enabled: false },
          b: { min: null, enabled: false },
          w: { min: null, enabled: false },
          links: { min: null, enabled: false }
        } : null
      }
    });
  });

  if (parsedItems.length === 0) {
    throw new Error('No se pudieron extraer items del build. Verifica que el código sea válido.');
  }

  // Detect game from XML and items
  const detectedGame = detectGameFromXml(xmlDoc, parsedItems);

  return {
    items: parsedItems,
    detectedGame
  };
};
