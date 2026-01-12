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

  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  // Validar que la URL sea de pobb.in
  try {
    const urlObj = new URL(url);
    if (!['pobb.in', 'www.pobb.in'].includes(urlObj.hostname)) {
      return res.status(400).json({ error: 'Only pobb.in URLs are supported' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    let targetUrl;

    // Detectar el tipo de URL y construir la URL raw correspondiente
    if (url.includes('pobb.in')) {
      const match = url.match(/pobb\.in\/(?:u\/[^/]+\/)?([A-Za-z0-9_-]+)/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid pobb.in URL format' });
      }
      const buildId = match[1];
      targetUrl = `https://pobb.in/${buildId}/raw`;
    } else if (url.includes('poe.ninja') && url.includes('/pob/')) {
      return res.status(400).json({
        error: 'poe.ninja PoB URLs are not directly supported',
        details: 'poe.ninja builds use external pastebins. Please copy the PoB code from the poe.ninja page directly.'
      });
    } else {
      return res.status(400).json({
        error: 'Unsupported URL format',
        details: 'Only pobb.in URLs are supported. Format: https://pobb.in/ID'
      });
    }

    // Hacer la petición
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

      https.get(targetUrl, {
        headers: {
          'User-Agent': 'PoE-Build-Analyzer/1.0',
          'Accept': 'text/plain',
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
    let data;

    // Descomprimir si es necesario
    const encoding = response.response.headers['content-encoding'];

    if (encoding === 'gzip') {
      data = zlib.gunzipSync(buffer).toString();
    } else if (encoding === 'deflate') {
      data = zlib.inflateSync(buffer).toString();
    } else if (encoding === 'br') {
      data = zlib.brotliDecompressSync(buffer).toString();
    } else {
      data = buffer.toString();
    }

    // Retornar el código raw
    res.status(200).json({
      success: true,
      code: data,
      source: url
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch PoB code',
      details: error.message
    });
  }
};
