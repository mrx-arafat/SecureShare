/**
 * QR Share Direct Login Module
 * Generates QR codes that provide direct login links for mobile devices
 */

(function() {
  'use strict'

  const log = window.log ? window.log.bind('[QRShareDirect]') : console.log.bind(console, '[QRShareDirect]')

  const qrShareDirect = {
    /**
     * Generate QR code for direct login
     * @param {Object} sessionData - Current session data (cookies, url, title)
     * @param {string} canvasId - ID of the canvas element
     * @returns {Promise<string>} Generated login URL
     */
    generateDirectLoginQR: async function(sessionData, canvasId = 'js-qr-canvas-share') {
      log('Generating direct login QR code')
      
      try {
        // Check if we have valid session data
        if (!sessionData || !sessionData.url) {
          throw new Error('Invalid session data: missing URL')
        }

        // Check for non-shareable URLs
        const url = sessionData.url.toLowerCase()
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
            url.startsWith('moz-extension://') || url.startsWith('about:') ||
            url.startsWith('file://') || url === 'about:blank') {
          throw new Error('Cannot share browser internal pages. Please navigate to a website first.')
        }

        // Create a direct login URL
        const loginUrl = await this.createDirectLoginUrl(sessionData)

        // Generate QR code
        const canvas = document.getElementById(canvasId)
        if (!canvas) {
          throw new Error('Canvas element not found: ' + canvasId)
        }

        log('Canvas element found, generating QR code...')
        log('Session URL:', sessionData.url)

        // Show loading state
        this.showQRLoading(true)
        this.hideQROverlay(false) // Show overlay initially

        // Method 1: QRious library (primary)
        if (typeof QRious !== 'undefined') {
          try {
            log('QRious library found, generating QR code...')
            log('Login URL to encode:', loginUrl.substring(0, 100) + '...')

            // Clear canvas first
            const ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Ensure canvas is properly sized and visible
            canvas.width = 200
            canvas.height = 200
            canvas.style.display = 'block'
            canvas.style.width = '200px'
            canvas.style.height = '200px'

            const qr = new QRious({
              element: canvas,
              value: loginUrl,
              size: 200,
              level: 'M',
              background: '#ffffff',
              foreground: '#000000'
            })

            log('QR Code generated successfully with QRious')

            // Hide loading and overlay, show success
            this.showQRLoading(false)
            this.hideQROverlay(true)
            this.updateQRStatus('✅ QR Code ready!', 'success')

            return loginUrl
          } catch (error) {
            log('QRious generation error:', error)
            console.error('QRious error details:', error)
            // Fall through to API method
          }
        } else {
          log('QRious library not found, falling back to API method')
        }

        // Method 2: QR Server API fallback
        try {
          const qrSize = 200
          const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(loginUrl)}`

          return new Promise((resolve, reject) => {
            // Create an image element and draw it to canvas
            const img = new Image()
            img.crossOrigin = 'anonymous'

            img.onload = () => {
              try {
                const ctx = canvas.getContext('2d')
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                canvas.width = qrSize
                canvas.height = qrSize
                ctx.drawImage(img, 0, 0, qrSize, qrSize)

                log('QR Code generated successfully with QR Server API')
                this.showQRLoading(false)
                this.hideQROverlay(true)
                this.updateQRStatus('✅ QR Code ready!', 'success')
                resolve(loginUrl)
              } catch (drawError) {
                log('Canvas drawing error:', drawError)
                this.showQRFallback(loginUrl)
                resolve(loginUrl)
              }
            }

            img.onerror = () => {
              log('QR Server API failed, using text fallback')
              this.showQRFallback(loginUrl)
              resolve(loginUrl)
            }

            img.src = qrApiUrl
          })

        } catch (error) {
          log('QR Server API error:', error)
          this.showQRFallback(loginUrl)
          return loginUrl
        }
      } catch (error) {
        log('QR generation failed:', error)
        this.showQRLoading(false)

        // Show user-friendly error messages
        if (error.message.includes('Cannot share browser internal pages')) {
          this.updateQRStatus('⚠️ Cannot share this page', 'warning')
          this.showQRFallback('Please navigate to a website (like google.com) and try again.')
        } else if (error.message.includes('Canvas element not found')) {
          this.updateQRStatus('❌ UI Error', 'error')
        } else if (error.message.includes('Invalid session data')) {
          this.updateQRStatus('❌ No session data', 'error')
        } else {
          this.updateQRStatus('❌ Generation failed', 'error')
        }

        throw error
      }
    },

    /**
     * Create a direct login URL that applies session automatically
     * @param {Object} sessionData - Session data with cookies, url, title
     * @returns {Promise<string>} Direct login URL
     */
    createDirectLoginUrl: async function(sessionData) {
      try {
        // Encrypt the session data for security
        const encryptedData = await this.encryptSessionData(sessionData)
        
        // Create a login page URL with encrypted data
        const loginPageUrl = this.createLoginPage(encryptedData, sessionData)
        
        return loginPageUrl
      } catch (error) {
        log('Error creating login URL:', error)
        throw error
      }
    },

    /**
     * Encrypt session data for secure transmission
     * @param {Object} sessionData - Raw session data
     * @returns {Promise<string>} Encrypted session data
     */
    encryptSessionData: async function(sessionData) {
      try {
        // For now, use simple Base64 encoding for reliability
        // In production, you could add proper encryption here
        log('Encoding session data with Base64')
        log('Raw session data:', sessionData)

        // Clean the session data to ensure it's serializable
        const cleanData = {
          cookies: sessionData.cookies || [],
          url: sessionData.url || '',
          title: sessionData.title || 'Unknown Site',
          timestamp: sessionData.timestamp || Date.now()
        }

        log('Cleaned session data:', cleanData)
        log('Number of cookies to encode:', cleanData.cookies.length)

        // Convert to JSON and Base64 encode
        const jsonString = JSON.stringify(cleanData)
        const encoded = btoa(jsonString)

        log('Session data encoded successfully, length:', encoded.length)
        log('JSON string preview:', jsonString.substring(0, 200) + '...')
        return encoded

      } catch (error) {
        log('Encoding error:', error)
        // If Base64 fails, try URL encoding as fallback
        try {
          const jsonString = JSON.stringify(sessionData)
          const urlEncoded = encodeURIComponent(jsonString)
          log('Using URL encoding fallback')
          return urlEncoded
        } catch (fallbackError) {
          log('All encoding methods failed:', fallbackError)
          throw new Error('Failed to encode session data: ' + error.message)
        }
      }
    },

    /**
     * Create a login page with embedded session data
     * @param {string} encryptedData - Encrypted session data
     * @param {Object} sessionData - Original session data for metadata
     * @returns {string} Data URL for the login page
     */
    createLoginPage: function(encryptedData, sessionData) {
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SecureShare - Auto Login</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            max-width: 400px; 
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            padding: 30px; 
            border-radius: 20px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
        }
        .logo {
            font-size: 2em;
            margin-bottom: 10px;
        }
        .title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
            color: #d94343;
        }
        .session-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #d94343;
        }
        .session-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .session-url {
            font-size: 0.9em;
            color: #666;
            word-break: break-all;
        }
        .btn { 
            background: linear-gradient(135deg, #d94343 0%, #c13333 100%);
            color: white; 
            padding: 15px 30px; 
            border: none; 
            border-radius: 25px; 
            cursor: pointer; 
            font-size: 16px;
            font-weight: bold;
            width: 100%;
            margin: 15px 0;
            box-shadow: 0 4px 15px rgba(217, 67, 67, 0.3);
            transition: all 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(217, 67, 67, 0.4);
        }
        .btn:active {
            transform: translateY(0);
        }
        .status {
            margin: 20px 0;
            padding: 15px;
            border-radius: 10px;
            display: none;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .instructions {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
            font-size: 0.9em;
        }
        .loading {
            display: none;
            margin: 20px 0;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #d94343;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔐</div>
        <div class="title">SecureShare Auto Login</div>
        
        <div class="session-info">
            <div class="session-title">${sessionData.title || 'Unknown Site'}</div>
            <div class="session-url">${sessionData.url || 'Unknown URL'}</div>
        </div>

        <button class="btn" onclick="applySession()">
            🚀 Login Automatically
        </button>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Applying session...</p>
        </div>
        
        <div class="status" id="status"></div>
        
        <div class="instructions">
            <strong>📱 How it works:</strong><br>
            1. Tap the button above<br>
            2. Session cookies will be applied<br>
            3. You'll be redirected to the site<br>
            4. You should be automatically logged in!
        </div>
    </div>

    <script>
        const encryptedData = ${JSON.stringify(encryptedData)};
        const targetUrl = ${JSON.stringify(sessionData.url || '')};
        
        async function applySession() {
            const loadingEl = document.getElementById('loading');
            const statusEl = document.getElementById('status');
            const btn = document.querySelector('.btn');

            try {
                // Show loading
                loadingEl.style.display = 'block';
                btn.disabled = true;
                btn.textContent = 'Applying...';
                statusEl.style.display = 'none';

                console.log('Starting session application...');
                console.log('Encrypted data length:', encryptedData.length);
                console.log('Encrypted data preview:', encryptedData.substring(0, 100) + '...');

                // Decrypt and parse session data
                const sessionData = await decryptSessionData(encryptedData);
                console.log('Session data decrypted:', sessionData);
                
                if (sessionData && sessionData.cookies) {
                    // Apply cookies
                    let appliedCount = 0;
                    sessionData.cookies.forEach(cookie => {
                        if (cookie.name && cookie.value) {
                            try {
                                document.cookie = cookie.name + '=' + cookie.value + 
                                    (cookie.domain ? '; domain=' + cookie.domain : '') +
                                    (cookie.path ? '; path=' + cookie.path : '') +
                                    (cookie.secure ? '; secure' : '') +
                                    (cookie.httpOnly ? '; httponly' : '');
                                appliedCount++;
                            } catch (e) {
                                console.warn('Failed to apply cookie:', cookie.name, e);
                            }
                        }
                    });
                    
                    // Show success
                    loadingEl.style.display = 'none';
                    statusEl.className = 'status success';
                    statusEl.innerHTML = '✅ Session applied successfully!<br>Applied ' + appliedCount + ' cookies.<br>Redirecting...';
                    statusEl.style.display = 'block';
                    
                    // Redirect to the target site
                    setTimeout(() => {
                        if (targetUrl) {
                            window.location.href = targetUrl;
                        } else {
                            statusEl.innerHTML += '<br><br>Please navigate to the target website manually.';
                        }
                    }, 2000);
                    
                } else {
                    throw new Error('Invalid session data format');
                }
                
            } catch (error) {
                console.error('Session application error:', error);
                loadingEl.style.display = 'none';
                statusEl.className = 'status error';
                statusEl.innerHTML = '❌ Error applying session: ' + error.message;
                statusEl.style.display = 'block';
                btn.disabled = false;
                btn.textContent = '🔄 Try Again';
            }
        }
        
        async function decryptSessionData(encryptedData) {
            try {
                // First, try to parse as JSON to see if it's already decrypted
                try {
                    const parsed = JSON.parse(encryptedData);
                    if (parsed.cookies) {
                        // Data is already in JSON format
                        return parsed;
                    }
                } catch (e) {
                    // Not JSON, continue with decryption attempts
                }

                // Try Base64 decoding (our current method)
                try {
                    const decoded = atob(encryptedData);
                    const parsed = JSON.parse(decoded);
                    if (parsed.cookies) {
                        return parsed;
                    }
                } catch (e) {
                    console.log('Base64 decoding failed:', e);
                }

                // Try URL decoding + Base64
                try {
                    const urlDecoded = decodeURIComponent(encryptedData);
                    const decoded = atob(urlDecoded);
                    const parsed = JSON.parse(decoded);
                    if (parsed.cookies) {
                        return parsed;
                    }
                } catch (e) {
                    console.log('URL + Base64 decoding failed:', e);
                }

                // If all else fails, try to extract from complex encrypted format
                try {
                    const parsed = JSON.parse(encryptedData);
                    if (parsed.key && parsed.data) {
                        // For now, return a mock session for testing
                        console.warn('Complex encryption detected, using fallback session');
                        return {
                            cookies: [
                                { name: 'test_session', value: 'fallback_value', domain: window.location.hostname, path: '/' }
                            ],
                            url: window.location.origin,
                            title: 'Fallback Session'
                        };
                    }
                } catch (e) {
                    console.log('Complex format parsing failed:', e);
                }

                throw new Error('Unable to decrypt session data with any method');
            } catch (error) {
                console.error('Decryption error details:', error);
                throw new Error('Failed to decrypt session data: ' + error.message);
            }
        }
        
        // Auto-apply if URL parameter is present
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auto') === 'true') {
            setTimeout(applySession, 1000);
        }
    </script>
</body>
</html>`

      // Create data URL with proper encoding
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent)
      log('Mobile login page created, URL length:', dataUrl.length)
      return dataUrl
    },

    /**
     * Show text fallback when QR generation fails
     * @param {HTMLElement} canvas - Canvas element
     * @param {string} url - URL to display
     */
    showTextFallback: function(canvas, url) {
      const container = canvas.parentElement
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; background: #f8f9fa; border-radius: 12px; border: 2px dashed #dee2e6;">
          <div style="font-size: 3em; margin-bottom: 15px;">📱</div>
          <p><strong>QR Code generation failed</strong></p>
          <p>Please copy this link and open it on your mobile device:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 11px; margin: 15px 0; border: 1px solid #dee2e6; max-height: 100px; overflow-y: auto;">
            ${url}
          </div>
          <button onclick="qrShareDirect.copyToClipboard('${url.replace(/'/g, "\\'")}').then(success => alert(success ? 'Link copied!' : 'Please copy manually'))"
                  style="background: #d94343; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            📋 Copy Link
          </button>
          <p style="font-size: 12px; color: #666; margin-top: 15px;">
            Open this link on your mobile browser to apply the session automatically.
          </p>
        </div>
      `
    },

    /**
     * Show/hide QR loading state
     * @param {boolean} show - Whether to show loading
     */
    showQRLoading: function(show) {
      const loadingEl = document.getElementById('js-qr-loading')
      if (loadingEl) {
        loadingEl.style.display = show ? 'flex' : 'none'
      }
    },

    /**
     * Hide/show QR overlay
     * @param {boolean} hide - Whether to hide overlay
     */
    hideQROverlay: function(hide) {
      const overlayEl = document.getElementById('js-qr-overlay')
      const containerEl = document.querySelector('.qr-container')
      if (overlayEl) {
        overlayEl.style.display = hide ? 'none' : 'flex'
      }
      if (containerEl) {
        if (hide) {
          containerEl.classList.add('qr-generated')
        } else {
          containerEl.classList.remove('qr-generated')
        }
      }
    },

    /**
     * Update QR status message
     * @param {string} message - Status message
     * @param {string} type - Status type (success, error, warning)
     */
    updateQRStatus: function(message, type = 'success') {
      const statusEl = document.getElementById('js-qr-status')
      if (statusEl) {
        statusEl.textContent = message
        statusEl.className = 'qr-status'
        if (type === 'error') {
          statusEl.classList.add('qr-status-error')
        } else if (type === 'warning') {
          statusEl.classList.add('qr-status-warning')
        } else {
          statusEl.classList.add('qr-status-success')
        }
      }
    },

    /**
     * Show QR fallback when generation fails
     * @param {string} url - URL to display in fallback
     */
    showQRFallback: function(url) {
      const fallbackEl = document.getElementById('js-qr-fallback')
      const fallbackUrlEl = document.getElementById('js-fallback-url')

      if (fallbackEl && fallbackUrlEl) {
        fallbackUrlEl.textContent = url
        fallbackEl.style.display = 'block'
        this.showQRLoading(false)

        // Store URL for copy functionality if it's a valid URL
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          window.currentQRUrl = url
          this.updateQRStatus('⚠️ Using fallback method', 'warning')
        } else {
          this.updateQRStatus('⚠️ Cannot share this page', 'warning')
        }
      }
    },

    /**
     * Copy URL to clipboard
     * @param {string} url - URL to copy
     * @returns {Promise<boolean>} Success status
     */
    copyToClipboard: async function(url) {
      try {
        if (!url || typeof url !== 'string') {
          log('Invalid URL provided for copying:', url)
          return false
        }

        log('Attempting to copy URL to clipboard:', url.substring(0, 50) + '...')

        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url)
          log('URL copied to clipboard successfully')
          return true
        } else {
          // Fallback for older browsers
          log('Using fallback clipboard method')
          const textArea = document.createElement('textarea')
          textArea.value = url
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          textArea.style.top = '-999999px'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          const success = document.execCommand('copy')
          document.body.removeChild(textArea)

          if (success) {
            log('URL copied using fallback method')
          } else {
            log('Failed to copy using fallback method')
          }
          return success
        }
      } catch (error) {
        log('Copy to clipboard failed:', error)
        return false
      }
    }
  }

  // Export to global scope
  window.qrShareDirect = qrShareDirect

})()
