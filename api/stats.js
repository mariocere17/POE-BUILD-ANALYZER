const https = require('https');
const zlib = require('zlib');

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

  const realm = req.query.realm || 'poe2';

  // Validar realm parameter
  if (!['poe1', 'poe2', 'pc'].includes(realm)) {
    return res.status(400).json({ error: 'Invalid realm parameter' });
  }

  const url = `https://www.pathofexile.com/api/trade/data/stats?realm=${realm}`;

  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Encoding': 'gzip, deflate, br'
    }
  }, (response) => {
    const chunks = [];

    response.on('data', (chunk) => {
      chunks.push(chunk);
    });

    response.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        let data;

        // Descomprimir si es necesario
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
        res.status(500).json({ error: 'Parse error' });
      }
    });
  }).on('error', (error) => {
    res.status(500).json({ error: 'Request failed' });
  });
};
