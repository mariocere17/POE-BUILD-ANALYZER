const https = require('https');
const zlib = require('zlib');
const { setCorsHeaders, isValidRealm, safeDecompress, createErrorResponse } = require('./utils/security');

module.exports = async (req, res) => {
  // CORS headers with whitelist
  setCorsHeaders(req, res, ['GET']);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const realm = req.query.realm || 'poe2';

  // Validar realm parameter
  if (!isValidRealm(realm)) {
    return res.status(400).json({ error: 'Invalid realm parameter' });
  }

  const url = `https://www.pathofexile.com/api/trade/data/stats?realm=${realm}`;

  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.pathofexile.com/trade2/',
      'Origin': 'https://www.pathofexile.com',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    }
  }, (response) => {
    const chunks = [];

    response.on('data', (chunk) => {
      chunks.push(chunk);
    });

    response.on('end', () => {
      try {
        // Check if the response was successful
        if (response.statusCode !== 200) {
          const buffer = Buffer.concat(chunks);
          const errorText = buffer.toString();
          console.error(`PoE API error: ${response.statusCode} - ${errorText}`);
          return res.status(response.statusCode).json({
            error: 'PoE API error',
            statusCode: response.statusCode,
            details: errorText
          });
        }

        const buffer = Buffer.concat(chunks);

        // Safe decompression with size limits
        const encoding = response.headers['content-encoding'];
        const data = safeDecompress(buffer, encoding, zlib);

        const json = JSON.parse(data);
        res.status(200).json(json);
      } catch (error) {
        console.error('Parse error:', error);
        res.status(500).json(createErrorResponse('Parse error', error));
      }
    });
  }).on('error', (error) => {
    res.status(500).json({ error: 'Request failed' });
  });
};
