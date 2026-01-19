# Claude Context Recovery - PoE Build Analyzer

## Project Overview
PoE Build Analyzer es una aplicación React que genera enlaces de trade automáticos para Path of Exile 2 basándose en builds importadas desde pobb.in.

## Session Work (2026-01-19)

### Problems Solved

#### 1. Stat Matching for Trade URLs
**Issue:** Stats from jewels (and other items) were showing as "Unavailable Stat" in the PoE2 Trade website because:
1. PoB uses different terminology than the Trade API (e.g., "Critical Hit Chance" vs "Critical Strike Chance")
2. Some stats have different stat IDs in PoE2 than expected
3. Text variations exist (e.g., "maximum Mana" vs "Mana")
4. Some PoE2-specific stats are NOT in the Trade API stats endpoint but DO exist in trade searches

**Solution:** Implemented a 3-tier stat lookup system:
1. `DIRECT_STAT_MAPPINGS` - Hardcoded IDs for stats missing from API
2. `findStatIdExact()` - Exact matching with `STAT_ALIASES` transformations
3. `findStatIdFuzzy()` - Token-based fuzzy matching as fallback

#### 2. Item Properties Being Treated as Mods
**Issue:** Item base properties like "Energy Shield: 190" were being incorrectly parsed as explicit mods.

**Solution:** Added filters in `pobParser.js` to skip item property lines.

#### 3. Time-Lost Jewel Stats
**Issue:** Time-Lost Jewels have unique stats like "Notable Passive Skills in Radius also grant X" that are NOT in the stats API but DO exist in trade searches.

**Solution:** Added known stat IDs to `DIRECT_STAT_MAPPINGS`. New stats must be discovered by inspecting trade JSON responses.

**Limitation:** There are MANY different Time-Lost Jewel stats (each "grant X" variant has a unique ID). Only commonly used ones are mapped.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/services/statsAPI.js` | Fuzzy matching, aliases, direct mappings, validateStatId |
| `src/services/tradeAPI.js` | Debug logging (dev only) |
| `src/services/pobParser.js` | Item property filters |
| `src/hooks/useBuildAnalyzer.js` | Dev default pobb.in URL |

---

## Key Code in statsAPI.js

### Feature Flags (Lines 11-12)
```javascript
const USE_FUZZY_MATCHING = true;
const FUZZY_MIN_SCORE = 0.75; // Minimum similarity score (0-1)
```

### STAT_ALIASES (Lines 18-29)
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

### DIRECT_STAT_MAPPINGS (Lines 36-58)
Stats NOT in API but exist in trade (discovered via JSON inspection):
```javascript
const DIRECT_STAT_MAPPINGS = {
  // Global Critical Hit/Strike Chance for jewels
  '#% increased Critical Hit Chance': 'explicit.stat_587431675',
  '#% increased Critical Strike Chance': 'explicit.stat_587431675',
  // Essence of Horror mod
  '#% increased effect of Socketed Items': 'explicit.stat_2081918629',
  // Spirit stat (PoE2 specific)
  '# to Spirit': 'explicit.stat_3981240776',
  '+# to Spirit': 'explicit.stat_3981240776',
  // Time-Lost Jewel stats
  'Upgrades Radius to Large': 'explicit.stat_3891355829|2',
  'Notable Passive Skills in Radius also grant #% increased Critical Hit Chance': 'explicit.stat_2077117738',
  'Notable Passive Skills in Radius also grant #% increased Critical Strike Chance': 'explicit.stat_2077117738',
  'Notable Passive Skills in Radius also grant #% increased Critical Hit Chance for Spells': 'explicit.stat_2704905000',
  'Notable Passive Skills in Radius also grant #% increased Critical Strike Chance for Spells': 'explicit.stat_2704905000',
  'Small Passive Skills in Radius also grant #% increased maximum Energy Shield': 'explicit.stat_3665922113',
};
```

### Stat Lookup Priority
```
1. DIRECT_STAT_MAPPINGS → if found, return immediately
      ↓ not found
