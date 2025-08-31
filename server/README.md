# SecureShare Session Storage API

A secure, temporary session storage service for the SecureShare mobile app access feature. This API provides encrypted storage for browser session data with automatic expiration and one-time use functionality.

## Features

- **Secure Storage**: AES-256-GCM encryption for all session data
- **Automatic Expiration**: Sessions expire after 30 minutes by default
- **One-Time Use**: Sessions are deleted after successful retrieval
- **Rate Limiting**: Protection against abuse (10 sessions per IP per hour)
- **Security Headers**: Comprehensive security headers via Helmet.js
- **CORS Support**: Configured for Chrome extensions and development

## Quick Start

### Installation

```bash
cd server
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Testing

```bash
# Run Jest tests
npm test

# Run tests with coverage
npm test:coverage

# Manual testing via browser
open test-runner.html
```

## API Endpoints

### POST /api/sessions

Store encrypted session data and receive a session ID.

**Request:**
```json
{
  "sessionData": {
    "url": "https://netflix.com/browse",
    "title": "Netflix - Home",
    "domain": "netflix.com",
    "cookies": [...],
    "timestamp": 1640995200000
  },
  "encryptionKey": "64-character-hex-string",
  "ttl": 1800
}
```

**Response:**
```json
{
  "sessionId": "uuid-v4",
  "expiresAt": 1640998800000,
  "ttl": 1800,
  "message": "Session stored successfully"
}
```

### GET /api/sessions/:id

Retrieve and decrypt session data (one-time use).

**Request:**
```
GET /api/sessions/uuid-v4?key=64-character-hex-string
```

**Response:**
```json
{
  "sessionData": {
    "url": "https://netflix.com/browse",
    "title": "Netflix - Home",
    "cookies": [...],
    "timestamp": 1640995200000
  },
  "metadata": {
    "createdAt": 1640995200000,
    "accessCount": 1
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-31T23:59:59.999Z",
  "activeSessions": 5,
  "uptime": 3600
}
```

## Security Features

### Encryption
- **Algorithm**: AES-256-GCM
- **Key Management**: Client-side key generation
- **IV**: Random 16-byte initialization vector per session
- **Authentication**: Built-in authentication tag verification

### Rate Limiting
- **Session Creation**: 10 sessions per IP per hour
- **Configurable**: Adjustable via environment variables

### Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection

### CORS Configuration
- Chrome/Firefox extension origins
- Development localhost origins
- Production domain whitelist

## Environment Variables

```bash
# Server Configuration
PORT=3001

# Security (Production)
NODE_ENV=production
REDIS_URL=redis://localhost:6379  # For production storage

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000      # 1 hour
RATE_LIMIT_MAX_REQUESTS=10        # Max requests per window

# Session Configuration
DEFAULT_SESSION_TTL=1800          # 30 minutes
MAX_SESSION_TTL=3600              # 1 hour
```

## Production Deployment

### Using Redis for Storage

For production, replace the in-memory Map with Redis:

```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Replace sessionStore.set() calls with:
await client.setex(sessionId, ttl, JSON.stringify(sessionRecord));

// Replace sessionStore.get() calls with:
const data = await client.get(sessionId);
const sessionRecord = JSON.parse(data);
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Health Monitoring

The `/health` endpoint provides:
- Server status
- Active session count
- Uptime information
- Memory usage (can be extended)

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_SESSION_DATA` | 400 | Session data not provided |
| `INVALID_ENCRYPTION_KEY` | 400 | Encryption key missing or invalid |
| `INVALID_SESSION_STRUCTURE` | 400 | Session data missing required fields |
| `MISSING_DECRYPTION_KEY` | 400 | Decryption key not provided |
| `SESSION_EXPIRED` | 410 | Session not found or expired |
| `STORAGE_FAILED` | 500 | Failed to store session |
| `RETRIEVAL_FAILED` | 500 | Failed to retrieve/decrypt session |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `NOT_FOUND` | 404 | Endpoint not found |

## Testing

### Unit Tests

```bash
npm test
```

Tests cover:
- Session storage and retrieval
- Encryption/decryption
- Expiration handling
- Rate limiting
- Error scenarios
- Security headers
- CORS functionality

### Manual Testing

Open `test-runner.html` in a browser to:
- Test API endpoints interactively
- Verify server connectivity
- Check session lifecycle
- Test error handling

### Load Testing

For production readiness:

```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 http://localhost:3001/health
```

## Architecture Notes

### Session Lifecycle

1. **Creation**: Client encrypts session data, sends to API
2. **Storage**: Server stores encrypted data with TTL
3. **Retrieval**: Mobile device requests session with decryption key
4. **Cleanup**: Session deleted after use or expiration

### Security Considerations

- **No Plaintext Storage**: All session data encrypted at rest
- **Key Separation**: Encryption keys never stored on server
- **Automatic Cleanup**: Expired sessions removed automatically
- **One-Time Use**: Sessions deleted after successful retrieval
- **Rate Limiting**: Prevents abuse and DoS attacks

### Scalability

- **Stateless Design**: Can be horizontally scaled
- **Redis Support**: For multi-instance deployments
- **Memory Efficient**: Automatic cleanup prevents memory leaks
- **Configurable TTL**: Adjustable session lifetime

## Contributing

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Ensure security best practices

## License

MIT License - see LICENSE file for details
