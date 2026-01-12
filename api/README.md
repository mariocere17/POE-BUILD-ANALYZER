# API Endpoints - Vercel Serverless Functions

Esta carpeta contiene todas las funciones serverless para Vercel. Cada archivo `.js` se convierte automáticamente en un endpoint.

## 📂 Estructura

```
api/
├── stats.js                    → /api/stats
├── leagues.js                  → /api/leagues
├── poeninja/
│   └── currency.js             → /api/poeninja/currency
├── poe2scout/
│   ├── currency.js             → /api/poe2scout/currency
│   └── items-multi.js          → /api/poe2scout/items-multi
└── pob/
    └── fetch.js                → /api/pob/fetch
```

## 🔌 Endpoints Disponibles

### 1. `/api/stats`
Obtiene estadísticas de mods del juego desde la API oficial de PoE.

**Query Parameters:**
- `realm`: `poe1`, `poe2`, o `pc` (default: `poe2`)

**Example:**
```
GET /api/stats?realm=poe2
```

**Response:**
```json
{
  "result": [
    {
      "label": "Pseudo",
      "entries": [...]
    }
  ]
}
```

---

### 2. `/api/leagues`
Obtiene las ligas activas del juego.

**Query Parameters:**
- `game`: `poe1` o `poe2` (default: `poe1`)

**Example:**
```
GET /api/leagues?game=poe2
```

**Response:**
```json
[
  {
    "id": "Fate of the Vaal",
    "realm": "poe2",
    "description": "Fate of the Vaal"
  }
]
```

**Fallback:** Si la API falla, devuelve ligas hardcodeadas.

---

### 3. `/api/poeninja/currency`
Obtiene precios de monedas desde poe.ninja.

**Query Parameters:**
- `league`: Nombre de la liga (default: `vaal`)
- `game`: `poe1` o `poe2` (default: `poe2`)

**Example:**
```
GET /api/poeninja/currency?league=vaal&game=poe2
```

**Response:**
```json
{
  "lines": [
    {
      "currencyTypeName": "Divine Orb",
      "chaosEquivalent": 50.5,
      "icon": "https://..."
    }
  ]
}
```

**Note:** Sigue redirects automáticamente.

---

### 4. `/api/poe2scout/currency`
Obtiene precios de monedas desde poe2scout (PoE2) o poe.ninja (PoE1).

**Query Parameters:**
- `league`: Nombre de la liga (default: `Fate of the Vaal`)
- `game`: `poe1` o `poe2` (default: `poe2`)

**Example:**
```
GET /api/poe2scout/currency?league=Fate%20of%20the%20Vaal&game=poe2
```

**Response (PoE2):**
```json
{
  "items": [
    {
      "text": "Divine Orb",
      "currentPrice": 381.5,
      "iconUrl": "https://...",
      "priceLogs": []
    }
  ]
}
```

**Response (PoE1):** Transformado al formato de poe2scout para compatibilidad.

---

### 5. `/api/poe2scout/items-multi`
Obtiene items de múltiples categorías en una sola request (solo PoE2).

**Query Parameters:**
- `league`: Nombre de la liga (default: `Fate of the Vaal`)
- `categories`: Categorías separadas por coma (ej: `currency,abyss,ritual`)

**Example:**
```
GET /api/poe2scout/items-multi?league=Fate%20of%20the%20Vaal&categories=currency,abyss,ritual
```

**Response:**
```json
{
  "items": [
    {
      "text": "Divine Orb",
      "currentPrice": 381.5,
      "iconUrl": "https://..."
    },
    {
      "text": "Abyssal Incubator",
      "currentPrice": 1.2,
      "iconUrl": "https://..."
    }
  ],
  "categories": ["currency", "abyss", "ritual"],
  "totalItems": 150
}
```

**Note:** Hace múltiples requests en paralelo y combina los resultados.

---

### 6. `/api/pob/fetch`
Obtiene el código PoB raw desde pobb.in.

**Query Parameters:**
- `url`: URL completa de pobb.in (ej: `https://pobb.in/VVZy6u-NrRUi`)

**Example:**
```
GET /api/pob/fetch?url=https://pobb.in/VVZy6u-NrRUi
```

**Response:**
```json
{
  "success": true,
  "code": "eNoA...(base64 code)",
  "source": "https://pobb.in/VVZy6u-NrRUi"
}
```

**Supported URLs:**
- ✅ `https://pobb.in/ID`
- ✅ `https://pobb.in/u/username/ID`
- ❌ `https://poe.ninja/pob/...` (not supported)

---

## 🔒 Seguridad

Todas las funciones implementan:
- ✅ CORS headers (`Access-Control-Allow-Origin: *`)
- ✅ Validación de métodos HTTP
- ✅ Validación de parámetros
- ✅ Timeouts (3-10 segundos según endpoint)
- ✅ Error handling y sanitización

## ⚙️ Configuración

Las funciones están configuradas en `vercel.json`:

```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 10
    }
  }
}
```

- **Free tier**: 10 segundos timeout
- **Pro tier**: 60 segundos timeout

## 🧪 Testing Local

Usa Vercel CLI para probar localmente:

```bash
vercel dev
```

Las funciones estarán disponibles en `http://localhost:3000/api/*`

## 📊 Monitoreo

Los logs de las funciones están disponibles en:
- Vercel Dashboard → Deployments → [tu deploy] → Functions

## 🚨 Rate Limiting

**Nota importante:** Las funciones serverless NO tienen rate limiting implementado porque son stateless.

**Opciones:**
1. Sin rate limiting (las APIs externas tienen sus propios límites)
2. Implementar con Vercel KV (Redis)
3. Implementar con Upstash Redis (tier gratis)

## 🔄 Migración desde Express

Estas funciones reemplazan los endpoints de `proxy-server.js`:

| Express Endpoint | Serverless Function |
|------------------|---------------------|
| `GET /api/stats` | `api/stats.js` |
| `GET /api/leagues` | `api/leagues.js` |
| `GET /api/poeninja/currency` | `api/poeninja/currency.js` |
| `GET /api/poe2scout/currency` | `api/poe2scout/currency.js` |
| `GET /api/poe2scout/items-multi` | `api/poe2scout/items-multi.js` |
| `GET /api/pob/fetch` | `api/pob/fetch.js` |

**Diferencias:**
- ❌ Sin rate limiting en memoria
- ✅ Escalado automático
- ✅ Sin servidor que mantener
- ✅ Deploy automático con git push

---

Para más información, ver [VERCEL_DEPLOYMENT.md](../VERCEL_DEPLOYMENT.md)
