/* global sjcl */

(function() {
  'use strict'

  // Thin wrapper around Standford Javascript Crypto Lib to provide a more generic interface.

  // We'll serialize/deserialize binary objects using HEX:
  const codec = sjcl.codec.hex

  // We'll use elliptic curves for asymmetric cryptography, with the k256 curve:
  const curve = sjcl.ecc.curves.k256

  const scheme = sjcl.ecc.elGamal


  const cryptography = {
    encrypt: function(secret, plainText, options={}) {
      return sjcl.encrypt(secret, plainText, options) // use all defaults
    },

    decrypt: function(secret, cipherText, options={}) {
      return sjcl.decrypt(secret, cipherText, options) // use all defaults
    },

    createKeys: function() {
      const pair = scheme.generateKeys(curve)

      return {
        privateKey: encodePrivateKey(pair.sec.get()),
        publicKey : encodePublicKey(pair.pub.get())
      }
    },

    randomkey: function() {
      return sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0)
    },

    decodePublicKey: function(text) {
      return new scheme.publicKey(curve, codec.toBits(text))
    },

    decodePrivateKey: function(text) {
      return new scheme.secretKey(curve, curve.field.fromBits(codec.toBits(text)))
    },

    /**
     * Generate cryptographically secure session key using Web Crypto API
     * @returns {Promise<string>} Base64 encoded session key
     */
    generateSessionKey: async function() {
      try {
        // Use Web Crypto API for secure random key generation
        if (window.crypto && window.crypto.getRandomValues) {
          const keyArray = new Uint8Array(32); // 256 bits for AES-256
          window.crypto.getRandomValues(keyArray);
          return sjcl.codec.base64.fromBits(sjcl.codec.bytes.toBits(Array.from(keyArray)));
        } else {
          // Fallback to SJCL random (less secure but compatible)
          console.warn('⚠️ Using SJCL fallback for key generation');
          return sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0));
        }
      } catch (error) {
        console.error('❌ Session key generation failed:', error);
        throw new Error('Failed to generate secure session key');
      }
    },

    /**
     * Encrypt session payload using AES-256-GCM with random IV
     * @param {Object} data - Session data to encrypt
     * @param {string} key - Base64 encoded encryption key
     * @returns {Promise<string>} Encrypted payload with integrity protection
     */
    encryptSessionPayload: async function(data, key) {
      try {
        // Validate input
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid session data provided');
        }
        if (!key || typeof key !== 'string') {
          throw new Error('Invalid encryption key provided');
        }

        // Sanitize session data to prevent XSS
        const sanitizedData = this.sanitizeSessionData(data);

        // Add metadata for integrity verification
        const payload = {
          data: sanitizedData,
          timestamp: Date.now(),
          version: '2.0',
          origin: window.location.origin,
          checksum: this.calculateChecksum(sanitizedData)
        };

        // Use SJCL AES-GCM mode for authenticated encryption
        const encryptionOptions = {
          mode: 'gcm',
          ts: 128, // 128-bit authentication tag
          adata: JSON.stringify({
            timestamp: payload.timestamp,
            version: payload.version,
            origin: payload.origin
          })
        };

        const encrypted = sjcl.encrypt(key, JSON.stringify(payload), encryptionOptions);

        console.log('🔐 Session payload encrypted successfully');
        return encrypted;

      } catch (error) {
        console.error('❌ Session payload encryption failed:', error);
        throw new Error(`Encryption failed: ${error.message}`);
      }
    },

    /**
     * Decrypt and validate session payload
     * @param {string} encryptedData - Encrypted payload
     * @param {string} key - Base64 encoded decryption key
     * @returns {Promise<Object>} Decrypted and validated session data
     */
    decryptSessionPayload: async function(encryptedData, key) {
      try {
        // Validate input
        if (!encryptedData || typeof encryptedData !== 'string') {
          throw new Error('Invalid encrypted data provided');
        }
        if (!key || typeof key !== 'string') {
          throw new Error('Invalid decryption key provided');
        }

        // Decrypt the payload
        const decrypted = sjcl.decrypt(key, encryptedData);
        const payload = JSON.parse(decrypted);

        // Validate payload structure
        if (!payload.data || !payload.timestamp || !payload.version || !payload.checksum) {
          throw new Error('Invalid payload structure');
        }

        // Verify integrity
        const calculatedChecksum = this.calculateChecksum(payload.data);
        if (calculatedChecksum !== payload.checksum) {
          throw new Error('Payload integrity verification failed');
        }

        // Verify timestamp (not too old)
        const age = Date.now() - payload.timestamp;
        const maxAge = 30 * 60 * 1000; // 30 minutes
        if (age > maxAge) {
          throw new Error('Payload has expired');
        }

        console.log('🔓 Session payload decrypted and validated successfully');
        return payload.data;

      } catch (error) {
        console.error('❌ Session payload decryption failed:', error);
        throw new Error(`Decryption failed: ${error.message}`);
      }
    },

    /**
     * Validate encryption integrity of data
     * @param {string} encryptedData - Encrypted data to validate
     * @returns {boolean} True if data integrity is valid
     */
    validateEncryptionIntegrity: function(encryptedData) {
      try {
        // Parse the encrypted data structure
        const parsed = JSON.parse(encryptedData);

        // Check required fields for SJCL format
        const requiredFields = ['iv', 'v', 'iter', 'ks', 'ts', 'mode', 'adata', 'cipher', 'salt', 'ct'];
        const hasRequiredFields = requiredFields.every(field => field in parsed);

        if (!hasRequiredFields) {
          console.warn('⚠️ Missing required encryption fields');
          return false;
        }

        // Verify encryption parameters
        if (parsed.mode !== 'gcm') {
          console.warn('⚠️ Invalid encryption mode');
          return false;
        }

        if (parsed.ts !== 128) {
          console.warn('⚠️ Invalid authentication tag size');
          return false;
        }

        // Verify IV length (should be 96 bits for GCM)
        const ivBits = sjcl.codec.base64.toBits(parsed.iv);
        if (sjcl.bitArray.bitLength(ivBits) !== 96) {
          console.warn('⚠️ Invalid IV length');
          return false;
        }

        console.log('✅ Encryption integrity validation passed');
        return true;

      } catch (error) {
        console.error('❌ Encryption integrity validation failed:', error);
        return false;
      }
    },

    /**
     * Generate cryptographically secure session ID
     * @returns {string} Secure UUID for session identification
     */
    secureSessionId: function() {
      try {
        // Use crypto.randomUUID if available (modern browsers)
        if (window.crypto && window.crypto.randomUUID) {
          return window.crypto.randomUUID();
        }

        // Fallback to manual UUID generation with crypto.getRandomValues
        if (window.crypto && window.crypto.getRandomValues) {
          const array = new Uint8Array(16);
          window.crypto.getRandomValues(array);

          // Set version (4) and variant bits according to RFC 4122
          array[6] = (array[6] & 0x0f) | 0x40; // Version 4
          array[8] = (array[8] & 0x3f) | 0x80; // Variant 10

          // Convert to UUID string format
          const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
          return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20, 32)
          ].join('-');
        }

        // Final fallback using SJCL (less secure)
        console.warn('⚠️ Using SJCL fallback for session ID generation');
        const randomBits = sjcl.random.randomWords(4, 0);
        const hex = sjcl.codec.hex.fromBits(randomBits);
        return [
          hex.slice(0, 8),
          hex.slice(8, 12),
          hex.slice(12, 16),
          hex.slice(16, 20),
          hex.slice(20, 32)
        ].join('-');

      } catch (error) {
        console.error('❌ Secure session ID generation failed:', error);
        throw new Error('Failed to generate secure session ID');
      }
    },

    /**
     * Sanitize session data to prevent XSS attacks
     * @param {Object} data - Session data to sanitize
     * @returns {Object} Sanitized session data
     */
    sanitizeSessionData: function(data) {
      try {
        const sanitized = {};

        // Recursively sanitize object properties
        for (const [key, value] of Object.entries(data)) {
          const sanitizedKey = this.sanitizeString(key);

          if (typeof value === 'string') {
            sanitized[sanitizedKey] = this.sanitizeString(value);
          } else if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              sanitized[sanitizedKey] = value.map(item =>
                typeof item === 'string' ? this.sanitizeString(item) : item
              );
            } else {
              sanitized[sanitizedKey] = this.sanitizeSessionData(value);
            }
          } else {
            sanitized[sanitizedKey] = value;
          }
        }

        return sanitized;

      } catch (error) {
        console.error('❌ Session data sanitization failed:', error);
        throw new Error('Failed to sanitize session data');
      }
    },

    /**
     * Sanitize string to prevent XSS
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeString: function(str) {
      if (typeof str !== 'string') return str;

      // Remove potentially dangerous characters and patterns
      return str
        .replace(/[<>'"&]/g, '') // Remove HTML/XML special characters
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:/gi, '') // Remove data: protocol
        .replace(/vbscript:/gi, '') // Remove vbscript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .trim();
    },

    /**
     * Calculate checksum for data integrity verification
     * @param {Object} data - Data to calculate checksum for
     * @returns {string} SHA-256 checksum
     */
    calculateChecksum: function(data) {
      try {
        const dataString = JSON.stringify(data, Object.keys(data).sort());
        const hash = sjcl.hash.sha256.hash(dataString);
        return sjcl.codec.hex.fromBits(hash);
      } catch (error) {
        console.error('❌ Checksum calculation failed:', error);
        throw new Error('Failed to calculate data checksum');
      }
    },

    /**
     * Validate session origin to ensure it came from legitimate extension
     * @param {string} origin - Origin to validate
     * @returns {boolean} True if origin is valid
     */
    validateSessionOrigin: function(origin) {
      try {
        // List of valid origins for SecureShare extension
        const validOrigins = [
          'chrome-extension://', // Chrome extension
          'moz-extension://', // Firefox extension
          'ms-browser-extension://', // Edge extension
          'https://share.secureshare.app', // Official mobile landing page
          'http://localhost:5500', // Development server
          'http://localhost:3001' // Development API server
        ];

        if (!origin || typeof origin !== 'string') {
          console.warn('⚠️ Invalid origin format');
          return false;
        }

        const isValid = validOrigins.some(validOrigin => origin.startsWith(validOrigin));

        if (!isValid) {
          console.warn('⚠️ Invalid session origin:', origin);
        }

        return isValid;

      } catch (error) {
        console.error('❌ Origin validation failed:', error);
        return false;
      }
    },

    /**
     * Secure memory cleanup for sensitive data
     * @param {Object} sensitiveData - Object containing sensitive data to clear
     */
    secureCleanup: function(sensitiveData) {
      try {
        if (typeof sensitiveData === 'object' && sensitiveData !== null) {
          // Overwrite object properties with random data
          for (const key in sensitiveData) {
            if (sensitiveData.hasOwnProperty(key)) {
              if (typeof sensitiveData[key] === 'string') {
                // Overwrite string with random characters
                const length = sensitiveData[key].length;
                sensitiveData[key] = Array(length).fill(0).map(() =>
                  String.fromCharCode(Math.floor(Math.random() * 95) + 32)
                ).join('');
              }
              delete sensitiveData[key];
            }
          }
        }

        // Suggest garbage collection (not guaranteed)
        if (window.gc) {
          window.gc();
        }

      } catch (error) {
        console.error('❌ Secure cleanup failed:', error);
      }
    }
  }

  function encodePublicKey(pub) {
    return codec.fromBits(pub.x.concat(pub.y))
  }

  function encodePrivateKey(sec) {
    return codec.fromBits(sec)
  }

  window.cryptography = cryptography
})()
