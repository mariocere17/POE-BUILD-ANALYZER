/**
 * Security utilities for API endpoints
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://poe-build-analyzer.vercel.app',
  // Add production domain variations
  /^https:\/\/poe-build-analyzer.*\.vercel\.app$/,
];

// Valid leagues whitelist
const VALID_LEAGUES = {
  poe2: [
    'Fate of the Vaal',
    'HC Fate of the Vaal',
    'Standard',
    'Hardcore',
    // Previous leagues (for historical data)
    'Dawn of the Hunt',
    'HC Dawn of the Hunt',
    'Rise of the Abyssal',
    'HC Rise of the Abyssal',
  ],
  poe1: [
    'Keepers of the Flame',
    'Hardcore Keepers of the Flame',
    'Standard',
    'Hardcore',
    // Previous leagues
    'Settlers of Kalguur',
    'Hardcore Settlers of Kalguur',
    'Necropolis',
    'Hardcore Necropolis',
  ],
};

// Maximum sizes for decompression (prevent zip bombs)
const MAX_COMPRESSED_SIZE = 10 * 1024 * 1024;   // 10MB compressed input
const MAX_DECOMPRESSED_SIZE = 50 * 1024 * 1024; // 50MB decompressed output

/**
 * Check if origin is allowed for CORS
 * @param {string} origin - The request origin
 * @returns {string|null} - The allowed origin or null
 */
function getAllowedOrigin(origin) {
  if (!origin) return null;

  for (const allowed of ALLOWED_ORIGINS) {
    if (typeof allowed === 'string') {
      if (origin === allowed) return origin;
    } else if (allowed instanceof RegExp) {
      if (allowed.test(origin)) return origin;
    }
  }

  return null;
}

/**
 * Set CORS headers with whitelist validation
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {string[]} methods - Allowed HTTP methods
 */
function setCorsHeaders(req, res, methods = ['GET']) {
  const origin = req.headers.origin;
  const allowedOrigin = getAllowedOrigin(origin);

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Validate league parameter against whitelist
 * @param {string} league - League name to validate
 * @param {string} game - Game type ('poe1' or 'poe2')
 * @returns {boolean} - Whether the league is valid
 */
function isValidLeague(league, game = 'poe2') {
  if (!league || typeof league !== 'string') return false;

  const validList = VALID_LEAGUES[game] || VALID_LEAGUES.poe2;

  // Check exact match
  if (validList.includes(league)) return true;

  // Check case-insensitive match
  const lowerLeague = league.toLowerCase();
  return validList.some(valid => valid.toLowerCase() === lowerLeague);
}

/**
 * Validate game parameter
 * @param {string} game - Game type to validate
 * @returns {boolean} - Whether the game is valid
 */
function isValidGame(game) {
  return ['poe1', 'poe2'].includes(game);
}

/**
 * Validate realm parameter
 * @param {string} realm - Realm to validate
 * @returns {boolean} - Whether the realm is valid
 */
function isValidRealm(realm) {
  return ['poe1', 'poe2', 'pc'].includes(realm);
}

/**
 * Get client IP with Vercel priority
 * @param {object} req - Request object
 * @returns {string} - Client IP address
 */
function getClientIp(req) {
  // Vercel's verified IP header (most trustworthy)
  const vercelIp = req.headers['x-vercel-forwarded-for'];
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }

  // Standard forwarded header (less trustworthy but fallback)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Real IP header
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

/**
 * Create a safe error response (hides details in production)
 * @param {string} message - Public error message
 * @param {Error|string} error - The actual error (hidden in production)
 * @returns {object} - Error response object
 */
function createErrorResponse(message, error = null) {
  const isProduction = process.env.NODE_ENV === 'production' ||
                       process.env.VERCEL_ENV === 'production';

  const response = { error: message };

  if (!isProduction && error) {
    response.details = error instanceof Error ? error.message : error;
  }

  return response;
}

/**
 * Validate buffer size before decompression
 * @param {Buffer} buffer - The buffer to check
 * @returns {boolean} - Whether the buffer is within limits
 */
function isBufferSizeSafe(buffer) {
  return buffer.length <= MAX_COMPRESSED_SIZE;
}

/**
 * Validate decompressed data size
 * @param {string|Buffer} data - The decompressed data
 * @returns {boolean} - Whether the data is within limits
 */
function isDecompressedSizeSafe(data) {
  const size = typeof data === 'string' ? Buffer.byteLength(data) : data.length;
  return size <= MAX_DECOMPRESSED_SIZE;
}

/**
 * Safe decompression with size limits
 * @param {Buffer} buffer - Compressed buffer
 * @param {string} encoding - Content encoding (gzip, deflate, br)
 * @param {object} zlib - Node.js zlib module
 * @returns {string} - Decompressed string
 * @throws {Error} - If size limits exceeded
 */
function safeDecompress(buffer, encoding, zlib) {
  if (!isBufferSizeSafe(buffer)) {
    throw new Error('Compressed data exceeds size limit');
  }

  let data;

  if (encoding === 'gzip') {
    data = zlib.gunzipSync(buffer).toString();
  } else if (encoding === 'deflate') {
    data = zlib.inflateSync(buffer).toString();
  } else if (encoding === 'br') {
    data = zlib.brotliDecompressSync(buffer).toString();
  } else {
    data = buffer.toString();
  }

  if (!isDecompressedSizeSafe(data)) {
    throw new Error('Decompressed data exceeds size limit');
  }

  return data;
}

/**
 * Validate image magic bytes
 * @param {Buffer} buffer - File buffer
 * @returns {boolean} - Whether the file is a valid image
 */
function isValidImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 4) return false;

  // PNG: 89 50 4E 47
  const png = [0x89, 0x50, 0x4E, 0x47];
  if (buffer[0] === png[0] && buffer[1] === png[1] &&
      buffer[2] === png[2] && buffer[3] === png[3]) {
    return true;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 &&
      buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }

  // WebP: RIFF....WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 &&
      buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length >= 12 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 &&
      buffer[10] === 0x42 && buffer[11] === 0x50) {
    return true;
  }

  return false;
}

module.exports = {
  ALLOWED_ORIGINS,
  VALID_LEAGUES,
  MAX_COMPRESSED_SIZE,
  MAX_DECOMPRESSED_SIZE,
  getAllowedOrigin,
  setCorsHeaders,
  isValidLeague,
  isValidGame,
  isValidRealm,
  getClientIp,
  createErrorResponse,
  isBufferSizeSafe,
  isDecompressedSizeSafe,
  safeDecompress,
  isValidImageMagicBytes,
};
