# PoE Build Analyzer

Automates item searches from your Path of Building builds. Paste your PoB code or pobb.in URL, and instantly generate trade searches for all your items with customizable filters.

## Features

- 🎮 **Dual Game Support**: Works with both Path of Exile 1 and Path of Exile 2
- 📋 **Multiple Input Formats**: Accepts raw PoB codes and pobb.in URLs
- 🔍 **Smart Item Parsing**: Extracts all items with mods, enchants, and stats
- 🛠️ **Customizable Filters**: Edit search parameters for each item
- 💱 **Real-time Currency Prices**: Live economy data from poe2scout and poe.ninja
- 🔗 **Direct Trade Integration**: Generate and open official trade site searches
- 🔒 **Security Hardened**: Rate limiting, input validation, and XSS prevention

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-repo/poe-build-analyzer.git
cd poe-build-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment (optional for development):
```bash
cp .env.example .env
# Edit .env if needed
```

### Running Locally

1. Start the proxy server (in one terminal):
```bash
node proxy-server.js
```

2. Start the React app (in another terminal):
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Step 1: Get Your Build Code

**From Path of Building:**
- Click "Import/Export Build"
- Click "Generate"
- Copy the code

**From pobb.in:**
- Copy the URL (e.g., `https://pobb.in/VVZy6u-NrRUi`)

### Step 2: Analyze Your Build

1. Select your game (PoE1 or PoE2)
2. Select your league
3. Paste the PoB code or URL
4. Click "Analyze Build"

### Step 3: Search for Items

- **Edit Filters**: Customize which mods to search for
- **Copy URL**: Save search URLs for later
- **Search in Trade**: Open searches in the official trade site

## Deployment

### Deploy to Vercel (Recommended) ⚡

The backend has been refactored to **Vercel Serverless Functions**. Deploy everything in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/poe-build-analyzer)

**Or manually:**
```bash
npm install -g vercel
vercel --prod
```

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for complete Vercel deployment guide.

### Other Deployment Options

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- VPS deployment (DigitalOcean, Linode, etc.)
- Split architecture (Frontend on Vercel + Backend on Railway)
- Docker deployment

## Security

This application implements several security measures:

- ✅ CORS protection
- ✅ Rate limiting (100 req/min per IP)
- ✅ Input validation
- ✅ Request timeouts
- ✅ XSS prevention
- ✅ Error sanitization

See [SECURITY.md](SECURITY.md) for complete security documentation.

## Available Scripts

### `npm start`

Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes. You may also see any lint errors in the console.

### `npm test`

Launches the test runner in interactive watch mode. See [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes. Your app is ready to be deployed!

## Troubleshooting

### CORS Errors

Verify your `.env` file has the correct `FRONTEND_URL`.

### Build Not Working

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Timeouts

The proxy server may be down. Check:
```bash
# Check if running
ps aux | grep node

# Check logs if using PM2
pm2 logs poe-analyzer
```

## FAQ

**Q: What formats does the app accept?**
- Raw PoB codes (base64)
- pobb.in URLs
- ❌ poe.ninja URLs (not supported - copy the code from the page instead)

**Q: Why are my searches returning no results?**
- Try disabling some mods in "Edit Filters"
- Widen min/max value ranges
- Lower minimum item level
- Switch from "Instant Buyout" to "Any"

**Q: How often do currency prices update?**
- Real-time on page load
- PoE2: Official GGG data via poe2scout
- PoE1: Community data via poe.ninja

## Technology Stack

- **Frontend**: React 19, Tailwind CSS 4
- **Backend**: Node.js, Express
- **Build Tool**: Create React App
- **Icons**: Lucide React

## Version History

- **v2.0.0** (2026-01-12)
  - ✨ Migrated to Vercel Serverless Functions
  - ✨ One-click deployment to Vercel
  - ✨ No separate backend needed
  - ✨ All APIs as serverless functions
  - 📚 Complete deployment documentation

- **v1.8.0** (2026-01-12)
  - Security hardening (CORS, rate limiting, validation)
  - Configurable API URLs for deployment
  - Production-ready error handling
  - Comprehensive documentation
  - Request timeouts and XSS prevention

## License

This project is fan-made and not affiliated with Grinding Gear Games in any way.

## Links

- [Path of Exile Official](https://www.pathofexile.com/)
- [PoE Trade](https://www.pathofexile.com/trade)
- [poe2scout](https://poe2scout.com/)
- [poe.ninja](https://poe.ninja/)
- [Path of Building](https://pathofbuilding.community/)
- [pobb.in](https://pobb.in/)

## Support

For bugs, feature requests, or questions:
- GitHub Issues: Create an issue
- Security Issues: See [SECURITY.md](SECURITY.md)

---

Made with ❤️ for the Path of Exile community

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
