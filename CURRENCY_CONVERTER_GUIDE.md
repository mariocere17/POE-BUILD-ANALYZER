# Guía de Currency Converter

Esta guía explica cómo usar el endpoint de test de currencies y el componente CurrencyConverter.

---

## 📡 Endpoint de Test: `/api/poe2scout/currency/test`

### Propósito
Obtener todas las currencies disponibles de la API para inspeccionar qué monedas están disponibles y sus precios en Chaos Orbs.

### URL
```
http://localhost:3001/api/poe2scout/currency/test
```

### Parámetros Query

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `league` | string | No | `"Fate of the Vaal"` | Nombre de la liga |
| `game` | string | No | `"poe2"` | Juego: `"poe2"` o `"poe1"` |

### Ejemplos de Uso

#### PoE2 - Liga Actual
```bash
curl "http://localhost:3001/api/poe2scout/currency/test?league=Fate%20of%20the%20Vaal&game=poe2"
```

#### PoE1 - Liga Actual
```bash
curl "http://localhost:3001/api/poe2scout/currency/test?league=Keepers%20of%20the%20Flame&game=poe1"
```

#### Usando JavaScript (en navegador o Node)
```javascript
// Obtener todas las currencies disponibles
const response = await fetch(
  'http://localhost:3001/api/poe2scout/currency/test?league=Fate%20of%20the%20Vaal&game=poe2'
);
const data = await response.json();

console.log('Currencies disponibles:', data.items.length);
data.items.forEach(item => {
  console.log(`${item.text}: ${item.currentPrice} Chaos Orbs`);
});
```

### Formato de Respuesta

```json
{
  "items": [
    {
      "text": "Divine Orb",
      "currentPrice": 57,
      "iconUrl": "https://web.poecdn.com/...",
      "priceLogs": [...]
    },
    {
      "text": "Mirror of Kalandra",
      "currentPrice": 1310057,
      "iconUrl": "https://web.poecdn.com/...",
      "priceLogs": [...]
    },
    {
      "text": "Exalted Orb",
      "currentPrice": 12,
      "iconUrl": "https://web.poecdn.com/...",
      "priceLogs": [...]
    },
    {
      "text": "Chaos Orb",
      "currentPrice": 1,
      "iconUrl": "https://web.poecdn.com/...",
      "priceLogs": [...]
    }
  ]
}
```

### Estructura de Datos

- **items**: Array de objetos currency
  - **text**: Nombre de la moneda (string)
  - **currentPrice**: Precio en Chaos Orbs (number, redondeado)
  - **iconUrl**: URL del icono (string, puede ser null)
  - **priceLogs**: Array de histórico de precios (array)

---

## 💱 Componente CurrencyConverter

### Propósito
Mostrar conversiones personalizadas entre pares de monedas. Por ejemplo:
- Mirror of Kalandra → Divine Orb
- Divine Orb → Chaos Orb
- Divine Orb → Exalted Orb

### Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `league` | string | Sí | - | Liga actual |
| `game` | string | Sí | - | Juego: `"poe2"` o `"poe1"` |
| `currencyPairs` | array | No | `[]` | Array de pares de conversión |

### Formato de `currencyPairs`

```javascript
[
  {
    from: "Mirror of Kalandra",  // Moneda origen (nombre exacto)
    to: "Divine Orb",             // Moneda destino (nombre exacto)
    icon: "🪞"                    // Emoji/icono opcional
  },
  {
    from: "Divine Orb",
    to: "Chaos Orb",
    icon: "💎"
  },
  {
    from: "Divine Orb",
    to: "Exalted Orb",
    icon: "💎"
  }
]
```

### Ejemplo de Uso Básico

```jsx
import CurrencyConverter from './components/PoeNinja/CurrencyConverter';

function App() {
  const currencyPairs = [
    { from: "Mirror of Kalandra", to: "Divine Orb", icon: "🪞" },
    { from: "Divine Orb", to: "Chaos Orb", icon: "💎" },
    { from: "Divine Orb", to: "Exalted Orb", icon: "💎" }
  ];

  return (
    <CurrencyConverter
      league="Fate of the Vaal"
      game="poe2"
      currencyPairs={currencyPairs}
    />
  );
}
```

### Ejemplo Completo con useState

