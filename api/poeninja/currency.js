const https = require('https');
const zlib = require('zlib');

// Función para seguir redirects manualmente
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
        // Si es un redirect (301, 302, 303, 307, 308)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume();
          const redirectUrl = new URL(response.headers.location, currentUrl).href;
          return makeRequest(redirectUrl, redirectCount + 1);
        }

        // Si no es 200, es un error
        if (response.statusCode !== 200) {
          response.resume();
          return reject(new Error(`HTTP ${response.statusCode}`));
        }

        // Procesar respuesta exitosa
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve({ response, buffer: Buffer.concat(chunks) }));
      }).on('error', reject);
    };

    makeRequest(targetUrl, 0);
  });
};

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const league = req.query.league || 'vaal';
  const game = req.query.game || 'poe2';

  // poe.ninja usa nombres cortos para las ligas de PoE1
  const POE1_LEAGUE_MAPPING = {
    'Keepers of the Flame': 'Keepers',
    'Hardcore Keepers of the Flame': 'Hardcore Keepers',
  };

  const ninjaLeague = (game === 'poe1' && POE1_LEAGUE_MAPPING[league])
    ? POE1_LEAGUE_MAPPING[league]
    : league;

  const url = game === 'poe2'
    ? `https://poe.ninja/api/data/poe2/currencyoverview?league=${encodeURIComponent(ninjaLeague)}&type=Currency`
    : `https://poe.ninja/poe1/api/economy/stash/current/currency/overview?league=${encodeURIComponent(ninjaLeague)}&type=Currency`;

  try {
    const { response, buffer } = await fetchWithRedirect(url);

    if (buffer.length === 0) {
      throw new Error('Empty response from poe.ninja');
    }

    let data;
    const encoding = response.headers['content-encoding'];

    if (encoding === 'gzip') {
      data = zlib.gunzipSync(buffer).toString();
    } else if (encoding === 'deflate') {
      data = zlib.inflateSync(buffer).toString();
    } else if (encoding === 'br') {
      data = zlib.brotliDecompressSync(buffer).toString();
    } else {
      data = buffer.toString();
    }

    const json = JSON.parse(data);
    res.status(200).json(json);
  } catch (error) {
    res.status(500).json({ error: 'Processing error', details: error.message });
  }
};
