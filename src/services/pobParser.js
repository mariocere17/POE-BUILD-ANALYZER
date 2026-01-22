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

/**
 * Parses a Path of Building code and extracts item data
 * @param {string} code - PoB code (base64, pobb.in URL, or raw code)
 * @returns {Promise<Array>} Array of parsed items
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

    // Debug logging for flasks
    if (process.env.NODE_ENV === 'development' &&
        (itemText.toLowerCase().includes('flask') || itemText.toLowerCase().includes('penetrating'))) {
      console.log('=== FLASK DEBUG ===');
      console.log('Raw itemText:', itemText);
      console.log('Lines:', lines);
    }

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

    // Debug: log name extraction for flasks
    if (process.env.NODE_ENV === 'development' &&
        (itemText.toLowerCase().includes('flask') || itemText.toLowerCase().includes('penetrating'))) {
      console.log('=== FLASK NAME DEBUG ===');
      console.log('nameLineIdx:', nameLineIdx);
      console.log('name (initial):', name);
      console.log('baseType (initial):', baseType);
      console.log('rarity:', rarity);
    }

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

    // Detectar corrupción
    const corrupted = itemText.includes('Corrupted');

    // Extraer sockets/runas
    const socketsMatch = itemText.match(/Sockets: (.+)/);
    const sockets = socketsMatch ? socketsMatch[1].trim() : null;

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

    // Contar sockets
    const socketCount = sockets ? sockets.split(' ').filter(s => s === 'S').length : 0;

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
      ilvl,
      levelReq,
      corrupted,
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
        selectedImplicits: implicitMods.map(() => true),
        selectedEnchants: enchantMods.map(() => false),
        selectedExplicits: explicitMods.map(() => true),
        searchFractured: implicitMods.some(m => m.fractured) || explicitMods.some(m => m.fractured)
      }
    });
  });

  if (parsedItems.length === 0) {
    throw new Error('No se pudieron extraer items del build. Verifica que el código sea válido.');
  }

  // Debug: Log charms that were parsed
  const charms = parsedItems.filter(item =>
    item.baseType?.toLowerCase().includes('charm') ||
    item.name?.toLowerCase().includes('charm') ||
    item.rawText?.toLowerCase().includes('charm')
  );

  return parsedItems;
};