2. findStatIdExact() → exact match with STAT_ALIASES
      ↓ not found
3. findStatIdFuzzy() → token-based fuzzy matching (if enabled)
      ↓ not found
4. Return null → stat excluded from search
```

### validateStatId Function
Validates stat IDs from BOTH the API cache AND `DIRECT_STAT_MAPPINGS`:
```javascript
export const validateStatId = (stats, statId) => {
  const directMappingIds = Object.values(DIRECT_STAT_MAPPINGS);
  if (directMappingIds.includes(statId)) return true;
  // ... also checks stats.result
};
```

---

## Known Stat ID Mappings for PoE2

Stats NOT in API but exist in trade (discovered via trade JSON inspection):

| Mod Text | Stat ID | Source |
|----------|---------|--------|
| `#% increased Critical Hit Chance` | `explicit.stat_587431675` | Jewels (Global) |
| `#% increased effect of Socketed Items` | `explicit.stat_2081918629` | Essence of Horror |
| `+# to Spirit` | `explicit.stat_3981240776` | Body Armour, etc. |
| `Upgrades Radius to Large` | `explicit.stat_3891355829\|2` | Time-Lost Jewels |
| `Notable Passive Skills in Radius also grant #% increased Critical Hit Chance` | `explicit.stat_2077117738` | Time-Lost Jewels |
| `Notable Passive Skills in Radius also grant #% increased Critical Hit Chance for Spells` | `explicit.stat_2704905000` | Time-Lost Jewels |
| `Small Passive Skills in Radius also grant #% increased maximum Energy Shield` | `explicit.stat_3665922113` | Time-Lost Jewels |

---

## How to Add New Stat Mappings

### Method: Inspect Trade JSON Response
1. Search for an item with the desired mod on pathofexile.com/trade2
2. Open browser DevTools → Network tab
3. Find the search response (POST to `/api/trade2/search/...`)
4. Look in `result[].item.extended.mods.explicit[].magnitudes[].hash`
5. Add to `DIRECT_STAT_MAPPINGS`:
```javascript
'Exact mod text with # for numbers': 'explicit.stat_XXXXXXXX',
```

### If stat text differs between PoB and Trade API:
Add to `STAT_ALIASES`:
```javascript
{ from: /PoB Text Pattern/gi, to: 'Trade API Text' },
```

---

## Debug Logging (Development Only)

### statsAPI.js
- `[STATS] Direct mapping: "..." -> ...` - DIRECT_STAT_MAPPINGS hit
- `[STATS] Trying variations for "...":` - STAT_ALIASES applied
- `[STATS] Searching for cleanMod: "..."` - Exact match attempt
- `[STATS] Exact match failed, trying fuzzy matching for: "..."` - Fallback
- `[STATS] Fuzzy match: "..." -> "..." (score: X.XX)` - Success
- `[STATS] Fuzzy match rejected (score too low)` - Below threshold
- `[STATS] No match found for: "..."` - Complete failure

### tradeAPI.js
- `[TRADE] Processing item mods` - Item and mods being processed
- `[EXPLICIT N] "..." -> ...` - Individual mod → stat ID
- `[TRADE] Generated Query` - Final JSON and URL

---

## Item Property Filters (pobParser.js)

Lines filtered to prevent base stats from being parsed as mods:
```javascript
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
```

---

## Development Convenience

Default pobb.in URL pre-filled in development mode:
```javascript
// src/hooks/useBuildAnalyzer.js
const DEV_DEFAULT_POB = process.env.NODE_ENV === 'development'
  ? 'https://pobb.in/VVZy6u-NrRUi'
  : '';
```

---

## Commands
- `npm start` - Development server (port 3000)
- `npm run dev:api` - Proxy server (port 3001)
- `npm run build` - Production build

## API Endpoints
- Stats API: `/api/stats?realm=poe2` (proxied)
- Static fallback: `/data/poe2-stats.json`
- Cache: localStorage `poe_stats_cache_poe2` (24h TTL)

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
