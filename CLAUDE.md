# Claude Context Recovery - PoE Build Analyzer

## Project Overview
PoE Build Analyzer es una aplicación React que genera enlaces de trade automáticos para Path of Exile 1 y 2 basándose en builds importadas desde pobb.in.

---

## ⚠️ CRITICAL FIX (2026-01-26) - Empty Filters Cause "Failed to load search state"

### Problem

Trade URLs were failing with error: **"Failed to load search state. The search is no longer valid."**

The URL parameter `q` was being stripped/ignored by the trade site, causing redirects to the base URL without search parameters.

### Root Cause

Empty filter objects in the query JSON were causing the PoE trade site to reject the entire query:

```json
{
  "filters": {
    "type_filters": { "filters": { "rarity": {...} } },
    "misc_filters": { "filters": {} },        // ← EMPTY - CAUSES ERROR
    "equipment_filters": { "filters": {} }    // ← EMPTY - CAUSES ERROR
  },
  "stats": []  // ← EMPTY ARRAY - CAUSES ERROR
}
```

### Solution

Added cleanup function in `tradeAPI.js` to remove empty filter groups before encoding:

```javascript
// Clean up empty filters to avoid "Failed to load search state" errors
const cleanFilters = (filters) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value && typeof value === 'object') {
      if (value.filters && Object.keys(value.filters).length === 0) {
        continue; // Skip empty filter groups
      }
      cleaned[key] = value;
    }
  }
  return cleaned;
};

query.query.filters = cleanFilters(query.query.filters);

// Remove empty stats array
if (query.query.stats.length === 0) {
  delete query.query.stats;
}
```

### Files Modified

| File | Changes |
|------|---------|
| `src/services/tradeAPI.js` | Added `cleanFilters()` function before URL encoding |

### How to Identify This Problem

1. Trade URL opens but shows "Failed to load search state" error
2. Browser URL changes from `...?q={...}` to just the base URL (query param stripped)
3. Network tab shows the full URL was sent, but trade site redirected

### Prevention

Always ensure new filter groups added to the query are either:
- Populated with actual filter values, OR
- Removed from the query before encoding

---

## Session Work (2026-01-26) - Trade Mode Options Fix

### Problem

Previously documented that PoE1 only supports `online` and `any` status values. This was **incorrect**.

### Correction

Both PoE1 and PoE2 support the same trade mode options:
- `securable` - Instant Buyout
- `available` - Instant Buyout & In Person
- `online` - Online Only / In Person Only
- `any` - Any

### Files Modified

| File | Changes |
|------|---------|
| `src/utils/constants.js` | Unified `TRADE_MODE_OPTIONS` as single array for both games |
| `src/hooks/useBuildAnalyzer.js` | Simplified to use single `DEFAULT_TRADE_MODE` value |
| `src/components/BuildAnalyzer/ItemList.jsx` | Use array directly instead of `TRADE_MODE_OPTIONS[game]` |

---

## Session Work (2026-01-26) - Socket Filter Sum Validation

### Problem

Socket color filters allowed invalid configurations. Users could set 4 red + 4 green + 4 blue + 4 white sockets on a 4-socket item, which is impossible.

### Root Cause

The `max` attribute on inputs was set to `item.socketInfo.totalSockets` for each color independently, without considering the sum of all enabled colors.

### Solution

Implemented dynamic max calculation that considers other enabled socket colors:

```javascript
// Calculate max available sockets for a color based on other enabled colors
const getMaxForColor = (color) => {
  if (!hasSocketInfo || !editedItem.filters.socketFilters) return 0;
  const maxTotal = item.socketInfo.totalSockets;
  const colors = ['r', 'g', 'b', 'w'];
  const otherColorsSum = colors
    .filter(c => c !== color)
    .reduce((sum, c) => {
      const filter = editedItem.filters.socketFilters[c];
      return sum + (filter.enabled && filter.min ? filter.min : 0);
    }, 0);
  return Math.max(0, maxTotal - otherColorsSum);
};
```

Handler also clamps values when user types directly:
```javascript
// Socket colors: sum of all enabled colors cannot exceed totalSockets
const otherColorsSum = colors
  .filter(c => c !== socketType)
  .reduce((sum, c) => {
    const filter = editedItem.filters.socketFilters[c];
    return sum + (filter.enabled && filter.min ? filter.min : 0);
  }, 0);

const maxForThisColor = Math.max(0, maxTotal - otherColorsSum);
parsedValue = Math.max(0, Math.min(parsedValue, maxForThisColor));
```

### Behavior

| Item Sockets | G enabled = 3 | Max for R, B, W |
|--------------|---------------|-----------------|
| 4 | ✓ | 1 each |
| 6 | ✓ | 3 each |

| Item Sockets | G = 2, B = 2 enabled | Max for R, W |
|--------------|----------------------|--------------|
| 4 | ✓ | 0 each |
| 6 | ✓ | 2 each |

### Files Modified

| File | Changes |
|------|---------|
| `src/components/BuildAnalyzer/EditItemModal.jsx` | Added `getMaxForColor()` helper, updated handler with sum validation, dynamic `max` attributes |

### Note

Links filter still uses `totalSockets` as max because link count is independent of color distribution.

**Important:** Socket filters only appear for PoE1. PoE2 has a different itemization system without colored sockets/links.

---

## Session Work (2026-01-26) - Socket Filters PoE1 Only

### Problem

Socket Filters section was appearing for PoE2 items, but PoE2 doesn't have the same colored socket/link system as PoE1.

### Solution

Added `game` prop to `EditItemModal` and conditioned socket section visibility:

```javascript
// App.jsx - pass game to modal
<EditItemModal
  item={editingItem}
  game={game}
  onClose={() => setEditingItem(null)}
  onSave={handleSaveItem}
/>

// EditItemModal.jsx - only show for PoE1
{game === 'poe1' && hasSocketInfo && editedItem.filters.socketFilters && (
  // Socket filters section...
)}
```

### Files Modified

| File | Changes |
|------|---------|
| `src/App.jsx` | Pass `game` prop to EditItemModal |
| `src/components/BuildAnalyzer/EditItemModal.jsx` | Add `game` to props, condition socket section |

---

## Session Work (2026-01-26) - Auto-Detect Game from PoB Code

### Problem

Users could paste a PoE1 build while having PoE2 selected (or vice versa), causing incorrect trade URLs and search failures.

### Solution

Implemented automatic game detection from the PoB XML using **ascendancy names only** (class names like Ranger/Witch exist in both games).

#### Ascendancy Lists

**PoE1 Ascendancies:**
- Marauder: Juggernaut, Berserker, Chieftain
- Duelist: Slayer, Gladiator, Champion
- Shadow: Assassin, Saboteur, Trickster
- Templar: Inquisitor, Hierophant, Guardian
- Witch: Necromancer, Occultist, Elementalist
- Ranger: Raider (Deadeye/Pathfinder shared)
- Scion: Ascendant

**PoE2 Ascendancies:**
- Mercenary: Witchhunter, Gemling Legionnaire, Tactician
- Monk: Invoker, Acolyte of Chayula
- Sorceress: Stormweaver, Chronomancer, Disciple of Varashta
- Warrior: Warbringer, Titan, Smith of Kitava
- Witch: Blood Mage, Infernalist, Lich
- Huntress: Amazon, Ritualist
- Druid: Oracle, Shaman
- Ranger: (Deadeye/Pathfinder shared - use item fallback)

#### Fallback Detection
- Charms in build → PoE2
- RGBW colored sockets → PoE1

#### Notification

When game is auto-switched, an amber notification banner appears:
> "Build detected for Path of Exile 2. Switched from Path of Exile 1."

User can dismiss with X button.

### Files Modified

