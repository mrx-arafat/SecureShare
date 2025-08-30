/**
 * Mobile Flow Manager for SecureShare
 * Handles deep links, auto-apply, and fallback flows
 */

(function() {
  'use strict'

  const log = window.log ? window.log.bind('[MobileFlow]') : console.log.bind(console, '[MobileFlow]')

  const mobileFlow = {
    // Deep link schemes
    DEEP_LINK_SCHEME: 'secureshare://apply',
    HTTPS_CATCHER: 'https://secureshare.app/apply',
    
    // Fallback page template
    FALLBACK_PAGE_TEMPLATE: null,

    /**
     * Generate deep link for auto-apply flow
     * @param {string} payload - Encoded payload data
     * @param {Object} options - Options for link generation
     * @returns {string} Deep link URL
     */
    generateDeepLink: function(payload, options = {}) {
      try {
        log('Generating deep link for payload size:', payload.length)
        
        const params = new URLSearchParams({
          v: '1',
          data: payload
        })

        // Add optional parameters
        if (options.token) {
          params.set('token', options.token)
          params.set('k', options.secret)
          params.delete('data') // Use token instead of direct data
        }

        // Prefer custom scheme for better extension integration
        const deepLink = `${this.DEEP_LINK_SCHEME}?${params.toString()}`
        
        log('Generated deep link:', deepLink.substring(0, 100) + '...')
        return deepLink

      } catch (error) {
        log('Deep link generation failed:', error)
        throw new Error('Failed to generate deep link: ' + error.message)
      }
    },

    /**
     * Generate HTTPS catcher link as fallback
     * @param {string} payload - Encoded payload data
     * @param {Object} options - Options for link generation
     * @returns {string} HTTPS catcher URL
     */
    generateHttpsCatcher: function(payload, options = {}) {
      try {
        const params = new URLSearchParams({
          v: '1',
          data: payload
        })

        if (options.token) {
          params.set('token', options.token)
          params.set('k', options.secret)
          params.delete('data')
        }

        const httpsLink = `${this.HTTPS_CATCHER}?${params.toString()}`
        
        log('Generated HTTPS catcher:', httpsLink.substring(0, 100) + '...')
        return httpsLink

      } catch (error) {
        log('HTTPS catcher generation failed:', error)
        throw new Error('Failed to generate HTTPS catcher: ' + error.message)
      }
    },

    /**
     * Create fallback landing page for manual flow
     * @param {Object} sessionData - Session data for display
     * @param {string} encodedPayload - Encoded payload for copying
     * @returns {string} Data URL for fallback page
     */
    createFallbackPage: function(sessionData, encodedPayload) {
      try {
        log('Creating fallback landing page...')
        
        // Create session data in extension format for copying
        const extensionFormat = JSON.stringify({
          iv: "mobile_qr_session",
          v: 1,
          iter: 10000,
          ks: 128,
          ts: 64,
          mode: "ccm",
          adata: "",
          cipher: "aes",
          kemtag: "mobile",
          ct: encodedPayload
        }, null, 2)

        const html = this.getFallbackPageTemplate(sessionData, extensionFormat)
        const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
        
        log('Fallback page created, size:', dataUrl.length)
        return dataUrl

      } catch (error) {
        log('Fallback page creation failed:', error)
        throw new Error('Failed to create fallback page: ' + error.message)
      }
    },

    /**
     * Get fallback page HTML template
     * @param {Object} sessionData - Session data
     * @param {string} sessionText - Formatted session text for copying
     * @returns {string} HTML template
     */
    getFallbackPageTemplate: function(sessionData, sessionText) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SecureShare Mobile</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #d94343 0%, #c13333 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 100%;
            text-align: center;
        }
        .logo {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .title {
            font-size: 1.4em;
            font-weight: bold;
            margin-bottom: 20px;
            color: #d94343;
        }
        .session-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            border-left: 4px solid #d94343;
            text-align: left;
        }
        .session-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 1.1em;
            color: #495057;
        }
        .session-url {
            font-size: 0.9em;
            color: #666;
            word-break: break-all;
            background: white;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        .btn {
            background: linear-gradient(135deg, #d94343 0%, #c13333 100%);
            color: white;
            padding: 18px 24px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            width: 100%;
            margin: 12px 0;
            box-shadow: 0 4px 15px rgba(217, 67, 67, 0.3);
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover, .btn:active {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(217, 67, 67, 0.4);
        }
        .btn.secondary {
            background: #6c757d;
            box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
        }
        .instructions {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            text-align: left;
            font-size: 0.9em;
            line-height: 1.6;
        }
        .step {
            margin: 12px 0;
            display: flex;
            align-items: flex-start;
        }
        .step-number {
            background: #d94343;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            margin-right: 12px;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .status {
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            display: none;
            font-weight: bold;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 0.8em;
            color: #666;
        }
        .session-data {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔐</div>
        <div class="title">SecureShare Mobile</div>
        
        <div class="session-info">
            <div class="session-title">${sessionData.title || 'Shared Session'}</div>
            <div class="session-url">${sessionData.url || 'Unknown URL'}</div>
        </div>

        <button class="btn" onclick="copySessionData()">
            📋 Copy Session Data
        </button>
        
        <a href="${sessionData.url || '#'}" class="btn secondary" target="_blank">
            🌐 Open Website
        </a>
        
        <div id="status" class="status"></div>
        
        <div class="instructions">
            <strong>📱 How to use on mobile:</strong>
            <div class="step">
                <div class="step-number">1</div>
                <div>Install SecureShare extension on your mobile browser</div>
            </div>
            <div class="step">
                <div class="step-number">2</div>
                <div>Tap "Copy Session Data" above</div>
            </div>
            <div class="step">
                <div class="step-number">3</div>
                <div>Open SecureShare → "Restore Session"</div>
            </div>
            <div class="step">
                <div class="step-number">4</div>
                <div>Paste data → "Receive" → Open website</div>
            </div>
        </div>

        <div class="footer">
            <div>🔒 SecureShare - Secure Session Sharing</div>
            <div>Your data is encrypted and secure</div>
        </div>
        
        <div class="session-data" id="sessionData">${sessionText}</div>
    </div>

    <script>
        function copySessionData() {
            const data = document.getElementById('sessionData').textContent;
            const statusEl = document.getElementById('status');
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(data).then(() => {
                    showStatus('✅ Session data copied! Open SecureShare extension and paste in "Restore Session".', 'success');
                }).catch(() => {
                    fallbackCopy(data);
                });
            } else {
                fallbackCopy(data);
            }
        }

        function fallbackCopy(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                showStatus('✅ Session data copied! Open SecureShare extension and paste in "Restore Session".', 'success');
            } catch (err) {
                showStatus('❌ Copy failed. Please install SecureShare extension and try again.', 'error');
            }
            
            document.body.removeChild(textArea);
        }

        function showStatus(message, type) {
            const statusEl = document.getElementById('status');
            statusEl.className = 'status ' + type;
            statusEl.innerHTML = message;
            statusEl.style.display = 'block';
            
            if (type === 'success') {
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 5000);
            }
        }
    </script>
</body>
</html>`
    },

    /**
     * Process deep link parameters (for mobile extension)
     * @param {string} url - Deep link URL
     * @returns {Promise<Object>} Processed session data
     */
    processDeepLink: async function(url) {
      try {
        log('Processing deep link:', url)
        
        const urlObj = new URL(url)
        const params = new URLSearchParams(urlObj.search)
        
        const version = params.get('v')
        if (version !== '1') {
          throw new Error('Unsupported deep link version: ' + version)
        }

        let sessionData
        
        if (params.has('token')) {
          // Tokenized payload - fetch from PrivateBin
          const token = params.get('token')
          const secret = params.get('k')
          sessionData = await this.fetchTokenizedPayload(token, secret)
        } else if (params.has('data')) {
          // Direct payload
          const payload = params.get('data')
          sessionData = await payloadManager.decodePayload(payload)
        } else {
          throw new Error('No data or token found in deep link')
        }

        log('Deep link processed successfully')
        return sessionData

      } catch (error) {
        log('Deep link processing failed:', error)
        throw new Error('Failed to process deep link: ' + error.message)
      }
    },

    /**
     * Fetch tokenized payload from PrivateBin
     * @param {string} token - Token ID
     * @param {string} secret - Decryption secret
     * @returns {Promise<Object>} Session data
     */
    fetchTokenizedPayload: async function(token, secret) {
      try {
        log('Fetching tokenized payload:', token)
        
        // Reconstruct PrivateBin URL
        const privateBinUrl = `https://privatebin.net/${token}#${secret}`
        
        // This would need to be implemented based on PrivateBin API
        // For now, throw error as this requires additional implementation
        throw new Error('Tokenized payload fetching not yet implemented')
        
      } catch (error) {
        throw new Error('Failed to fetch tokenized payload: ' + error.message)
      }
    },

    /**
     * Apply session cookies (for mobile extension)
     * @param {Object} sessionData - Decoded session data
     * @returns {Promise<void>}
     */
    applySessionCookies: async function(sessionData) {
      try {
        log('Applying session cookies...')
        
        if (!sessionData.cookies || !Array.isArray(sessionData.cookies)) {
          throw new Error('No cookies to apply')
        }

        const appliedCount = await this.setCookies(sessionData.cookies, sessionData.url)
        
        log(`Applied ${appliedCount} cookies successfully`)
        return appliedCount

      } catch (error) {
        log('Cookie application failed:', error)
        throw new Error('Failed to apply cookies: ' + error.message)
      }
    },

    /**
     * Set cookies using Chrome extension API
     * @param {Array} cookies - Cookies to set
     * @param {string} url - Target URL
     * @returns {Promise<number>} Number of cookies applied
     */
    setCookies: async function(cookies, url) {
      try {
        if (!chrome || !chrome.cookies) {
          throw new Error('Chrome cookies API not available')
        }

        let appliedCount = 0
        
        for (const cookie of cookies) {
          try {
            const cookieDetails = {
              url: url,
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain,
              path: cookie.path || '/',
              secure: cookie.secure || false,
              httpOnly: cookie.httpOnly || false
            }

            // Set expiration if provided
            if (cookie.expirationDate) {
              cookieDetails.expirationDate = cookie.expirationDate
            }

            await new Promise((resolve, reject) => {
              chrome.cookies.set(cookieDetails, (result) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError)
                } else {
                  resolve(result)
                }
              })
            })

            appliedCount++
            log(`Applied cookie: ${cookie.name}`)

          } catch (error) {
            log(`Failed to apply cookie ${cookie.name}:`, error.message)
          }
        }

        return appliedCount

      } catch (error) {
        throw new Error('Cookie setting failed: ' + error.message)
      }
    }
  }

  // Export to global scope
  window.mobileFlow = mobileFlow
})()
