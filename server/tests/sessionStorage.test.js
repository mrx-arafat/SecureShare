/**
 * Session Storage API Tests
 * Comprehensive test suite for the session storage functionality
 */

const request = require('supertest');
const crypto = require('crypto');
const app = require('../sessionStorage');

describe('Session Storage API', () => {
  let testSessionData;
  let testEncryptionKey;
  let testSessionId;

  beforeEach(() => {
    // Generate test data
    testSessionData = {
      url: 'https://netflix.com/browse',
      title: 'Netflix - Home',
      domain: 'netflix.com',
      cookies: [
        {
          name: 'NetflixId',
          value: 'v%3D2%26mac%3DAQEAEAABAAhQKKAqEC',
          domain: '.netflix.com',
          path: '/',
          secure: true,
          httpOnly: true
        },
        {
          name: 'session_token',
          value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          domain: 'netflix.com',
          path: '/',
          secure: true,
          httpOnly: false
        }
      ],
      timestamp: Date.now()
    };

    // Generate test encryption key (32 bytes = 64 hex chars)
    testEncryptionKey = crypto.randomBytes(32).toString('hex');
  });

  describe('POST /api/sessions', () => {
    it('should store session data successfully', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          sessionData: testSessionData,
          encryptionKey: testEncryptionKey,
          ttl: 1800
        })
        .expect(201);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body).toHaveProperty('ttl', 1800);
      expect(response.body).toHaveProperty('message', 'Session stored successfully');

      // Store for later tests
      testSessionId = response.body.sessionId;
    });

    it('should reject request without session data', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          encryptionKey: testEncryptionKey
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing session data');
      expect(response.body).toHaveProperty('code', 'MISSING_SESSION_DATA');
    });

    it('should reject request without encryption key', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          sessionData: testSessionData
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid encryption key');
      expect(response.body).toHaveProperty('code', 'INVALID_ENCRYPTION_KEY');
    });

    it('should reject request with invalid session structure', async () => {
      const invalidSessionData = {
        title: 'Test Page'
        // Missing url and cookies
      };

      const response = await request(app)
        .post('/api/sessions')
        .send({
          sessionData: invalidSessionData,
          encryptionKey: testEncryptionKey
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid session data structure');
      expect(response.body).toHaveProperty('code', 'INVALID_SESSION_STRUCTURE');
    });

    it('should use default TTL when not specified', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          sessionData: testSessionData,
          encryptionKey: testEncryptionKey
        })
        .expect(201);

      expect(response.body).toHaveProperty('ttl', 1800); // Default 30 minutes
    });

    it('should generate unique session IDs', async () => {
      const sessionIds = new Set();

      // Create multiple sessions
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/sessions')
          .send({
            sessionData: testSessionData,
            encryptionKey: crypto.randomBytes(32).toString('hex')
          })
          .expect(201);

        sessionIds.add(response.body.sessionId);
      }

      // All session IDs should be unique
      expect(sessionIds.size).toBe(5);
    });
  });

  describe('GET /api/sessions/:id', () => {
    beforeEach(async () => {
      // Create a session for retrieval tests
      const response = await request(app)
        .post('/api/sessions')
        .send({
          sessionData: testSessionData,
          encryptionKey: testEncryptionKey,
          ttl: 3600 // 1 hour for testing
        });

      testSessionId = response.body.sessionId;
    });

    it('should retrieve and decrypt session data successfully', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}`)
        .query({ key: testEncryptionKey })
        .expect(200);

      expect(response.body).toHaveProperty('sessionData');
      expect(response.body).toHaveProperty('metadata');

      // Verify decrypted data matches original
      const retrievedData = response.body.sessionData;
      expect(retrievedData.url).toBe(testSessionData.url);
      expect(retrievedData.title).toBe(testSessionData.title);
      expect(retrievedData.cookies).toHaveLength(testSessionData.cookies.length);
      expect(retrievedData.cookies[0].name).toBe(testSessionData.cookies[0].name);
    });

    it('should delete session after retrieval (one-time use)', async () => {
      // First retrieval should succeed
      await request(app)
        .get(`/api/sessions/${testSessionId}`)
        .query({ key: testEncryptionKey })
        .expect(200);

      // Second retrieval should fail
      await request(app)
        .get(`/api/sessions/${testSessionId}`)
        .query({ key: testEncryptionKey })
        .expect(410);
    });

    it('should reject request without decryption key', async () => {
      const response = await request(app)
        .get(`/api/sessions/${testSessionId}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Decryption key required');
      expect(response.body).toHaveProperty('code', 'MISSING_DECRYPTION_KEY');
    });

    it('should reject request with wrong decryption key', async () => {
      const wrongKey = crypto.randomBytes(32).toString('hex');

      const response = await request(app)
        .get(`/api/sessions/${testSessionId}`)
        .query({ key: wrongKey })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to retrieve session');
      expect(response.body).toHaveProperty('code', 'RETRIEVAL_FAILED');
    });

    it('should return 410 for non-existent session', async () => {
      const fakeSessionId = crypto.randomUUID();

      const response = await request(app)
        .get(`/api/sessions/${fakeSessionId}`)
        .query({ key: testEncryptionKey })
        .expect(410);

      expect(response.body).toHaveProperty('error', 'Session expired or not found');
      expect(response.body).toHaveProperty('code', 'SESSION_EXPIRED');
    });
  });

  describe('Session Expiration', () => {
    it('should automatically expire sessions after TTL', async () => {
      // Create session with very short TTL
      const response = await request(app)
        .post('/api/sessions')
        .send({
          sessionData: testSessionData,
          encryptionKey: testEncryptionKey,
          ttl: 1 // 1 second
        });

      const sessionId = response.body.sessionId;

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Session should be expired
      await request(app)
        .get(`/api/sessions/${sessionId}`)
        .query({ key: testEncryptionKey })
        .expect(410);
    });

    it('should handle manual expiration check', async () => {
      // Create session with past expiration time (simulate expired session)
      const pastTime = Date.now() - 10000; // 10 seconds ago
      
      // This test would require access to internal session store
      // In a real implementation, you might want to add a test endpoint
      // or use dependency injection for testing
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on session creation', async () => {
      const requests = [];
      
      // Make multiple requests quickly (more than the limit)
      for (let i = 0; i < 12; i++) {
        requests.push(
          request(app)
            .post('/api/sessions')
            .send({
              sessionData: testSessionData,
              encryptionKey: crypto.randomBytes(32).toString('hex')
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for security headers added by helmet
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('activeSessions');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });
  });

  describe('CORS', () => {
    it('should allow requests from extension origins', async () => {
      const response = await request(app)
        .options('/api/sessions')
        .set('Origin', 'chrome-extension://abcdef123456')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeTruthy();
    });

    it('should allow requests from localhost development', async () => {
      const response = await request(app)
        .options('/api/sessions')
        .set('Origin', 'http://localhost:5500')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeTruthy();
    });
  });
});
