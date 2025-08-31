/**
 * SecureShare Session Storage API
 * Temporary storage server for encrypted session data
 * @version 1.0.0
 */

const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// HTTPS enforcement middleware
const enforceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    console.log(`🔒 Redirecting HTTP to HTTPS: ${req.url}`);
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

app.use(enforceHTTPS);

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://share.secureshare.app"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: [
    'chrome-extension://*',
    'moz-extension://*',
    'http://localhost:6969',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:6969'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Enhanced rate limiting with multiple tiers
const sessionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 sessions per IP per hour
  message: {
    error: 'Too many session requests',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + User-Agent hash for more granular rate limiting
    return `${req.ip}-${crypto.createHash('sha256').update(req.get('User-Agent') || '').digest('hex').substring(0, 8)}`;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Stricter rate limiting for session creation
const createSessionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 session creations per 15 minutes
  message: {
    error: 'Too many session creation attempts',
    code: 'CREATE_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

// General API rate limiting
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 minutes
  message: {
    error: 'Too many requests from this IP',
    code: 'GENERAL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalRateLimit);

// Body parsing with security limits
app.use(express.json({
  limit: '1mb', // Reduced from 10mb for security
  verify: (req, res, buf) => {
    // Verify JSON payload integrity
    try {
      JSON.parse(buf);
    } catch (e) {
      const error = new Error('Invalid JSON payload');
      error.status = 400;
      throw error;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input validation and sanitization middleware
const validateSessionRequest = (req, res, next) => {
  try {
    const { sessionData, encryptionKey, ttl } = req.body;

    // Validate required fields
    if (!sessionData || typeof sessionData !== 'object') {
      return res.status(400).json({
        error: 'Invalid session data',
        code: 'INVALID_SESSION_DATA'
      });
    }

    if (!encryptionKey || typeof encryptionKey !== 'string') {
      return res.status(400).json({
        error: 'Invalid encryption key',
        code: 'INVALID_ENCRYPTION_KEY'
      });
    }

    // Validate TTL
    if (ttl && (typeof ttl !== 'number' || ttl < 60 || ttl > 1800)) {
      return res.status(400).json({
        error: 'TTL must be between 60 and 1800 seconds',
        code: 'INVALID_TTL'
      });
    }

    // Validate session data structure
    if (!sessionData.url || typeof sessionData.url !== 'string') {
      return res.status(400).json({
        error: 'Session data must include valid URL',
        code: 'INVALID_SESSION_URL'
      });
    }

    // Sanitize URL
    try {
      const url = new URL(sessionData.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return res.status(400).json({
          error: 'Only HTTP/HTTPS URLs are allowed',
          code: 'INVALID_URL_PROTOCOL'
        });
      }
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL format',
        code: 'MALFORMED_URL'
      });
    }

    // Validate cookies array
    if (sessionData.cookies && !Array.isArray(sessionData.cookies)) {
      return res.status(400).json({
        error: 'Cookies must be an array',
        code: 'INVALID_COOKIES_FORMAT'
      });
    }

    // Validate individual cookies
    if (sessionData.cookies) {
      for (const cookie of sessionData.cookies) {
        if (!cookie.name || typeof cookie.name !== 'string') {
          return res.status(400).json({
            error: 'Invalid cookie name',
            code: 'INVALID_COOKIE_NAME'
          });
        }

        if (cookie.value && typeof cookie.value !== 'string') {
          return res.status(400).json({
            error: 'Invalid cookie value',
            code: 'INVALID_COOKIE_VALUE'
          });
        }

        // Sanitize cookie name and value
        cookie.name = sanitizeString(cookie.name);
        if (cookie.value) {
          cookie.value = sanitizeString(cookie.value);
        }
      }
    }

    // Sanitize other session data fields
    if (sessionData.title) {
      sessionData.title = sanitizeString(sessionData.title);
    }
    if (sessionData.domain) {
      sessionData.domain = sanitizeString(sessionData.domain);
    }

    next();
  } catch (error) {
    console.error('❌ Session validation failed:', error);
    res.status(400).json({
      error: 'Session validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

// String sanitization function
function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  return str
    .replace(/[<>'"&]/g, '') // Remove HTML/XML special characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .trim()
    .substring(0, 1000); // Limit length
}

// In-memory session storage (use Redis in production)
const sessionStore = new Map();
const cleanupTimers = new Map();

/**
 * Generate cryptographically secure session ID
 * @returns {string} Unique session identifier
 */
function generateSessionId() {
  return crypto.randomUUID();
}

/**
 * Encrypt session data using AES-256-GCM
 * @param {Object} data - Session data to encrypt
 * @param {string} key - Encryption key (hex string)
 * @returns {Object} Encrypted data with IV and auth tag
 */
function encryptSessionData(data, key) {
  try {
    const algorithm = 'aes-256-cbc';
    const keyBuffer = Buffer.from(key.slice(0, 64), 'hex'); // Use first 32 bytes (64 hex chars)
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      algorithm
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt session data using AES-256-GCM
 * @param {Object} encryptedData - Encrypted session data
 * @param {string} key - Decryption key (hex string)
 * @returns {Object} Decrypted session data
 */
function decryptSessionData(encryptedData, key) {
  try {
    const keyBuffer = Buffer.from(key.slice(0, 64), 'hex'); // Use first 32 bytes (64 hex chars)
    const iv = Buffer.from(encryptedData.iv, 'hex');

    const decipher = crypto.createDecipheriv(encryptedData.algorithm, keyBuffer, iv);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Schedule automatic cleanup of expired session
 * @param {string} sessionId - Session ID to cleanup
 * @param {number} ttl - Time to live in seconds
 */
function scheduleCleanup(sessionId, ttl = 1800) { // Default 30 minutes
  const timeoutId = setTimeout(() => {
    if (sessionStore.has(sessionId)) {
      sessionStore.delete(sessionId);
      cleanupTimers.delete(sessionId);
      console.log(`[Cleanup] Expired session removed: ${sessionId}`);
    }
  }, ttl * 1000);
  
  cleanupTimers.set(sessionId, timeoutId);
  console.log(`[Cleanup] Scheduled cleanup for session ${sessionId} in ${ttl} seconds`);
}



/**
 * Validate link expiration middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateLinkExpiration(req, res, next) {
  const sessionId = req.params.id;
  const sessionData = sessionStore.get(sessionId);

  if (!sessionData) {
    return res.status(404).json({
      error: 'Session not found',
      code: 'SESSION_NOT_FOUND'
    });
  }

  // Check if session has expired
  if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
    sessionStore.delete(sessionId);
    cleanupTimers.delete(sessionId);

    return res.status(410).json({
      error: 'Session has expired',
      code: 'SESSION_EXPIRED',
      expiredAt: new Date(sessionData.expiresAt).toISOString(),
      timeRemaining: 0
    });
  }

  // Check if session has been accessed (one-time use)
  if (sessionData.accessCount >= 1) {
    sessionStore.delete(sessionId);
    cleanupTimers.delete(sessionId);

    return res.status(410).json({
      error: 'Session has already been used',
      code: 'SESSION_ALREADY_USED',
      usedAt: sessionData.lastAccessedAt ? new Date(sessionData.lastAccessedAt).toISOString() : null
    });
  }

  // Add time remaining information for client countdown
  req.sessionTimeRemaining = sessionData.expiresAt - Date.now();

  next();
}

// API Routes

/**
 * POST /api/sessions
 * Store encrypted session data and return session ID
 */
app.post('/api/sessions', createSessionRateLimit, validateSessionRequest, (req, res) => {
  try {
    const { sessionData, encryptionKey, ttl = 1800 } = req.body;
    
    // Generate unique session ID
    const sessionId = generateSessionId();
    
    // Encrypt session data
    const encryptedData = encryptSessionData(sessionData, encryptionKey);
    
    // Calculate expiration time
    const expiresAt = Date.now() + (ttl * 1000);
    
    // Store session
    const sessionRecord = {
      sessionId,
      encryptedData,
      createdAt: Date.now(),
      expiresAt,
      accessCount: 0,
      clientIP: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    sessionStore.set(sessionId, sessionRecord);
    
    // Schedule cleanup
    scheduleCleanup(sessionId, ttl);
    
    console.log(`[API] Session stored: ${sessionId}, expires: ${new Date(expiresAt).toISOString()}`);
    
    res.status(201).json({
      sessionId,
      expiresAt,
      ttl,
      message: 'Session stored successfully'
    });
    
  } catch (error) {
    console.error('[API] Session storage failed:', error.message);
    res.status(500).json({
      error: 'Failed to store session',
      code: 'STORAGE_FAILED'
    });
  }
});

/**
 * GET /api/sessions/:id
 * Retrieve and decrypt session data (one-time use)
 */
app.get('/api/sessions/:id', validateLinkExpiration, (req, res) => {
  try {
    const sessionId = req.params.id;
    const { key } = req.query;
    
    if (!key) {
      return res.status(400).json({
        error: 'Decryption key required',
        code: 'MISSING_DECRYPTION_KEY'
      });
    }
    
    const sessionRecord = sessionStore.get(sessionId);

    // Mark session as accessed
    sessionRecord.accessCount++;
    sessionRecord.lastAccessedAt = Date.now();

    // Decrypt session data
    const sessionData = decryptSessionData(sessionRecord.encryptedData, key);

    // Mark session as used (one-time use) - delete after successful retrieval
    markSessionUsed(sessionId);

    console.log(`[API] Session retrieved: ${sessionId}, access count: ${sessionRecord.accessCount}`);

    res.json({
      sessionData,
      metadata: {
        sessionId,
        retrievedAt: new Date().toISOString(),
        timeRemaining: req.sessionTimeRemaining || 0,
        expiresAt: sessionRecord.expiresAt ? new Date(sessionRecord.expiresAt).toISOString() : null,
        createdAt: sessionRecord.createdAt,
        accessCount: sessionRecord.accessCount
      }
    });
    
  } catch (error) {
    console.error('[API] Session retrieval failed:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve session',
      code: 'RETRIEVAL_FAILED'
    });
  }
});

/**
 * Mark session as used and delete it (one-time use)
 * @param {string} sessionId - Session ID to mark as used
 */
function markSessionUsed(sessionId) {
  if (sessionStore.has(sessionId)) {
    sessionStore.delete(sessionId);
    
    // Clear cleanup timer
    if (cleanupTimers.has(sessionId)) {
      clearTimeout(cleanupTimers.get(sessionId));
      cleanupTimers.delete(sessionId);
    }
    
    console.log(`[Cleanup] Session marked as used and removed: ${sessionId}`);
  }
}

/**
 * Cleanup expired sessions (runs every 5 minutes)
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  let expiredCount = 0;
  let usedCount = 0;
  let orphanedCount = 0;
  let totalCleaned = 0;

  for (const [sessionId, sessionRecord] of sessionStore.entries()) {
    let shouldDelete = false;
    let reason = '';

    // Check if session has expired
    if (sessionRecord.expiresAt && now > sessionRecord.expiresAt) {
      expiredCount++;
      shouldDelete = true;
      reason = 'expired';
    }

    // Check if session has been used (one-time use)
    if (sessionRecord.accessCount >= 1) {
      usedCount++;
      shouldDelete = true;
      reason = 'used';
    }

    // Check for orphaned sessions (older than 24 hours)
    if (now - sessionRecord.createdAt > 24 * 60 * 60 * 1000) {
      orphanedCount++;
      shouldDelete = true;
      reason = 'orphaned';
    }

    if (shouldDelete) {
      sessionStore.delete(sessionId);

      if (cleanupTimers.has(sessionId)) {
        clearTimeout(cleanupTimers.get(sessionId));
        cleanupTimers.delete(sessionId);
      }

      totalCleaned++;
      console.log(`[Cleanup] Removed ${reason} session: ${sessionId}`);
    }
  }

  if (totalCleaned > 0) {
    console.log(`[Cleanup] Total removed: ${totalCleaned} sessions (${expiredCount} expired, ${usedCount} used, ${orphanedCount} orphaned)`);
    console.log(`[Cleanup] Active sessions remaining: ${sessionStore.size}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeSessions: sessionStore.size,
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('[Error]', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SecureShare Session Storage API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  
  // Start cleanup interval (every 5 minutes)
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  
  // Clear all timers
  for (const timerId of cleanupTimers.values()) {
    clearTimeout(timerId);
  }
  
  process.exit(0);
});

module.exports = app;
