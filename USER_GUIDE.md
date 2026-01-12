# PoE Build Analyzer - User Guide

Welcome to PoE Build Analyzer! This tool helps you quickly search for items from your Path of Building builds on the Path of Exile trade market.

---

## 🚀 Quick Start

### 1. Get Your Build Code
You have two options:

**Option A: From Path of Building**
1. Open Path of Building
2. Click "Import/Export Build"
3. Click "Generate" to create a code
4. Copy the code

**Option B: From pobb.in**
1. Get a pobb.in link (e.g., `https://pobb.in/VVZy6u-NrRUi`)
2. Copy the entire URL

### 2. Analyze Your Build
1. Select your **game** (Path of Exile 2 or Path of Exile 1)
2. Select your **league** (automatically loads available leagues)
3. Paste your code or URL in the text box
4. Click **"Analyze Build"**

### 3. View Your Items
After analysis, you'll see all items from your build with:
- Item name and type
- Rarity (color-coded)
- Item level (iLvl)
- Required level
- Mods (implicit, explicit, enchants)
- Number of sockets

---

## 🔍 Main Features

### **Search for Items on Trade**

For each item, you have three options:

1. **📝 Edit Filters**
   - Click "Edit filters" to customize your search
   - Enable/disable specific mods
   - Set minimum and maximum values for mods
   - Adjust item level requirements
   - Change rarity filters

2. **📋 Copy URL**
   - Click "Copy URL" to copy the trade search link
   - Paste it anywhere (Discord, browser, notepad)
   - Share it with friends

3. **🔗 Search in Trade**
   - Click "Search in Trade" to open the search directly in your browser
   - View results immediately on the official PoE trade site

### **Seller Status Filter**

At the top of the items list, you can choose:
- **Any**: Show all listings (offline and online sellers)
- **Instant Buyout**: Show only online sellers for instant trading

### **Economy Status Panel**

On the left side, you'll see real-time currency prices:
- Mirror of Kalandra value
- Divine Orb to Chaos Orb ratio
- Exalted Orb prices
- And more currency pairs

**Note:** The panel automatically rotates through currencies if there are more than 5. Hover over it to pause the rotation.

---

## ❓ Frequently Asked Questions

### **What formats does the app accept?**
- ✅ Raw PoB codes (base64): `eNrtXW1z27gR...`
- ✅ pobb.in URLs: `https://pobb.in/VVZy6u-NrRUi`
- ✅ pobb.in user URLs: `https://pobb.in/u/username/buildid`
- ❌ poe.ninja URLs: Not supported (copy the code from the page instead)

### **Why don't poe.ninja URLs work?**
poe.ninja builds use external pastebin services that vary by build. To use a poe.ninja build:
1. Visit the poe.ninja page
2. Click "Import in PoB" or find the PoB code
3. Copy the code
4. Paste it in the app

### **What does "Edit filters" do?**
The Edit modal allows you to:
- **Select which mods to search for**: Uncheck mods you don't care about
- **Set value ranges**: If an item has "+50% Fire Resistance", you can search for items with 40-60%
- **Adjust item level**: Set minimum iLvl for your search
- **Change rarity**: Search for the same base with different rarity

### **Why are some mods not included in the search?**
By default:
- **Enchants are disabled** (usually very specific and rare)
- **Implicits are enabled** (important for most items)
- **Explicits are enabled** (the main mods you want)

You can change this in the Edit modal.

### **What's the difference between "Any" and "Instant Buyout"?**
- **Any**: Shows all items, including those from offline players
- **Instant Buyout**: Only shows items from online players you can buy immediately

Tip: Use "Any" to see price ranges, use "Instant Buyout" when you're ready to buy.

### **How do I search for unique items?**
Unique items are automatically detected and the search will include:
- The exact unique name
- The base type
- Selected mods

This ensures you get the specific unique item you want.

### **Can I search for jewels?**
Yes! Jewels are specially handled to give better results. The app searches by mods only, without restricting the base type.

### **What if I get "No items found" on the trade site?**
This can happen if:
- The item is very rare or expensive
- Your mod filters are too strict
- The league is not very active

Solutions:
1. Click "Edit filters" and disable some mods
2. Widen the min/max value ranges
3. Lower the minimum item level
4. Try "Any" instead of "Instant Buyout"

