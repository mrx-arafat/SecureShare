/**
 * Session Capture Module
 * Enhanced session data extraction and validation for mobile sharing
 * @module sessionCapture
 */
(function() {
  'use strict'

  /**
   * Session Capture Class
   * Handles extraction, validation, and formatting of session data
   */
  class SessionCapture {
    constructor() {
      this.supportedProtocols = ['http:', 'https:']
      this.unsupportedUrls = ['chrome://', 'chrome-extension://', 'file://', 'about:', 'moz-extension://']
      this.essentialCookiePatterns = [
        // Authentication cookies
        /session/i, /auth/i, /login/i, /token/i, /jwt/i, /bearer/i,
        // User identification
        /user/i, /uid/i, /id/i, /account/i, /profile/i,
        // Platform-specific patterns
        /netflix/i, /amazon/i, /google/i, /facebook/i, /twitter/i,
        /instagram/i, /linkedin/i, /github/i, /microsoft/i,
        // Security and state
        /csrf/i, /xsrf/i, /state/i, /nonce/i, /remember/i
      ]
      this.trackingCookiePatterns = [
        /^_ga/, /^_gid/, /^_gat/, /^_utm/, /^__utm/,
        /analytics/i, /tracking/i, /pixel/i, /ads/i, /marketing/i
      ]
    }

    /**
     * Capture current session data from active tab
     * @returns {Promise<Object>} Session data object
     */
    async captureCurrentSession() {
      try {
        log('[SessionCapture] Starting session capture...')
        
        // Get current active tab
        const tab = await this.getCurrentTab()
        log('[SessionCapture] Current tab:', tab.url, tab.title)
        
        // Validate if session can be shared
        this.validateSessionData({ url: tab.url, title: tab.title })
        
        // Extract session cookies
        const cookies = await this.extractSessionCookies(tab.url)
        log('[SessionCapture] Extracted cookies count:', cookies.length)
        
        // Filter essential cookies
        const essentialCookies = this.filterEssentialCookies(cookies)
        log('[SessionCapture] Essential cookies count:', essentialCookies.length)
        
        // Create session payload
        const sessionPayload = this.createSessionPayload({
          url: tab.url,
          title: tab.title,
          cookies: essentialCookies,
          domain: this.extractDomain(tab.url)
        })
        
        log('[SessionCapture] Session capture completed successfully')
        return sessionPayload
        
      } catch (error) {
        log('[SessionCapture] Session capture failed:', error.message)
        throw new Error(`Session capture failed: ${error.message}`)
      }
    }

    /**
     * Get current active tab using Chrome tabs API
     * @returns {Promise<Object>} Tab object
     */
    getCurrentTab() {
      return new Promise((resolve, reject) => {
        if (!chrome || !chrome.tabs) {
          reject(new Error('Chrome tabs API not available'))
          return
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
            return
          }
          
          if (!tabs || tabs.length === 0) {
            reject(new Error('No active tab found'))
            return
          }
          
          resolve(tabs[0])
        })
      })
    }

    /**
     * Extract session cookies for a given URL
     * @param {string} url - Target URL
     * @returns {Promise<Array>} Array of cookie objects
     */
    extractSessionCookies(url) {
      return new Promise((resolve, reject) => {
        if (!chrome || !chrome.cookies) {
          reject(new Error('Chrome cookies API not available'))
          return
        }

        chrome.cookies.getAll({ url }, (cookies) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
            return
          }
          
          if (!cookies) {
            resolve([])
            return
          }
          
          // Clean and standardize cookie data
          const cleanedCookies = cookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path || '/',
            secure: cookie.secure || false,
            httpOnly: cookie.httpOnly || false,
            expirationDate: cookie.expirationDate
          }))
          
          resolve(cleanedCookies)
        })
      })
    }

    /**
     * Validate session data for shareability
     * @param {Object} sessionData - Session data to validate
     * @throws {Error} If session data is invalid or unshareable
     */
    validateSessionData(sessionData) {
      if (!sessionData) {
        throw new Error('Session data is required')
      }
      
      if (!sessionData.url) {
        throw new Error('Session URL is required')
      }
      
      // Check for unsupported URLs
      const url = sessionData.url.toLowerCase()
      for (const unsupportedUrl of this.unsupportedUrls) {
        if (url.startsWith(unsupportedUrl)) {
          throw new Error(`Cannot share ${unsupportedUrl} pages`)
        }
      }
      
      // Validate protocol
      try {
        const urlObj = new URL(sessionData.url)
        if (!this.supportedProtocols.includes(urlObj.protocol)) {
          throw new Error(`Unsupported protocol: ${urlObj.protocol}`)
        }
      } catch (error) {
        throw new Error('Invalid URL format')
      }
      
      if (!sessionData.title) {
        log('[SessionCapture] Warning: No page title available')
      }
    }

    /**
     * Filter essential cookies from all cookies
     * @param {Array} cookies - All cookies
     * @returns {Array} Essential cookies only
     */
    filterEssentialCookies(cookies) {
      if (!cookies || !Array.isArray(cookies)) {
        return []
      }

      return cookies.filter(cookie => {
        // Skip empty or invalid cookies
        if (!cookie.name || !cookie.value) {
          return false
        }

        // Remove tracking cookies
        for (const pattern of this.trackingCookiePatterns) {
          if (pattern.test(cookie.name)) {
            log('[SessionCapture] Filtering out tracking cookie:', cookie.name)
            return false
          }
        }

        // Keep essential cookies
        for (const pattern of this.essentialCookiePatterns) {
          if (pattern.test(cookie.name)) {
            log('[SessionCapture] Keeping essential cookie:', cookie.name)
            return true
          }
        }

        // Keep cookies with authentication-like values
        if (this.isAuthenticationCookie(cookie)) {
          log('[SessionCapture] Keeping auth-like cookie:', cookie.name)
          return true
        }

        // Default: keep if not obviously tracking
        return true
      })
    }

    /**
     * Check if cookie appears to be authentication-related
     * @param {Object} cookie - Cookie object
     * @returns {boolean} True if appears to be auth cookie
     */
    isAuthenticationCookie(cookie) {
      // Check for JWT-like tokens
      if (cookie.value.includes('.') && cookie.value.length > 50) {
        return true
      }

      // Check for session-like values
      if (cookie.value.length > 20 && /^[a-zA-Z0-9+/=]+$/.test(cookie.value)) {
        return true
      }

      // Check for secure flags
      if (cookie.secure && cookie.httpOnly) {
        return true
      }

      return false
    }

    /**
     * Create standardized session payload
     * @param {Object} sessionData - Raw session data
     * @returns {Object} Formatted session payload
     */
    createSessionPayload(sessionData) {
      const payload = {
        version: '1.0',
        url: sessionData.url,
        title: sessionData.title || 'Untitled Page',
        domain: sessionData.domain,
        cookies: sessionData.cookies || [],
        timestamp: Date.now(),
        metadata: {
          cookieCount: sessionData.cookies ? sessionData.cookies.length : 0,
          userAgent: navigator.userAgent,
          captureMethod: 'sessionCapture'
        }
      }

      // Validate payload
      if (payload.cookies.length === 0) {
        log('[SessionCapture] Warning: No cookies captured for session')
      }

      return payload
    }

    /**
     * Extract domain from URL
     * @param {string} url - Full URL
     * @returns {string} Domain name
     */
    extractDomain(url) {
      try {
        const urlObj = new URL(url)
        return urlObj.hostname
      } catch (error) {
        log('[SessionCapture] Failed to extract domain from URL:', url)
        return 'unknown'
      }
    }

    /**
     * Check if user appears to be logged in based on cookies
     * @param {Array} cookies - Session cookies
     * @returns {Object} Login status information
     */
    detectLoginStatus(cookies) {
      const loginIndicators = {
        hasAuthCookies: false,
        hasSessionCookies: false,
        hasUserCookies: false,
        confidence: 0
      }

      if (!cookies || cookies.length === 0) {
        return { ...loginIndicators, status: 'not_logged_in', message: 'No cookies found' }
      }

      for (const cookie of cookies) {
        const name = cookie.name.toLowerCase()
        
        // Check for authentication indicators
        if (/auth|login|token|jwt|bearer/.test(name)) {
          loginIndicators.hasAuthCookies = true
          loginIndicators.confidence += 30
        }
        
        // Check for session indicators
        if (/session|sess/.test(name)) {
          loginIndicators.hasSessionCookies = true
          loginIndicators.confidence += 25
        }
        
        // Check for user indicators
        if (/user|uid|profile|account/.test(name)) {
          loginIndicators.hasUserCookies = true
          loginIndicators.confidence += 20
        }
      }

      // Determine status
      let status = 'unknown'
      let message = 'Unable to determine login status'
      
      if (loginIndicators.confidence >= 50) {
        status = 'logged_in'
        message = 'User appears to be logged in'
      } else if (loginIndicators.confidence >= 20) {
        status = 'possibly_logged_in'
        message = 'User might be logged in'
      } else {
        status = 'not_logged_in'
        message = 'User does not appear to be logged in'
      }

      return {
        ...loginIndicators,
        status,
        message,
        cookieCount: cookies.length
      }
    }
  }

  // Export SessionCapture class
  window.SessionCapture = SessionCapture

  // Create global instance for backward compatibility
  window.sessionCapture = new SessionCapture()

  log('[SessionCapture] Module loaded successfully')

})()