| File | Changes |
|------|---------|
| `src/services/pobParser.js` | Ascendancy-only detection, complete PoE2 ascendancy list |
| `src/hooks/useBuildAnalyzer.js` | Added `gameSwitch` state and `dismissGameSwitch` action |
| `src/App.jsx` | Added notification banner component |
| `src/i18n/LanguageContext.jsx` | Added template interpolation support (`{{param}}`) |
| `src/i18n/translations.js` | Added `notifications.gameSwitched` (EN/ES) |

### Behavior

| Scenario | Result |
|----------|--------|
| PoE2 selected, paste PoE1 build | Auto-switch to PoE1, show notification |
| PoE1 selected, paste PoE2 build | Auto-switch to PoE2, show notification |
| Unable to detect game | Keep user's selection, no notification |

---

## Session Work (2026-01-26) - Legacy of Phrecia Event Ascendancies

### Context

Added 19 new PoE1 ascendancies for the upcoming Legacy of Phrecia event to the game detection system.

### Ascendancies Added

| Class | Ascendancies |
|-------|--------------|
| **Ranger** | Daughter of Oshabi, Whisperer, Wildspeaker |
| **Marauder** | Antiquarian, Behemoth, Ancestral Commander |
| **Shadow** | Surfcaster, Servant of Arakaali, Blind Prophet |
| **Witch** | Harbinger, Herald, Bog Shaman |
| **Duelist** | Gambler, Paladin, Aristocrat |
| **Templar** | Architect of Chaos, Polytheist, Puppeteer |
| **Scion** | Scavenger |

### Files Modified

| File | Changes |
|------|---------|
| `src/services/pobParser.js` | Added 19 Legacy of Phrecia ascendancies to `POE1_ASCENDANCIES` array |

### Source

https://www.poe-vault.com/guides/legacy-of-phrecia-ascendancy-overview

---

## Session Work (2026-01-26) - Heart of the Well Jewel Stat Mappings

### Problem

The unique jewel "Heart of the Well" has mods like `Gain 15% of Damage as Extra Fire Damage` which were incorrectly fuzzy-matching to `Gain #% of Physical Damage as Extra Fire Damage` (0.89 similarity score).

These are **different stats**:
- `Physical Damage as Extra X` - Only converts physical damage
- `Damage as Extra X` - Converts ALL damage types

### Solution

Added direct mappings for "Gain #% of Damage as Extra X" stats:

| Mod Text | Stat ID |
|----------|---------|
| Gain #% of Damage as Extra Fire Damage | `explicit.stat_3015669065` |
| Gain #% of Damage as Extra Lightning Damage | `explicit.stat_3278136794` |
| Gain #% of Damage as Extra Cold Damage | `explicit.stat_2505884597` |
| Gain #% of Damage as Extra Chaos Damage | `explicit.stat_3398787959` |
| #% increased Critical Spell Damage Bonus | `explicit.stat_274716455` |

**Note:** Critical Spell Damage Bonus is different from Critical Damage Bonus (stat_3556824919).

### Files Modified

| File | Changes |
|------|---------|
| `src/services/statsAPI.js` | Added 4 new entries to `DIRECT_STAT_MAPPINGS` |

---

## Session Work (2026-01-21) - Item Category Filtering

### New Feature: Item Category Filter

Added a dropdown selector next to "Items Found (X)" to filter items by category.

#### Categories Available
- **All** - Shows all items
- **Weapons** - Swords, axes, bows, wands, staves, quivers, etc.
- **Armour** - Helmets, body armour, gloves, boots
- **Accessories** - Rings, amulets, belts
- **Flasks** - All flask types
- **Jewels** - PoE1 jewels and PoE2 jewels (Emerald, Ruby, Sapphire, Diamond, Time-Lost variants, Timeless)
- **Grafts** (PoE1 only) - Eshgraft, Tulgraft, Uulgraft, Xophgraft, Fleshgraft
- **Charms** (PoE2 only) - Charm items

#### Implementation Details

**Files Modified:**
- `src/utils/constants.js` - Added `ITEM_CATEGORIES`, `GRAFT_TYPES`, `POE2_JEWEL_TYPES`, `getItemCategory()`
- `src/components/BuildAnalyzer/ItemList.jsx` - Added category selector with dynamic options
- `src/i18n/translations.js` - Added translations for all categories (EN/ES)
- `src/utils/rarityColors.js` - Added support for "Relic" rarity (shows as orange like unique)
- `src/services/tradeAPI.js` - Fixed Relic items to search as unique in trade

**Key Code:**

```javascript
// ITEM_CATEGORIES
export const ITEM_CATEGORIES = {
  all: 'all',
  weapons: 'weapons',
  armour: 'armour',
  accessories: 'accessories',
  flasks: 'flasks',
  jewels: 'jewels',
  grafts: 'grafts',  // PoE1 only
  charms: 'charms'   // PoE2 only
};

// PoE2 jewels don't have "jewel" in name - exact match required
export const POE2_JEWEL_TYPES = [
  'emerald', 'ruby', 'sapphire', 'diamond',
  'time-lost emerald', 'time-lost ruby', 'time-lost sapphire', 'time-lost diamond',
  'timeless jewel'
];

// PoE1 Keepers league grafts
export const GRAFT_TYPES = ['eshgraft', 'tulgraft', 'uulgraft', 'xophgraft', 'fleshgraft'];
```

**Category Detection Order (important to avoid false positives):**
1. Grafts (PoE1 league items)
2. Charms (PoE2 items)
3. Flasks (before jewels - "Amethyst Flask" contains "Amethyst")
4. Accessories (before jewels - "Amethyst Ring" contains "Amethyst")
5. Jewels (PoE1 with "jewel" in name, PoE2 with exact match)
6. Weapons
7. Armour
8. Default fallback to armour

**Dynamic Category Display:**
- Grafts category only shown if build contains graft items
- Charms category only shown if build contains charm items

---

## Session Work (2026-01-21) - PoE1 Support Fixes

### Problems Solved

#### 1. PoE1 Currency Prices Not Loading (CORS/403 Error)
**Issue:** In production (Vercel), the stats API proxy returned 403 for PoE1, causing CORS errors and no prices displayed.

**Solution:** Created static fallback file `public/data/poe1-stats.json` for when the proxy fails.

#### 2. poe.ninja League Name Mismatch
**Issue:** poe.ninja uses shortened league names for PoE1 (e.g., "Keepers" instead of "Keepers of the Flame"), causing empty price data.

**Solution:** Added `POE1_LEAGUE_MAPPING` in both currency API files:
```javascript
const POE1_LEAGUE_MAPPING = {
  'Keepers of the Flame': 'Keepers',
  'Hardcore Keepers of the Flame': 'Hardcore Keepers',
};
```

#### 3. Magic Flask Names Not Displaying Correctly
**Issue:** Magic/rare flasks showed only suffix (e.g., "of Penetrating") instead of full name because PoB format differs - magic items don't have a separate baseType line.

**Solution:** Updated `pobParser.js` to:
1. Detect when `baseType` line is actually metadata (starts with "Unique ID:", "Item Level:", etc.)
2. Extract flask base type from the full name using regex pattern matching
3. Display full name for magic items while keeping baseType for trade searches

#### 4. Flask "reduced Duration" Searching Wrong Stat
**Issue:** "#% reduced Duration" was fuzzy-matching to "#% reduced Spark Duration" because the exact stat doesn't exist in the API.

**Root Cause:** In PoE, flask mods like "reduced Duration" and "reduced effect" don't exist as separate stats. They're represented as negative values of "increased Duration" and "increased effect".

