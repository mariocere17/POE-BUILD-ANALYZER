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

  const league = req.query.league || 'Fate of the Vaal';
  const categories = req.query.categories;

  if (!categories) {
    return res.status(400).json({
      error: 'Missing categories parameter',
      details: 'Use format: ?categories=currency,abyss,ritual'
    });
  }

  const categoryList = categories.split(',').map(c => c.trim());

  try {
    // Función helper para fetch de una categoría
    const fetchCategory = async (category) => {
      const url = `https://poe2scout.com/api/items/currency/${category}?league=${encodeURIComponent(league)}&perPage=100`;

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Timeout for ${category}`)), 5000);

        https.get(url, {
          headers: {
            'User-Agent': 'PoE-Build-Analyzer/1.0',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        }, (response) => {
          clearTimeout(timeout);

          if (response.statusCode !== 200) {
            response.resume();
            return reject(new Error(`HTTP ${response.statusCode} for ${category}`));
          }

          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            try {
              const buffer = Buffer.concat(chunks);
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
              resolve({ category, data: json });
            } catch (err) {
              reject(new Error(`Parse error for ${category}: ${err.message}`));
            }
          });
        }).on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    };

    // Fetch todas las categorías en paralelo con manejo de errores individual
    const results = await Promise.allSettled(
      categoryList.map(cat => fetchCategory(cat))
    );

    // Combinar todos los items exitosos
    const allItems = [];
    const errors = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.data && result.value.data.items) {
        allItems.push(...result.value.data.items);
      } else if (result.status === 'rejected') {
        errors.push({ category: categoryList[index], error: result.reason.message });
      }
    });

    // Retornar en el mismo formato que el endpoint original
    res.status(200).json({
      items: allItems,
      categories: categoryList,
      totalItems: allItems.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Multi-category fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch multi-category data',
      details: error.message
    });
  }
};