```jsx
import React, { useState } from 'react';
import CurrencyConverter from './components/PoeNinja/CurrencyConverter';

function App() {
  const [game, setGame] = useState('poe2');
  const [league, setLeague] = useState('Fate of the Vaal');

  // Pares de conversión para PoE2
  const poe2Pairs = [
    { from: "Mirror of Kalandra", to: "Divine Orb", icon: "🪞" },
    { from: "Divine Orb", to: "Chaos Orb", icon: "💎" },
    { from: "Divine Orb", to: "Exalted Orb", icon: "💎" },
    { from: "Exalted Orb", to: "Chaos Orb", icon: "🌟" }
  ];

  // Pares de conversión para PoE1
  const poe1Pairs = [
    { from: "Mirror of Kalandra", to: "Divine Orb", icon: "🪞" },
    { from: "Divine Orb", to: "Chaos Orb", icon: "💎" }
  ];

  return (
    <div>
      <select value={game} onChange={(e) => setGame(e.target.value)}>
        <option value="poe2">Path of Exile 2</option>
        <option value="poe1">Path of Exile 1</option>
      </select>

      <CurrencyConverter
        league={league}
        game={game}
        currencyPairs={game === 'poe2' ? poe2Pairs : poe1Pairs}
      />
    </div>
  );
}
```

### Nombres de Monedas Comunes

Estos son los nombres exactos que debes usar en `currencyPairs`:

**PoE2:**
- `"Mirror of Kalandra"`
- `"Divine Orb"`
- `"Exalted Orb"`
- `"Chaos Orb"`
- `"Regal Orb"`
- `"Orb of Alchemy"`
- `"Vaal Orb"`
- `"Gemcutter's Prism"`
- `"Chromatic Orb"`
- `"Orb of Regret"`
- `"Jeweller's Orb"`
- `"Orb of Fusing"`
- `"Orb of Scouring"`
- `"Orb of Alteration"`
- `"Orb of Augmentation"`
- `"Orb of Transmutation"`

**PoE1:** (Similar a PoE2 con algunas variaciones)
- `"Mirror of Kalandra"`
- `"Divine Orb"`
- `"Exalted Orb"`
- `"Chaos Orb"`
- Y más...

**Nota:** Usa el endpoint de test para obtener la lista completa actualizada.

---

## 🔧 Cómo Funcionan las Conversiones

### Cálculo Interno

El componente calcula automáticamente los ratios entre monedas:

1. **Obtiene precios base**: Todas las monedas tienen su precio en Chaos Orbs
   ```
   Mirror of Kalandra: 1,310,057 Chaos
   Divine Orb: 57 Chaos
   Exalted Orb: 12 Chaos
   ```

2. **Calcula el ratio**: Divide el precio de la moneda origen entre la destino
   ```
   Mirror → Divine = 1,310,057 / 57 = 22,984 divines
   Divine → Chaos = 57 / 1 = 57 chaos
   Divine → Exalted = 57 / 12 = 4.75 ≈ 5 exalts
   ```

3. **Redondea el resultado**: Siempre muestra números enteros
   ```
   22,984 divines
   57 chaos
   5 exalts
   ```

### Formato de Números

El componente automáticamente formatea los números con separadores de miles:
```
1000 → 1,000
1310057 → 1,310,057
```

---

## 📊 Ejemplos de Configuraciones Útiles

### Configuración Minimalista (Solo las más usadas)
```javascript
const minimalPairs = [
  { from: "Mirror of Kalandra", to: "Divine Orb", icon: "🪞" },
  { from: "Divine Orb", to: "Chaos Orb", icon: "💎" }
];
```

### Configuración Completa (Trading)
```javascript
const tradingPairs = [
  { from: "Mirror of Kalandra", to: "Divine Orb", icon: "🪞" },
  { from: "Divine Orb", to: "Chaos Orb", icon: "💎" },
  { from: "Divine Orb", to: "Exalted Orb", icon: "💎" },
  { from: "Exalted Orb", to: "Chaos Orb", icon: "🌟" },
  { from: "Regal Orb", to: "Chaos Orb", icon: "👑" },
  { from: "Vaal Orb", to: "Chaos Orb", icon: "🔮" }
];
```

### Configuración Crafter (Orbs de crafting)
```javascript
const crafterPairs = [
  { from: "Divine Orb", to: "Chaos Orb", icon: "💎" },
  { from: "Exalted Orb", to: "Chaos Orb", icon: "🌟" },
  { from: "Orb of Alchemy", to: "Chaos Orb", icon: "⚗️" },
  { from: "Vaal Orb", to: "Chaos Orb", icon: "🔮" },
  { from: "Orb of Regret", to: "Chaos Orb", icon: "😢" },
  { from: "Gemcutter's Prism", to: "Chaos Orb", icon: "💠" }
];
```

---

## 🚀 Mejores Prácticas

