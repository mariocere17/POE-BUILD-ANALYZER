# Security Documentation

## Security Improvements Implemented

This document outlines the security enhancements implemented in the PoE Build Analyzer application.

### 1. **CORS Configuration**
- **Issue**: Server accepted requests from any origin
- **Fix**: Implemented environment-specific CORS configuration
  - Production: Restricted to specific frontend URL (configurable via `FRONTEND_URL` env var)
  - Development: Allows all origins for local development
- **Location**: `proxy-server.js` lines 8-16

### 2. **Rate Limiting**
- **Issue**: No protection against API abuse
- **Fix**: Implemented IP-based rate limiting
  - Default: 100 requests per minute per IP
  - Configurable via environment variables
  - Automatic cleanup of expired rate limit data
- **Location**: `proxy-server.js` lines 19-59

### 3. **Input Validation**
- **Issue**: User input not validated before making external requests
- **Fix**:
  - Realm parameter validation in stats endpoint
  - URL validation for PoB fetch endpoint (only allows pobb.in)
  - Trade URL sanitization before opening in browser
- **Locations**:
  - `proxy-server.js` lines 65-67, 1030-1038
  - `src/config/apiConfig.js` lines 29-50

### 4. **Request Timeouts**
- **Issue**: Requests could hang indefinitely
- **Fix**: Implemented AbortController with timeouts for all fetch requests
  - Stats API: 8 seconds
  - PoB fetch: 10 seconds
  - Leagues: 5 seconds
  - Currency: 10 seconds
- **Locations**: All service files in `src/services/`

### 5. **Error Message Sanitization**
- **Issue**: Internal error details exposed to clients
- **Fix**:
  - Generic error messages in production
  - Detailed errors only in development mode
  - No stack traces sent to client
- **Location**: All error handlers across the application

### 6. **Console Log Removal**
- **Issue**: Sensitive information logged in production
- **Fix**: Conditional logging based on `NODE_ENV`
  - Logs only visible in development mode
  - Production builds have minimal logging
- **Location**: All service files

### 7. **XSS Prevention**
- **Issue**: Trade URLs not sanitized before opening
- **Fix**:
  - URL validation before `window.open()`
  - Added `noopener,noreferrer` flags to prevent tabnapping
  - Domain whitelist for trade URLs
- **Location**: `src/hooks/useBuildAnalyzer.js` line 60

### 8. **Configurable API URLs**
- **Issue**: Hardcoded localhost URLs wouldn't work in production
- **Fix**:
  - Centralized API configuration
  - Environment-based URL selection
  - Easy deployment configuration
- **Location**: `src/config/apiConfig.js`

## Deployment Recommendations

### Environment Variables
Create a `.env` file based on `.env.example`:

```bash
# Production
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
REACT_APP_API_URL=https://api.your-domain.com
PORT=3001
```

### Additional Security Measures for Production

1. **Use HTTPS**: Always serve the application over HTTPS in production
2. **Implement Helmet.js**: Add security headers
   ```bash
   npm install helmet
   ```
   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

3. **Use a Reverse Proxy**: Deploy behind nginx or similar
4. **Implement Redis for Rate Limiting**: For distributed systems
5. **Add Request Logging**: For monitoring and security auditing
6. **Set up CSRF Protection**: If adding POST endpoints
7. **Regular Dependencies Update**: Keep packages up to date
   ```bash
   npm audit
   npm audit fix
   ```

## Security Best Practices

### For Developers
- Never commit `.env` files
- Always validate user input
- Use prepared statements for any database queries (if added)
- Keep dependencies updated
- Review security advisories regularly

### For Deployment
- Use environment variables for sensitive configuration
- Enable HTTPS
- Set up proper logging and monitoring
- Implement proper backup strategies
- Use Content Security Policy headers

## Reporting Security Issues

If you discover a security vulnerability, please report it by creating a private security advisory on GitHub or contacting the maintainers directly.

## Security Checklist

- [x] CORS properly configured
- [x] Rate limiting implemented
- [x] Input validation on all endpoints
- [x] Request timeouts configured
- [x] Error messages sanitized
- [x] XSS prevention measures
- [x] Console logs removed from production
- [x] URLs configurable via environment
- [ ] HTTPS enforced (deployment-specific)
- [ ] Helmet.js security headers (recommended)
- [ ] Redis-based rate limiting (for scale)
- [ ] Request logging (for audit)

## Version History

- **v1.8.0** - Initial security hardening (2026-01-12)
  - Added CORS configuration
  - Implemented rate limiting
  - Added input validation
  - Implemented request timeouts
  - Sanitized error messages
  - Removed production console logs
  - Added XSS prevention
  - Made API URLs configurable
