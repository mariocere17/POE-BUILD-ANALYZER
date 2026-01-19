# Claude Context Recovery - PoE Build Analyzer

## Project Overview
PoE Build Analyzer es una aplicación React que genera enlaces de trade automáticos para Path of Exile 2 basándose en builds importadas desde pobb.in.

## Current Session Work (2026-01-19)

### Problems Solved

#### 1. Stat Matching for Trade URLs
**Issue:** Stats from jewels (and other items) were showing as "Unavailable Stat" in the PoE2 Trade website because:
1. PoB uses different terminology than the Trade API (e.g., "Critical Hit Chance" vs "Critical Strike Chance")
2. Some stats have different stat IDs in PoE2 than expected
3. Text variations exist (e.g., "maximum Mana" vs "Mana")
4. Some PoE2-specific stats are NOT in the Trade API stats endpoint but DO exist in trade searches

#### 2. Item Properties Being Treated as Mods
**Issue:** Item base properties like "Energy Shield: 190" were being incorrectly parsed as explicit mods and included in trade searches.

**Solution:** Added filters in `pobParser.js` to skip item property lines.

#### 3. Fuzzy Matching System
**Issue:** Manual 1:1 stat mappings are not scalable.

**Solution:** Implemented a fuzzy token-based matching system as fallback when exact matching fails.

### Solution Implemented

**Files Modified:**
- `src/services/statsAPI.js` - Added fuzzy matching system, alias system, and direct stat ID mappings
- `src/services/tradeAPI.js` - Added debug logging (development only)
- `src/services/pobParser.js` - Added filters to exclude item properties from mod parsing

---

## Key Code Changes

### statsAPI.js

#### Feature Flag (Line 11-12)
Toggle fuzzy matching on/off for easy rollback:
```javascript
const USE_FUZZY_MATCHING = true;
const FUZZY_MIN_SCORE = 0.75; // Minimum similarity score (0-1)
```

#### STAT_ALIASES Array (Line 18-23)
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

#### DIRECT_STAT_MAPPINGS Object (Lines 36-58)
For stats that are NOT in the Trade API stats endpoint but DO exist in trade:
```javascript
const DIRECT_STAT_MAPPINGS = {
  // Critical Hit/Strike Chance - uses Global stat ID in PoE2
  '#% increased Critical Hit Chance': 'explicit.stat_587431675',
  '#% increased Critical Strike Chance': 'explicit.stat_587431675',
  // Essence of Horror mod - not in stats API but exists in trade
  '#% increased effect of Socketed Items': 'explicit.stat_2081918629',
  // Spirit stat - PoE2 specific, not in stats API
  '# to Spirit': 'explicit.stat_3981240776',
  '+# to Spirit': 'explicit.stat_3981240776',
  // Time-Lost Jewel stats
  'Upgrades Radius to Large': 'explicit.stat_3891355829|2',
  'Notable Passive Skills in Radius also grant #% increased Critical Hit Chance': 'explicit.stat_2077117738',
  'Small Passive Skills in Radius also grant #% increased maximum Energy Shield': 'explicit.stat_3665922113',
  // ... more Time-Lost stats added as discovered
};
```

**Note:** Time-Lost Jewels have MANY different "Notable/Small Passive Skills in Radius also grant X" stats. Only commonly used ones are mapped. To add more, inspect trade JSON responses for the stat ID.

#### Fuzzy Matching System (Lines 40-220)
Token-based matching with bidirectional scoring:

1. **WORD_SYNONYMS**: Normalizes terminology differences
   - `hit` → `strike`
   - `maximum` → `` (removed)

2. **STOP_WORDS**: Common words removed during tokenization
   - `to`, `the`, `a`, `an`, `of`, `for`, `with`, `on`, `by`, `per`, `and`, `or`

3. **tokenizeAndNormalize()**: Converts mod text to comparable tokens
   - `"#% increased Critical Hit Chance"` → `["increased", "critical", "strike", "chance"]`

4. **calculateTokenSimilarity()**: Bidirectional scoring
   - Requires BOTH directions to match well (geometric mean)
   - Prevents matching generic stats to specific ones
   - Penalizes large size differences

5. **findStatIdFuzzy()**: Finds best matching stat above threshold

#### Stat Lookup Priority (findStatId function)
```
1. DIRECT_STAT_MAPPINGS (hardcoded IDs for missing stats)
      ↓ not found
2. findStatIdExact() (legacy system with STAT_ALIASES)
      ↓ not found
3. findStatIdFuzzy() (if USE_FUZZY_MATCHING = true)
      ↓ not found
4. Return null (stat won't be included in search)
```

---

### pobParser.js

