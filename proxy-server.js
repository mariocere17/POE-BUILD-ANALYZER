const express = require('express');
const cors = require('cors');
const https = require('https');
const zlib = require('zlib');
const formidable = require('formidable');
const FormData = require('form-data');
const fs = require('fs').promises;
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const app = express();

// Configuración de CORS más segura
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400, // 24 horas
};

app.use(cors(corsOptions));

// Rate limiting simple (en producción usar redis o similar)
const requestCounts = new Map();
const RATE_LIMIT = 100; // requests por minuto
const RATE_WINDOW = 60000; // 1 minuto

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return next();
  }

  const userData = requestCounts.get(ip);

  if (now > userData.resetTime) {
    userData.count = 1;
    userData.resetTime = now + RATE_WINDOW;
    return next();
  }

  if (userData.count >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  userData.count++;
  next();
};

app.use(rateLimiter);

// Limpiar requestCounts cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 300000);

app.get('/api/stats', async (req, res) => {
  const realm = req.query.realm || 'poe2';

  // Validar realm parameter
  if (!['poe1', 'poe2', 'pc'].includes(realm)) {
    return res.status(400).json({ error: 'Invalid realm parameter' });
  }

  const url = `https://www.pathofexile.com/api/trade/data/stats?realm=${realm}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('📡 Fetching:', url);
  }

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
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Stats fetched:', json.result?.length, 'categories');
        }
        res.json(json);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Parse error:', error.message);
        }
        res.status(500).json({ error: 'Parse error' });
      }
    });
  }).on('error', (error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Request error:', error.message);
    }
    res.status(500).json({ error: 'Request failed' });
  });
});

app.get('/api/poeninja/currency', async (req, res) => {
  const league = req.query.league || 'vaal';
  const game = req.query.game || 'poe2';

  // La URL correcta es diferente según el juego:
  // PoE1: Usa stash tab trading → /poe1/api/economy/stash/current/currency/overview
  // PoE2: Usa Currency Exchange (datos de GGG) → estructura diferente
  const url = game === 'poe2'
    ? `https://poe.ninja/api/data/poe2/currencyoverview?league=${encodeURIComponent(league)}&type=Currency`
    : `https://poe.ninja/poe1/api/economy/stash/current/currency/overview?league=${encodeURIComponent(league)}&type=Currency`;

  console.log('💰 Fetching poe.ninja:', url);

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
            console.log(`   📍 Redirect ${response.statusCode} to:`, response.headers.location);
            response.resume(); // Consumir el response

            // Construir la nueva URL (puede ser relativa o absoluta)
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

  try {
    const { response, buffer } = await fetchWithRedirect(url);

    console.log('   ✅ Status Code:', response.statusCode);
    console.log('   Content-Encoding:', response.headers['content-encoding'] || 'none');
    console.log('   Buffer length:', buffer.length);

    // Si el buffer está vacío, es un error
    if (buffer.length === 0) {
      throw new Error('Empty response from poe.ninja');
    }

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

    console.log('   Data length:', data.length);
    console.log('   First 100 chars:', data.substring(0, 100));

    const json = JSON.parse(data);
    console.log('✅ Currency data fetched:', json.lines?.length || 0, 'currencies');
    res.json(json);
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: 'Processing error', details: error.message });
  }
});