**Solution:** Implemented `REDUCED_TO_INCREASED_MODS` transformation system:
```javascript
const REDUCED_TO_INCREASED_MODS = [
  { pattern: /^#% reduced Duration$/i, replacement: '#% increased Duration' },
  { pattern: /^#% reduced effect$/i, replacement: '#% increased effect' },
];
```
- `30% reduced Duration` → searches for `#% increased Duration` with `min: -30`

#### 5. Unsearchable Flask Mods
**Issue:** Some flask mods like trigger enchants are local and not searchable in trade.

**Solution:** Added `UNSEARCHABLE_MODS` list to skip these mods:
```javascript
const UNSEARCHABLE_MODS = [
  'Used when Charges reach full',
  'Used when you Hit a Rare or Unique Enemy, if not already in effect',
  'Used when you use a Skill',
  'Used when you take a Savage Hit',
  'Reused at the end of this Flask\'s Effect',
];
```

---

## Session Work (2026-01-19) - PoE2 Stat Matching

### Problems Solved

#### 1. Stat Matching for Trade URLs
**Issue:** Stats from jewels (and other items) were showing as "Unavailable Stat" in the PoE2 Trade website.

**Solution:** Implemented a 3-tier stat lookup system:
1. `DIRECT_STAT_MAPPINGS` - Hardcoded IDs for stats missing from API
2. `findStatIdExact()` - Exact matching with `STAT_ALIASES` transformations
3. `findStatIdFuzzy()` - Token-based fuzzy matching as fallback

#### 2. Item Properties Being Treated as Mods
**Solution:** Added filters in `pobParser.js` to skip item property lines.

