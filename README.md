# ⚡ PoE Build Analyzer

> Automate your Path of Exile item searches. Paste your Path of Building code and get instant trade links with smart mod filtering.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mariocere17/POE-BUILD-ANALYZER)

**Live Demo:** [https://poe-build-analyzer.vercel.app](https://poe-build-analyzer.vercel.app)

---

## ✨ Features

- 🎮 **Dual Game Support** - Works with both Path of Exile 1 and Path of Exile 2
- 📋 **Multiple Input Formats** - Accepts raw PoB codes and pobb.in URLs
- 🔍 **Smart Item Parsing** - Extracts all items with mods, enchants, and stats
- 🛠️ **Customizable Filters** - Edit search parameters for each item before searching
- 💱 **Real-time Currency Prices** - Live economy data from poe2scout and poe.ninja
- 🔗 **Direct Trade Links** - Generate personalized trade searches with 3-7 mod filters per item
- ⚡ **Serverless Architecture** - Fully deployed on Vercel with zero backend maintenance
- 🔄 **Auto-updating Stats** - Daily automated updates of PoE trade stats via GitHub Actions

---

## 🚀 Quick Start

### Using the Live App

1. Visit [https://poe-build-analyzer.vercel.app](https://poe-build-analyzer.vercel.app)
2. Select your game (PoE1 or PoE2) and league
3. Paste your PoB code or pobb.in URL
4. Click "Analyze Build"
5. Get instant trade links for all your items

### Getting Your Build Code

**From Path of Building:**
1. Open your build in Path of Building
2. Click "Import/Export Build"
3. Click "Generate"
4. Copy the code

**From pobb.in:**
- Just copy the URL (e.g., `https://pobb.in/VVZy6u-NrRUi`)

---

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ and npm
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/mariocere17/POE-BUILD-ANALYZER.git
cd POE-BUILD-ANALYZER

# Install dependencies
npm install

# Start the development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📦 Deployment

### Deploy to Vercel (Recommended)

This project is optimized for Vercel deployment with serverless functions.

**One-Click Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mariocere17/POE-BUILD-ANALYZER)

**Manual Deploy:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**What gets deployed:**
- ✅ React frontend (optimized production build)
- ✅ 6 serverless API functions (`/api/stats`, `/api/leagues`, etc.)
- ✅ Static JSON fallback for stats (2.7MB)
- ✅ Auto-updates via GitHub Actions

**No environment variables required** - everything works out of the box!

---

## 🏗️ Architecture

### Frontend
- **React 18** - UI framework
- **Tailwind CSS 3.4.17** - Styling
- **Lucide React** - Icons
- **pako.js 2.1.0** - PoB decompression

### Backend (Serverless Functions)
```
api/
├── stats.js                    → PoE trade stats API
├── leagues.js                  → Active leagues
├── poeninja/currency.js        → PoE1 currency prices
├── poe2scout/currency.js       → PoE2 currency prices
├── poe2scout/items-multi.js    → Multiple item categories
└── pob/fetch.js                → Fetch PoB from pobb.in
```

### Key Technical Decisions

**Multi-Layer Stats Fallback System:**
1. In-memory cache (during session)
2. localStorage cache (24h persistent)
3. Vercel serverless proxy
4. Direct API call (if CORS allows)
5. Static JSON fallback (`public/data/poe2-stats.json`)

This ensures stats are **always available** even when PoE API blocks Vercel IPs.

**PoB Parsing with pako.js:**
- More robust than browser's native `DecompressionStream`
- Handles multiple compression formats (zlib, deflate-raw)
- Prevents "invalid stored block lengths" errors

**GitHub Actions Auto-Update:**
- Runs daily at 3 AM UTC
- Fetches fresh stats from PoE API
- Commits changes automatically
- Vercel auto-deploys the update

---

## 📖 Usage Guide

### Step 1: Select Game & League
Choose between PoE1 or PoE2, then select your league from the dropdown.

### Step 2: Input Your Build
Paste either:
- Raw PoB code (base64 string)
- pobb.in URL

### Step 3: Analyze
Click "Analyze Build" and wait for parsing to complete.

### Step 4: Search for Items
For each item:
- **Edit Filters** - Customize which mods to include in search
- **Copy URL** - Save the trade search URL
- **Search in Trade** - Open the official trade site with your filters

### Tips for Better Results
- Start with all mods enabled, then disable some if you get zero results
- Widen min/max value ranges for more results
- Try switching between "Instant Buyout" and "Any"
- Some implicit mods may not be searchable (this is normal)

---

## 🔐 Security & Performance

### Implemented Security Measures
- ✅ CORS protection with allowed origins
- ✅ Input validation and sanitization
- ✅ Request timeouts (10s serverless limit)
- ✅ XSS prevention
- ✅ Error sanitization (no stack traces to client)
- ✅ Safe localStorage usage with expiry

### Performance Optimizations
- Multi-layer caching system
- Promise.allSettled for resilient API calls
- Optimized static JSON fallback (2.7MB compressed)
- Lazy loading and code splitting

---

## 🧩 API Documentation

### GET `/api/stats`
Fetch PoE trade stats for mod searching.

**Query Parameters:**
- `realm` - `poe1` or `poe2`

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

### GET `/api/leagues`
Get active leagues for the specified game.

**Query Parameters:**
- `game` - `poe1` or `poe2`

**Response:**
```json
{
  "result": [
    {"id": "Fate of the Vaal", "realm": "poe2", ...}
  ]
}
```

### GET `/api/poe2scout/currency`
Fetch currency prices from poe2scout.

**Query Parameters:**
- `league` - League name (URL-encoded)
- `game` - `poe1` or `poe2`

### GET `/api/pob/fetch`
Fetch PoB XML from pobb.in URL.

**Query Parameters:**
- `url` - pobb.in URL

---

## 🐛 Troubleshooting

### PoB Code Not Working
- Try using a pobb.in URL instead of raw code
- Ensure you copied the entire code without truncation
- Some ancient PoB codes may use unsupported compression

### No Search Results
- Disable some mods in "Edit Filters"
- Widen min/max value ranges
- Lower minimum item level
- Try "Any" instead of "Instant Buyout"

### Currency Panel Shows Errors
- This is usually temporary - poe2scout/poe.ninja may be down
- Refresh the page after a few minutes
- The app will continue working for item searches

### Trade Links Not Personalized
- This means stats API couldn't find those specific mods
- The link will still work, just with fewer filters
- 3-7 mod filters per item is normal and sufficient

---

## 📊 Project Statistics

- **Version:** 2.1.0
- **Total Lines of Code:** ~5,000
- **Serverless Functions:** 6
- **Static Fallback Size:** 2.7MB (poe2-stats.json)
- **Average Item Parse Time:** 1-2 seconds
- **Average Trade Link Generation:** 500ms per item

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 Version History

### v2.1.0 (2026-01-13)
- ✅ Fixed GitHub Actions permissions for auto-updates
- ✅ Verified complete functionality in production
- 📚 Comprehensive documentation overhaul

### v2.0.0 (2026-01-12)
- ✨ Migrated to Vercel Serverless Functions
- ✨ Added static JSON fallback for stats API
- ✨ Implemented multi-layer caching system
- ✨ Fixed PoB decompression with pako.js
- ✨ Added GitHub Actions for daily stats updates
- 🔒 Security hardening (CORS, validation, timeouts)

### v1.0.0 (Initial Release)
- Basic PoB parsing and trade link generation
- Express backend with proxy server
- React frontend with Tailwind CSS

---

## 📜 License

This project is fan-made and not affiliated with Grinding Gear Games.

---

## 🔗 Links

- [Live App](https://poe-build-analyzer.vercel.app)
- [GitHub Repository](https://github.com/mariocere17/POE-BUILD-ANALYZER)
- [Path of Exile Official](https://www.pathofexile.com/)
- [PoE Trade](https://www.pathofexile.com/trade)
- [Path of Building](https://pathofbuilding.community/)
- [pobb.in](https://pobb.in/)
- [poe2scout](https://poe2scout.com/)
- [poe.ninja](https://poe.ninja/)

---

## 💖 Support

If you find this tool useful, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs via GitHub Issues
- 💡 Suggesting features or improvements
- 📢 Sharing with your PoE community

---

## 🙏 Acknowledgments

- **Grinding Gear Games** - for creating Path of Exile
- **Path of Building Community** - for the amazing build planner
- **pobb.in** - for PoB code hosting
- **poe2scout & poe.ninja** - for economy data APIs
- **Vercel** - for free serverless hosting

---

**Made with ❤️ for the Path of Exile community**
