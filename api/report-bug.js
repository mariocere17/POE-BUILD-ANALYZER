/**
 * Bug Report Serverless Function
 * Sends bug reports to Discord webhook with rate limiting
 */

// In-memory store for rate limiting (resets when function cold-starts)
const rateLimitStore = new Map();

// Rate limit: 5 reports per IP per hour
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const timestamps = rateLimitStore.get(key);

  // Remove old timestamps outside the window
  const validTimestamps = timestamps.filter(t => now - t < RATE_WINDOW);

  if (validTimestamps.length >= RATE_LIMIT) {
    return false; // Rate limit exceeded
  }

  // Add current timestamp
  validTimestamps.push(now);
  rateLimitStore.set(key, validTimestamps);

  return true;
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  // Remove any potential XSS/injection attempts
  return input
    .trim()
    .slice(0, 2000) // Max 2000 chars
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

function createDiscordEmbed(data) {
  const timestamp = new Date().toISOString();

  return {
    embeds: [{
      title: '🐛 New Bug Report',
      color: 0xFF0000, // Red color
      description: sanitizeInput(data.description),
      fields: [
        {
          name: '📧 Contact',
          value: data.email ? sanitizeInput(data.email) : 'Anonymous',
          inline: true
        },
        {
          name: '🌐 Browser',
          value: sanitizeInput(data.browser).slice(0, 100),
          inline: true
        },
        {
          name: '🎮 Game',
          value: sanitizeInput(data.game) || 'Unknown',
          inline: true
        },
        {
          name: '🏆 League',
          value: sanitizeInput(data.league) || 'Unknown',
          inline: true
        },
        {
          name: '🔗 Page URL',
          value: sanitizeInput(data.url).slice(0, 200),
          inline: false
        }
      ],
      timestamp: timestamp,
      footer: {
        text: 'PoE Build Analyzer'
      }
    }]
  };
}

export default async function handler(req, res) {
  // CORS headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'https://poe-build-analyzer.vercel.app'
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if webhook is configured
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL not configured');
      return res.status(500).json({ error: 'Report system not configured' });
    }

    // Get IP for rate limiting
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait before submitting another report.'
      });
    }

    // Validate input
    const { description, email, browser, game, league, url } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        error: 'Description must be at least 10 characters long'
      });
    }

    // Create Discord embed
    const payload = createDiscordEmbed({
      description,
      email,
      browser,
      game,
      league,
      url
    });

    // Send to Discord
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Discord webhook error:', response.status, await response.text());
      return res.status(500).json({ error: 'Failed to send report' });
    }

    // Success
    return res.status(200).json({
      success: true,
      message: 'Report submitted successfully. Thank you!'
    });

  } catch (error) {
    console.error('Report bug error:', error);
    return res.status(500).json({
      error: 'Failed to submit report. Please try again later.'
    });
  }
}
