/**
 * Payload Manager for SecureShare QR Mobile Flow
 * Handles compression, encryption, and payload size optimization
 */

(function() {
  'use strict'

  const log = window.log ? window.log.bind('[PayloadManager]') : console.log.bind(console, '[PayloadManager]')

  const payloadManager = {
    // Maximum payload size for reliable QR scanning (2.5KB target, 3KB hard cap)
    MAX_PAYLOAD_SIZE: 2500,
    HARD_CAP_SIZE: 3000,

    /**
     * Create compact session payload from session data
     * @param {Object} sessionData - Raw session data with cookies, url, title, timestamp
     * @param {string} recipientPublicKey - Optional recipient public key for encryption
     * @returns {Promise<Object>} Payload object with data and metadata
     */
    createPayload: async function(sessionData, recipientPublicKey = null) {
      try {
        log('Creating compact session payload...')
        
        // Step 1: Clean and validate session data
        const cleanData = this.cleanSessionData(sessionData)
        log('Cleaned session data:', cleanData)

        // Step 2: Create payload envelope
        const envelope = {
          v: 1, // Version
          t: Math.floor(Date.now() / 1000), // Timestamp (Unix)
          ttl: 3600, // TTL in seconds (1 hour default)
          url: cleanData.url,
          title: cleanData.title,
          cookies: cleanData.cookies
        }

        // Step 3: Compress payload
        const compressed = await this.compressPayload(envelope)
        log('Compressed payload size:', compressed.length)

        // Step 4: Encrypt if public key provided
        let finalPayload = compressed
        if (recipientPublicKey) {
          try {
            finalPayload = await this.encryptPayload(compressed, recipientPublicKey)
            log('Encrypted payload size:', finalPayload.length)
          } catch (error) {
            log('Encryption failed, using unencrypted payload:', error.message)
            // Fall back to unencrypted if encryption fails
          }
        }

        // Step 5: Encode to Base64URL
        const encoded = base64url.encode(finalPayload)
        log('Final encoded payload size:', encoded.length)

        return {
          data: encoded,
          size: encoded.length,
          compressed: compressed.length < JSON.stringify(envelope).length,
          encrypted: finalPayload !== compressed,
          needsTokenization: encoded.length > this.MAX_PAYLOAD_SIZE
        }

      } catch (error) {
        log('Payload creation failed:', error)
        throw new Error('Failed to create payload: ' + error.message)
      }
    },

    /**
     * Clean and validate session data
     * @param {Object} sessionData - Raw session data
     * @returns {Object} Cleaned session data
     */
    cleanSessionData: function(sessionData) {
      if (!sessionData || !sessionData.url) {
        throw new Error('Invalid session data: missing URL')
      }

      // Clean cookies - only keep essential fields
      const cleanCookies = (sessionData.cookies || []).map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || '/',
        secure: cookie.secure || false,
        httpOnly: cookie.httpOnly || false,
        expirationDate: cookie.expirationDate
      })).filter(cookie => cookie.name && cookie.value)

      return {
        url: sessionData.url,
        title: sessionData.title || 'Shared Session',
        cookies: cleanCookies,
        timestamp: sessionData.timestamp || Date.now()
      }
    },

    /**
     * Compress payload using RawDeflate
     * @param {Object} data - Data to compress
     * @returns {Promise<string>} Compressed data
     */
    compressPayload: async function(data) {
      try {
        const json = JSON.stringify(data)
        
        // Use RawDeflate if available
        if (typeof RawDeflate !== 'undefined' && RawDeflate.deflate) {
          log('Using RawDeflate compression...')
          const compressed = RawDeflate.deflate(json)
          
          // Only use compression if it actually reduces size
          if (compressed.length < json.length) {
            log('Compression effective:', json.length, '->', compressed.length)
            return compressed
          } else {
            log('Compression not effective, using original')
            return json
          }
        } else {
          log('RawDeflate not available, using uncompressed JSON')
          return json
        }
      } catch (error) {
        log('Compression failed, using original:', error.message)
        return JSON.stringify(data)
      }
    },

    /**
     * Encrypt payload using SJCL
     * @param {string} data - Data to encrypt
     * @param {string} publicKey - Recipient's public key
     * @returns {Promise<string>} Encrypted data
     */
    encryptPayload: async function(data, publicKey) {
      try {
        if (!window.cryptography || !window.cryptography.encrypt) {
          throw new Error('Cryptography module not available')
        }

        log('Encrypting payload with public key...')
        const encrypted = window.cryptography.encrypt(publicKey, data)
        return encrypted
      } catch (error) {
        throw new Error('Encryption failed: ' + error.message)
      }
    },

    /**
     * Create tokenized payload using PrivateBin
     * @param {string} payload - Large payload to tokenize
     * @returns {Promise<Object>} Token and secret for retrieval
     */
    createTokenizedPayload: async function(payload) {
      try {
        log('Creating tokenized payload via PrivateBin...')
        
        if (!window.shareText || !window.shareText.getLink) {
          throw new Error('ShareText module not available')
        }

        return new Promise((resolve, reject) => {
          window.shareText.getLink(payload, 
            (shareUrl) => {
              try {
                // Extract token and secret from PrivateBin URL
                const url = new URL(shareUrl)
                const pathParts = url.pathname.split('/')
                const fragment = url.hash.substring(1)
                
                const token = pathParts[pathParts.length - 1]
                const secret = fragment
                
                log('Tokenized payload created:', { token, secret })
                resolve({ token, secret, url: shareUrl })
              } catch (error) {
                reject(new Error('Failed to parse tokenized URL: ' + error.message))
              }
            },
            (error) => {
              reject(new Error('Tokenization failed: ' + error.message))
            }
          )
        })
      } catch (error) {
        throw new Error('Tokenization setup failed: ' + error.message)
      }
    },

    /**
     * Decode payload from Base64URL
     * @param {string} encodedPayload - Base64URL encoded payload
     * @param {string} privateKey - Optional private key for decryption
     * @returns {Promise<Object>} Decoded session data
     */
    decodePayload: async function(encodedPayload, privateKey = null) {
      try {
        log('Decoding payload...')
        
        // Step 1: Decode from Base64URL
        const decoded = base64url.decode(encodedPayload)
        
        // Step 2: Try to decrypt if it looks encrypted
        let decrypted = decoded
        if (privateKey && this.looksEncrypted(decoded)) {
          try {
            decrypted = await this.decryptPayload(decoded, privateKey)
            log('Payload decrypted successfully')
          } catch (error) {
            log('Decryption failed, trying as unencrypted:', error.message)
          }
        }

        // Step 3: Try to decompress if it looks compressed
        let decompressed = decrypted
        if (this.looksCompressed(decrypted)) {
          try {
            decompressed = await this.decompressPayload(decrypted)
            log('Payload decompressed successfully')
          } catch (error) {
            log('Decompression failed, trying as uncompressed:', error.message)
          }
        }

        // Step 4: Parse JSON
        const sessionData = JSON.parse(decompressed)
        
        // Step 5: Validate payload
        this.validatePayload(sessionData)
        
        return sessionData
      } catch (error) {
        throw new Error('Payload decoding failed: ' + error.message)
      }
    },

    /**
     * Check if data looks encrypted (SJCL format)
     * @param {string} data - Data to check
     * @returns {boolean} True if looks encrypted
     */
    looksEncrypted: function(data) {
      try {
        const parsed = JSON.parse(data)
        return parsed.iv && parsed.v && parsed.cipher
      } catch (error) {
        return false
      }
    },

    /**
     * Check if data looks compressed
     * @param {string} data - Data to check
     * @returns {boolean} True if looks compressed
     */
    looksCompressed: function(data) {
      // Simple heuristic: compressed data usually has non-printable characters
      return data.length > 0 && !/^[\x20-\x7E]*$/.test(data)
    },

    /**
     * Decompress payload
     * @param {string} compressed - Compressed data
     * @returns {Promise<string>} Decompressed data
     */
    decompressPayload: async function(compressed) {
      try {
        if (typeof RawDeflate !== 'undefined' && RawDeflate.inflate) {
          return RawDeflate.inflate(compressed)
        } else {
          throw new Error('RawDeflate not available')
        }
      } catch (error) {
        throw new Error('Decompression failed: ' + error.message)
      }
    },

    /**
     * Decrypt payload
     * @param {string} encrypted - Encrypted data
     * @param {string} privateKey - Private key for decryption
     * @returns {Promise<string>} Decrypted data
     */
    decryptPayload: async function(encrypted, privateKey) {
      try {
        if (!window.cryptography || !window.cryptography.decrypt) {
          throw new Error('Cryptography module not available')
        }

        return window.cryptography.decrypt(privateKey, encrypted)
      } catch (error) {
        throw new Error('Decryption failed: ' + error.message)
      }
    },

    /**
     * Validate decoded payload
     * @param {Object} payload - Decoded payload
     * @throws {Error} If payload is invalid
     */
    validatePayload: function(payload) {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid payload format')
      }

      if (!payload.v || payload.v !== 1) {
        throw new Error('Unsupported payload version')
      }

      if (!payload.url || typeof payload.url !== 'string') {
        throw new Error('Invalid or missing URL')
      }

      if (!payload.cookies || !Array.isArray(payload.cookies)) {
        throw new Error('Invalid or missing cookies')
      }

      // Check TTL
      const now = Math.floor(Date.now() / 1000)
      if (payload.t && payload.ttl && (now - payload.t) > payload.ttl) {
        throw new Error('Payload has expired')
      }

      log('Payload validation passed')
    }
  }

  // Export to global scope
  window.payloadManager = payloadManager
})()
