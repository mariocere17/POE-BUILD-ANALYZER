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

    // Debug logging for charms
    const isCharm = itemText.toLowerCase().includes('charm');
    if (isCharm) {
      console.log(`\n[CHARM DEBUG] Item ${index + 1}:`);
      console.log('First 15 lines:', lines.slice(0, 15));
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

    if (isCharm) {
      console.log(`[CHARM DEBUG] Rarity: ${rarity}, Name: ${name}, BaseType: ${baseType}`);
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

      // Saltar líneas de metadata
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
          .replace(/\+?-?\d+(\.\d+)?/g, '#')
          .replace(/#%/g, '#%')
          .replace(/# to #/g, '# to #');

        // Extraer el valor original
        const valueMatch = cleanLine.match(/\+?-?(\d+(\.\d+)?)/);
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

    parsedItems.push({
      id: index,
      rarity,
      name: rarity === 'unique' ? name : baseType,
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
    item.name?.toLowerCase().includes('charm')
  );
  if (charms.length > 0) {
    console.log(`\n[CHARM DEBUG] Successfully parsed ${charms.length} charms:`);
    charms.forEach((charm, i) => {
      console.log(`${i + 1}. ${charm.name} (${charm.rarity}) - ${charm.explicitMods.length} explicit mods`);
    });
  }

  return parsedItems;
};
