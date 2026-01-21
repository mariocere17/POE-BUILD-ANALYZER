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
