// src/config/currencyPairs.js
//
// Configuración de pares de conversión de monedas
//
// Formato:
// {
//   from: "Nombre exacto de la moneda origen",
//   to: "Nombre exacto de la moneda destino",
//   iconUrl: string  // URL del icono del CDN oficial de PoE
// }
//
// IMPORTANTE: Los nombres deben coincidir exactamente con los de la API
// Usa el endpoint de test para verificar nombres:
// http://localhost:3001/api/poe2scout/currency/test?league=Fate%20of%20the%20Vaal&game=poe2

import { poe2CurrencyIcons, poe1CurrencyIcons } from './currencyIcons';

/**
 * Parejas de conversión para Path of Exile 2
 *
 * Incluye items de Currency, Abyssal Bones (Abyss), y Ritual Omens
 *
 * NOTA: El componente mostrará máximo 5 items a la vez
 * Si hay más de 5, rotará automáticamente cada 5 segundos
 */
export const poe2CurrencyPairs = [
  // --- High Value Currency ---
  {
    from: "Mirror of Kalandra",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Mirror of Kalandra"]
  },
  {
    from: "Hinekora's Lock",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Hinekora's Lock"]
  },
  {
    from: "Fracturing Orb",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Fracturing Orb"]
  },
  {
    from: "Divine Orb",
    to: "Chaos Orb",
    iconUrl: poe2CurrencyIcons["Divine Orb"]
  },
  {
    from: "Divine Orb",
    to: "Exalted Orb",
    iconUrl: poe2CurrencyIcons["Divine Orb"]
  },
  {
    from: "Ancient Collarbone",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Ancient Collarbone"]
  },
  {
    from: "Ancient Jawbone",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Ancient Jawbone"]
  },
  {
    from: "Ancient Rib",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Ancient Rib"]
  },
  {
    from: "Omen of Whittling",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Omen of Whittling"]
  },
  {
    from: "Omen of Light",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Omen of Light"]
  },
  {
    from: "Omen of Abyssal Echoes",
    to: "Chaos orb",
    iconUrl: poe2CurrencyIcons["Omen of Abyssal Echoes"]
  },
  {
    from: "Uhtred's Augury",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Uhtred's Augury"]
  },
  {
    from: "Tecrod's Gaze",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Tecrod's Gaze"]
  },
  {
    from: "Garukhan's Resolve",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Garukhan's Resolve"]
  },
  {
    from: "Rakiata's Flow",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Rakiata's Flow"]

  }
];

/**
 * Parejas de conversión para Path of Exile 1
 *
 * NOTA: El componente mostrará máximo 5 items a la vez
 * Si hay más de 5, rotará automáticamente cada 5 segundos
 */
export const poe1CurrencyPairs = [
  {
    from: "Mirror of Kalandra",
    to: "Divine Orb",
    iconUrl: poe1CurrencyIcons["Mirror of Kalandra"]
  },
  {
    from: "Hinekora's Lock",
    to: "Divine Orb",
    iconUrl: poe1CurrencyIcons["Hinekora's Lock"]
  },
  {
    from: "Mirror Shard",
    to: "Divine Orb",
    iconUrl: poe1CurrencyIcons["Mirror Shard"]
  },
  {
    from: "Fracturing Orb",
    to: "Divine Orb",
    iconUrl: poe1CurrencyIcons["Fracturing Orb"]
  },
  {
    from: "Divine Orb",
    to: "Chaos Orb",
    iconUrl: poe1CurrencyIcons["Divine Orb"]
  },
  {
    from: "Divine Orb",
    to: "Exalted Orb",
    iconUrl: poe1CurrencyIcons["Divine Orb"]
  },
  {
    from: "Reflecting Mist",
    to: "Divine Orb",
    iconUrl: poe1CurrencyIcons["Reflecting Mist"]
  },
  {
    from: "Veiled Exalted Orb",
    to: "Divine Orb",
    iconUrl: poe1CurrencyIcons["Veiled Exalted Orb"]
  },
  {
    from: "Exalted Orb",
    to: "Chaos Orb",
    iconUrl: poe1CurrencyIcons["Exalted Orb"]
  },
];
