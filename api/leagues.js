const https = require('https');
const zlib = require('zlib');
const { setCorsHeaders, isValidGame, safeDecompress, getClientIp, checkRateLimit } = require('./utils/security');

module.exports = async (req, res) => {
  // CORS headers with whitelist
  setCorsHeaders(req, res, ['GET']);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 30 requests per minute per IP
  const ip = getClientIp(req);
  if (!checkRateLimit(ip, 'leagues', 30, 60000)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  const game = req.query.game || 'poe1';

  // Validate game parameter
  if (!isValidGame(game)) {
    return res.status(400).json({ error: 'Invalid game parameter' });
  }

  // Ligas hardcodeadas como fallback
  const fallbackLeagues = {
    poe2: [
      { id: 'Fate of the Vaal', description: 'Fate of the Vaal' },
      { id: 'HC Fate of the Vaal', description: 'HC Fate of the Vaal' },
      { id: 'Standard', description: 'Standard League' }
    ],
    poe1: [
      { id: 'Keepers of the Flame', description: 'Keepers of the Flame' },
      { id: 'Hardcore Keepers of the Flame', description: 'Hardcore Keepers' },
      { id: 'Standard', description: 'Standard League' }
    ]
  };

  try {
    // Para PoE2, usar poe2scout
    if (game === 'poe2') {
      const url = 'https://poe2scout.com/api/leagues';

      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);

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

      // Filtrar ligas antiguas
      const currentLeagues = json.filter(league =>
        !league.value.includes('Dawn of the Hunt') &&
        !league.value.includes('Rise of the Abyssal')
      );

      const activeLeagues = currentLeagues.map(league => ({
        id: league.value,
        realm: 'poe2',
        description: league.value
      }));

      return res.status(200).json(activeLeagues);
    }

    // Para PoE1, usar Trade API
    const url = game === 'poe2'
      ? 'https://www.pathofexile.com/api/trade/data/leagues?realm=poe2'
      : 'https://www.pathofexile.com/api/trade/data/leagues?realm=pc';

    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);

      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
    const leagues = json.result || json;

    // Filtrar ligas relevantes
    const filteredLeagues = (Array.isArray(leagues) ? leagues : []).filter(league => {
      return !league.id.startsWith('SSF') &&
             !league.id.includes('Solo') &&
             !league.id.includes('Private') &&
             league.id.length < 30;
    });

    const mainLeagues = filteredLeagues.slice(0, 2);
    const standardLeague = filteredLeagues.find(league =>
      league.id === 'Standard' || league.text === 'Standard'
    );

    const finalLeagues = [...mainLeagues];
    if (standardLeague && !mainLeagues.find(l => l.id === standardLeague.id)) {
      finalLeagues.push(standardLeague);
    }

    const activeLeagues = finalLeagues.map(league => ({
      id: league.id,
      realm: league.realm || 'pc',
      description: league.text || league.id
    }));

    res.status(200).json(activeLeagues);
  } catch (error) {
    // Usar fallback en caso de error
    res.status(200).json(fallbackLeagues[game]);
  }
};