#### 3. Time-Lost Jewel Stats
**Solution:** Added known stat IDs to `DIRECT_STAT_MAPPINGS`.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/services/statsAPI.js` | Fuzzy matching, aliases, direct mappings, UNSEARCHABLE_MODS, REDUCED_TO_INCREASED_MODS, transformReducedMod() |
| `src/services/tradeAPI.js` | Debug logging, reduced→increased transformation support |
| `src/services/pobParser.js` | Item property filters, flask/charm baseType extraction from magic item names |
| `src/hooks/useBuildAnalyzer.js` | Dev default pobb.in URL, game/league defaults |
| `api/poe2scout/currency.js` | POE1_LEAGUE_MAPPING for poe.ninja |
| `api/poeninja/currency.js` | POE1_LEAGUE_MAPPING for poe.ninja |
| `public/data/poe1-stats.json` | Static fallback for PoE1 stats (NEW) |

---

## Key Code in statsAPI.js

### Feature Flags
```javascript
const USE_FUZZY_MATCHING = true;
const FUZZY_MIN_SCORE = 0.75; // Minimum similarity score (0-1)
```

### UNSEARCHABLE_MODS
Mods that are local to items and cannot be searched in trade:
```javascript
const UNSEARCHABLE_MODS = [
  'Used when Charges reach full',
  'Used when you Hit a Rare or Unique Enemy, if not already in effect',
  'Used when you use a Skill',
  'Used when you take a Savage Hit',
  'Reused at the end of this Flask\'s Effect',
];
```

### REDUCED_TO_INCREASED_MODS
Transforms "reduced X" mods to "increased X" with negative values:
```javascript
const REDUCED_TO_INCREASED_MODS = [
  { pattern: /^#% reduced Duration$/i, replacement: '#% increased Duration' },
  { pattern: /^#% reduced effect$/i, replacement: '#% increased effect' },
];
```

### transformReducedMod()
```javascript
export const transformReducedMod = (normalizedMod, value) => {
  // Returns: { mod: transformedMod, value: negatedValue, transformed: boolean }
  // Example: ("30% reduced Duration", 30) → ("#% increased Duration", -30, true)
};
```

### STAT_ALIASES
Transforms PoB terminology to Trade API terminology:
```javascript
const STAT_ALIASES = [
  { from: /Critical Hit Chance/gi, to: 'Critical Strike Chance' },
  { from: /Critical Hit Multiplier/gi, to: 'Critical Strike Multiplier' },
  { from: /#% increased Critical Strike Chance for Spells/gi, to: '#% increased Spell Critical Strike Chance' },
  { from: /#% increased Critical Strike Multiplier for Spells/gi, to: '+#% to Critical Strike Multiplier for Spell Damage' },
  { from: /of maximum Mana/gi, to: 'of Mana' },
  { from: /of maximum Life/gi, to: 'of Life' },
];
```

### DIRECT_STAT_MAPPINGS
Stats NOT in API but exist in trade (discovered via JSON inspection):
```javascript
const DIRECT_STAT_MAPPINGS = {
  '#% increased Critical Hit Chance': 'explicit.stat_587431675',
  '#% increased Critical Strike Chance': 'explicit.stat_587431675',
  '#% increased effect of Socketed Items': 'explicit.stat_2081918629',
  '# to Spirit': 'explicit.stat_3981240776',
  '+# to Spirit': 'explicit.stat_3981240776',
  'Upgrades Radius to Large': 'explicit.stat_3891355829|2',
  // ... more Time-Lost Jewel stats
};
```

### Stat Lookup Priority
```
0. UNSEARCHABLE_MODS → if match, return null (skip)
      ↓ not unsearchable
1. DIRECT_STAT_MAPPINGS → if found, return immediately
      ↓ not found
2. findStatIdExact() → exact match with STAT_ALIASES
      ↓ not found
3. findStatIdFuzzy() → token-based fuzzy matching (if enabled)
      ↓ not found
4. Return null → stat excluded from search
```

---

## Flask BaseType Extraction (pobParser.js)

For magic/rare items where PoB doesn't provide separate baseType line:
```javascript
// Detect flask base from full name like "Dabbler's Quicksilver Flask of Penetrating"
const flaskMatch = name.match(/(Quicksilver Flask|Diamond Flask|Jade Flask|...)/i);
if (flaskMatch) {
  baseType = flaskMatch[1]; // "Quicksilver Flask"
}
```

Supported flask types:
- Quicksilver, Diamond, Jade, Quartz, Granite, Ruby, Sapphire, Topaz, Amethyst
- Bismuth, Aquamarine, Stibnite, Sulphur, Basalt, Silver, Gold, Corundum, Iron
- Life Flasks (Hallowed, Sanctified, Divine, Eternal, Colossal, Sacred)
- Mana Flasks (Hallowed, Sanctified, Divine, Eternal)
- Hybrid Flasks (Large, Medium, Small)

---

## poe.ninja League Mapping

poe.ninja uses shortened league names for PoE1:
```javascript
const POE1_LEAGUE_MAPPING = {
  'Keepers of the Flame': 'Keepers',
  'Hardcore Keepers of the Flame': 'Hardcore Keepers',
  // Add new leagues as they release
};
```

---

## Debug Logging (Development Only)

### statsAPI.js
- `[STATS] Skipping unsearchable local mod: "..."` - UNSEARCHABLE_MODS hit
- `[STATS] Transforming reduced->increased: "..." (X) -> "..." (-X)` - Transformation applied
- `[STATS] Direct mapping: "..." -> ...` - DIRECT_STAT_MAPPINGS hit
- `[STATS] Exact match failed, trying fuzzy matching for: "..."` - Fallback
- `[STATS] Fuzzy match: "..." -> "..." (score: X.XX)` - Success
- `[STATS] No match found for: "..."` - Complete failure

### tradeAPI.js
- `[TRADE] Processing item mods` - Item and mods being processed
- `[EXPLICIT N] "..." (X) -> transformed to "..." (-X) -> ...` - Reduced mod transformed
- `[EXPLICIT N] "..." -> ...` - Normal mod lookup
- `[TRADE] Generated Query` - Final JSON and URL

### pobParser.js
- `=== FLASK DEBUG ===` - Raw flask item data (when flask detected)
- `=== FLASK NAME DEBUG ===` - Name/baseType extraction details

---

## Commands
- `npm start` - Development server (port 3000)
- `npm run dev:api` - Proxy server (port 3001)
- `npm run build` - Production build

## API Endpoints
- Stats API: `/api/stats?realm=poe2` or `?realm=poe1` (proxied)
- Currency API: `/api/poe2scout/currency?league=X&game=poe1|poe2`
- Static fallback: `/data/poe1-stats.json`, `/data/poe2-stats.json`
- Cache: localStorage `poe_stats_cache_poe1` / `poe_stats_cache_poe2` (24h TTL)

---

## Rollback Instructions

### Disable Fuzzy Matching
```javascript
const USE_FUZZY_MATCHING = false;
```

### Adjust Fuzzy Sensitivity
```javascript
const FUZZY_MIN_SCORE = 0.80; // Higher = stricter (default 0.75)
```

### Disable Reduced→Increased Transformation
Remove or comment out entries in `REDUCED_TO_INCREASED_MODS` array.

---

## Session Work (2026-01-22) - Security Hardening

### Security Audit & Fixes

Performed comprehensive security audit using `npm audit` and `eslint-plugin-security`. Implemented fixes for 6 high-priority vulnerabilities.

#### 1. CORS Whitelist (was: wildcard `*`)
**Problem:** All API endpoints used `Access-Control-Allow-Origin: *` allowing any site to call the API.

**Solution:** Created centralized security module with origin whitelist:
```javascript
// api/utils/security.js
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://poe-build-analyzer.vercel.app',
  /^https:\/\/poe-build-analyzer.*\.vercel\.app$/,
];
```

#### 2. League Parameter Validation
**Problem:** `league` parameter was not validated, allowing potential injection.

**Solution:** Whitelist validation for all league parameters:
```javascript
const VALID_LEAGUES = {
  poe2: ['Fate of the Vaal', 'HC Fate of the Vaal', 'Standard', ...],
  poe1: ['Keepers of the Flame', 'Hardcore Keepers of the Flame', 'Standard', ...],
};
```

#### 3. Zip Bomb Prevention
**Problem:** `pako.inflate()` and `zlib` decompression had no size limits.

**Solution:** `safeDecompress()` function with limits:
```javascript
const MAX_COMPRESSED_SIZE = 10 * 1024 * 1024;   // 10MB input
const MAX_DECOMPRESSED_SIZE = 50 * 1024 * 1024; // 50MB output
```

#### 4. Error Message Sanitization
**Problem:** Error responses exposed internal details (`error.message`) in production.

**Solution:** `createErrorResponse()` hides details in production:
```javascript
function createErrorResponse(message, error = null) {
  const isProduction = process.env.NODE_ENV === 'production';
  const response = { error: message };
  if (!isProduction && error) {
    response.details = error.message;
  }
  return response;
}
```

#### 5. IP Spoofing Prevention
**Problem:** Rate limiting used easily-spoofed `x-forwarded-for` header.

**Solution:** Priority-based IP detection with Vercel verification:
```javascript
function getClientIp(req) {
  // Vercel's verified IP (most trustworthy)
  const vercelIp = req.headers['x-vercel-forwarded-for'];
  if (vercelIp) return vercelIp.split(',')[0].trim();
  // Fallbacks...
}
```

#### 6. Image Magic Bytes Validation
**Problem:** Screenshot uploads only validated MIME type (client-provided, spoofable).

**Solution:** Server-side magic bytes validation:
```javascript
function isValidImageMagicBytes(buffer) {
  // Validates PNG, JPEG, GIF, WebP signatures
  const png = [0x89, 0x50, 0x4E, 0x47];
  const jpeg = [0xFF, 0xD8, 0xFF];
  // ...
}
```

### Files Created/Modified

| File | Changes |
|------|---------|
| `api/utils/security.js` | **NEW** - Centralized security utilities module |
| `api/stats.js` | CORS whitelist, safe decompression, error sanitization |
| `api/pob/fetch.js` | CORS whitelist, safe decompression, error sanitization |
| `api/poeninja/currency.js` | CORS whitelist, league validation, safe decompression |
| `api/poe2scout/currency.js` | CORS whitelist, league validation, safe decompression |
| `api/poe2scout/items-multi.js` | CORS whitelist, league validation, safe decompression |
| `api/leagues.js` | CORS whitelist, game validation, safe decompression |
| `api/report-bug.js` | Improved IP detection, magic bytes validation |
| `package.json` | Added eslint-plugin-security config, lint scripts |

### Security Module API (`api/utils/security.js`)

```javascript
// CORS
setCorsHeaders(req, res, methods)  // Set CORS with whitelist
getAllowedOrigin(origin)           // Check if origin is allowed

// Validation
isValidLeague(league, game)        // Validate league against whitelist
isValidGame(game)                  // Validate game parameter
isValidRealm(realm)                // Validate realm parameter

// Rate Limiting
getClientIp(req)                   // Get verified client IP

// Error Handling
createErrorResponse(msg, error)   // Safe error response

// Decompression
safeDecompress(buffer, encoding, zlib)  // Size-limited decompression
isBufferSizeSafe(buffer)          // Check compressed size
isDecompressedSizeSafe(data)      // Check decompressed size

// File Validation
isValidImageMagicBytes(buffer)    // Validate image file signatures
```

### New NPM Scripts

```bash
npm run lint           # ESLint on src/ and api/
npm run lint:security  # Security-focused linting
```

### ESLint Security Rules Added

```json
{
  "plugins": ["security"],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "warn",
    "security/detect-non-literal-fs-filename": "warn"
  }
}
```

### npm audit Status

- ✅ Fixed: lodash Prototype Pollution
- ⚠️ Remaining: 9 vulnerabilities in react-scripts dependencies (dev-only, no production impact)
  - nth-check, postcss, webpack-dev-server (all development tools)

### Rollback Instructions

To disable security features:

```javascript
// Revert to wildcard CORS (not recommended)
res.setHeader('Access-Control-Allow-Origin', '*');

// Disable league validation
// Comment out isValidLeague() checks

// Disable decompression limits
// Use zlib directly instead of safeDecompress()
```

---

## Session Work (2026-01-22) - PoE2 Charm & Flask Stat Handling

### Problems Solved

#### 1. Flask "reduced Amount Recovered" Not Found
**Issue:** `#% reduced Amount Recovered` was not finding the correct stat.

**Solution:** Added to `REDUCED_TO_INCREASED_MODS`:
```javascript
{ pattern: /^#% reduced Amount Recovered$/i, replacement: '#% increased Amount Recovered' }
```

#### 2. Charm Trigger Implicits Not Searchable
**Issue:** Charm triggers like "Used when you kill a Rare or Unique enemy" were being searched but don't exist in API.

**Solution:** Added charm triggers to `UNSEARCHABLE_MODS`:
```javascript
'Used when you kill a Rare or Unique enemy',
'Used when you become Frozen',
'Used when you become Chilled',
'Used when you become Shocked',
'Used when you become Ignited',
'Used when you become Poisoned',
'Used when you start Bleeding',
```

#### 3. Charm-Specific Mods Not in API
**Issue:** Several charm mods don't exist in the trade API.

**Solution:** Added to `UNSEARCHABLE_MODS`:
```javascript
'Recover # Mana when Used',
'Recover # Life when Used',
'Recover # Energy Shield when Used',
'#% increased Charges gained',  // API only has "Flask Charges gained"
'#% Chance to gain a Charge when you kill an enemy',  // API only has specific charge types
'Energy Shield Recharge starts on use',  // Stat exists but doesn't work for charms
```

#### 4. Corruption Implicit Defence Stats Show as "Unavailable Stat"
**Issue:** Local defence stats (`#% increased Energy Shield`) work as explicits but NOT as corruption implicits.

**Solution:** Created `UNSEARCHABLE_IMPLICIT_MODS` list:
```javascript
const UNSEARCHABLE_IMPLICIT_MODS = [
  /^#% increased Energy Shield$/i,
  /^#% increased Armour$/i,
  /^#% increased Evasion$/i,
  /^#% increased Evasion Rating$/i,
  /^#% increased Armour and Energy Shield$/i,
  /^#% increased Armour and Evasion$/i,
  /^#% increased Evasion and Energy Shield$/i,
  /^#% increased Armour, Evasion and Energy Shield$/i,
];
```

#### 5. Local Defence Stats Need "(Local)" Suffix
**Issue:** Explicit defence stats need "(Local)" suffix to match API format.

**Solution:** Added to `STAT_ALIASES`:
```javascript
{ from: /^#% increased Energy Shield$/i, to: '#% increased Energy Shield (Local)' },
{ from: /^#% increased Armour$/i, to: '#% increased Armour (Local)' },
{ from: /^#% increased Evasion$/i, to: '#% increased Evasion (Local)' },
{ from: /^#% increased Evasion Rating$/i, to: '#% increased Evasion Rating (Local)' },
```

#### 6. Mutated Mods Not Cleaned
**Issue:** `{mutated}` tag was not being removed from mod text, causing search failures.

**Solution:** Added to pobParser.js tag cleaning:
```javascript
.replace(/\{mutated\}/g, '')
```

#### 7. Unique Item Mods Different from API
**Issue:** Some unique item mods have different wording than API equivalents.

**Initial Solution (later corrected):** Initially added to `UNSEARCHABLE_MODS`, but these were later found to BE searchable with correct stat IDs. See "Session Work (2026-01-22) - The Vertex Unique Item Stat Mappings" below for the correct mappings.

### Updated Stat Lookup Priority
```
0. UNSEARCHABLE_MODS → if match, return null (skip)
      ↓ not unsearchable
0b. UNSEARCHABLE_IMPLICIT_MODS → if implicit AND match, return null (skip)
      ↓ not unsearchable implicit
1. DIRECT_STAT_MAPPINGS → if found, return immediately
      ↓ not found
2. findStatIdExact() → exact match with STAT_ALIASES
      ↓ not found
3. findStatIdFuzzy() → token-based fuzzy matching (if enabled)
      ↓ not found
4. Return null → stat excluded from search
```

### Files Modified

| File | Changes |
|------|---------|
| `src/services/statsAPI.js` | Added UNSEARCHABLE_IMPLICIT_MODS, expanded UNSEARCHABLE_MODS, new STAT_ALIASES, new REDUCED_TO_INCREASED_MODS entry |
| `src/services/pobParser.js` | Added `{mutated}` tag cleaning |

### Commits
- `2647ca7` - fix: improve PoE2 charm and flask stat handling
- `f3ee3ac` - fix: skip unsearchable corruption implicit mods in PoE2
- `8913bdb` - fix: handle mutated mods and unique item stats in PoE2

---

## Session Work (2026-01-22) - The Vertex Unique Item Stat Mappings

### Problems Solved

Previous session marked several The Vertex mods as unsearchable. User provided trade search JSON revealing the actual stat IDs.

#### The Vertex Stat Mappings (from trade API response)

| Mod Text | Stat ID |
|----------|---------|
| Has no Attribute Requirements | `explicit.stat_2739148464` |
| #% increased Critical Hit Chance | `explicit.stat_587431675` |
| Equipment has no Attribute Requirements | `explicit.stat_2480151124` |
| +# to Level of all Skills | `explicit.stat_4283407333` |
| #% increased Mana Cost Efficiency | `explicit.stat_4101445926` |

#### Changes Made

1. **Removed from `UNSEARCHABLE_MODS`:**
   - `Equipment has no Attribute Requirements`
   - `#% increased Mana Cost Efficiency`

2. **Added to `DIRECT_STAT_MAPPINGS`:**
```javascript
// The Vertex unique item stats (PoE2)
'Has no Attribute Requirements': 'explicit.stat_2739148464',
'Equipment has no Attribute Requirements': 'explicit.stat_2480151124',
'+# to Level of all Skills': 'explicit.stat_4283407333',
'# to Level of all Skills': 'explicit.stat_4283407333',
'#% increased Mana Cost Efficiency': 'explicit.stat_4101445926',
```

### Files Modified

| File | Changes |
|------|---------|
| `src/services/statsAPI.js` | Added The Vertex stat mappings to DIRECT_STAT_MAPPINGS, removed false positives from UNSEARCHABLE_MODS |

---

## Session Work (2026-01-22) - Trade Mode Selector Fix

### Problem

The "Status" dropdown selector was using incorrect values for PoE2 trade API:
- Old `online` value was labeled "Instant Buyout" but actually meant "In Person Trade Only"
- Trade mode wasn't updating when selector changed (stale closure in useCallback)

### Solution

#### 1. Correct Trade Mode Values (from PoB-PoE2 PR #1306)

| UI Label | API Value | Description |
|----------|-----------|-------------|
| Instant Buyout | `securable` | Items with instant buyout only |
| Instant Buyout & In Person | `available` | Both instant and in-person trade |
| In Person Only | `online` | Traditional trade only |
| Any | `any` | All listings |

Reference: https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/pull/1306

#### 2. Fixed Stale Closure Bug

Used `useRef` for `sellerStatus` to ensure callbacks always use current value:

```javascript
// In useBuildAnalyzer.js
const sellerStatusRef = useRef(sellerStatus);
sellerStatusRef.current = sellerStatus;

// In callbacks, use ref instead of state directly
const url = await generateTradeURL(item, game, league, sellerStatusRef.current, stats);
```

### Files Modified

| File | Changes |
|------|---------|
| `src/utils/constants.js` | New `TRADE_MODE_OPTIONS` with correct values and translation keys |
| `src/i18n/translations.js` | Added `tradeMode` translations (EN/ES) |
| `src/components/BuildAnalyzer/ItemList.jsx` | Updated to use translation keys |
| `src/hooks/useBuildAnalyzer.js` | Added `sellerStatusRef` to fix stale closure, default to `securable` |

### Default Value

Changed default from `any` to `securable` (Instant Buyout) as it's the most useful for most users.

---

## Session Work (2026-01-22) - Critical Damage Bonus Stat Mapping

### Problem

The mod `#% increased Critical Damage Bonus` was not being found in trade searches, showing as "NOT FOUND" in logs.

### Root Cause

GGG's stats API endpoint (`/api/trade/data/stats?realm=poe2`) returns this stat with PoE1 terminology:
- **API returns:** `+#% to Global Critical Strike Multiplier`
- **Items show:** `#% increased Critical Damage Bonus`

The stat ID (`explicit.stat_3556824919`) is correct, but the text description in the API is outdated/incorrect for PoE2.

### Solution

Added direct mapping in `DIRECT_STAT_MAPPINGS`:
```javascript
'#% increased Critical Damage Bonus': 'explicit.stat_3556824919',
```

### Files Modified

| File | Changes |
|------|---------|
| `src/services/statsAPI.js` | Added Critical Damage Bonus to DIRECT_STAT_MAPPINGS |

### Note

This is a GGG API inconsistency - the stats endpoint uses PoE1 terminology ("Critical Strike Multiplier") while PoE2 items use "Critical Damage Bonus". The stat ID is the same for both.

---

## Session Work (2026-01-25) - Local/Global Flat Stat Variants

### Problem

Flat defence stats like `+# to maximum Energy Shield` have two versions in PoE2:
- **Global version** - Used on jewellery/accessories
- **Local version** - Used on armour (adds to item's base defence)

When searching for items with these stats, if the wrong version is used, no results are returned.

### Solution

Implemented COUNT groups in trade queries for stats with local/global variants. When one of these stats is detected, instead of a simple filter, we create a COUNT group with `min: 1` containing both versions.

**Example query structure:**
```json
{
  "stats": [
    {
      "type": "and",
      "filters": [... other stats ...]
    },
    {
      "type": "count",
      "value": { "min": 1 },
      "filters": [
        { "id": "explicit.stat_3489782002", "value": { "min": 55 } },
        { "id": "explicit.stat_4052037485", "value": { "min": 55 } }
      ]
    }
  ]
}
```

### Stats with Local/Global Variants

| Stat | Global ID | Local ID |
|------|-----------|----------|
| +# to maximum Energy Shield | `explicit.stat_3489782002` | `explicit.stat_4052037485` |
| +# to Armour | `explicit.stat_809229260` | `explicit.stat_3484657501` |
| +# to Evasion Rating | `explicit.stat_2144192055` | `explicit.stat_53045048` |

### Files Modified

| File | Changes |
|------|---------|
| `src/services/tradeAPI.js` | Added `STATS_WITH_LOCAL_VARIANTS` mapping and COUNT group generation logic |

### Key Code

```javascript
const STATS_WITH_LOCAL_VARIANTS = {
  'explicit.stat_3489782002': {
    global: 'explicit.stat_3489782002',
    local: 'explicit.stat_4052037485',
    name: 'maximum Energy Shield'
  },
  // ... more variants
};
```

---

## Session Work (2026-01-25) - Remove Default Trade Filters

### Problem

Trade searches were filtering out corrupted and fractured items by default, limiting results.

### Solution

Removed the default filters for `corrupted: false` and `fractured_item: no` from `tradeAPI.js`. Now searches return all items regardless of corruption or fractured status, making searches more inclusive.

### Files Modified

| File | Changes |
|------|---------|
| `src/services/tradeAPI.js` | Removed default corrupted and fractured_item filters |

---

## Session Work (2026-01-25) - Project Cleanup

### Files Removed

| File | Reason |
|------|--------|
| `.stylelintrc.json` | Config file for stylelint but package not installed |
| `public/logo512.png` | Unused logo file, only referenced in manifest.json |

### Files Updated

| File | Changes |
|------|---------|
| `public/manifest.json` | Removed logo512.png reference, updated app name to "PoE Build Analyzer" |
| `src/components/PoeNinja/README.md` | Cleaned up references to non-existent components (CurrencyPanel, CurrencyConverterExample) |

---

## Session Work (2026-01-25) - Fractured Mod Selector

### New Feature

Added ability to mark a single explicit mod as "Fractured" in the Edit Item Modal. When searching for items, this mod will use the `fractured.stat_XXXX` prefix instead of `explicit.stat_XXXX`.

### How It Works

1. In the Edit Item Modal, each explicit mod now has a "Fractured" button
2. Only ONE mod can be marked as fractured (radio button behavior)
3. Clicking an already-selected fractured button deselects it
4. When a mod is marked as fractured:
   - The stat ID changes from `explicit.stat_XXXX` to `fractured.stat_XXXX`
   - The query includes `fractured_item: { option: true }` filter

### Files Modified

| File | Changes |
|------|---------|
| `src/services/pobParser.js` | Added `fracturedModIndex: null` to filters initialization |
| `src/components/BuildAnalyzer/EditItemModal.jsx` | Added `handleFracturedToggle()`, fractured button UI with amber styling |
| `src/components/BuildAnalyzer/ItemCard.jsx` | Fixed memo comparator to include `item.filters` for proper re-rendering |
| `src/services/tradeAPI.js` | Added fractured mod detection, prefix replacement `explicit.` → `fractured.`, and `fractured_item` filter |
| `src/services/statsAPI.js` | Updated `validateStatId()` to validate fractured stat IDs based on explicit equivalents |
| `src/i18n/translations.js` | Added `editModal.fractured` and `editModal.fracturedTooltip` (EN/ES) |

### Key Code

**Filter initialization (pobParser.js):**
```javascript
filters: {
  // ... other filters
  fracturedModIndex: null, // Index of explicit mod to search as fractured
}
```

**Fractured toggle handler (EditItemModal.jsx):**
```javascript
const handleFracturedToggle = (index) => {
  const newIndex = editedItem.filters.fracturedModIndex === index ? null : index;
  setEditedItem({
    ...editedItem,
    filters: { ...editedItem.filters, fracturedModIndex: newIndex }
  });
};
```

**Trade query generation (tradeAPI.js):**
```javascript
const isFractured = fracturedModIndex === i;
let statId = findStatId(stats, transformedMod, 'explicit');

// If fractured, replace explicit prefix with fractured prefix
if (isFractured && statId && statId.startsWith('explicit.')) {
  statId = statId.replace('explicit.', 'fractured.');
}

// Add fractured_item filter when a mod is marked as fractured
if (hasFracturedMod) {
  query.query.filters.misc_filters.filters.fractured_item = { option: true };
}
```

**Memo comparator fix (ItemCard.jsx):**
```javascript
// CRITICAL: Must include filters to ensure trade URL uses updated values
prevProps.item.filters === nextProps.item.filters
```

### Example Query with Fractured Mod

When `#% increased Energy Shield` is marked as fractured:
```json
{
  "query": {
    "stats": [{
      "type": "and",
      "filters": [
        { "id": "fractured.stat_4015621042", "value": { "min": 91 } }
      ]
    }],
    "filters": {
      "misc_filters": {
        "filters": {
          "fractured_item": { "option": true }
        }
      }
    }
  }
}
```

### UI Styling

- Default state: Gray button with slate border
- Selected state: Amber background, amber border, amber text
- Selected mod row: Amber left border, amber text color

---

## Session Work (2026-01-25) - Edit Modal UX Improvements

### Problem

The Edit Item Modal had multiple scrollbars (one per section: Enchants, Implicits, Explicits) which looked cluttered and was poor UX.

### Solution

Implemented collapsible accordion sections with a single global scroll.

#### Changes Made

1. **Collapsible Sections**
   - Each section header (Enchants, Implicit Mods, Explicit Mods) is now clickable
   - ChevronDown icon rotates 90° when collapsed
   - Smooth transition animation
   - All sections expanded by default

2. **Single Global Scroll**
   - Removed individual `max-h-XX overflow-y-auto` from each section
   - Single scroll on the main content container

3. **Custom Styled Scrollbar**
   - Width: 8px
   - Track: slate-800 (`#1e293b`)
   - Thumb: cyan-600 (`#0891b2`) with lighter hover state
   - Rounded corners
   - Firefox support via `scrollbar-width` and `scrollbar-color`

### Files Modified

| File | Changes |
|------|---------|
| `src/components/BuildAnalyzer/EditItemModal.jsx` | Added `expandedSections` state, `toggleSection()`, collapsible UI with ChevronDown icons, `custom-scrollbar` class |
| `src/index.css` | Added `.custom-scrollbar` styles for webkit and Firefox |

### Key Code

**State for collapsible sections:**
```javascript
const [expandedSections, setExpandedSections] = useState({
  enchants: true,
  implicits: true,
  explicits: true
});

const toggleSection = (section) => {
  setExpandedSections(prev => ({
    ...prev,
    [section]: !prev[section]
  }));
};
```

**Custom scrollbar CSS:**
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #1e293b;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #0891b2;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #06b6d4;
}
/* Firefox */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #0891b2 #1e293b;
}
```

---

## Session Work (2026-01-25) - Custom Scrollbar Site-Wide

### Implementation

Applied the `.custom-scrollbar` class to all scrollable elements across the site.

### Files Modified

| File | Element |
|------|---------|
| `src/components/BuildAnalyzer/EditItemModal.jsx` | Modal content area |
| `src/components/Layout/UserGuideModal.jsx` | User guide content |
| `src/components/ReportModal.js` | Modal container + textarea |
| `src/components/BuildAnalyzer/BuildForm.jsx` | POB code textarea |

---

## Session Work (2026-01-25) - Fractured + Local/Global Variants Fix

### Problem

When a mod was marked as fractured AND had local/global variants (like `+# to maximum Energy Shield`), the code was adding it to the AND group instead of creating a COUNT group with fractured prefixes.

### Solution

Updated `tradeAPI.js` to check for local/global variants BEFORE handling the fractured logic. Now when a stat has variants:
- Creates COUNT group with both global and local versions
- Uses `fractured.` prefix if mod is marked as fractured
- Uses `explicit.` prefix otherwise

### Key Code Change

```javascript
// Check if this stat has local/global variants (use explicit ID for lookup)
const explicitStatId = isFractured ? statId.replace('fractured.', 'explicit.') : statId;
const variantInfo = STATS_WITH_LOCAL_VARIANTS[explicitStatId];

if (variantInfo) {
  // Determine prefix based on whether mod is fractured
  const prefix = isFractured ? 'fractured.' : 'explicit.';
  const globalId = variantInfo.global.replace('explicit.', prefix);
  const localId = variantInfo.local.replace('explicit.', prefix);
  // Create COUNT group with both versions...
}
```

---

## Session Work (2026-01-25) - Mobile Responsiveness

### Problems

1. ItemList header was cluttered on mobile
2. ItemCard badges were too large, making cards very tall
3. EditItemModal's Fractured button overflowed its container

### Solutions

#### ItemList (`src/components/BuildAnalyzer/ItemList.jsx`)
- Title and category selector stack vertically on mobile (`flex-col sm:flex-row`)
- Full-width dropdowns on small screens (`w-full sm:w-auto`)
- League and status filters also stack on mobile

#### ItemCard (`src/components/BuildAnalyzer/ItemCard.jsx`)
- Reduced padding: `p-4 sm:p-6`
- Smaller badges: `px-2 sm:px-3 py-1 sm:py-1.5`
- Thinner borders on mobile: `border sm:border-2`
- Shorter text: "Req Lvl X" → "Req X"
- Truncate long item names: `truncate` class
- Action buttons align to bottom on mobile: `self-end sm:self-start`

#### EditItemModal (`src/components/BuildAnalyzer/EditItemModal.jsx`)
- Two-row layout for mods:
  - Row 1: Checkbox + mod text
  - Row 2: Value inputs + Fractured button (with `ml-auto`)
- Smaller inputs on mobile: `w-16 sm:w-20`
- Reduced padding throughout: `p-4 sm:p-6`
- Modal uses more height on mobile: `max-h-[90vh] sm:max-h-[85vh]`

### Breakpoint Used

All responsive changes use the `sm:` breakpoint (640px) for consistency.

---

## Session Work (2026-01-25) - Equipment Defence Filters

### New Feature

Added ability to filter armour items by their defence properties (Energy Shield, Armour, Evasion) in the Edit Item Modal.

### How It Works

1. Defence properties (ES, Armour, Evasion) are parsed from PoB item text
2. If an item has defence properties, "Equipment Filters" section appears in Edit Modal
3. Each property can be enabled with checkbox and has Min/Max inputs
4. Enabled filters are added to trade query as `equipment_filters`

### Files Modified

| File | Changes |
|------|---------|
| `src/services/pobParser.js` | Parse `Energy Shield:`, `Armour:`, `Evasion:` from item text, add `defenceProperties` to item, initialize `defenceFilters` in filters |
| `src/components/BuildAnalyzer/EditItemModal.jsx` | Add collapsible "Equipment Filters" section (blue), checkbox + min/max inputs for each defence type |
| `src/services/tradeAPI.js` | Add `equipment_filters` to query structure, generate `es`, `ar`, `ev` filters when enabled |
| `src/i18n/translations.js` | Add `editModal.equipmentFilters`, `editModal.energyShield`, `editModal.armour`, `editModal.evasion` (EN/ES) |

### Key Code

**Defence property parsing (pobParser.js):**
```javascript
const energyShieldMatch = itemText.match(/Energy Shield: (\d+)/);
const armourMatch = itemText.match(/Armour: (\d+)/);
const evasionMatch = itemText.match(/Evasion: (\d+)/);

const defenceProperties = {
  energyShield: energyShieldMatch ? parseInt(energyShieldMatch[1]) : null,
  armour: armourMatch ? parseInt(armourMatch[1]) : null,
  evasion: evasionMatch ? parseInt(evasionMatch[1]) : null
};
```

**Filter initialization (pobParser.js):**
```javascript
defenceFilters: {
  energyShield: { min: defenceProperties.energyShield, max: null, enabled: false },
  armour: { min: defenceProperties.armour, max: null, enabled: false },
  evasion: { min: defenceProperties.evasion, max: null, enabled: false }
}
```

**Trade query generation (tradeAPI.js):**
```javascript
// Add equipment_filters to query structure
equipment_filters: {
  filters: {}
}

// When defence filter is enabled
if (defenceFilters.energyShield?.enabled) {
  query.query.filters.equipment_filters.filters.es = {
    min: defenceFilters.energyShield.min,
    max: defenceFilters.energyShield.max
  };
}
```

---

## Session Work (2026-01-25) - ItemList Header Reorganization

### Change

Reorganized the ItemList header to have a more logical visual layout:
- **Left side:** "Items Found (X)" + Category selector
- **Right side:** League badge + Status selector

### Implementation

Changed from two stacked rows to single row with `justify-between` on large screens:
```javascript
<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
```

Uses `lg:` breakpoint (1024px) to ensure enough space for all elements.

---

## Session Work (2026-01-25) - Talisman Category Fix

### Problem

Talismans (like "Changeling Talisman") were incorrectly categorized as Armour.

### Solution

Added `talisman` to the weapon types array in `getItemCategory()`:
```javascript
const weaponTypes = ['sword', 'axe', 'mace', 'staff', 'wand', 'dagger', 'claw', 'bow', 'sceptre', 'flail', 'crossbow', 'spear', 'quarterstaff', 'trap', 'focus', 'quiver', 'talisman'];
```

Talismans in PoE2 are focus-type weapons, not accessories.

---

## Quick Reference - Current State

### Trade Query Generation (`tradeAPI.js`)

1. **Normal stats** → Added to `type: "and"` group
2. **Stats with local/global variants** → Added to separate `type: "count"` groups with `min: 1`
3. **Fractured mods with variants** → COUNT group with `fractured.` prefix for both global/local
4. **Fractured mods without variants** → Added to AND group with `fractured.` prefix
5. **No default filtering** → Corrupted and fractured items are included
6. **Equipment filters** → Added to `equipment_filters.filters` as `es`, `ar`, `ev` when enabled

### Stat Lookup Priority (`statsAPI.js`)

```
0. UNSEARCHABLE_MODS → skip
0b. UNSEARCHABLE_IMPLICIT_MODS (if implicit) → skip
1. DIRECT_STAT_MAPPINGS → return immediately
2. findStatIdExact() with STAT_ALIASES → exact match
3. findStatIdFuzzy() → token-based fuzzy (if enabled)
4. Return null → excluded from search
```

### Key Direct Mappings

| PoB Text | Trade API ID |
|----------|--------------|
| `#% increased Critical Damage Bonus` | `explicit.stat_3556824919` |
| `#% increased Critical Hit Chance` | `explicit.stat_587431675` |
| `#% increased effect of Socketed Items` | `explicit.stat_2081918629` |
| `+# to Spirit` | `explicit.stat_3981240776` |

---

## Session Work (2026-01-25) - Socket Filters (PoE1)

### New Feature

Added socket filtering capability for PoE1 items (PoE2 uses different itemization without sockets).

### How Socket Parsing Works

PoB exports sockets in format: `Sockets: R-R-B-G-G-G`
- Colors separated by `-` are **linked**
- Colors separated by space are **unlinked**

```javascript
// Example: "R-R-B G-G-G" = 3-link (RGB) + 3-link (GGG), not linked to each other
const socketInfo = {
  raw: "R-R-B-G-G-G",
  colors: { r: 2, g: 3, b: 1, w: 0 },
  totalSockets: 6,
  maxLinks: 6
};
```

### Socket Filters UI

In Edit Item Modal (PoE1 only):
- **Socket Colors**: Checkboxes for R, G, B, W with min value inputs
- **Minimum Links**: Number input for minimum linked sockets
- Purple-themed collapsible section

### Trade Query Generation

```json
{
  "query": {
    "filters": {
      "socket_filters": {
        "filters": {
          "sockets": { "r": 2, "g": 3, "b": 1 },
          "links": { "min": 5 }
        }
      }
    }
  }
}
```

### Files Modified

| File | Changes |
|------|---------|
| `src/services/pobParser.js` | Parse socket string, extract colors/links, add `socketInfo` to item, initialize `socketFilters` in filters |
| `src/components/BuildAnalyzer/EditItemModal.jsx` | Socket Filters UI section (purple theme), color checkboxes, min link input |
| `src/services/tradeAPI.js` | Generate `socket_filters` in trade query |
| `src/i18n/translations.js` | Added `editModal.socketFilters`, `editModal.socketColors`, `editModal.minLinks`, `editModal.currentLinks` (EN/ES) |

### Key Code

**Socket parsing (pobParser.js):**
```javascript
let socketInfo = null;
if (sockets && sockets.match(/^[RGBWS\- ]+$/i)) {
  const colors = { r: 0, g: 0, b: 0, w: 0 };
  let maxLinks = 0;

  // Split by space to get link groups, then count colors
  const groups = sockets.split(' ');
  groups.forEach(group => {
    const groupColors = group.split('-');
    maxLinks = Math.max(maxLinks, groupColors.length);
    groupColors.forEach(c => {
      const color = c.toLowerCase();
      if (colors.hasOwnProperty(color)) colors[color]++;
    });
  });

  socketInfo = { raw: sockets, colors, totalSockets, maxLinks };
}
```

---

## Session Work (2026-01-25) - Parser Exclusions for PoE1 Metadata

### Problem

Several PoE1 item metadata lines were being incorrectly parsed as mods:
- `Fractured Item` - Status flag
- `Split` - Status flag
- `Mirrored` - Status flag
- `Synthesised Item` - Status flag
- `Searing Exarch Item` - Influence type
- `Eater of Worlds Item` - Influence type
- `Shaper Item` - Influence type
- `Elder Item` - Influence type
- `Crusader Item` - Influence type
- `Hunter Item` - Influence type
- `Redeemer Item` - Influence type
- `Warlord Item` - Influence type
- `EvasionBasePercentile: #` - PoB internal property

### Solution

Added comprehensive exclusion list in `pobParser.js` mod extraction:

```javascript
// Skip item status flags and influence markers
if (
  line === 'Fractured Item' ||
  line === 'Split' ||
  line === 'Mirrored' ||
  line === 'Synthesised Item' ||
  line === 'Searing Exarch Item' ||
  line === 'Eater of Worlds Item' ||
  line === 'Shaper Item' ||
  line === 'Elder Item' ||
  line === 'Crusader Item' ||
  line === 'Hunter Item' ||
  line === 'Redeemer Item' ||
  line === 'Warlord Item' ||
  line.startsWith('EvasionBasePercentile:') ||
  line.startsWith('ArmourBasePercentile:') ||
  line.startsWith('EnergyShieldBasePercentile:')
) {
  continue;
}
```

### Files Modified

| File | Changes |
|------|---------|
| `src/services/pobParser.js` | Added exclusions for status flags, influence types, and PoB internal properties |

---

## Session Work (2026-01-25) - Implicit Mods Disabled by Default

### Change

Changed the default value for `selectedImplicits` from `true` to `false` in `pobParser.js`.

### Reason

Implicit mods are often less relevant for trade searches, and enabling them by default can make searches too restrictive.

### Code Change

```javascript
// Before
selectedImplicits: implicits.map(() => true),

// After
selectedImplicits: implicits.map(() => false),
```

---

## ⚠️ Session Work (2026-01-25) - CRITICAL: Trade Mode Options Fix (PoE1 vs PoE2)

### Problem

**The `securable` (Instant Buyout) trade status value does NOT exist in PoE1 trade API.**

Using `securable` for PoE1 searches causes:
```
"Failed to load search state"
```

This error appears because the PoE1 trade website doesn't recognize the `securable` status parameter.

### Root Cause

PoE1 and PoE2 have different trade status options:

| Game | Available Values | Description |
|------|------------------|-------------|
| **PoE2** | `securable`, `available`, `online`, `any` | Instant Buyout system exists |
| **PoE1** | `online`, `any` | No Instant Buyout (whisper-only trading) |

The app was using `securable` as default for both games, breaking PoE1 searches.

### Solution

#### 1. Game-Specific Trade Mode Options (`src/utils/constants.js`)

```javascript
export const TRADE_MODE_OPTIONS = {
  poe2: [
    { value: 'securable', labelKey: 'tradeMode.instantBuyout' },
    { value: 'available', labelKey: 'tradeMode.instantAndInPerson' },
    { value: 'online', labelKey: 'tradeMode.inPersonOnly' },
    { value: 'any', labelKey: 'tradeMode.any' }
  ],
  poe1: [
    { value: 'online', labelKey: 'tradeMode.onlineOnly' },
    { value: 'any', labelKey: 'tradeMode.any' }
  ]
};

export const DEFAULT_TRADE_MODE = {
  poe2: 'securable',
  poe1: 'online'
};
```

#### 2. Game Change Handler (`src/hooks/useBuildAnalyzer.js`)

```javascript
const DEV_DEFAULT_GAME = process.env.NODE_ENV === 'development' ? 'poe1' : 'poe2';
const [sellerStatus, setSellerStatus] = useState(DEFAULT_TRADE_MODE[DEV_DEFAULT_GAME]);

const handleGameChange = useCallback((newGame) => {
  setGame(newGame);
  // CRITICAL: Reset seller status to game-appropriate default
  setSellerStatus(DEFAULT_TRADE_MODE[newGame]);
}, []);
```

#### 3. Dynamic Options in UI (`src/components/BuildAnalyzer/ItemList.jsx`)

```javascript
// Use game-specific options
{TRADE_MODE_OPTIONS[game].map(option => (
  <option key={option.value} value={option.value}>
    {t(option.labelKey)}
  </option>
))}
```

### Files Modified

| File | Changes |
|------|---------|
| `src/utils/constants.js` | Added `TRADE_MODE_OPTIONS` (per-game) and `DEFAULT_TRADE_MODE` |
| `src/hooks/useBuildAnalyzer.js` | Added `handleGameChange`, game-specific defaults |
| `src/components/BuildAnalyzer/ItemList.jsx` | Dynamic options from `TRADE_MODE_OPTIONS[game]` |
| `src/components/BuildAnalyzer/BuildForm.jsx` | Added `onGameChange` prop |
| `src/App.jsx` | Pass `handleGameChange` to BuildForm |
| `src/i18n/translations.js` | Added `tradeMode.onlineOnly` (EN/ES) |

### Testing

When switching games in the UI:
- **PoE2 → PoE1**: Status resets to `online`
- **PoE1 → PoE2**: Status resets to `securable`

This prevents the "Failed to load search state" error.
