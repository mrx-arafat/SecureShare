/**
 * Mobile Extension Deep Link Handler
 * This script demonstrates how the mobile SecureShare extension would handle deep links
 * for automatic session application
 */

(function() {
  'use strict'

  const log = console.log.bind(console, '[MobileHandler]')

  const mobileExtensionHandler = {
    /**
     * Initialize mobile extension deep link handling
     */
    init: function() {
      log('🚀 Mobile extension handler initialized')
      
      // Register deep link handler
      this.registerDeepLinkHandler()
      
      // Check if current page is a deep link
      this.checkCurrentURL()
    },

    /**
     * Register deep link handler for secureshare:// protocol
     */
    registerDeepLinkHandler: function() {
      try {
        // In a real mobile extension, this would be registered in manifest.json
        // For testing, we'll simulate the handler
        
        if (window.location.protocol === 'secureshare:') {
          log('🔗 Deep link detected, processing...')
          this.handleDeepLink(window.location.href)
        }

        // Also handle HTTPS catcher URLs
        if (window.location.hostname === 'secureshare.app' && window.location.pathname === '/apply') {
          log('🌐 HTTPS catcher detected, processing...')
          this.handleDeepLink(window.location.href)
        }

        log('✅ Deep link handlers registered')
      } catch (error) {
        log('❌ Failed to register deep link handlers:', error)
      }
    },

    /**
     * Check current URL for deep link patterns
     */
    checkCurrentURL: function() {
      const url = window.location.href
      
      if (url.includes('secureshare://') || url.includes('secureshare.app/apply')) {
        log('📱 Deep link URL detected in current page')
        this.handleDeepLink(url)
      }
    },

    /**
     * Handle deep link URL
     * @param {string} deepLinkUrl - Deep link URL to process
     */
    handleDeepLink: async function(deepLinkUrl) {
      try {
        log('🔄 Processing deep link:', deepLinkUrl)
        
        // Show processing overlay
        this.showProcessingOverlay('Processing SecureShare session...')

        // Parse deep link parameters
        const params = this.parseDeepLinkParams(deepLinkUrl)
        log('📋 Parsed parameters:', params)

        // Get session data
        let sessionData
        if (params.token) {
          // Tokenized payload - fetch from PrivateBin
          sessionData = await this.fetchTokenizedSession(params.token, params.secret)
        } else if (params.data) {
          // Direct payload
          sessionData = await this.decodeSessionData(params.data)
        } else {
          throw new Error('No session data found in deep link')
        }

        log('📦 Session data decoded:', sessionData)

        // Apply cookies
        const appliedCount = await this.applyCookies(sessionData.cookies, sessionData.url)
        log(`✅ Applied ${appliedCount} cookies`)

        // Show success and redirect
        this.showSuccessOverlay(`Session applied! Redirecting to ${sessionData.title}...`)
        
        setTimeout(() => {
          window.location.href = sessionData.url
        }, 2000)

      } catch (error) {
        log('❌ Deep link processing failed:', error)
        this.showErrorOverlay('Failed to apply session: ' + error.message)
      }
    },

    /**
     * Parse deep link parameters
     * @param {string} url - Deep link URL
     * @returns {Object} Parsed parameters
     */
    parseDeepLinkParams: function(url) {
      try {
        const urlObj = new URL(url.replace('secureshare://', 'https://'))
        const params = new URLSearchParams(urlObj.search)
        
        return {
          version: params.get('v'),
          data: params.get('data'),
          token: params.get('token'),
          secret: params.get('k')
        }
      } catch (error) {
        throw new Error('Invalid deep link format: ' + error.message)
      }
    },

    /**
     * Decode session data from payload
     * @param {string} encodedData - Base64URL encoded session data
     * @returns {Promise<Object>} Decoded session data
     */
    decodeSessionData: async function(encodedData) {
      try {
        // This would use the actual payloadManager in a real extension
        const decoded = atob(encodedData.replace(/-/g, '+').replace(/_/g, '/'))
        return JSON.parse(decoded)
      } catch (error) {
        throw new Error('Failed to decode session data: ' + error.message)
      }
    },

    /**
     * Fetch tokenized session from PrivateBin
     * @param {string} token - Token ID
     * @param {string} secret - Decryption secret
     * @returns {Promise<Object>} Session data
     */
    fetchTokenizedSession: async function(token, secret) {
      try {
        // Simulate PrivateBin fetch
        log('🎫 Fetching tokenized session:', token)
        
        // In a real implementation, this would fetch from PrivateBin
        throw new Error('Tokenized session fetching not implemented in demo')
        
      } catch (error) {
        throw new Error('Failed to fetch tokenized session: ' + error.message)
      }
    },

    /**
     * Apply cookies using extension API
     * @param {Array} cookies - Cookies to apply
     * @param {string} url - Target URL
     * @returns {Promise<number>} Number of cookies applied
     */
    applyCookies: async function(cookies, url) {
      try {
        log('🍪 Applying cookies for:', url)
        
        // Simulate cookie application
        // In a real mobile extension, this would use chrome.cookies.set
        
        let appliedCount = 0
        for (const cookie of cookies) {
          try {
            // Simulate cookie setting
            log(`Setting cookie: ${cookie.name} = ${cookie.value}`)
            
            // In real extension:
            // await chrome.cookies.set({
            //   url: url,
            //   name: cookie.name,
            //   value: cookie.value,
            //   domain: cookie.domain,
            //   path: cookie.path || '/',
            //   secure: cookie.secure || false,
            //   httpOnly: cookie.httpOnly || false
            // })
            
            appliedCount++
          } catch (error) {
            log(`Failed to set cookie ${cookie.name}:`, error.message)
          }
        }

        return appliedCount
      } catch (error) {
        throw new Error('Cookie application failed: ' + error.message)
      }
    },

    /**
     * Show processing overlay
     * @param {string} message - Processing message
     */
    showProcessingOverlay: function(message) {
      this.createOverlay('processing', '🔄', message, '#007bff')
    },

    /**
     * Show success overlay
     * @param {string} message - Success message
     */
    showSuccessOverlay: function(message) {
      this.createOverlay('success', '✅', message, '#28a745')
    },

    /**
     * Show error overlay
     * @param {string} message - Error message
     */
    showErrorOverlay: function(message) {
      this.createOverlay('error', '❌', message, '#dc3545')
    },

    /**
     * Create overlay element
     * @param {string} type - Overlay type
     * @param {string} icon - Icon to display
     * @param {string} message - Message to display
     * @param {string} color - Primary color
     */
    createOverlay: function(type, icon, message, color) {
      // Remove existing overlay
      const existing = document.getElementById('secureshare-overlay')
      if (existing) {
        existing.remove()
      }

      // Create new overlay
      const overlay = document.createElement('div')
      overlay.id = 'secureshare-overlay'
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
        text-align: center;
      `

      overlay.innerHTML = `
        <div style="
          background: ${color};
          padding: 40px;
          border-radius: 20px;
          max-width: 400px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
          <div style="font-size: 3em; margin-bottom: 20px;">${icon}</div>
          <h2 style="margin: 0 0 15px 0; font-size: 1.5em;">SecureShare</h2>
          <p style="margin: 0; font-size: 1.1em; line-height: 1.4;">${message}</p>
          ${type === 'error' ? `
            <button onclick="document.getElementById('secureshare-overlay').remove()" 
                    style="
                      background: white;
                      color: ${color};
                      padding: 12px 24px;
                      border: none;
                      border-radius: 8px;
                      font-weight: bold;
                      cursor: pointer;
                      margin-top: 20px;
                      font-size: 14px;
                    ">
              Close
            </button>
          ` : ''}
        </div>
      `

      document.body.appendChild(overlay)

      // Auto-remove processing overlay after timeout
      if (type === 'processing') {
        setTimeout(() => {
          if (overlay.parentElement) {
            overlay.remove()
          }
        }, 10000)
      }
    }
  }

  // Auto-initialize if this is a mobile environment
  if (window.navigator.userAgent.includes('Mobile') || window.location.protocol === 'secureshare:') {
    mobileExtensionHandler.init()
  }

  // Export for testing
  window.mobileExtensionHandler = mobileExtensionHandler

})()

// Test function for demonstration
function testMobileDeepLink() {
  const testUrl = 'secureshare://apply?v=1&data=eyJ1cmwiOiJodHRwczovL2dpdGh1Yi5jb20vbXJ4LWFyYWZhdCIsInRpdGxlIjoidGVzdCIsImNvb2tpZXMiOlt7Im5hbWUiOiJ0ZXN0IiwidmFsdWUiOiIxMjMifV19'
  
  console.log('🧪 Testing mobile deep link:', testUrl)
  window.mobileExtensionHandler.handleDeepLink(testUrl)
}