// Endpoint de prueba para verificar ligas disponibles
app.get('/api/test-leagues', async (req, res) => {
  const leagues = [
    'vaal',
    'vaal-hardcore',
    'Standard',
    'Hardcore'
  ];

  const results = [];

  // Probar el patrón que sabemos que funciona con redirects
  const testUrl = (league) => `https://poe.ninja/api/data/currencyoverview?league=${encodeURIComponent(league)}&type=Currency`;

  for (const league of leagues) {
    const url = testUrl(league);
    try {
      const testResult = await new Promise((resolve) => {
        const followRedirect = (currentUrl, redirectCount = 0) => {
          if (redirectCount > 5) {
            return resolve({
              league,
              url: currentUrl,
              status: 'too_many_redirects',
              available: false
            });
          }

          https.get(currentUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept-Encoding': 'gzip, deflate, br'
            }
          }, (response) => {
            // Si es redirect, seguirlo
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
              response.resume();
              const redirectUrl = new URL(response.headers.location, currentUrl).href;
              return followRedirect(redirectUrl, redirectCount + 1);
            }

            // Leer el contenido para verificar que sea válido
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              const buffer = Buffer.concat(chunks);
              let dataValid = false;

              try {
                // Intentar descomprimir y parsear
                const encoding = response.headers['content-encoding'];
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

                const json = JSON.parse(data);
                dataValid = json.lines && Array.isArray(json.lines);
              } catch (e) {
                dataValid = false;
              }

              resolve({
                league,
                url: currentUrl,
                status: response.statusCode,
                available: response.statusCode === 200 && dataValid,
                dataValid,
                finalUrl: currentUrl !== url ? currentUrl : undefined
              });
            });
          }).on('error', (err) => {
            resolve({
              league,
              url: currentUrl,
              status: 'error',
              available: false,
              error: err.message
            });
          });
        };

        followRedirect(url);
      });

      results.push(testResult);
    } catch (error) {
      results.push({
        league,
        url: testUrl(league),
        status: 'exception',
        available: false,
        error: error.message
      });
    }
  }

  res.json(results);
});

