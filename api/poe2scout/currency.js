const https = require('https');
const zlib = require('zlib');
const { setCorsHeaders, isValidLeague, isValidGame, safeDecompress, createErrorResponse } = require('../utils/security');

// Función para seguir redirects manualmente (para poe.ninja)
const fetchWithRedirect = (targetUrl, maxRedirects = 5) => {
  return new Promise((resolve, reject) => {
    const makeRequest = (currentUrl, redirectCount) => {
      if (redirectCount > maxRedirects) {
        return reject(new Error('Too many redirects'));
      }

      https.get(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume();
          const redirectUrl = new URL(response.headers.location, currentUrl).href;
          return makeRequest(redirectUrl, redirectCount + 1);
        }

        if (response.statusCode !== 200) {
          response.resume();
          return reject(new Error(`HTTP ${response.statusCode}`));
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve({ response, buffer: Buffer.concat(chunks) }));
      }).on('error', reject);
    };

    makeRequest(targetUrl, 0);
  });
};

module.exports = async (req, res) => {
  // CORS headers with whitelist
  setCorsHeaders(req, res, ['GET']);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const league = req.query.league || 'Fate of the Vaal';
  const game = req.query.game || 'poe2';

  // Validate parameters
  if (!isValidGame(game)) {
    return res.status(400).json({ error: 'Invalid game parameter' });
  }

  if (!isValidLeague(league, game)) {
    return res.status(400).json({ error: 'Invalid league parameter' });
  }

  // Para PoE1, usar poe.ninja
  if (game === 'poe1') {
    // poe.ninja usa nombres cortos para las ligas de PoE1
    // Mapear nombres completos a nombres cortos
    const POE1_LEAGUE_MAPPING = {
      'Keepers of the Flame': 'Keepers',
      'Hardcore Keepers of the Flame': 'Hardcore Keepers',
      // Agregar más mapeos según sea necesario
    };

    const ninjaLeague = POE1_LEAGUE_MAPPING[league] || league;
    const poeNinjaUrl = `https://poe.ninja/poe1/api/economy/stash/current/currency/overview?league=${encodeURIComponent(ninjaLeague)}&type=Currency`;

    try {
      const { response, buffer } = await fetchWithRedirect(poeNinjaUrl);

      // Safe decompression with size limits
      const encoding = response.headers['content-encoding'];
      const data = safeDecompress(buffer, encoding, zlib);

      const json = JSON.parse(data);

      // Transformar poe.ninja al formato de poe2scout para compatibilidad
      const transformedData = {
        items: json.lines.map(line => ({
          text: line.currencyTypeName,
          currentPrice: line.chaosEquivalent,
          iconUrl: line.icon || null,
          priceLogs: []
        }))
      };

      return res.status(200).json(transformedData);
    } catch (error) {
      return res.status(500).json(createErrorResponse('Failed to fetch poe.ninja data', error));
    }
  }

  // Para PoE2, usar poe2scout directamente
  const url = `https://poe2scout.com/api/items/currency/currency?league=${encodeURIComponent(league)}&perPage=50`;

  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

      https.get(url, {
        headers: {
          'User-Agent': 'PoE-Build-Analyzer/1.0',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      }, (response) => {
        clearTimeout(timeout);

        if (response.statusCode !== 200) {
          response.resume();
          return reject(new Error(`HTTP ${response.statusCode}`));
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve({ response, buffer: Buffer.concat(chunks) }));
      }).on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    const { buffer } = response;

    // Safe decompression with size limits
    const encoding = response.response.headers['content-encoding'];
    const data = safeDecompress(buffer, encoding, zlib);

    const json = JSON.parse(data);
    res.status(200).json(json);
  } catch (error) {
    res.status(500).json(createErrorResponse('Failed to fetch poe2scout data', error));
  }
};