### **Do I need to run anything locally?**
Yes, the app requires:
1. **Proxy server** running on port 3001 (`node proxy-server.js`)
2. **React app** running on port 3000 (`npm start`)

Both must be running for full functionality.

### **How often do currency prices update?**
Currency prices are fetched in real-time when you load the page. They come from:
- **PoE2**: poe2scout.com (official GGG data)
- **PoE1**: poe.ninja (community data)

### **Can I use this for both PoE1 and PoE2?**
Yes! The app fully supports both games. Just select the correct game at the top of the form.

### **Are league names updated automatically?**
Yes! The app fetches active leagues from:
- **PoE2**: poe2scout API
- **PoE1**: Official PoE Trade API

If the API is unavailable, it falls back to hardcoded league names.

### **Is my build data stored anywhere?**
No! All processing happens in your browser. Your build codes are not sent to any server except:
- The official PoE API (for stats)
- pobb.in (if you use a pobb.in URL)
- poe2scout/poe.ninja (for currency prices)

---

## 💡 Pro Tips

### **Tip 1: Start Broad, Then Narrow**
When searching for rare items:
1. First, disable most explicit mods (keep only 1-2 important ones)
2. Check the price range on trade
3. Go back and enable more mods if needed
4. Adjust value ranges to match your budget

### **Tip 2: Use the Copy URL Feature**
If you're shopping for multiple items:
1. Copy URLs for all items you want
2. Paste them in a notepad
3. Compare prices across different items
4. Buy the best value items first

### **Tip 3: Check Both Online and Offline**
For expensive items:
1. First search with "Any" to see the full price range
2. Check what offline sellers are listing at
3. Switch to "Instant Buyout" to buy immediately
4. Decide if paying a premium for instant buyout is worth it

### **Tip 4: Adjust Values for Budget Builds**
If a build requires "+100% increased Life":
1. Click "Edit filters"
2. Change the min value to 80% or 70%
3. Find cheaper alternatives that are "good enough"
4. Upgrade later when you have more currency

### **Tip 5: Use the Currency Panel**
Before buying:
1. Check the Divine to Chaos ratio
2. Calculate if paying in Divines or Chaos is better
3. Look at the seller's preferred currency
4. Convert prices mentally using the panel

---

## 🔧 Troubleshooting

### **"Failed to fetch stats"**
- Make sure the proxy server is running (`node proxy-server.js`)
- Check that port 3001 is not blocked
- Try restarting the proxy server

### **"Invalid PoB code"**
- Make sure you copied the entire code
- Check that you're not pasting a URL from pastebin
- Try generating a new code in Path of Building

### **"Could not fetch build from URL"**
- Check your internet connection
- Verify the pobb.in URL is correct
- Make sure the proxy server is running
- Try copying the raw code from pobb.in manually

### **Currency panel shows "API unavailable"**
- This is normal if poe2scout or poe.ninja is down
- You can still search for items
- Prices will return when the API is back online

### **Items have wrong mods or missing data**
- This is a Path of Building issue, not the app
- Re-import your character in PoB
- Manually check the item text in PoB
- Generate a new code

---

## 📚 Additional Resources

### **Official Sites**
- [Path of Exile Official](https://www.pathofexile.com/)
- [Path of Exile 2 Official](https://www.pathofexile2.com/)
- [PoE Trade](https://www.pathofexile.com/trade)

### **Community Tools**
- [poe2scout](https://poe2scout.com/) - PoE2 economy tracker
- [poe.ninja](https://poe.ninja/) - PoE1 economy tracker
- [Path of Building](https://pathofbuilding.community/) - Build planner
- [pobb.in](https://pobb.in/) - Build sharing platform

### **Resources**
- [PoE Wiki](https://www.poewiki.net/) - Game information
- [PoEDB](https://poedb.tw/) - Database and API docs

---

## 🆘 Need More Help?

If you encounter issues not covered in this guide:
1. Check the [Technical Documentation](DOCUMENTACION_PROYECTO.md) for developers
2. Review the [pobb.in Support Guide](POBB_IN_SUPPORT.md) for URL issues
3. Report bugs on GitHub (if available)

---

**Last Updated**: January 2026
**Version**: 1.7.0

Enjoy using PoE Build Analyzer and happy trading, Exile! 🎮
