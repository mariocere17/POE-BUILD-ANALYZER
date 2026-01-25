# Claude Context Recovery - PoE Build Analyzer

## Project Overview
PoE Build Analyzer es una aplicación React que genera enlaces de trade automáticos para Path of Exile 1 y 2 basándose en builds importadas desde pobb.in.

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
