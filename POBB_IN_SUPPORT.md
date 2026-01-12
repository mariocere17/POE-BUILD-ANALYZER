# pobb.in URL Support Guide

## Overview

Starting from version 1.7.0, PoE Build Analyzer now supports **pobb.in URLs** in addition to raw PoB codes. This means you can paste a pobb.in link directly into the application without manually copying the code.

## Supported Formats

### ✅ Raw PoB Code (Base64)
```
eNrtXW1z27gR_u7...(long base64 string)
```

### ✅ pobb.in Standard URL
```
https://pobb.in/VVZy6u-NrRUi
```

### ✅ pobb.in User Build URL
```
https://pobb.in/u/username/buildid
```

### ❌ poe.ninja Build URLs (Not Supported)
```
https://poe.ninja/poe2/pob/16e00
```

**Why?** poe.ninja builds use external pastebins that vary by build. You need to visit the poe.ninja page and click "Import in PoB" to get the actual code.

## How It Works

### Backend (Proxy Server)

A new endpoint `/api/pob/fetch` has been added to the proxy server:

```javascript
GET http://localhost:3001/api/pob/fetch?url=https://pobb.in/VVZy6u-NrRUi
```

**Response:**
```json
{
  "success": true,
  "code": "eNrtXW1z27gR...",
  "source": "https://pobb.in/VVZy6u-NrRUi"
}
```

### Frontend (pobParser.js)

The parser now includes automatic URL detection:

1. **URL Detection**: Checks if input contains `pobb.in`
2. **Fetch Request**: Calls the proxy endpoint to get the raw code
3. **Parsing**: Continues with normal PoB parsing logic

## Usage Instructions

### For Users

1. Get a pobb.in URL from anywhere (Discord, Reddit, forums, etc.)
2. Paste it directly into the "PoB Code or URL" textarea
3. Click "Analyze Build"
4. The app will automatically fetch and parse the build

### Example Workflow

```
User Input: https://pobb.in/VVZy6u-NrRUi
     ↓
Frontend detects URL
     ↓
Proxy fetches raw code from https://pobb.in/VVZy6u-NrRUi/raw
     ↓
Parser processes the base64 code
     ↓
Items displayed to user
```

## Testing

A test script is included to validate the functionality:

```bash
node test-pobb-in.js
```

**Expected Output:**
```
============================================================
Testing pobb.in support
============================================================
🧪 Testing fetch from: https://pobb.in/VVZy6u-NrRUi/raw
   Status: 200
✅ Success! Code length: 16248
============================================================
✅ TEST PASSED: Successfully fetched PoB code from pobb.in
============================================================
```

## API Documentation

### Endpoint: `/api/pob/fetch`

**Method:** `GET`

**Query Parameters:**
- `url` (required): The pobb.in URL to fetch

**Success Response (200):**
```json
{
  "success": true,
  "code": "eNrtXW1z27gR...",
  "source": "https://pobb.in/VVZy6u-NrRUi"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid pobb.in URL format"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to fetch PoB code",
  "details": "Timeout"
}
```

## Technical Details

### URL Pattern Matching

The following regex is used to extract the build ID:

```javascript
/pobb\.in\/(?:u\/[^/]+\/)?([A-Za-z0-9_-]+)/
```

This matches:
- `pobb.in/VVZy6u-NrRUi` → `VVZy6u-NrRUi`
- `pobb.in/u/username/buildid` → `buildid`

### pobb.in Raw Endpoint

pobb.in provides a `/raw` endpoint that returns the base64-encoded PoB code:

```
https://pobb.in/{buildId}/raw
```

This endpoint:
- Returns `Content-Type: text/plain`
- Supports Brotli compression
- Includes cache headers (`s-max-age=31536000`)
- Requires a `User-Agent` header (recommended to include contact info)

### Error Handling

The implementation handles multiple error scenarios:

1. **Invalid URL format**: Returns clear error message
2. **Network timeout**: 10-second timeout with descriptive error
3. **HTTP errors**: Captures status codes and provides details
4. **Compression errors**: Handles gzip, deflate, and brotli
5. **poe.ninja URLs**: Provides specific instructions for unsupported format

## Files Modified

| File | Changes |
|------|---------|
| `proxy-server.js` | Added `/api/pob/fetch` endpoint (lines 956-1052) |
| `src/services/pobParser.js` | Added URL detection and fetching logic (lines 3-60) |
| `src/components/BuildAnalyzer/BuildForm.jsx` | Updated label and placeholder (lines 78-86) |
| `DOCUMENTACION_PROYECTO.md` | Added v1.7.0 changelog |
| `package.json` | Updated version to 1.7.0 |

## Troubleshooting

### Issue: "Failed to fetch from pobb.in"

**Possible causes:**
1. Network connectivity issues
2. pobb.in is down
3. Invalid build ID

**Solution:** Try the URL in a browser first to verify it's accessible.

### Issue: "Could not fetch build from URL"

**Possible causes:**
1. Proxy server not running
2. CORS issues
3. Timeout

**Solution:** Ensure proxy server is running on port 3001.

### Issue: poe.ninja URLs don't work

**Expected behavior:** This is intentional. poe.ninja uses external pastebins.

**Solution:** Visit the poe.ninja page, click "Import in PoB", copy the code.

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for pastebin.com URLs
- [ ] Support for poe.ninja URLs (requires scraping)
- [ ] Caching of fetched codes
- [ ] Offline mode with localStorage
- [ ] Progress indicator for URL fetching
- [ ] Automatic retry on network errors

## References

- **pobb.in GitHub**: https://github.com/Dav1dde/pasteofexile
- **pobb.in Website**: https://pobb.in/
- **pobb.in API**: Uses `/{id}/raw` endpoint for retrieving builds

## Version History

- **v1.7.0** (January 2026): Initial pobb.in URL support
- **v1.6.0** (January 2026): Currency panel rotation system
- **v1.5.0** (January 2026): Local currency icons and English translation

---

**Last Updated**: January 2026
**Version**: 1.7.0
