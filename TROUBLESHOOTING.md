# 🔧 Troubleshooting Guide

Quick solutions to common issues with PoE Build Analyzer.

---

## 🚨 Common Issues

### PoB Parsing Fails

**Symptom:**
```
Error: Failed to decompress PoB code
Uncaught TypeError: The compressed data was not valid
```

**Solutions:**
1. ✅ Try using a pobb.in URL instead of raw code
2. ✅ Ensure you copied the **entire** code without truncation
3. ✅ Verify the code is from recent Path of Building version
4. ✅ Some ancient PoB codes may use unsupported compression formats

**Fixed in v2.0.0:** Integrated pako.js for robust decompression

---

### Trade Links Have No Mods

**Symptom:**
Trade links open but don't have specific mod filters applied.

**Cause:**
Stats API couldn't find stat IDs for those specific mods in PoE database.

**This is NORMAL:**
- Not all mods are indexed in PoE trade API
- 3-7 mod filters per item is typical and sufficient
- Implicit mods often aren't searchable
- The links still work, just with fewer filters

**Solutions:**
- None needed - this is expected behavior
- Edit filters manually on the trade site if needed

---

### Currency Panel Shows Errors

**Symptom:**
```
Failed to load resource: 500
API unavailable - showing placeholder
```

**Causes:**
1. poe2scout or poe.ninja API is temporarily down
2. Invalid league name
3. Network connectivity issues

**Solutions:**
1. ✅ Wait a few minutes and refresh the page
2. ✅ Check if the selected league is still active
3. ✅ The rest of the app will continue working

---

### No Search Results on Trade Site

**Symptom:**
Trade search returns "No results found"

**Solutions:**
1. **Disable some mods** - Use "Edit Filters" to reduce requirements
2. **Widen ranges** - Increase min/max value ranges
3. **Lower item level** - Set minimum ilvl to 0
4. **Change buyout type** - Switch from "Instant Buyout" to "Any"
5. **Remove implicit mods** - They're often not searchable

---

### GitHub Actions Workflow Fails

**Symptom:**
```
remote: Write access to repository not granted.
fatal: The requested URL returned error: 403
```

**Solution:**
Add permissions to `.github/workflows/update-stats.yml`:

```yaml
permissions:
  contents: write  # Allows push to repository
```

**Fixed in v2.1.0**

---

### Stats API Returns 403 Forbidden

**Symptom:**
Stats API calls fail from Vercel deployment.

**Cause:**
PoE API blocks some cloud provider IPs (including Vercel).

**Solution:**
Multi-layer fallback system (already implemented):
1. Try serverless proxy
2. Try direct API call
3. Use static JSON fallback (`public/data/poe2-stats.json`)

**This is handled automatically** - no action needed.

---

### Vercel Function Timeout

**Symptom:**
```
Function execution timed out (10s limit exceeded)
```

**Causes:**
- External API (poe2scout, poe.ninja) is slow
- Network latency issues

**Solutions:**
1. **Free tier limitation** - 10 second timeout
2. **Upgrade to Vercel Pro** - 60 second timeout ($20/month)
3. **Optimize requests** - Already using Promise.allSettled
4. **Wait and retry** - Usually temporary

---

## 🐛 Debugging Tools

### Check Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Click "Deployments" → Select latest deployment
4. Click "Functions" tab
5. View logs for each serverless function

### Test APIs Directly

```bash
# Test stats API
curl "https://your-app.vercel.app/api/stats?realm=poe2"

# Test leagues API
curl "https://your-app.vercel.app/api/leagues?game=poe2"

# Test PoB fetch
curl "https://your-app.vercel.app/api/pob/fetch?url=https://pobb.in/TEST_ID"

# Test currency API
curl "https://your-app.vercel.app/api/poe2scout/currency?league=Fate%20of%20the%20Vaal&game=poe2"
```

### Check Browser Console

Open Developer Tools (F12) and check the Console tab for errors:
- Red errors indicate JavaScript issues
- Network tab shows failed API requests
- Application tab shows localStorage data

---

## 🔍 Local Development Issues

### Port Already in Use

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Kill the process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Mac/Linux
```

### Module Not Found

**Symptom:**
```
Error: Cannot find module 'X'
```

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Build Fails

**Symptom:**
```
Failed to compile
```

**Solutions:**
```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
npm run build

# If still fails, clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📊 Performance Issues

### Slow PoB Parsing

**Normal:** 1-2 seconds for average build
**Slow:** 5+ seconds

**Causes:**
- Very large builds (100+ items)
- Slow network (fetching from pobb.in)
- Browser performance

**Solutions:**
- Use raw PoB code instead of pobb.in URL (faster)
- Close other browser tabs
- Try a different browser

### High Memory Usage

**Cause:**
Large stats JSON (2.7MB) cached in localStorage

**Solution:**
This is normal and intentional - enables offline functionality.

---

## 🆘 Still Having Issues?

### Before Reporting:

1. ✅ Check this troubleshooting guide
2. ✅ Verify you're using latest version
3. ✅ Clear browser cache and localStorage
4. ✅ Try in incognito/private mode
5. ✅ Test in a different browser

### Report a Bug:

1. Go to [GitHub Issues](https://github.com/mariocere17/POE-BUILD-ANALYZER/issues)
2. Search existing issues first
3. Create new issue with:
   - Clear description of problem
   - Steps to reproduce
   - Browser and OS version
   - Screenshots if applicable
   - Console error messages

### Get Help:

- **GitHub Issues:** For bugs and feature requests
- **Vercel Logs:** For deployment issues
- **PoE Community:** For game-related questions

---

## 📝 Known Limitations

These are **not bugs**, just limitations of the current implementation:

1. **Some mods not searchable** - PoE API doesn't index all mods
2. **10s timeout on free tier** - Vercel free tier limitation
3. **Stats update daily, not real-time** - Prevents rate limiting
4. **No PoE1 support yet** - Focus is on PoE2
5. **Requires modern browser** - Uses ES6+ features

---

**Last Updated:** 2026-01-13
**Version:** 2.1.0