#### Item Property Filters (Lines 232-244)
Added filters to prevent item base stats from being parsed as mods:
```javascript
// Item properties (not mods) - these are base stats of the item
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

These lines represent calculated item stats (after quality, % mods, etc.) and should NOT be searchable mods.

---

## Known Stat ID Mappings for PoE2

Stats that are NOT in the API but exist in trade (discovered via trade response inspection):

| Mod Text | Stat ID | Source |
|----------|---------|--------|
| `#% increased Critical Hit Chance` | `explicit.stat_587431675` | Jewels (Global) |
| `#% increased effect of Socketed Items` | `explicit.stat_2081918629` | Essence of Horror |
| `+# to Spirit` | `explicit.stat_3981240776` | Body Armour, etc. |
| `Upgrades Radius to Large` | `explicit.stat_3891355829\|2` | Time-Lost Jewels |
| `Notable Passive Skills in Radius also grant #% increased Critical Hit Chance` | `explicit.stat_2077117738` | Time-Lost Jewels |
| `Notable Passive Skills in Radius also grant #% increased Critical Hit Chance for Spells` | `explicit.stat_2704905000` | Time-Lost Jewels |
| `Small Passive Skills in Radius also grant #% increased maximum Energy Shield` | `explicit.stat_3665922113` | Time-Lost Jewels |

Stats in the API (for reference):
- `explicit.stat_737908626` = `#% increased Spell Critical Strike Chance`
- `explicit.stat_3291658075` = `#% increased Cold Damage`
- `explicit.stat_1782086450` = `#% faster start of Energy Shield Recharge`
- `explicit.stat_2974417149` = `#% increased Spell Damage`
- `explicit.stat_2891184298` = `#% increased Cast Speed`
- `explicit.stat_3489782002` = `+# to maximum Energy Shield`
- `explicit.stat_2482852589` = `#% increased maximum Energy Shield`

---

## Debug Logging

Development-only logging (`process.env.NODE_ENV === 'development'`):

### statsAPI.js
- `[STATS] Direct mapping: "..." -> ...` - When a DIRECT_STAT_MAPPINGS entry is used
- `[STATS] Trying variations for "...":` - Shows STAT_ALIASES transformations
- `[STATS] Searching for cleanMod: "..."` - Exact match attempt
- `[STATS] Exact match failed, trying fuzzy matching for: "..."` - Fallback to fuzzy
- `[STATS] Fuzzy match: "..." -> "..." (score: X.XX) = ...` - Successful fuzzy match
- `[STATS] Fuzzy match rejected (score too low): "..." -> "..." (score: X.XX, min: 0.75)` - Rejected fuzzy match
- `[STATS] No match found for: "..." (type: explicit)` - Complete failure

### tradeAPI.js
- `🔍 [TRADE] Processing item mods` - Shows item and selected mods
- `[EXPLICIT N] "..." -> ...` - Individual mod → stat ID mapping
- `📦 [TRADE] Generated Query` - Final JSON query and URL

---

## How to Add New Stat Mappings

### If the stat text is slightly different (PoB vs Trade API):
Add to `STAT_ALIASES`:
```javascript
{ from: /PoB Text/gi, to: 'Trade API Text' },
```

### If the stat ID is completely missing from the API:
1. Find an item with that mod on the trade site
2. Inspect the network response or item JSON
3. Find the `hash` value in `extended.mods.explicit[].magnitudes[].hash`
4. Add to `DIRECT_STAT_MAPPINGS`:
```javascript
'#% normalized mod text': 'explicit.stat_XXXXXXXX',
```

---

## Files Structure
```
src/
├── services/
│   ├── statsAPI.js      # Stat ID lookup with fuzzy matching
│   ├── tradeAPI.js      # Trade URL generation
│   └── pobParser.js     # PoB code parsing with property filters
├── hooks/
│   └── useBuildAnalyzer.js  # Main state management
└── components/
    └── BuildAnalyzer/   # UI components
```

## API Endpoints
- Stats API: `/api/stats?realm=poe2` (proxied from pathofexile.com)
- Static fallback: `/data/poe2-stats.json`
- Cache: localStorage `poe_stats_cache_poe2` (24h TTL)

## Commands
- `npm start` - Development server (port 3000)
- `npm run dev:api` - Proxy server (port 3001)
- `npm run build` - Production build

## Rollback Instructions

### Disable Fuzzy Matching
In `statsAPI.js`, change:
```javascript
const USE_FUZZY_MATCHING = false;
```

### Adjust Fuzzy Sensitivity
In `statsAPI.js`, change the minimum score (higher = stricter):
```javascript
const FUZZY_MIN_SCORE = 0.80; // Default is 0.75
```