// Endpoint para poe2scout (currency data para PoE2 y PoE1)
app.get('/api/poe2scout/currency', async (req, res) => {
  const league = req.query.league || 'Fate of the Vaal';
  const game = req.query.game || 'poe2';

  console.log(`🔍 Fetching ${game.toUpperCase()} currency for league:`, league);

  // poe2scout solo tiene datos de PoE2, para PoE1 usar poe.ninja
  if (game === 'poe1') {
    console.log('   ⚠️  poe2scout no soporta PoE1, redirigiendo a poe.ninja...');

    // Redireccionar a poe.ninja para PoE1
    const poeNinjaUrl = `https://poe.ninja/poe1/api/economy/stash/current/currency/overview?league=${encodeURIComponent(league)}&type=Currency`;

    // Función para seguir redirects manualmente (copiada del endpoint poeninja)
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
              console.log(`   📍 Redirect ${response.statusCode} to:`, response.headers.location);
              response.resume(); // Consumir el response

              // Construir la nueva URL (puede ser relativa o absoluta)
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

    try {
      const { response, buffer } = await fetchWithRedirect(poeNinjaUrl);

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
      console.log('✅ poe.ninja currency data fetched:', json.lines?.length || 0, 'currencies');

      // Transformar poe.ninja al formato de poe2scout para compatibilidad
      const transformedData = {
        items: json.lines.map(line => ({
          text: line.currencyTypeName,
          currentPrice: line.chaosEquivalent,
          iconUrl: line.icon || null,
          priceLogs: []
        }))
      };

      console.log('✅ Transformed to poe2scout format:', transformedData.items.length, 'items');
      return res.json(transformedData);
    } catch (error) {
      console.error('❌ Error fetching poe.ninja data:', error.message);
      return res.status(500).json({ error: 'Failed to fetch poe.ninja data', details: error.message });
    }
  }

  // Para PoE2, usar poe2scout directamente
  const url = `https://poe2scout.com/api/items/currency/currency?league=${encodeURIComponent(league)}&perPage=50`;

  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

      https.get(url, {
        headers: {
          'User-Agent': 'PoE-Build-Analyzer/1.0 (https://github.com/your-repo)',
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

    const json = JSON.parse(data);
    console.log('✅ poe2scout currency data fetched:', json.items?.length || 0, 'items');
    res.json(json);
  } catch (error) {
    console.error('❌ Error fetching poe2scout data:', error.message);
    res.status(500).json({ error: 'Failed to fetch poe2scout data', details: error.message });
  }
});

// Endpoint para obtener ligas activas
app.get('/api/leagues', async (req, res) => {
  const game = req.query.game || 'poe1';

  console.log('🏆 Fetching leagues for:', game);

  // Ligas hardcodeadas como fallback (actualizadas manualmente)
  // Solo 3 ligas: Liga actual + Hardcore + Standard
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
    // Para PoE2, usar poe2scout que tiene datos más actualizados
    if (game === 'poe2') {
      const url = 'https://poe2scout.com/api/leagues';
      console.log('   📡 Fetching PoE2 leagues from poe2scout:', url);

      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);

        https.get(url, {
          headers: {
            'User-Agent': 'PoE-Build-Analyzer/1.0 (https://github.com/your-repo)',
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

      const json = JSON.parse(data);
      console.log('✅ poe2scout leagues fetched:', json.length, 'leagues');

      // poe2scout retorna: [{ value: "Fate of the Vaal", divinePrice: 381, chaosDivinePrice: 57 }]
      // Filtrar y tomar solo las 3 principales (liga actual, hardcore, standard)
      // Excluir ligas antiguas (Dawn of the Hunt, Rise of the Abyssal)
      const currentLeagues = json.filter(league =>
        !league.value.includes('Dawn of the Hunt') &&
        !league.value.includes('Rise of the Abyssal')
      );

      // Mapear al formato esperado
      const activeLeagues = currentLeagues.map(league => ({
        id: league.value,
        realm: 'poe2',
        description: league.value
      }));

      console.log('   Final PoE2 leagues:', activeLeagues.map(l => l.id).join(', '));
      return res.json(activeLeagues);
    }

    // Para PoE1, usar el endpoint público de Trade API
    // Usar el endpoint público de Trade API que no requiere autenticación
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

    const json = JSON.parse(data);

    // El formato de respuesta es: {"result": [{"id": "Standard", "realm": "pc", "text": "Standard"}]}
    const leagues = json.result || json;
    console.log('✅ Leagues fetched from API:', leagues.length || 0, 'leagues');

    // Filtrar ligas relevantes:
    // 1. Excluir SSF, Solo, Private
    // 2. Tomar las 2 primeras (liga actual + hardcore)
    // 3. Asegurar que Standard esté incluido
    const filteredLeagues = (Array.isArray(leagues) ? leagues : []).filter(league => {
      return !league.id.startsWith('SSF') &&
             !league.id.includes('Solo') &&
             !league.id.includes('Private') &&
             league.id.length < 30;
    });

    // Tomar las 2 primeras ligas (challenge league + hardcore challenge)
    const mainLeagues = filteredLeagues.slice(0, 2);

    // Buscar Standard en el resto
    const standardLeague = filteredLeagues.find(league =>
      league.id === 'Standard' || league.text === 'Standard'
    );

    // Combinar: 2 primeras + Standard (si existe y no está ya incluido)
    const finalLeagues = [...mainLeagues];
    if (standardLeague && !mainLeagues.find(l => l.id === standardLeague.id)) {
      finalLeagues.push(standardLeague);
    }

    // Mapear al formato esperado
    const activeLeagues = finalLeagues.map(league => ({
      id: league.id,
      realm: league.realm || 'pc',
      description: league.text || league.id
    }));

    console.log('   Final leagues:', activeLeagues.map(l => l.id).join(', '));
    res.json(activeLeagues);
  } catch (error) {
    // Si falla (401, timeout, etc), usar ligas hardcodeadas
    console.log('⚠️  API failed, using fallback leagues:', error.message);
    console.log('✅ Returning', fallbackLeagues[game].length, 'fallback leagues');
    res.json(fallbackLeagues[game]);
  }
});

// Endpoint unificado para obtener items de múltiples categorías (PoE2 only)
app.get('/api/poe2scout/items-multi', async (req, res) => {
  const league = req.query.league || 'Fate of the Vaal';
  const categories = req.query.categories; // Formato: "currency,abyss,ritual"

  if (!categories) {
    return res.status(400).json({
      error: 'Missing categories parameter',
      details: 'Use format: ?categories=currency,abyss,ritual'
    });
  }

  const categoryList = categories.split(',').map(c => c.trim());
  console.log(`🔄 Fetching multiple categories for league ${league}:`, categoryList.join(', '));

  try {
    // Función helper para fetch de una categoría
    const fetchCategory = async (category) => {
      const url = `https://poe2scout.com/api/items/currency/${category}?league=${encodeURIComponent(league)}&perPage=100`;

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Timeout for ${category}`)), 5000);

        https.get(url, {
          headers: {
            'User-Agent': 'PoE-Build-Analyzer/1.0 (https://github.com/your-repo)',
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

    // Fetch todas las categorías en paralelo
    const results = await Promise.all(
      categoryList.map(cat => fetchCategory(cat))
    );

    // Combinar todos los items en un único array
    const allItems = [];
    results.forEach(result => {
      if (result.data && result.data.items) {
        allItems.push(...result.data.items);
      }
    });

    console.log(`✅ Multi-category fetch complete: ${allItems.length} total items from ${categoryList.length} categories`);

    // Retornar en el mismo formato que el endpoint original
    res.json({
      items: allItems,
      categories: categoryList,
      totalItems: allItems.length
    });
  } catch (error) {
    console.error('❌ Error fetching multi-category data:', error.message);
    res.status(500).json({
      error: 'Failed to fetch multi-category data',
      details: error.message
    });
  }
});

// Endpoint de test para ver todas las categorías disponibles en poe2scout
app.get('/api/poe2scout/categories/test', async (req, res) => {
  const league = req.query.league || 'Fate of the Vaal';

  console.log('🧪 TEST: Fetching ALL available categories from poe2scout');

  const url = 'https://poe2scout.com/api/items/categories';

  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

      https.get(url, {
        headers: {
          'User-Agent': 'PoE-Build-Analyzer/1.0 (https://github.com/your-repo)',
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

    const json = JSON.parse(data);

    console.log('✅ TEST: Categories fetched successfully');
    console.log('📋 Currency categories:', json.currency_categories?.length || 0);
    console.log('   →', json.currency_categories?.map(c => `${c.label} (${c.id})`).join(', '));
    console.log('📋 Unique categories:', json.unique_categories?.length || 0);
    console.log('   →', json.unique_categories?.map(c => `${c.label} (${c.id})`).join(', '));

    res.json(json);
  } catch (error) {
    console.error('❌ TEST: Error fetching categories:', error.message);
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

// Endpoint de test para ver items de una categoría específica
app.get('/api/poe2scout/items/test', async (req, res) => {
  const league = req.query.league || 'Fate of the Vaal';
  const category = req.query.category || 'currency'; // currency, abyss, ritual, etc.
  const type = req.query.type || 'currency'; // currency o unique

  console.log(`🧪 TEST: Fetching items for category "${category}" (type: ${type}) in league:`, league);

  const url = `https://poe2scout.com/api/items/${type}/${category}?league=${encodeURIComponent(league)}&perPage=100`;

  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

      https.get(url, {
        headers: {
          'User-Agent': 'PoE-Build-Analyzer/1.0 (https://github.com/your-repo)',
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

    const json = JSON.parse(data);

    console.log(`✅ TEST: Items fetched for category "${category}":`, json.items?.length || 0, 'items');
    if (json.items && json.items.length > 0) {
      console.log('📋 Sample items:', json.items.slice(0, 5).map(i => `${i.text} (${Math.round(i.currentPrice)} chaos)`).join(', '));
      console.log('📋 All item names:', json.items.map(i => i.text).join(', '));
    }

    res.json(json);
  } catch (error) {
    console.error('❌ TEST: Error fetching items:', error.message);
    res.status(500).json({ error: 'Failed to fetch items', details: error.message });
  }
});

// Endpoint de test para ver todas las currencies disponibles
app.get('/api/poe2scout/currency/test', async (req, res) => {
  const league = req.query.league || 'Fate of the Vaal';
  const game = req.query.game || 'poe2';

  console.log(`🧪 TEST: Fetching ALL ${game.toUpperCase()} currencies for league:`, league);

  // poe2scout solo tiene datos de PoE2, para PoE1 usar poe.ninja
  if (game === 'poe1') {
    console.log('   ⚠️  poe2scout no soporta PoE1, redirigiendo a poe.ninja...');

    const poeNinjaUrl = `https://poe.ninja/poe1/api/economy/stash/current/currency/overview?league=${encodeURIComponent(league)}&type=Currency`;

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
              console.log(`   📍 Redirect ${response.statusCode} to:`, response.headers.location);
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

    try {
      const { response, buffer } = await fetchWithRedirect(poeNinjaUrl);

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
      console.log('✅ TEST: poe.ninja currency data fetched:', json.lines?.length || 0, 'currencies');

      // Transformar poe.ninja al formato de poe2scout para compatibilidad
      const transformedData = {
        items: json.lines.map(line => ({
          text: line.currencyTypeName,
          currentPrice: line.chaosEquivalent,
          iconUrl: line.icon || null,
          priceLogs: []
        }))
      };

      console.log('✅ TEST: Transformed to poe2scout format:', transformedData.items.length, 'items');
      console.log('📋 Available currencies:', transformedData.items.map(i => i.text).join(', '));
      return res.json(transformedData);
    } catch (error) {
      console.error('❌ TEST: Error fetching poe.ninja data:', error.message);
      return res.status(500).json({ error: 'Failed to fetch poe.ninja data', details: error.message });
    }
  }

  // Para PoE2, usar poe2scout directamente con mayor cantidad de resultados
  const url = `https://poe2scout.com/api/items/currency/currency?league=${encodeURIComponent(league)}&perPage=100`;

  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

      https.get(url, {
        headers: {
          'User-Agent': 'PoE-Build-Analyzer/1.0 (https://github.com/your-repo)',
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

    const json = JSON.parse(data);
    console.log('✅ TEST: poe2scout currency data fetched:', json.items?.length || 0, 'items');
    console.log('📋 Available currencies:', json.items?.map(i => i.text).join(', ') || 'none');
    res.json(json);
  } catch (error) {
    console.error('❌ TEST: Error fetching poe2scout data:', error.message);
    res.status(500).json({ error: 'Failed to fetch poe2scout data', details: error.message });
  }
});

// Endpoint para obtener código raw de pobb.in y poe.ninja/pob
app.get('/api/pob/fetch', async (req, res) => {
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

  if (process.env.NODE_ENV !== 'production') {
    console.log('📋 Fetching PoB code from:', url);
  }

  try {
    let targetUrl;

    // Detectar el tipo de URL y construir la URL raw correspondiente
    if (url.includes('pobb.in')) {
      // Extraer el ID del build (puede ser: pobb.in/ID o pobb.in/u/username/ID)
      const match = url.match(/pobb\.in\/(?:u\/[^/]+\/)?([A-Za-z0-9_-]+)/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid pobb.in URL format' });
      }
      const buildId = match[1];
      targetUrl = `https://pobb.in/${buildId}/raw`;
    } else if (url.includes('poe.ninja') && url.includes('/pob/')) {
      // poe.ninja/poe2/pob/16e00 → Necesitamos encontrar el pastebin o código
      // poe.ninja usa pastebins externos, vamos a intentar obtener la página y extraer el link
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

    console.log('   📍 Fetching from:', targetUrl);

    // Hacer la petición
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

      https.get(targetUrl, {
        headers: {
          'User-Agent': 'PoE-Build-Analyzer/1.0 (https://github.com/your-repo)',
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

    console.log('✅ PoB code fetched successfully, length:', data.length);

    // Retornar el código raw
    res.json({
      success: true,
      code: data,
      source: url
    });
  } catch (error) {
    console.error('❌ Error fetching PoB code:', error.message);
    res.status(500).json({
      error: 'Failed to fetch PoB code',
      details: error.message
    });
  }
});

// Bug Report Endpoint with Screenshot Support
app.post('/api/report-bug', async (req, res) => {
  console.log('🐛 Bug report received');

  try {
    // Check if webhook is configured
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('❌ DISCORD_WEBHOOK_URL not configured in .env.local');
      return res.status(500).json({ error: 'Report system not configured' });
    }

    // Parse multipart form data
    const form = new formidable.IncomingForm({
      maxFileSize: 5 * 1024 * 1024, // 5MB max
      keepExtensions: true,
      allowEmptyFiles: false,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('❌ Form parse error:', err);
        return res.status(400).json({ error: 'Invalid form data' });
      }

      // Extract fields (formidable returns arrays in v3)
      const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
      const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
      const browser = Array.isArray(fields.browser) ? fields.browser[0] : fields.browser;
      const game = Array.isArray(fields.game) ? fields.game[0] : fields.game;
      const league = Array.isArray(fields.league) ? fields.league[0] : fields.league;
      const url = Array.isArray(fields.url) ? fields.url[0] : fields.url;

      // Validate input
      if (!description || description.trim().length < 10) {
        return res.status(400).json({
          error: 'Description must be at least 10 characters long'
        });
      }

      // Get screenshot file if provided
      const screenshot = Array.isArray(files.screenshot) ? files.screenshot[0] : files.screenshot;

      // Validate screenshot if provided
      if (screenshot) {
        if (!screenshot.mimetype?.startsWith('image/')) {
          return res.status(400).json({
            error: 'Screenshot must be an image file'
          });
        }
        if (screenshot.size > 5 * 1024 * 1024) {
          return res.status(400).json({
            error: 'Screenshot must be smaller than 5MB'
          });
        }
      }

      // Create Discord embed
      const embed = {
        embeds: [{
          title: '🐛 New Bug Report',
          color: 0xFF0000,
          description: description.trim(),
          fields: [
            {
              name: '📧 Contact',
              value: email ? email.trim() : 'Anonymous',
              inline: true
            },
            {
              name: '🌐 Browser',
              value: (browser || 'Unknown').slice(0, 100),
              inline: true
            },
            {
              name: '🎮 Game',
              value: game || 'Unknown',
              inline: true
            },
            {
              name: '🏆 League',
              value: league || 'Unknown',
              inline: true
            },
            {
              name: '🔗 Page URL',
              value: (url || 'Unknown').slice(0, 200),
              inline: false
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'PoE Build Analyzer - Local Dev'
          }
        }]
      };

      // Add screenshot info if provided
      if (screenshot) {
        embed.embeds[0].fields.push({
          name: '📸 Screenshot',
          value: 'Attached below',
          inline: false
        });
      }

      // Send to Discord
      try {
        const formData = new FormData();
        formData.append('payload_json', JSON.stringify(embed));

        // Add screenshot if provided
        if (screenshot) {
          const fileBuffer = await fs.readFile(screenshot.filepath);
          formData.append('file', fileBuffer, {
            filename: screenshot.originalFilename || 'screenshot.png',
            contentType: screenshot.mimetype,
          });
        }

        const response = await fetch(webhookUrl, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Discord webhook error:', response.status, errorText);
          return res.status(500).json({ error: 'Failed to send report to Discord' });
        }

        console.log('✅ Bug report sent to Discord successfully');
        return res.status(200).json({
          success: true,
          message: 'Report submitted successfully. Thank you!'
        });

      } catch (error) {
        console.error('❌ Error sending to Discord:', error);
        return res.status(500).json({
          error: 'Failed to send report',
          details: error.message
        });
      }
    });

  } catch (error) {
    console.error('❌ Report bug error:', error);
    return res.status(500).json({
      error: 'Failed to submit report. Please try again later.'
    });
  }
});

app.listen(3001, () => {
  console.log('✅ Proxy server running on http://localhost:3001');
  console.log('📡 Ready to proxy requests to PoE API');
  console.log('📦 Compression support: gzip, deflate, brotli');
  console.log('\n🐛 Bug Report System:');
  console.log('   Discord Webhook:', process.env.DISCORD_WEBHOOK_URL ? '✅ Configured' : '❌ NOT CONFIGURED');
  console.log('   Endpoint: http://localhost:3001/api/report-bug');
  console.log('\n🧪 Test Endpoints:');
  console.log('   Leagues: http://localhost:3001/api/test-leagues');
  console.log('   Categories: http://localhost:3001/api/poe2scout/categories/test');
  console.log('   Items by category: http://localhost:3001/api/poe2scout/items/test?category=abyss&type=currency');
  console.log('   Currency test: http://localhost:3001/api/poe2scout/currency/test?league=Fate%20of%20the%20Vaal&game=poe2');
  console.log('   PoB fetch: http://localhost:3001/api/pob/fetch?url=https://pobb.in/ID');
  console.log('\n🏆 Production Endpoints:');
  console.log('   http://localhost:3001/api/leagues');
  console.log('   http://localhost:3001/api/poe2scout/currency');
  console.log('   http://localhost:3001/api/poe2scout/items-multi?categories=currency,abyss,ritual&league=Fate%20of%20the%20Vaal');
  console.log('   http://localhost:3001/api/pob/fetch?url=URL');
});
