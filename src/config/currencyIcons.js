// src/config/currencyIcons.js
//
// Mapeo de nombres de monedas a sus iconos locales
//
// Los iconos están almacenados en src/assets/currency-icons/
// Formato de nombres: {juego}-{nombre-moneda}.png
// Ejemplo: poe2-divine-orb.png, poe1-chaos-orb.png

// ===== IMPORTAR ICONOS DE PoE2 =====
import poe2DivineOrb from '../assets/currency-icons/poe2-divine-orb.png';
import poe2ChaosOrb from '../assets/currency-icons/poe2-chaos-orb.png';
import poe2MirrorOfKalandra from '../assets/currency-icons/poe2-mirror-of-kalandra.png';
import poe2ExaltedOrb from '../assets/currency-icons/poe2-exalted-orb.png';
import poe2HinekorasLock from '../assets/currency-icons/poe2-hinekoras-lock.png';
import poe2FracturingOrb from '../assets/currency-icons/poe2-fracturing-orb.png';
import poe2TecrodsGaze from '../assets/currency-icons/poe2-tecrods-gaze.png';
import poe2RakiatasFlow from '../assets/currency-icons/poe2-rakiatas-flow.png';
import poe2OmenOfWhittling from '../assets/currency-icons/poe2-omen-of-whittling.png';
import poe2OmenOfAbyssalEchoes from '../assets/currency-icons/poe2-omen-of-abyssal-echoes.png';
import poe2AncientRib from '../assets/currency-icons/poe2-ancient-rib.png';
import poe2AncientJawbone from '../assets/currency-icons/poe2-ancient-jawbone.png';
import poe2AncientCollarbone from '../assets/currency-icons/poe2-ancient-collarbone.png';
import poe2OmenOfLight from '../assets/currency-icons/poe2-omen-of-light.png';
import poe2UhtredsAugury from '../assets/currency-icons/poe2-uhtreds-augury.png';
import poe2GarukhansResolve from '../assets/currency-icons/poe2-garukhans-resolve.png';

// ===== IMPORTAR ICONOS DE PoE1 =====
import poe1DivineOrb from '../assets/currency-icons/poe1-divine-orb.png';
import poe1ChaosOrb from '../assets/currency-icons/poe1-chaos-orb.png';
import poe1MirrorOfKalandra from '../assets/currency-icons/poe1-mirror-of-kalandra.png';
import poe1ExaltedOrb from '../assets/currency-icons/poe1-exalted-orb.png';
import poe1MirrorShard from '../assets/currency-icons/poe1-mirror-shard.png';
import poe1HinekorasLock from '../assets/currency-icons/poe1-hinekoras-lock.png';
import poe1FracturingOrb from '../assets/currency-icons/poe1-fracturing-orb.png';
import poe1ReflectingMist from '../assets/currency-icons/poe1-reflecting-mist.png';
import poe1VeiledExaltedOrb from '../assets/currency-icons/poe1-veiled-exalted-orb.png';

/**
 * Iconos de monedas para Path of Exile 2
 */
export const poe2CurrencyIcons = {
  // Principales
  "Divine Orb": poe2DivineOrb,
  "Chaos Orb": poe2ChaosOrb,
  "Mirror of Kalandra": poe2MirrorOfKalandra,
  "Exalted Orb": poe2ExaltedOrb,

  // Adicionales
  "Hinekora's Lock": poe2HinekorasLock,
  "Fracturing Orb": poe2FracturingOrb,
  "Tecrod's Gaze": poe2TecrodsGaze,
  "Rakiata's Flow": poe2RakiatasFlow,
  "Omen of Whittling": poe2OmenOfWhittling,
  "Omen of Abyssal Echoes": poe2OmenOfAbyssalEchoes,
  "Ancient Rib": poe2AncientRib,
  "Ancient Jawbone": poe2AncientJawbone,
  "Ancient Collarbone": poe2AncientCollarbone,
  "Omen of Light": poe2OmenOfLight,
  "Uhtred's Augury": poe2UhtredsAugury,
  "Garukhan's Resolve": poe2GarukhansResolve,
};

/**
 * Iconos de monedas para Path of Exile 1
 */
export const poe1CurrencyIcons = {
  // Principales
  "Divine Orb": poe1DivineOrb,
  "Chaos Orb": poe1ChaosOrb,
  "Mirror of Kalandra": poe1MirrorOfKalandra,
  "Exalted Orb": poe1ExaltedOrb,

  // Adicionales (PoE1 específicos)
  "Mirror Shard": poe1MirrorShard,
  "Hinekora's Lock": poe1HinekorasLock,
  "Fracturing Orb": poe1FracturingOrb,
  "Reflecting Mist": poe1ReflectingMist,
  "Veiled Exalted Orb": poe1VeiledExaltedOrb,
};

/**
 * Función helper para obtener el icono de una moneda
 * @param {string} currencyName - Nombre de la moneda
 * @param {string} game - Juego ('poe1' o 'poe2')
 * @returns {string|null} - URL del icono o null si no existe
 */
export function getCurrencyIcon(currencyName, game = 'poe2') {
  const icons = game === 'poe2' ? poe2CurrencyIcons : poe1CurrencyIcons;
  return icons[currencyName] || null;
}
