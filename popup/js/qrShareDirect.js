/**
 * QR Share Direct - Advanced Mobile Flow with Auto-Apply
 *
 * This module implements a sophisticated QR code system for mobile devices:
 *
 * AUTO-APPLY FLOW:
 * - When SecureShare mobile extension is installed, scanning QR opens deep link
 * - Extension intercepts link, applies cookies automatically, redirects to site
 * - User is logged in within 3-5 seconds
 *
 * FALLBACK FLOW:
 * - When extension is not installed, QR opens instruction page
 * - User can copy session data and paste into extension manually
 * - Clear step-by-step instructions provided
 *
 * PAYLOAD OPTIMIZATION:
 * - Compression using RawDeflate for large sessions
 * - Encryption using SJCL when recipient public key available
 * - Tokenization via PrivateBin for oversized payloads
 * - Base64URL encoding for URL safety
 */

(function() {
  'use strict'

  const log = window.log ? window.log.bind('[QRShareDirect]') : console.log.bind(console, '[QRShareDirect]')

  const qrShareDirect = {
    // Configuration
    PREFER_DEEP_LINK: true,
    PREFER_ENCRYPTION: true,
    MAX_QR_SIZE: 2500, // Target size for reliable scanning

    /**
     * Generate advanced QR code with auto-apply and fallback
     * @param {Object} sessionData - Current session data (cookies, url, title)
     * @param {string} canvasId - ID of the canvas element
     * @param {string} recipientPublicKey - Optional recipient public key for encryption
     * @returns {Promise<string>} Generated QR URL (deep link or fallback)
     */
    generateDirectLoginQR: async function(sessionData, canvasId = 'js-qr-canvas-share', recipientPublicKey = null) {
      log('🚀 Generating advanced mobile QR with auto-apply...')

      try {
        // Step 1: Validate session data
        this.validateSessionData(sessionData)

        // Step 2: Create optimized payload
        const payload = await this.createOptimizedPayload(sessionData, recipientPublicKey)
        log('📦 Payload created:', {
          size: payload.size,
          compressed: payload.compressed,
          encrypted: payload.encrypted,
          needsTokenization: payload.needsTokenization
        })

        // Step 3: Generate QR URL (deep link or tokenized)
        let qrUrl
        if (payload.needsTokenization) {
          qrUrl = await this.generateTokenizedQR(payload, sessionData)
        } else {
          qrUrl = await this.generateDirectQR(payload, sessionData)
        }

        // Step 4: Render QR code
        await this.renderQRCode(qrUrl, canvasId)

        log('✅ Advanced QR generated successfully!')
        log('📱 QR URL type:', qrUrl.startsWith('secureshare://') ? 'Deep Link (Auto-Apply)' : 'Fallback Page')

        return qrUrl

      } catch (error) {
        log('❌ QR generation failed:', error)

        // Emergency fallback - create simple instruction page
        try {
          const fallbackUrl = await this.createEmergencyFallback(sessionData)
          await this.renderQRCode(fallbackUrl, canvasId)
          return fallbackUrl
        } catch (fallbackError) {
          log('💥 Emergency fallback also failed:', fallbackError)
          throw new Error('QR generation completely failed: ' + error.message)
        }
      }
    },

    /**
     * Validate session data before processing
     * @param {Object} sessionData - Session data to validate
     * @throws {Error} If validation fails
     */
    validateSessionData: function(sessionData) {
      if (!sessionData || !sessionData.url) {
        throw new Error('Invalid session data: missing URL')
      }

      // Check for non-shareable URLs
      const url = sessionData.url.toLowerCase()
      const unsafeProtocols = ['chrome://', 'chrome-extension://', 'moz-extension://', 'about:', 'file://']

      if (unsafeProtocols.some(protocol => url.startsWith(protocol)) || url === 'about:blank') {
        throw new Error('Cannot share browser internal pages. Please navigate to a website first.')
      }

      if (!sessionData.cookies || !Array.isArray(sessionData.cookies) || sessionData.cookies.length === 0) {
        throw new Error('No cookies available to share. Please log into the website first.')
      }

      log('✅ Session data validation passed')
    },

    /**
     * Create optimized payload with compression and encryption
     * @param {Object} sessionData - Raw session data
     * @param {string} recipientPublicKey - Optional public key for encryption
     * @returns {Promise<Object>} Optimized payload object
     */
    createOptimizedPayload: async function(sessionData, recipientPublicKey = null) {
      try {
        // Ensure required modules are available
        if (!window.payloadManager) {
          throw new Error('PayloadManager module not loaded')
        }

        // Create payload using PayloadManager
        const payload = await window.payloadManager.createPayload(sessionData, recipientPublicKey)

        log('📊 Payload optimization complete:', {
          originalSize: JSON.stringify(sessionData).length,
          finalSize: payload.size,
          compressionRatio: payload.compressed ? 'Yes' : 'No',
          encrypted: payload.encrypted ? 'Yes' : 'No'
        })

        return payload

      } catch (error) {
        log('⚠️ Payload optimization failed, using basic format:', error.message)

        // Fallback to basic Base64 encoding
        const basicPayload = btoa(JSON.stringify(sessionData))
        return {
          data: basicPayload,
          size: basicPayload.length,
          compressed: false,
          encrypted: false,
          needsTokenization: basicPayload.length > this.MAX_QR_SIZE
        }
      }
    },

    /**
     * Generate direct QR with deep link (auto-apply flow)
     * @param {Object} payload - Optimized payload
     * @param {Object} sessionData - Original session data
     * @returns {Promise<string>} Deep link URL
     */
    generateDirectQR: async function(payload, sessionData) {
      try {
        if (!window.mobileFlow) {
          throw new Error('MobileFlow module not loaded')
        }

        // Generate deep link for auto-apply
        if (this.PREFER_DEEP_LINK) {
          const deepLink = window.mobileFlow.generateDeepLink(payload.data)
          log('🔗 Generated deep link for auto-apply')
          return deepLink
        } else {
          // Generate HTTPS catcher as alternative
          const httpsLink = window.mobileFlow.generateHttpsCatcher(payload.data)
          log('🌐 Generated HTTPS catcher link')
          return httpsLink
        }

      } catch (error) {
        log('⚠️ Deep link generation failed, using fallback page:', error.message)
        return this.createFallbackPage(sessionData, payload.data)
      }
    },

    /**
     * Generate tokenized QR for large payloads
     * @param {Object} payload - Large payload that needs tokenization
     * @param {Object} sessionData - Original session data
     * @returns {Promise<string>} Tokenized deep link or fallback URL
     */
    generateTokenizedQR: async function(payload, sessionData) {
      try {
        log('📤 Payload too large, creating tokenized version...')

        if (!window.payloadManager) {
          throw new Error('PayloadManager module not loaded')
        }

        // Create tokenized payload via PrivateBin
        const tokenData = await window.payloadManager.createTokenizedPayload(payload.data)

        // Generate deep link with token
        if (window.mobileFlow && this.PREFER_DEEP_LINK) {
          const deepLink = window.mobileFlow.generateDeepLink('', {
            token: tokenData.token,
            secret: tokenData.secret
          })
          log('🎫 Generated tokenized deep link')
          return deepLink
        } else {
          // Fallback to PrivateBin URL directly
          log('🔗 Using PrivateBin URL as fallback')
          return tokenData.url
        }

      } catch (error) {
        log('⚠️ Tokenization failed, using emergency fallback:', error.message)
        return this.createEmergencyFallback(sessionData)
      }
    },

    /**
     * Create fallback instruction page
     * @param {Object} sessionData - Session data for display
     * @param {string} encodedPayload - Encoded payload for copying
     * @returns {string} Fallback page URL
     */
    createFallbackPage: function(sessionData, encodedPayload) {
      try {
        if (!window.mobileFlow) {
          throw new Error('MobileFlow module not loaded')
        }

        const fallbackUrl = window.mobileFlow.createFallbackPage(sessionData, encodedPayload)
        log('📄 Created fallback instruction page')
        return fallbackUrl

      } catch (error) {
        log('⚠️ Fallback page creation failed:', error.message)
        return this.createEmergencyFallback(sessionData)
      }
    },

    /**
     * Create emergency fallback when all else fails
     * @param {Object} sessionData - Session data
     * @returns {string} Emergency fallback URL
     */
    createEmergencyFallback: function(sessionData) {
      try {
        // Create minimal session data for extension
        const emergencyData = JSON.stringify({
          iv: "emergency_qr_session",
          v: 1,
          iter: 10000,
          ks: 128,
          ts: 64,
          mode: "ccm",
          adata: "",
          cipher: "aes",
          kemtag: "emergency",
          ct: btoa(JSON.stringify(sessionData))
        }, null, 2)

        // Create ultra-minimal HTML page
        const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SecureShare Emergency</title>
<style>body{font-family:Arial;padding:20px;background:#d94343;color:white;text-align:center}
.box{background:white;color:#333;padding:20px;border-radius:15px;max-width:400px;margin:0 auto}
.btn{background:#d94343;color:white;padding:15px;border:none;border-radius:8px;width:100%;margin:10px 0;font-size:16px;cursor:pointer}
.data{background:#f5f5f5;padding:10px;border-radius:5px;font-family:monospace;font-size:11px;word-break:break-all;margin:10px 0;max-height:120px;overflow-y:auto}
</style></head><body><div class="box">
<h2>🔐 SecureShare</h2><p><strong>${sessionData.title || 'Emergency Session'}</strong></p>
<p>1. Install SecureShare extension<br>2. Copy data below<br>3. Paste in "Restore Session"</p>
<button class="btn" onclick="copy()">📋 Copy Session Data</button>
<div class="data" id="d">${emergencyData}</div>
<button class="btn" onclick="window.open('${sessionData.url}')">🌐 Open Site</button>
</div><script>function copy(){const t=document.getElementById('d').textContent;
if(navigator.clipboard){navigator.clipboard.writeText(t).then(()=>alert('✅ Copied!'))}else{
const e=document.createElement('textarea');e.value=t;document.body.appendChild(e);
e.select();document.execCommand('copy');document.body.removeChild(e);alert('✅ Copied!')}}</script></body></html>`

        const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
        log('🚨 Created emergency fallback page')
        return dataUrl

      } catch (error) {
        log('💥 Emergency fallback creation failed:', error.message)
        // Ultimate fallback - just return the target URL
        return sessionData.url || 'https://google.com'
      }
    },

    /**
     * Render QR code on canvas
     * @param {string} url - URL to encode in QR
     * @param {string} canvasId - Canvas element ID
     * @returns {Promise<void>}
     */
    renderQRCode: async function(url, canvasId) {
      try {
        const canvas = document.getElementById(canvasId)
        if (!canvas) {
          throw new Error(`Canvas element '${canvasId}' not found`)
        }

        log('🎨 Rendering QR code on canvas...')
        log('📏 QR URL length:', url.length)
        log('🔗 QR URL preview:', url.substring(0, 100) + '...')

        // Show loading state
        this.showQRLoading(true)
        this.hideQROverlay(false)

        // Show loading state
        this.showQRLoading(true)
        this.hideQROverlay(false)

        // Try QRious library first
        if (typeof QRious !== 'undefined') {
          try {
            const qr = new QRious({
              element: canvas,
              value: url,
              size: 300,
              level: 'M', // Medium error correction
              background: '#ffffff',
              foreground: '#000000'
            })

            log('✅ QR code rendered with QRious!')
            this.showQRLoading(false)
            return

          } catch (qrError) {
            log('⚠️ QRious failed:', qrError.message)
          }
        }

        // Fallback to API service
        log('🌐 Using API fallback for QR generation...')
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`

        await new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            const ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, 300, 300)
            log('✅ QR code rendered with API fallback!')
            this.showQRLoading(false)
            resolve()
          }
          img.onerror = () => {
            const error = new Error('API QR generation failed')
            log('❌ API fallback failed')
            this.showQRLoading(false)
            this.showQRError('QR generation failed. Please try again.')
            reject(error)
          }
          img.src = apiUrl
        })

      } catch (error) {
        log('❌ QR rendering failed:', error)
        this.showQRLoading(false)
        this.showQRError(error.message)
        throw error
      }
    },

    /**
     * Mobile extension deep link handler (for mobile extension)
     * @param {string} deepLinkUrl - Deep link URL to process
     * @returns {Promise<void>}
     */
    handleMobileDeepLink: async function(deepLinkUrl) {
      try {
        if (!window.mobileFlow) {
          throw new Error('MobileFlow module not loaded')
        }

        log('🔗 Processing mobile deep link...')

        // Process the deep link and extract session data
        const sessionData = await window.mobileFlow.processDeepLink(deepLinkUrl)

        // Apply cookies automatically
        const appliedCount = await window.mobileFlow.applySessionCookies(sessionData)

        log(`✅ Applied ${appliedCount} cookies successfully`)

        // Redirect to target URL
        if (sessionData.url) {
          window.location.href = sessionData.url
        }

      } catch (error) {
        log('❌ Deep link processing failed:', error)
        // Show error to user
        this.showMobileError('Failed to apply session: ' + error.message)
      }
    },

    /**
     * Show mobile error message
     * @param {string} message - Error message to display
     */
    showMobileError: function(message) {
      // Create error overlay for mobile
      const errorDiv = document.createElement('div')
      errorDiv.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8); color: white; z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        font-family: Arial, sans-serif; padding: 20px; text-align: center;
      `
      errorDiv.innerHTML = `
        <div style="background: #d94343; padding: 30px; border-radius: 15px; max-width: 400px;">
          <h2>🔐 SecureShare Error</h2>
          <p>${message}</p>
          <button onclick="this.parentElement.parentElement.remove()"
                  style="background: white; color: #d94343; padding: 10px 20px;
                         border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            Close
          </button>
        </div>
      `
      document.body.appendChild(errorDiv)
    },

    // UI Helper Methods
    showQRLoading: function(show) {
      const loadingEl = document.getElementById('js-qr-loading')
      if (loadingEl) {
        loadingEl.style.display = show ? 'block' : 'none'
      }
    },

    hideQROverlay: function(hide) {
      const overlayEl = document.getElementById('js-qr-overlay')
      if (overlayEl) {
        overlayEl.style.display = hide ? 'none' : 'block'
      }
    },

    showQRError: function(message) {
      const errorEl = document.getElementById('js-qr-error')
      if (errorEl) {
        errorEl.textContent = message
        errorEl.style.display = 'block'
      }
      log('QR Error shown:', message)
    },

    updateQRStatus: function(message, type = 'info') {
      const statusEl = document.getElementById('js-qr-status')
      if (statusEl) {
        statusEl.textContent = message
        statusEl.className = `qr-status ${type}`
        statusEl.style.display = 'block'
      }
      log('QR Status updated:', message, type)
    }
  }

  // Export to global scope
  window.qrShareDirect = qrShareDirect

  // Auto-register deep link handler if on mobile
  if (window.location.protocol === 'secureshare:') {
    qrShareDirect.handleMobileDeepLink(window.location.href)
  }

})()