### 1. Usa el Endpoint de Test Primero
Antes de configurar tus pares, verifica qué monedas están disponibles:
```bash
curl "http://localhost:3001/api/poe2scout/currency/test?league=Fate%20of%20the%20Vaal&game=poe2"
```

### 2. Nombres Exactos
Los nombres deben coincidir exactamente con los de la API (case-insensitive, pero mejor usar el nombre exacto):
```javascript
// ✅ Correcto
{ from: "Divine Orb", to: "Chaos Orb" }

// ❌ Incorrecto
{ from: "divine", to: "chaos" }
{ from: "Divine", to: "Chaos" }
```

### 3. Pares con Sentido Económico
Convierte de mayor a menor valor para que los números tengan sentido:
```javascript
// ✅ Correcto
{ from: "Mirror of Kalandra", to: "Divine Orb" }  // → 22,984 divines
{ from: "Divine Orb", to: "Chaos Orb" }            // → 57 chaos

// ❌ No tiene sentido económico (resultado < 1)
{ from: "Chaos Orb", to: "Divine Orb" }            // → 0 divines (0.017...)
```

### 4. Iconos Consistentes
Usa emojis relevantes para cada moneda:
```javascript
const recommendedIcons = {
  "Mirror of Kalandra": "🪞",
  "Divine Orb": "💎",
  "Exalted Orb": "🌟",
  "Chaos Orb": "🌀",
  "Vaal Orb": "🔮",
  "Regal Orb": "👑",
  "Orb of Alchemy": "⚗️",
  "Gemcutter's Prism": "💠",
  "Chromatic Orb": "🌈",
  "Orb of Regret": "😢"
};
```

---

## 🐛 Troubleshooting

### Error: "Failed to fetch currency data"
**Causa:** El servidor proxy no está corriendo o no puede conectarse a poe2scout.
**Solución:**
```bash
# Verifica que el servidor proxy esté corriendo
node proxy-server.js

# Verifica que puedes acceder al endpoint
curl "http://localhost:3001/api/poe2scout/currency/test?game=poe2"
```

### Conversión muestra "---"
**Causa:** Una de las monedas no existe en los datos de la API.
**Solución:** Verifica el nombre exacto usando el endpoint de test.

### Números muy pequeños o 0
**Causa:** El par de conversión está invertido (de menor a mayor valor).
**Solución:** Invierte el orden del par:
```javascript
// ❌ Incorrecto (resultado < 1)
{ from: "Chaos Orb", to: "Divine Orb" }

// ✅ Correcto
{ from: "Divine Orb", to: "Chaos Orb" }
```

---

## 📝 Formato JSON Recomendado para Configuración

Si quieres guardar la configuración en un archivo JSON:

```json
{
  "poe2": {
    "pairs": [
      {
        "from": "Mirror of Kalandra",
        "to": "Divine Orb",
        "icon": "🪞"
      },
      {
        "from": "Divine Orb",
        "to": "Chaos Orb",
        "icon": "💎"
      },
      {
        "from": "Divine Orb",
        "to": "Exalted Orb",
        "icon": "💎"
      }
    ]
  },
  "poe1": {
    "pairs": [
      {
        "from": "Mirror of Kalandra",
        "to": "Divine Orb",
        "icon": "🪞"
      },
      {
        "from": "Divine Orb",
        "to": "Chaos Orb",
        "icon": "💎"
      }
    ]
  }
}
```

Luego puedes importarlo:
```javascript
import currencyConfig from './currencyConfig.json';

<CurrencyConverter
  league={league}
  game={game}
  currencyPairs={currencyConfig[game].pairs}
/>
```

---

## 🎨 Personalización

### Cambiar Estilos
El componente usa Tailwind CSS. Puedes crear tu propia versión copiando el archivo y modificando las clases:

```jsx
// Cambiar color de acento de cyan a purple
className="text-cyan-400"  // → className="text-purple-400"

// Cambiar borde
className="border-slate-700"  // → className="border-purple-700"
```

### Añadir Información Extra
Puedes extender el componente para mostrar información adicional:

```jsx
// Añadir precio base en Chaos
<div className="text-xs text-slate-500">
  {getCurrencyPrice(pair.from)} Chaos total
</div>
```

---

## 📚 Referencias

- **poe2scout API**: [https://poe2scout.com/api/swagger](https://poe2scout.com/api/swagger)
- **poe.ninja**: [https://poe.ninja/](https://poe.ninja/)
- **Documentación del Proyecto**: Ver `DOCUMENTACION_PROYECTO.md`

---

**Última actualización**: Enero 2026
**Versión del componente**: 1.0.0
