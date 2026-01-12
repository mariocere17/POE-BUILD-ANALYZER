# Documentación del Proyecto: PoE Build Analyzer

## Enlaces Útiles y Referencias de APIs

### APIs Oficiales de Path of Exile
- **Trade API (Stats)**: [https://www.pathofexile.com/api/trade/data/stats?realm=poe2](https://www.pathofexile.com/api/trade/data/stats?realm=poe2)
- **Trade API (Leagues)**: [https://www.pathofexile.com/api/trade/data/leagues?realm=poe2](https://www.pathofexile.com/api/trade/data/leagues?realm=poe2)
- **Trade Search**: [https://www.pathofexile.com/trade2/search/poe2](https://www.pathofexile.com/trade2/search/poe2)

### poe2scout - Path of Exile 2 Economy Tracker
- **Website**: [https://poe2scout.com/](https://poe2scout.com/)
- **Currency Economy**: [https://poe2scout.com/economy/currency](https://poe2scout.com/economy/currency)
- **API Swagger Documentation**: [https://poe2scout.com/api/swagger](https://poe2scout.com/api/swagger)
- **GitHub Repository**: [https://github.com/poe2scout/poe2scout](https://github.com/poe2scout/poe2scout)

### PoEDB - Documentación y API
- **Developer API Overview**: [https://poedb.tw/us/Developer_API](https://poedb.tw/us/Developer_API)
- **PoE API Documentation**: [https://poedb.tw/us/poe-api](https://poedb.tw/us/poe-api)
- **Trade API Reference**: [https://poedb.tw/us/API%3ATrade](https://poedb.tw/us/API%3ATrade)

### poe.ninja - Economy Data (PoE1)
- **Website**: [https://poe.ninja/](https://poe.ninja/)
- **API (PoE1)**: [https://poe.ninja/poe1/api/economy/stash/current/currency/overview](https://poe.ninja/poe1/api/economy/stash/current/currency/overview)

### Otros Recursos
- **Path of Building Community**: [https://github.com/PathOfBuildingCommunity/PathOfBuilding](https://github.com/PathOfBuildingCommunity/PathOfBuilding)
- **PoE Wiki**: [https://www.poewiki.net/](https://www.poewiki.net/)

---

## Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Propósito y Funcionalidad](#propósito-y-funcionalidad)
3. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
4. [Componentes Principales](#componentes-principales)
5. [Servicios y Lógica de Negocio](#servicios-y-lógica-de-negocio)
6. [Servidor Proxy](#servidor-proxy)
7. [Flujo de Datos](#flujo-de-datos)
8. [Tecnologías Utilizadas](#tecnologías-utilizadas)
9. [Instalación y Uso](#instalación-y-uso)

---

## Resumen Ejecutivo

**PoE Build Analyzer** es una aplicación web React que automatiza la búsqueda de items en Path of Exile. Toma un código de build exportado desde Path of Building, lo parsea, extrae todos los items y genera URLs de búsqueda preconfiguradas para cada uno en el mercado oficial de PoE.

**Problema que resuelve**: Buscar manualmente items con características específicas (stats, nivel, rareza, etc.) en el trade es tedioso. Esta herramienta automátiza completamente ese proceso.

---

## Propósito y Funcionalidad

### Flujo de Uso
1. El jugador exporta un código PoB desde Path of Building
2. Pega el código en la aplicación
3. La aplicación parsea el código y extrae todos los items
4. Para cada item, el usuario puede:
   - Ver detalles completos (mods, rareza, level req, etc.)
   - Editar qué mods incluir en la búsqueda
   - Generar URL de trade o copiarla al portapapeles
   - Abrir directamente la búsqueda en el navegador

### Características Principales
- Soporte para PoE1 y PoE2
- Selector de liga (Standard, Challenge, HC)
- Parseo automático de items únicos, raros, mágicos y normales
- Detección automática de mods (enchants, implícitos, explícitos)
- Editor de mods con rangos min/max
- Generación de URLs de trade optimizadas
- Panel lateral con precios de monedas (poe.ninja)

---

## Arquitectura del Proyecto

### Estructura de Carpetas

```
poe-build-analyzer/
├── public/
│   └── index.html              # Punto de entrada HTML
├── src/
│   ├── components/
│   │   ├── BuildAnalyzer/
│   │   │   ├── BuildForm.jsx           # Formulario de entrada de código PoB
│   │   │   ├── ItemList.jsx            # Contenedor de lista de items
│   │   │   ├── ItemCard.jsx            # Tarjeta individual de item
│   │   │   └── EditItemModal.jsx       # Modal para editar filtros de item
│   │   ├── Layout/
│   │   │   ├── Header.jsx              # Encabezado de la aplicación
│   │   │   └── Footer.jsx              # Pie de página
│   │   └── PoeNinja/
│   │       └── CurrencyConverter.jsx   # Panel unificado de economía
│   ├── assets/
│   │   ├── currency-icons/             # Iconos de monedas (.png)
│   │   │   ├── poe2-divine-orb.png
│   │   │   ├── poe2-chaos-orb.png
│   │   │   └── ... (12 iconos totales)
│   │   └── other-icons/                # Logos y otros iconos
│   │       ├── poe1-logo.png
│   │       └── poe2-logo.png
│   ├── config/
│   │   ├── currencyPairs.js            # Configuración de pares de monedas
│   │   ├── currencyIcons.js            # Mapeo de iconos locales
│   │   └── README_CURRENCY_ICONS.md    # Guía para añadir iconos
│   ├── services/
│   │   ├── pobParser.js                # Parser de códigos Path of Building
│   │   ├── tradeAPI.js                 # Generador de URLs de trade
│   │   └── statsAPI.js                 # Cliente API de stats de PoE
│   ├── hooks/
│   │   └── useBuildAnalyzer.js         # Hook central de gestión de estado
│   ├── utils/
│   │   └── constants.js                # Constantes globales (ligas, URLs, etc.)
│   ├── App.jsx                         # Componente raíz
│   ├── index.js                        # Punto de entrada React
│   └── index.css                       # Estilos globales + Tailwind
├── proxy-server.js                     # Servidor proxy para resolver CORS
├── start-all.bat                       # Script para iniciar todo en Windows
├── package.json                        # Dependencias y scripts
├── DOCUMENTACION_PROYECTO.md           # Esta documentación
└── CURRENCY_CONVERTER_GUIDE.md         # Guía de Currency Converter
```

---

## Componentes Principales

### Componentes de Presentación (UI)

#### BuildForm.jsx
**Propósito**: Formulario de entrada de datos del usuario.

**Funcionalidad**:
- Selector de juego (PoE2 vs PoE1)
- Selector de liga activa
- Textarea para pegar código PoB
- Botón "Analizar Build"
- Muestra errores de validación

**Props**:
```javascript
{
  pobCode: string,           // Código PoB actual
  setPobCode: function,      // Setter para código
  game: string,              // 'poe2' o 'poe1'
  setGame: function,         // Setter para juego
  league: string,            // Nombre de liga
  setLeague: function,       // Setter para liga
  handleParsePoB: function,  // Handler de parseo
  loading: boolean,          // Estado de carga
  error: string              // Mensaje de error
}
```

#### ItemList.jsx
**Propósito**: Contenedor principal que lista todos los items parseados.

**Funcionalidad**:
- Lista todos los items extraídos del código PoB
- Selector de estado del vendedor (any / online)
- Muestra información de la liga seleccionada
- Renderiza un `ItemCard` por cada item

**Props**:
```javascript
{
  items: array,              // Array de items parseados
  game: string,              // Juego actual
  league: string,            // Liga actual
  // ... handlers para acciones de items
}
```

#### ItemCard.jsx
**Propósito**: Tarjeta visual para un item individual.

**Funcionalidad**:
- Muestra nombre, tipo base y rareza (con color)
- Badges: iLvl, level requerido, corrupted, sockets
- 3 botones de acción: Editar, Copiar URL, Abrir Trade
- Preview de los primeros 3-4 mods por tipo

**Estructura visual**:
```
┌─────────────────────────────────────┐
│ [Nombre del Item]                   │
│ Tipo Base (Rareza en color)         │
│ ╔═══╗ ╔═══╗ ╔═══╗                  │
│ iLvl  Lvl   [⚡Cor]                 │
│ ─────────────────────────────────── │
│ Enchants: (2)                       │
│ • Mod 1                             │
│ • Mod 2                             │
│ Implicits: (1)                      │
│ • Mod                               │
│ Explicits: (4) - Showing 3          │
│ • Mod 1                             │
│ • Mod 2                             │
│ • Mod 3                             │
│ ─────────────────────────────────── │
│ [Edit] [Copy URL] [Open Trade]     │
└─────────────────────────────────────┘
```

#### EditItemModal.jsx
**Propósito**: Modal para editar los filtros de búsqueda de un item.

**Funcionalidad**:
- Editar iLvl mínimo y rareza del item
- Checkboxes para seleccionar/deseleccionar mods individuales
- Inputs min/max para valores numéricos de cada mod
- Separado en 3 secciones: Enchants, Implícitos, Explícitos
- Indicador de cuántos mods están seleccionados

**Ejemplo de uso**:
```javascript
// Si un mod es "+15% to Fire Resistance"
// El usuario puede:
// ☑ Incluir este mod en la búsqueda
// Min: 10   Max: 20  (rango deseado)
```

#### CurrencyConverter.jsx
**Propósito**: Panel unificado de economía que muestra conversiones entre pares de monedas.

**Funcionalidad**:
- Título "Economy Status" con logo del juego y nombre de la liga
- Muestra conversiones personalizadas entre cualquier par de monedas
- Calcula automáticamente los ratios basándose en precios en Chaos
- Formato de números con separadores de miles
- Configuración mediante archivo externo (`src/config/currencyPairs.js`)
- Iconos locales (.png) para cada moneda desde `src/assets/currency-icons/`
- Logos de juego desde `src/assets/other-icons/`
- Diseño consistente con el resto de la UI
- Panel sticky que se mantiene visible al hacer scroll

**Configuración de iconos**:
```javascript
// src/config/currencyIcons.js
import poe2DivineOrb from '../assets/currency-icons/poe2-divine-orb.png';
import poe2ChaosOrb from '../assets/currency-icons/poe2-chaos-orb.png';
// ...

export const poe2CurrencyIcons = {
  "Divine Orb": poe2DivineOrb,
  "Chaos Orb": poe2ChaosOrb,
  // ...
};
```

**Configuración de pares**:
```javascript
// src/config/currencyPairs.js
export const poe2CurrencyPairs = [
  {
    from: "Mirror of Kalandra",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Mirror of Kalandra"]
  },
  {
    from: "Divine Orb",
    to: "Chaos Orb",
    iconUrl: poe2CurrencyIcons["Divine Orb"]
  },
  // ... más pares
];
```

**Props**:
- `league`: Liga actual (string) - se muestra en el header del panel
- `game`: Juego actual ('poe2' o 'poe1') - determina qué logo mostrar
- `currencyPairs`: Array de objetos con formato `{ from, to, iconUrl }`

**Uso en App.jsx**:
```jsx
<CurrencyConverter
  league={league}
  game={game}
  currencyPairs={game === 'poe2' ? poe2CurrencyPairs : poe1CurrencyPairs}
/>
```

**Pares configurados**:
- **PoE2**: 8 pares (Mirror, Hinekora's Lock, Fracturing, Divine, Exalted, Chaos)
- **PoE1**: 8 pares (Mirror, Hinekora's Lock, Mirror Shard, Fracturing, Divine, Exalted, Chaos)

**Sistema de Rotación Automática (v1.6.0)**:
- **Máximo visible**: 5 items simultáneos
- **Rotación**: Automática cada 5 segundos si hay más de 5 items
- **Pausa al hover**: La rotación se detiene cuando el mouse está sobre el panel
- **Animaciones**: Transiciones suaves slide-in/slide-out con delay escalonado
- **Indicador**: Dots de progreso y mensaje "⏸ Paused" cuando se pausa

📖 **Ver guía completa**: [CURRENCY_ROTATION_GUIDE.md](CURRENCY_ROTATION_GUIDE.md)

**Nota**: CurrencyPanel.jsx fue eliminado en v1.5.0 (era deprecated desde v1.4.0)

#### Header.jsx y Footer.jsx
**Propósito**: Componentes decorativos de layout.

- **Header**: Título con gradiente y branding
- **Footer**: Disclaimer legal y logo de PoE

---

### Hook de Estado Central

#### useBuildAnalyzer.js
**Propósito**: Gestor centralizado de todo el estado de la aplicación.

**Estado Mantenido**:
```javascript
{
  pobCode: string,              // Código PoB ingresado por usuario
  items: array,                 // Items parseados
  loading: boolean,             // Estado de carga global
  error: string,                // Mensaje de error actual
  editingItem: object,          // Item siendo editado en modal
  game: string,                 // 'poe2' o 'poe1'
  league: string,               // Liga seleccionada
  copiedIndex: number,          // Índice del último item copiado
  statCache: object,            // Cache de stat IDs de API
  sellerStatus: string          // 'any' o 'online'
}
```

**Acciones Principales**:

1. **handleParsePoB()**: Parsea el código PoB
   ```javascript
   // Valida código → pobParser.parsePoB() → setItems()
   ```

2. **handleFetchStats()**: Obtiene stat IDs desde API
   ```javascript
   // Verifica cache → si no existe: statsAPI.fetchStatIds()
   ```

3. **handleCopyToClipboard(item)**: Genera URL y copia
   ```javascript
   // Fetch stats → tradeAPI.generateTradeURL() → navigator.clipboard
   ```

4. **handleOpenTradeURL(item)**: Genera URL y abre
   ```javascript
   // Fetch stats → tradeAPI.generateTradeURL() → window.open()
   ```

5. **handleSaveItem(updatedItem)**: Actualiza item editado
   ```javascript
   // Reemplaza item en array → cierra modal
   ```

---

## Servicios y Lógica de Negocio

### pobParser.js - Parser de Path of Building

**Propósito**: Convertir códigos PoB (base64 comprimidos) en objetos JavaScript estructurados.

**Proceso de Parseo**:

1. **Validación de entrada**
   ```javascript
   // Rechaza URLs de pobb.in
   // Acepta strings base64
   ```

2. **Decodificación**
   ```javascript
   // Corrige caracteres URL-safe (- → +, _ → /)
   // Convierte base64 a Uint8Array
   ```

3. **Descompresión**
   ```javascript
   // Usa DecompressionStream con 'deflate-raw'
   // Fallback a 'deflate' si falla
   ```

4. **Parseo XML**
   ```javascript
   // DOMParser convierte string XML a DOM
   // Extrae nodos <Item>
   ```

5. **Extracción de datos por item**

**Detección de Rareza**:
```javascript
// Busca línea "Rarity: UNIQUE"
// Si no existe, infiere por contexto
```

**Extracción de Propiedades Básicas**:
- Nombre (primera línea después de rareza)
- Tipo base (segunda línea)
- iLvl (línea "ItemLevel: N")
- Level requerido (línea "LevelReq: N")
- Corrupted (línea "Corrupted")
- Sockets (línea "Sockets: R-G-B")

**Categorización de Mods**:
```javascript
// Enchants: tienen tag {enchant}
// Implícitos: contador "Implicits: N" + siguientes N líneas
// Explícitos: resto de líneas de mods
```

**Normalización de Mods**:
```javascript
// Ejemplo:
// "+25% to Fire Resistance" → "+#% to Fire Resistance"
// "#.#" para decimales
// "# to #" para rangos
```

**Salida**: Array de objetos con estructura:
```javascript
{
  id: string,                    // UUID único
  rarity: string,                // 'unique', 'rare', 'magic', 'normal'
  name: string,                  // Nombre del item
  baseType: string,              // Tipo base
  implicitMods: string[],        // Mods implícitos normalizados
  enchantMods: string[],         // Enchants normalizados
  explicitMods: string[],        // Mods explícitos normalizados
  socketCount: number,           // Número de sockets
  ilvl: number,                  // Item level
  levelReq: number,              // Level requerido
  corrupted: boolean,            // Si está corrupted
  slot: string,                  // Slot del item (Weapon, Body, etc.)
  rawText: string,               // Texto completo original
  filters: {                     // Filtros de búsqueda
    minValues: object,           // Valores mínimos por mod
    maxValues: object,           // Valores máximos por mod
    selectedImplicits: boolean[], // Qué implícitos buscar
    selectedEnchants: boolean[],  // Qué enchants buscar
    selectedExplicits: boolean[], // Qué explícitos buscar
    searchFractured: boolean      // Buscar fractured
  }
}
```

---

### tradeAPI.js - Generador de URLs de Trade

**Propósito**: Construir URLs de búsqueda para la API oficial de trade de PoE.

**Entrada**:
```javascript
generateTradeURL(item, game, league, sellerStatus, stats)
```

**Proceso**:

1. **Selección de URL base**
   ```javascript
   // PoE2: www.pathofexile.com/trade2
   // PoE1: www.pathofexile.com/trade
   ```

2. **Construcción de query JSON**
   ```javascript
   {
     query: {
       status: { option: "online" },  // o "any"
       name: "Item Name",              // Solo para uniques
       type: "Base Type",              // Excepto joyas
       filters: {
         type_filters: {
           filters: {
             rarity: { option: "unique" },
             ilvl: { min: 75 }
           }
         }
         // ... más filtros
       },
       stats: [
         {
           type: "and",
           filters: [
             { id: "stat_id", value: { min: 10, max: 20 } }
           ]
         }
       ]
     },
     sort: { price: "asc" }
   }
   ```

3. **Casos especiales**:

   **Items Únicos**:
   ```javascript
   // Busca por nombre exacto + tipo base
   query.name = item.name
   query.type = item.baseType
   ```

   **Joyas**:
   ```javascript
   // NO especifica type (busca solo por mods)
   // Mejora resultados de búsqueda
   query.type = undefined
   ```

   **Items Fractured**:
   ```javascript
   // Añade filtro opcional
   filters.misc_filters.filters.fractured_item = true
   ```

4. **Resolución de Stat IDs**:
   ```javascript
   // Para cada mod seleccionado:
   // 1. Normalizar mod
   // 2. statsAPI.findStatId(stats, normalizedMod, modType)
   // 3. Validar que existe
   // 4. Añadir a query.stats con min/max
   ```

5. **Codificación y construcción final**:
   ```javascript
   const encodedQuery = encodeURIComponent(JSON.stringify(query))
   return `${baseUrl}/search/${league}?q=${encodedQuery}`
   ```

**Validaciones**:
- Verifica que stat ID existe antes de añadir
- Muestra errores en consola si falla

**Salida**: URL completa lista para abrir o copiar.

---

### statsAPI.js - Cliente de API de Stats

**Propósito**: Obtener y gestionar stat IDs de la API oficial de PoE.

**Funciones Principales**:

#### 1. fetchStatIds(game, statCache)
**Propósito**: Obtener lista completa de stats disponibles.

```javascript
// Si hay cache, retornar cache
if (statCache[game]) return statCache[game]

// Si no, hacer fetch
const response = await fetch(`http://localhost:3001/api/stats?realm=${game}`)
const data = await response.json()

// Estructura de respuesta:
{
  result: [
    {
      label: "Pseudo",
      entries: [
        { id: "pseudo.pseudo_total_life", text: "+# to maximum Life" }
      ]
    },
    {
      label: "Explicit",
      entries: [ ... ]
    }
  ]
}
```

#### 2. findStatId(stats, normalizedMod, modType)
**Propósito**: Buscar el stat ID correcto para un mod normalizado.

**Proceso**:
```javascript
// 1. Mapear modType a label
const typeLabel = {
  'enchant': 'Enchant',
  'implicit': 'Implicit',
  'explicit': 'Explicit'
}

// 2. Buscar en la categoría correcta
const category = stats.result.find(cat => cat.label === typeLabel)

// 3. Buscar entrada que coincida
// Match exacto
let entry = category.entries.find(e => e.text === normalizedMod)

// Si no hay match exacto, buscar parcial
if (!entry) {
  entry = category.entries.find(e =>
    e.text.includes(normalizedMod) ||
    normalizedMod.includes(e.text)
  )
}

// 4. Retornar ID o null
return entry ? entry.id : null
```

#### 3. validateStatId(stats, statId)
**Propósito**: Verificar que un stat ID existe en los datos.

```javascript
return stats.result.some(category =>
  category.entries.some(entry => entry.id === statId)
)
```

---

## Servidor Proxy

### proxy-server.js

**Propósito**: Resolver problemas de CORS con las APIs externas de PoE.

**Puerto**: 3001

**Tecnologías**:
- Express 5.2.1
- Node.js zlib (descompresión)

**Endpoints**:

#### 1. GET /api/stats
**Query params**: `realm` ('poe2' o 'poe1')

**Funcionamiento**:
```javascript
// 1. Construir URL de API oficial
const realm = req.query.realm === 'poe2' ? 'poe2' : 'pc'
const url = `https://www.pathofexile.com/api/trade/data/stats?realm=${realm}`

// 2. Hacer fetch con headers apropiados
const response = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 ...',
    'Accept-Encoding': 'gzip, deflate, br'
  }
})

// 3. Descomprimir según Content-Encoding
const encoding = response.headers.get('content-encoding')
let decompressed
if (encoding === 'gzip') {
  decompressed = zlib.gunzipSync(buffer)
} else if (encoding === 'deflate') {
  decompressed = zlib.inflateSync(buffer)
} else if (encoding === 'br') {
  decompressed = zlib.brotliDecompressSync(buffer)
}

// 4. Parsear JSON y retornar
const data = JSON.parse(decompressed.toString())
res.json(data)
```

#### 2. GET /api/poeninja/currency
**Query params**: `league`, `game`

**Funcionamiento**:
```javascript
// 1. Construir URL según juego (endpoints diferentes para PoE1 vs PoE2)
// PoE1: Usa stash tab trading
const urlPoE1 = `https://poe.ninja/poe1/api/economy/stash/current/currency/overview?league=${league}&type=Currency`

// PoE2: Usa Currency Exchange (datos de GGG)
const urlPoE2 = `https://poe.ninja/api/data/poe2/currencyoverview?league=${league}&type=Currency`

// 2. Seguir redirects automáticamente (manejo manual de 301, 302, etc)

// 3. Descomprimir según Content-Encoding (gzip, deflate, brotli)

// 4. Retornar
// Estructura: { lines: [ { currencyTypeName, chaosEquivalent, pay, receive } ] }
```

**Notas importantes**:
- PoE1 y PoE2 usan sistemas de economía diferentes
- PoE1: Basado en stash tabs públicos
- PoE2: Basado en Currency Exchange (datos horarios de GGG, puede tener delay de hasta 1 hora)

#### 3. GET /api/poe2scout/currency
**Query params**:
- `league` (nombre de la liga)
- `game` ('poe1' o 'poe2')

**Propósito**: Obtener datos de currency unificados para ambos juegos (PoE1 y PoE2).

**Funcionamiento**:
```javascript
// Para PoE2: usar poe2scout directamente
if (game === 'poe2') {
  const url = `https://poe2scout.com/api/items/currency/currency?league=${league}&perPage=50`
  // Fetch → Retornar datos directamente
}

// Para PoE1: usar poe.ninja y transformar al formato poe2scout
if (game === 'poe1') {
  const url = `https://poe.ninja/poe1/api/economy/stash/current/currency/overview?league=${league}`
  // Fetch → Transformar estructura → Retornar formato unificado

  // Transformación:
  // { lines: [{ currencyTypeName, chaosEquivalent }] }
  // ↓
  // { items: [{ text, currentPrice }] }
}
```

**Respuesta (formato unificado para ambos juegos)**:
```json
{
  "items": [
    {
      "text": "Divine Orb",
      "currentPrice": 58,
      "iconUrl": "https://web.poecdn.com/...",
      "priceLogs": [...]
    },
    {
      "text": "Mirror of Kalandra",
      "currentPrice": 1310057,
      "iconUrl": "https://web.poecdn.com/...",
      "priceLogs": [...]
    }
  ]
}
```

**Notas importantes**:
- **PoE2**: Usa poe2scout (datos del Currency Exchange oficial de GGG)
- **PoE1**: Usa poe.ninja pero transforma los datos al formato poe2scout para compatibilidad
- Formato de respuesta unificado permite un único flujo en el frontend
- Los precios se redondean a números enteros para mejor legibilidad
- La API es completamente pública y no requiere autenticación
- Se recomienda incluir User-Agent para permitir contacto del desarrollador

#### 4. GET /api/leagues
**Query params**: `game` ('poe1' o 'poe2')

**Propósito**: Obtener ligas activas dinámicamente desde la API correspondiente.

**Funcionamiento**:
```javascript
// Para PoE2: usar poe2scout (más actualizado y preciso)
if (game === 'poe2') {
  const url = 'https://poe2scout.com/api/leagues'
  // Retorna: [{ value: "Fate of the Vaal", divinePrice: 381, chaosDivinePrice: 57 }]
  // Filtrar ligas antiguas (Dawn of the Hunt, Rise of the Abyssal)
  // Mapear al formato esperado
}

// Para PoE1: usar API oficial de Trade
const url = 'https://www.pathofexile.com/api/trade/data/leagues?realm=pc'

// Si falla cualquiera, usar ligas hardcodeadas (fallback)
```

**Respuesta (PoE2)**:
```json
[
  {"id": "Fate of the Vaal", "realm": "poe2", "description": "Fate of the Vaal"},
  {"id": "HC Fate of the Vaal", "realm": "poe2", "description": "HC Fate of the Vaal"},
  {"id": "Standard", "realm": "poe2", "description": "Standard"}
]
```

**Respuesta (PoE1)**:
```json
[
  {"id": "Keepers of the Flame", "realm": "pc", "description": "Keepers of the Flame"},
  {"id": "Hardcore Keepers of the Flame", "realm": "pc", "description": "Hardcore Keepers"},
  {"id": "Standard", "realm": "pc", "description": "Standard League"}
]
```

#### 5. GET /api/poe2scout/currency/test
**Query params**:
- `league` (nombre de la liga)
- `game` ('poe1' o 'poe2')

**Propósito**: Endpoint de test para obtener TODAS las currencies disponibles en la API (hasta 100).

**Funcionamiento**:
```javascript
// Para PoE2: usar poe2scout con perPage=100
const url = `https://poe2scout.com/api/items/currency/currency?league=${league}&perPage=100`;

// Para PoE1: usar poe.ninja y transformar al formato poe2scout
const url = `https://poe.ninja/poe1/api/economy/stash/current/currency/overview?league=${league}`;
```

**Respuesta** (igual formato para ambos juegos):
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
    // ... hasta 100 currencies
  ]
}
```

**Uso principal**:
- Verificar nombres exactos de currencies para `currencyPairs.js`
- Obtener URLs de iconos reales
- Debugging y exploración de datos disponibles

**Logging en consola**:
- Lista completa de nombres de currencies disponibles
- Total de items encontrados

**Ejemplo de uso**:
```bash
# PoE2
curl "http://localhost:3001/api/poe2scout/currency/test?league=Fate%20of%20the%20Vaal&game=poe2"

# PoE1
curl "http://localhost:3001/api/poe2scout/currency/test?league=Keepers%20of%20the%20Flame&game=poe1"
```

#### 6. GET /api/test-leagues
**Propósito**: Endpoint de prueba para verificar disponibilidad de ligas en poe.ninja.

**Características del servidor**:
- CORS habilitado globalmente
- User-Agent header en todas las requests
- Logging detallado de cada request
- Manejo robusto de errores y compresión
- Manejo manual de redirects HTTP (301, 302, 303, 307, 308)
- Timeout configurables (3s para leagues, 30s para otros)

---

## Flujo de Datos

### Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario pega código PoB en BuildForm                    │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BuildForm.jsx → setPobCode(code)                        │
│    useBuildAnalyzer actualiza estado: pobCode              │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Usuario hace clic en "Analizar Build"                   │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. useBuildAnalyzer.handleParsePoB()                       │
│    - Valida que pobCode no esté vacío                      │
│    - setLoading(true)                                      │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. pobParser.parsePoB(pobCode)                             │
│    ┌─────────────────────────────────────────┐            │
│    │ a. Validar input (no pobb.in URLs)      │            │
│    │ b. Decodificar base64                   │            │
│    │ c. Descomprimir deflate                 │            │
│    │ d. Parsear XML con DOMParser            │            │
│    │ e. Extraer nodos <Item>                 │            │
│    │ f. Por cada item:                       │            │
│    │    - Detectar rareza                    │            │
│    │    - Extraer nombre, base, ilvl, etc.   │            │
│    │    - Categorizar mods                   │            │
│    │    - Normalizar mods (# por números)    │            │
│    │    - Inicializar filters                │            │
│    └─────────────────────────────────────────┘            │
│    Retorna: Array de objetos item                         │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. useBuildAnalyzer actualiza estado                       │
│    - setItems(parsedItems)                                 │
│    - setLoading(false)                                     │
│    - setError(null)                                        │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. ItemList.jsx recibe items como prop                     │
│    - Renderiza un ItemCard por cada item                   │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. ItemCard.jsx muestra cada item                          │
│    - Nombre, tipo, rareza (con color)                      │
│    - Badges: iLvl, level, corrupted, sockets               │
│    - Preview de mods (primeros 3-4)                        │
│    - Botones: Edit, Copy URL, Open Trade                   │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 9a. Usuario hace clic en "Edit"                            │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 10a. handleEditItem(item)                                   │
│     - setEditingItem(item)                                  │
│     - EditItemModal se abre                                 │
│     - Usuario edita filtros y hace clic en "Save"          │
│     - handleSaveItem(updatedItem)                           │
│     - Items array se actualiza                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 9b. Usuario hace clic en "Copy URL" o "Open Trade"         │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 10b. handleCopyToClipboard(item) o handleOpenTradeURL()    │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. useBuildAnalyzer.handleFetchStats()                     │
│     - Verifica si statCache[game] existe                    │
│     - Si NO: statsAPI.fetchStatIds(game, statCache)        │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 12. statsAPI.fetchStatIds()                                 │
│     - fetch('http://localhost:3001/api/stats?realm=...')   │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 13. proxy-server.js recibe request                          │
│     GET /api/stats?realm=poe2                               │
│     ┌─────────────────────────────────────────┐            │
│     │ a. Construir URL de API oficial         │            │
│     │ b. Fetch con headers apropiados         │            │
│     │ c. Leer buffer de response              │            │
│     │ d. Descomprimir según encoding          │            │
│     │    (gzip, deflate, brotli)              │            │
│     │ e. Parsear JSON                         │            │
│     │ f. Retornar datos                       │            │
│     └─────────────────────────────────────────┘            │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 14. statsAPI recibe response                                │
│     { result: [ { label, entries: [{id, text}] } ] }       │
│     - Actualiza statCache[game]                             │
│     - Retorna stats                                         │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 15. tradeAPI.generateTradeURL(item, game, league, ...)     │
│     ┌─────────────────────────────────────────┐            │
│     │ a. Seleccionar URL base (trade2 o trade)│            │
│     │ b. Inicializar query JSON                │            │
│     │ c. Casos especiales:                     │            │
│     │    - Unique: añadir name + type          │            │
│     │    - Joya: NO especificar type           │            │
│     │ d. Añadir filtros automáticos:           │            │
│     │    - Rareza, iLvl, corrupted, categoría  │            │
│     │ e. Por cada mod seleccionado:            │            │
│     │    - statsAPI.findStatId()               │            │
│     │    - Validar que existe                  │            │
│     │    - Añadir a query.stats con min/max   │            │
│     │ f. Codificar JSON                        │            │
│     │ g. Construir URL final                   │            │
│     └─────────────────────────────────────────┘            │
│     Retorna: URL completa                                   │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 16. Acción final                                            │
│     - Copy: navigator.clipboard.writeText(url)              │
│     - Open: window.open(url, '_blank')                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Tecnologías Utilizadas

### Frontend
- **React 19.2.3**: Librería UI principal (Create React App)
- **Tailwind CSS 4.1.18**: Framework de estilos utility-first
- **Lucide React 0.562.0**: Librería de iconos moderna
- **Web APIs**:
  - DecompressionStream (descompresión nativa)
  - DOMParser (parseo XML)
  - Clipboard API

### Backend
- **Express 5.2.1**: Framework web para Node.js
- **Node.js zlib**: Módulo nativo de compresión/descompresión
- **Fetch API**: Cliente HTTP

### APIs Externas
- **Path of Exile Trade API**: API oficial de trade
  - Stats API: `pathofexile.com/api/trade/data/stats`
  - Search API: `pathofexile.com/trade/search/[league]`
- **poe.ninja API**: Precios de mercado
  - Currency Overview: `poe.ninja/api/data/currencyoverview`

### Build Tools
- **react-scripts**: Tooling de Create React App
- **Babel + webpack**: Transpilación y bundling (vía CRA)
- **PostCSS + Autoprefixer**: Procesamiento de CSS

### Formato de Datos
- **Base64**: Codificación de códigos PoB
- **Deflate**: Compresión de códigos PoB
- **XML**: Formato de datos de Path of Building
- **JSON**: Comunicación con APIs

---

## Instalación y Uso

### Requisitos Previos
- Node.js 16 o superior
- npm o yarn
- Path of Building (para generar códigos PoB)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd poe-build-analyzer

# 2. Instalar dependencias
npm install
```

### Ejecución en Desarrollo

**Opción 1: Manualmente (2 terminales)**

```bash
# Terminal 1: Iniciar servidor proxy
node proxy-server.js
# Output: Proxy server running on http://localhost:3001

# Terminal 2: Iniciar aplicación React
npm start
# Output: React app running on http://localhost:3000
# Se abrirá automáticamente en el navegador
```

**Opción 2: Script automático (Windows)**

```bash
# Ejecutar script
start-all.bat
# Abre 2 ventanas de terminal automáticamente
```

### Uso de la Aplicación

1. **Exportar build desde Path of Building**
   - Abrir Path of Building
   - Clic en "Import/Export Build"
   - Clic en "Generate" en la sección "Share with Code"
   - Copiar el código generado

2. **Analizar build**
   - Pegar el código en el textarea
   - Seleccionar juego (PoE2 o PoE1)
   - Seleccionar liga
   - Clic en "Analizar Build"

3. **Trabajar con items**
   - Ver lista de items parseados
   - Clic en "Edit" para ajustar filtros de búsqueda
   - Clic en "Copy URL" para copiar URL al portapapeles
   - Clic en "Open Trade" para abrir directamente en navegador

### Build para Producción

```bash
# Crear build optimizado
npm run build

# La carpeta 'build/' contendrá los archivos estáticos
# Servir con cualquier servidor web estático

# Ejemplo con serve:
npx serve -s build -l 3000
```

### Solución de Problemas

**Error: "Failed to fetch stats"**
- Verificar que proxy-server.js esté corriendo
- Verificar que el puerto 3001 esté disponible

**Error: "Invalid PoB code"**
- Verificar que el código sea válido (no URL de pobb.in)
- Verificar que el código no esté truncado

**Items no muestran precios**
- La API de poe.ninja puede estar caída
- Para PoE2, la API aún no está disponible oficialmente

---

## Notas Adicionales

### Limitaciones Conocidas
- URLs de poe.ninja/pob no están soportadas (requieren copia manual del código)
- Algunos mods muy específicos pueden no encontrar stat ID
- Las ligas se obtienen dinámicamente, pero si la API de PoE falla, usa fallback hardcodeado

### Características Implementadas en Esta Versión
- **Obtención dinámica de ligas**: Las ligas se cargan automáticamente desde las APIs correspondientes
  - PoE2: poe2scout (más actualizado)
  - PoE1: API oficial de PoE Trade
- **Filtrado inteligente**: Solo muestra las 3 ligas más relevantes (Challenge + Hardcore + Standard)
- **Manejo de redirects HTTP**: El proxy sigue automáticamente redirects 301/302
- **Sistema de fallback robusto**: Si la API falla, usa ligas hardcodeadas
- **Currency Panel unificado**: Un único endpoint para ambos juegos
  - PoE2: Datos directos desde poe2scout
  - PoE1: Datos desde poe.ninja transformados al formato poe2scout
- **Formato de datos unificado**: Estructura consistente en frontend independiente del juego
- **Precios redondeados**: Sin decimales para mejor legibilidad

### Casos de Uso Optimizados
- Items únicos: búsqueda por nombre exacto
- Joyas: búsqueda sin especificar tipo base (mejor precisión)
- Items fractured: filtro opcional
- Enchantments: correctamente diferenciados

### Mejoras Futuras Potenciales
- Soporte para bulk item search
- Guardado de builds analizados
- Historial de búsquedas
- Comparador de precios entre ligas
- Exportación de búsquedas
- Mejora del endpoint de PoE2 cuando poe.ninja estabilice su API

---

## Changelog Reciente

### Enero 2026 - v1.8.0

**📄 Footer Mejorado y Guía de Usuario**:
- ✅ **Footer rediseñado**: Nuevo diseño con 3 columnas informativas
- ✅ **Sección About**: Descripción breve de la aplicación (2-3 líneas)
- ✅ **Sección Resources**: Enlace a User Guide & FAQ con modal interactivo
- ✅ **Sección Quick Links**: Enlaces a recursos externos importantes
  - Path of Exile Official (color ámbar)
  - PoE Trade (color ámbar)
  - poe2scout (color cyan, destacado)
  - poe.ninja (color cyan, destacado)
  - Path of Building
  - pobb.in
- ✅ **User Guide Modal**: Guía completa dentro de la app con:
  - Quick Start guide de 3 pasos
  - Descripción de características principales
  - FAQ expandible con detalles técnicos
  - Pro Tips para usuarios avanzados
  - Enlaces a recursos externos
- ✅ **Diseño responsive**: Footer adaptado para móviles y desktop

**Archivos creados**:
- `src/components/Layout/UserGuideModal.jsx` - Modal interactivo con la guía
- `USER_GUIDE.md` - Documentación completa para usuarios (no técnica)

**Archivos modificados**:
- `src/components/Layout/Footer.jsx` - Completamente rediseñado

**Mejoras visuales**:
- Gradiente de fondo en el footer
- Iconos de Lucide React para cada sección (Info, BookOpen, Link2)
- Colores diferenciados para enlaces (ámbar para PoE oficial, cyan para herramientas)
- Animaciones hover en enlaces externos
- Cherry icon con mensaje "Made with passion for the PoE community"

---

### Enero 2026 - v1.7.0

**🔗 Soporte para URLs de pobb.in**:
- ✅ **Detección automática de URLs**: La aplicación ahora detecta URLs de pobb.in automáticamente
- ✅ **Fetch automático**: Obtiene el código PoB raw desde pobb.in sin intervención manual
- ✅ **Endpoint proxy**: Nuevo endpoint `/api/pob/fetch` en el proxy server
- ✅ **Múltiples formatos soportados**:
  - Código PoB raw (base64): `eNrtXW1z27gR...`
  - URLs de pobb.in: `https://pobb.in/VVZy6u-NrRUi`
  - URLs de pobb.in con usuario: `https://pobb.in/u/username/buildid`
- ✅ **Mensajes de error mejorados**: Indicaciones claras cuando un formato no es soportado
- ✅ **UI actualizada**: Placeholder y label actualizados para reflejar los formatos soportados

**Archivos modificados**:
- `proxy-server.js` - Nuevo endpoint `/api/pob/fetch` para obtener código raw desde URLs
- `src/services/pobParser.js` - Lógica de detección y fetch de URLs
- `src/components/BuildAnalyzer/BuildForm.jsx` - UI actualizada con ejemplos

**Notas sobre poe.ninja**:
- Las URLs de poe.ninja/pob NO están soportadas directamente porque usan pastebins externos
- Solución: Copiar el código PoB desde la página de poe.ninja manualmente

**Documentación**:
- ✅ Script de prueba incluido: `test-pobb-in.js`
- ✅ Actualizada DOCUMENTACION_PROYECTO.md

---

### Enero 2026 - v1.6.0

**🔄 Sistema de Rotación Automática para Currency Panel**:
- ✅ **Rotación automática**: Muestra máximo 5 items y rota automáticamente cada 5 segundos
- ✅ **Pausa al hover**: La rotación se detiene cuando el mouse está sobre el panel
- ✅ **Animaciones suaves**: Transiciones slide-in/slide-out con delay escalonado (50ms por item)
- ✅ **Indicador visual**:
  - Dots de progreso que muestran la posición actual
  - Mensaje "⏸ Paused" cuando está pausado
  - Contador "Showing 5 of 8" cuando hay rotación activa
- ✅ **Configuración expandida**:
  - PoE2: Expandido de 5 a 8 pares de monedas
  - PoE1: Expandido de 5 a 8 pares de monedas
- ✅ **Props configurables**:
  - `maxVisible` (default: 5) - Número de items visibles simultáneos
  - `rotationInterval` (default: 5000ms) - Velocidad de rotación
- ✅ **Comportamiento inteligente**: Solo rota si hay más items que el máximo visible
- ✅ **Cleanup automático**: Gestión correcta de intervalos sin memory leaks

**Archivos modificados**:
- `src/components/PoeNinja/CurrencyConverter.jsx` - Lógica de rotación y pausa
- `src/index.css` - Animaciones @keyframes slideIn/slideOut
- `src/config/currencyPairs.js` - Expandido a 8 pares por juego

**Documentación**:
- ✅ **Guía completa**: [CURRENCY_ROTATION_GUIDE.md](CURRENCY_ROTATION_GUIDE.md)
- ✅ **Referencia añadida**: Actualizado DOCUMENTACION_PROYECTO.md

---

### Enero 2026 - v1.5.0

**Mejoras de UI/UX**:
- ✅ **Iconos de monedas locales**: Implementados iconos .png descargados localmente en lugar de URLs del CDN
  - Ubicación: `src/assets/currency-icons/`
  - Formato: `{juego}-{nombre-moneda}.png` (ej: `poe2-divine-orb.png`)
  - Total: 12 iconos (6 para PoE2, 6 para PoE1)
- ✅ **Logos de juegos**: Reemplazado emoji de espada por logos oficiales
  - Ubicación: `src/assets/other-icons/poe1-logo.png` y `poe2-logo.png`
  - Se muestra el logo correspondiente según el juego seleccionado
- ✅ **Información de liga en Economy Status**: Ahora muestra "Path of Exile 2 • Fate of the Vaal"
- ✅ **Labels capitalizados**: Selector de status ahora muestra "Any" e "Instant Buyout" (antes: "any", "instant buyout")

**Internacionalización**:
- ✅ **Traducción completa a inglés**: Todos los textos de la interfaz traducidos
  - BuildForm: "Game", "League", "Analyze Build", "PoB Code"
  - ItemList: "Items Found", "League"
  - ItemCard: "Edit filters", "Copy URL", "Search in Trade", "Implicit Mods", "Explicit Mods"
  - EditItemModal: "Item Level (minimum)", "Rarity", "Save Changes", "Cancel"
  - CurrencyConverter: "Economy Status", "API unavailable"

**Limpieza de código**:
- ✅ **Archivos eliminados**:
  - `src/components/PoeNinja/CurrencyPanel.jsx` (deprecated, reemplazado por CurrencyConverter)
  - `src/components/PoeNinja/CurrencyConverterExample.jsx` (archivo de ejemplos no utilizado)
- ✅ **Constantes eliminadas** de `src/utils/constants.js`:
  - `POE_NINJA_BASE_URLS` (no utilizada)
  - `POE_NINJA_PROXY_URL` (no utilizada)
  - `STATS_PROXY_URL` (no utilizada)
- ✅ Solo se mantiene `TRADE_BASE_URLS` que sí se utiliza

**Configuración de iconos**:
- ✅ Archivo `src/config/currencyIcons.js` actualizado con imports locales
- ✅ Mapeo completo de monedas principales y adicionales para ambos juegos
- ✅ Función helper `getCurrencyIcon()` disponible para uso dinámico

**Estado Actual**:
- **PoE1**: ✅ Completamente funcional con iconos locales
- **PoE2**: ✅ Completamente funcional con iconos locales
- **Interfaz**: ✅ 100% en inglés
- **Código**: ✅ Limpio y optimizado

---

### Enero 2026 - v1.4.0

**Nuevas Funcionalidades**:
- ✅ **CurrencyConverter Component**: Panel unificado que reemplaza a CurrencyPanel
- ✅ **Endpoint de Test**: `/api/poe2scout/currency/test` para explorar todas las currencies disponibles
- ✅ **Configuración Externa**: Sistema de configuración mediante `src/config/currencyPairs.js`
- ✅ **Soporte para Iconos**: Preparado para iconos reales (.png) en lugar de emojis
- ✅ **Panel Unificado**: CurrencyConverter reemplaza completamente a CurrencyPanel

**Características del CurrencyConverter**:
- ✅ Configuración flexible de pares de conversión (from/to)
- ✅ Cálculo automático de ratios basándose en precios en Chaos
- ✅ Formato de números con separadores de miles (1,310,057)
- ✅ Placeholder temporal para iconos (💰) mientras se añaden los reales
- ✅ Diseño consistente con la UI existente (Tailwind CSS)
- ✅ Soporta ambos juegos (PoE1 y PoE2)

**Pares Configurados por Defecto**:

**PoE2** (5 parejas):
1. Divine Orb → Chaos Orb *(antes en CurrencyPanel)*
2. Mirror of Kalandra → Divine Orb *(antes en CurrencyPanel)*
3. Divine Orb → Exalted Orb
4. Hinekora's Lock → Divine Orb
5. Fracturing Orb → Divine Orb

**PoE1** (5 parejas):
1. Divine Orb → Chaos Orb *(antes en CurrencyPanel)*
2. Mirror of Kalandra → Divine Orb *(antes en CurrencyPanel)*
3. Mirror Shard → Divine Orb
4. Hinekora's Lock → Divine Orb
5. Fracturing Orb → Divine Orb

**Documentación Nueva**:
- ✅ `CURRENCY_CONVERTER_GUIDE.md`: Guía completa de uso del CurrencyConverter
- ✅ `src/config/README_CURRENCY_ICONS.md`: Guía para añadir iconos reales
- ✅ `src/components/PoeNinja/CurrencyConverterExample.jsx`: Ejemplos de configuraciones

**Endpoint de Test**:
- URL: `http://localhost:3001/api/poe2scout/currency/test?league=X&game=Y`
- Retorna hasta 100 currencies con nombres exactos y URLs de iconos
- Logging detallado en consola del servidor
- Formato unificado para PoE1 y PoE2

**Integración en App.jsx**:
```jsx
<CurrencyConverter
  league={league}
  game={game}
  currencyPairs={game === 'poe2' ? poe2CurrencyPairs : poe1CurrencyPairs}
/>
```

**Migración desde CurrencyPanel**:
- ✅ CurrencyPanel ha sido **deprecado** y reemplazado por CurrencyConverter
- ✅ Las parejas Divine→Chaos y Mirror→Divine están incluidas por defecto
- ✅ Un solo componente en lugar de dos paneles separados

**Estado Actual**:
- **PoE1**: ✅ Completamente funcional
- **PoE2**: ✅ Completamente funcional

---

### Enero 2026 - v1.3.0

**Nuevas Funcionalidades**:
- ✅ **Endpoint unificado de currency**: Un solo endpoint para PoE1 y PoE2
- ✅ **Transformación automática de datos**: poe.ninja → formato poe2scout para PoE1
- ✅ **Obtención de ligas desde poe2scout**: Para PoE2, usa poe2scout en lugar de API oficial
- ✅ **Precios redondeados**: Números sin decimales en Currency Panel

**Mejoras Técnicas**:
- ✅ Código limpio sin dependencias duales (eliminado código comentado)
- ✅ Frontend simplificado con un único flujo de datos
- ✅ Transformación transparente de datos en el proxy
- ✅ Mejor legibilidad de precios (sin decimales innecesarios)

**Optimizaciones**:
- Eliminado endpoint `/api/poeninja/currency` (ahora todo pasa por `/api/poe2scout/currency`)
- Un solo formato de datos en toda la aplicación
- Código más mantenible y escalable

**APIs Integradas**:
- **poe2scout**: Para PoE2 (directo) y transformación de datos
- **poe.ninja**: Para PoE1 (mediante transformación)
- **PoE Trade API**: Para stats y ligas de PoE1

**Estado Actual**:
- **PoE1**: ✅ Completamente funcional (ligas, currency, trade)
- **PoE2**: ✅ Completamente funcional (ligas, currency, trade)

### Enero 2026 - v1.2.0

**Nuevas Funcionalidades**:
- ✅ **Currency Panel completamente funcional para PoE2** usando poe2scout API
- ✅ **Integración con poe2scout.com**: API pública específica para Path of Exile 2
- ✅ **Soporte dual de APIs**: poe.ninja para PoE1, poe2scout para PoE2

**Mejoras Técnicas**:
- ✅ Nuevo endpoint en proxy: `/api/poe2scout/currency`
- ✅ Detección automática de fuente de datos según el juego seleccionado
- ✅ Manejo diferenciado de estructuras de datos (poe.ninja vs poe2scout)

**Estado Actual**:
- **PoE1**: ✅ Completamente funcional (ligas, currency desde poe.ninja, trade)
- **PoE2**: ✅ Completamente funcional (ligas, currency desde poe2scout, trade)

### Enero 2026 - v1.1.0

**Nuevas Funcionalidades**:
- ✅ **Obtención dinámica de ligas** desde la API oficial de PoE (`/api/trade/data/leagues`)
- ✅ **Filtrado inteligente de ligas**: Solo muestra 3 ligas relevantes (Challenge + Hardcore + Standard)
- ✅ **Manejo automático de redirects HTTP** en el proxy (301, 302, 303, 307, 308)
- ✅ **Currency Panel funcional para PoE1** con datos de poe.ninja

**Correcciones**:
- ✅ Solucionado problema con endpoint de ligas (cambio de `/league` a `/api/trade/data/leagues`)
- ✅ Corregido el fetching de poe.ninja para PoE1 (ahora sigue redirects correctamente)
- ✅ Endpoints diferenciados para PoE1 (stash tabs) y PoE2 (Currency Exchange)

---

**Última actualización**: Enero 2026
**Versión**: 1.8.0
