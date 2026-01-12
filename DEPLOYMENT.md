# Deployment Guide

## Pre-Deployment Checklist

Before deploying to production, ensure you've completed these steps:

### 1. Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```bash
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
REACT_APP_API_URL=https://api.your-domain.com
PORT=3001
RATE_LIMIT=100
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Audit for vulnerabilities
npm audit
npm audit fix
```

### 3. Build the React Application

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### 4. Test the Build Locally

Start the proxy server:

```bash
node proxy-server.js
```

Serve the build (you can use `serve` package):

```bash
npx serve -s build -l 3000
```

Test the application at `http://localhost:3000`

## Production Deployment Options

### Option 1: Traditional Server (VPS/Dedicated)

#### Using PM2 (Recommended)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'poe-analyzer-api',
    script: './proxy-server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

3. Start the application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

4. Serve the React build with Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # React App
    location / {
        root /path/to/build;
        try_files $uri /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Option 2: Docker Deployment

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build React app
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "proxy-server.js"]
```

2. Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  poe-analyzer:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - FRONTEND_URL=https://your-domain.com
      - PORT=3001
    restart: unless-stopped
```

3. Build and run:
```bash
docker-compose up -d
```

### Option 3: Vercel (Frontend) + VPS (Backend)

#### Deploy React App to Vercel:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Set environment variables in Vercel dashboard:
   - `REACT_APP_API_URL=https://api.your-domain.com`

#### Deploy Backend to VPS:
Follow Option 1 (PM2 setup)

### Option 4: Static Hosting (Netlify/Vercel) + Serverless Functions

If you want fully serverless:

1. Convert `proxy-server.js` endpoints to serverless functions
2. Deploy React app to Netlify/Vercel
3. Deploy functions to same platform or AWS Lambda

## Post-Deployment

### 1. Verify Deployment

Test all endpoints:

```bash
# Health check
curl https://api.your-domain.com/api/leagues?game=poe2

# Stats endpoint
curl https://api.your-domain.com/api/stats?realm=poe2
```

### 2. Monitor Application

Set up monitoring:

- **Error tracking**: Sentry, Rollbar
- **Performance**: New Relic, Datadog
- **Uptime**: UptimeRobot, Pingdom

### 3. Set Up Backups

If using a database in the future, ensure regular backups.

### 4. Configure SSL/TLS

Use Let's Encrypt for free SSL certificates:

```bash
sudo certbot --nginx -d your-domain.com
```

### 5. Enable Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Scaling Considerations

### Horizontal Scaling

Use PM2 cluster mode or deploy multiple instances behind a load balancer.

### Caching

Implement Redis for:
- Rate limiting (distributed)
- Stats API caching
- League data caching

Example Redis integration:
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache stats for 1 hour
app.get('/api/stats', async (req, res) => {
  const cacheKey = `stats:${req.query.realm}`;

  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Fetch from API...
  await client.setEx(cacheKey, 3600, JSON.stringify(data));
  res.json(data);
});
```

### CDN

Serve static assets through a CDN:
- Cloudflare
- AWS CloudFront
- Vercel Edge Network

## Troubleshooting

### Issue: CORS errors in production

**Solution**: Verify `FRONTEND_URL` in `.env` matches your domain exactly.

### Issue: API timeouts

**Solution**: Increase timeout values in `src/config/apiConfig.js`

### Issue: Rate limiting too aggressive

**Solution**: Adjust `RATE_LIMIT` and `RATE_WINDOW` in `.env`

### Issue: Build fails

**Solution**:
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

## Rollback Plan

If deployment fails:

1. Keep previous build:
```bash
mv build build-backup-$(date +%Y%m%d)
```

2. Rollback with PM2:
```bash
pm2 reload poe-analyzer-api --update-env
```

3. Restore previous Docker image:
```bash
docker-compose down
docker-compose up -d previous-tag
```

## Maintenance

### Regular Updates

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Audit security
npm audit
npm audit fix
```

### Log Rotation

Configure log rotation for PM2:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'poe-analyzer-api',
    script: './proxy-server.js',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    max_size: '10M',
    max_files: 5
  }]
};
```

## Support

For issues or questions:
- Check `SECURITY.md` for security-related issues
- Review logs: `pm2 logs` or check log files
- GitHub Issues: [Your repo URL]
