/**
 * Base64URL encoding/decoding utility for SecureShare
 * Provides URL-safe Base64 encoding without padding
 */

(function() {
  'use strict'

  const base64url = {
    /**
     * Encode string to Base64URL format (URL-safe, no padding)
     * @param {string} str - String to encode
     * @returns {string} Base64URL encoded string
     */
    encode: function(str) {
      try {
        // Convert string to base64
        const base64 = btoa(str)
        
        // Convert to URL-safe format
        return base64
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')
      } catch (error) {
        throw new Error('Base64URL encoding failed: ' + error.message)
      }
    },

    /**
     * Decode Base64URL string back to original string
     * @param {string} base64url - Base64URL encoded string
     * @returns {string} Decoded string
     */
    decode: function(base64url) {
      try {
        // Convert back to standard base64
        let base64 = base64url
          .replace(/-/g, '+')
          .replace(/_/g, '/')
        
        // Add padding if needed
        const padding = base64.length % 4
        if (padding) {
          base64 += '='.repeat(4 - padding)
        }
        
        // Decode from base64
        return atob(base64)
      } catch (error) {
        throw new Error('Base64URL decoding failed: ' + error.message)
      }
    },

    /**
     * Encode object to Base64URL JSON
     * @param {Object} obj - Object to encode
     * @returns {string} Base64URL encoded JSON
     */
    encodeObject: function(obj) {
      try {
        const json = JSON.stringify(obj)
        return this.encode(json)
      } catch (error) {
        throw new Error('Object encoding failed: ' + error.message)
      }
    },

    /**
     * Decode Base64URL JSON back to object
     * @param {string} base64url - Base64URL encoded JSON
     * @returns {Object} Decoded object
     */
    decodeObject: function(base64url) {
      try {
        const json = this.decode(base64url)
        return JSON.parse(json)
      } catch (error) {
        throw new Error('Object decoding failed: ' + error.message)
      }
    }
  }

  // Export to global scope
  window.base64url = base64url
})()
