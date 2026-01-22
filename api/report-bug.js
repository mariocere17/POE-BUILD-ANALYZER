/**
 * Bug Report Serverless Function
 * Sends bug reports to Discord webhook with rate limiting and screenshot support
 */

const formidable = require('formidable');
const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');
const { getClientIp, isValidImageMagicBytes } = require('./utils/security');

// In-memory store for rate limiting (resets when function cold-starts)
const rateLimitStore = new Map();

// Rate limit: 5 reports per IP per hour
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in ms

// Vercel configuration - disable body parsing
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

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

// Parse multipart form data
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      maxFileSize: 5 * 1024 * 1024, // 5MB max
      keepExtensions: true,
      allowEmptyFiles: false,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

// Send to Discord with optional file attachment
async function sendToDiscord(webhookUrl, payload, screenshotFile = null) {
  const formData = new FormData();

  // Add the JSON payload
  formData.append('payload_json', JSON.stringify(payload));

  // Add screenshot if provided
  if (screenshotFile) {
    try {
      const fileBuffer = await fs.readFile(screenshotFile.filepath);
      formData.append('file', fileBuffer, {
        filename: screenshotFile.originalFilename || 'screenshot.png',
        contentType: screenshotFile.mimetype,
      });
    } catch (error) {
      console.error('Error reading screenshot file:', error);
      // Continue without screenshot if file read fails
    }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders(),
  });

  return response;
}

module.exports = async function handler(req, res) {
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

    // Get IP for rate limiting (using verified Vercel header when available)
    const ip = getClientIp(req);

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait before submitting another report.'
      });
    }

    // Parse form data
    const { fields, files } = await parseForm(req);

    // Extract fields (formidable returns arrays)
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

      // Validate magic bytes (server-side file type verification)
      try {
        const fileBuffer = await fs.readFile(screenshot.filepath);
        if (!isValidImageMagicBytes(fileBuffer)) {
          return res.status(400).json({
            error: 'Invalid image file format'
          });
        }
      } catch (readError) {
        console.error('Error reading screenshot for validation:', readError);
        return res.status(400).json({
          error: 'Failed to validate screenshot'
        });
      }
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

    // Add screenshot info to embed if provided
    if (screenshot) {
      payload.embeds[0].fields.push({
        name: '📸 Screenshot',
        value: 'Attached below',
        inline: false
      });
    }

    // Send to Discord
    const response = await sendToDiscord(webhookUrl, payload, screenshot);

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
