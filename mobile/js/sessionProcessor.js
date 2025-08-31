/**
 * Mobile Session Processor
 * Handles secure link processing and session application for mobile devices
 * @version 1.0.0
 */

(function() {
  'use strict';

  const sessionProcessor = {
    // Configuration
    SESSION_STORAGE_API: 'http://localhost:3001',
    REDIRECT_DELAY: 3000, // 3 seconds
    RETRY_ATTEMPTS: 3,
    
    // State
    currentAttempt: 0,
    sessionData: null,
    targetUrl: null,
    sessionId: null,
    encryptionKey: null,
    
    /**
     * Initialize session processing from URL parameters
     */
    initialize: async function() {
      try {
        console.log('🚀 Initializing mobile session processor...');

        // Track mobile processing start
        if (window.analytics) {
          window.analytics.trackMobileProcessingStart();
        }

        // Initialize device detection first
        if (window.deviceDetection) {
          this.deviceInfo = window.deviceDetection.initialize();
          console.log('📱 Device detection completed:', this.deviceInfo);
        }

        // Extract session parameters from URL
        const urlParams = this.extractUrlParameters();

        if (!urlParams.sessionId || !urlParams.key) {
          throw new Error('Missing session parameters in URL');
        }

        this.sessionId = urlParams.sessionId;
        this.encryptionKey = urlParams.key;

        // Check browser compatibility
        if (this.deviceInfo && this.deviceInfo.capabilities) {
          const compatibility = window.deviceDetection.getBrowserCompatibility();

          if (!compatibility.supported) {
            this.showCompatibilityError(compatibility);
            return;
          }

          if (compatibility.issues.length > 0) {
            console.warn('⚠️ Browser compatibility issues:', compatibility.issues);
          }
        }

        // Check for extension availability
        if (this.detectExtensionAvailability()) {
          console.log('🔌 Extension detected, using enhanced flow');
          await this.processWithExtension();
        } else {
          console.log('📱 No extension detected, checking device capabilities');

          // Show extension prompt or proceed with fallback based on device capabilities
          if (window.deviceDetection && window.deviceDetection.showInstallPrompt()) {
            // Extension prompt was shown
            return;
          } else {
            // Proceed with fallback processing
            this.showExtensionPrompt();
          }
        }

      } catch (error) {
        console.error('❌ Initialization failed:', error);

        // Use comprehensive error handling
        if (window.ErrorHandler) {
          window.ErrorHandler.handleError(error, 'unknown_error', {
            operation: 'initialization',
            deviceInfo: this.deviceInfo
          });
        } else {
          this.showError(`Initialization failed: ${error.message}`);
        }
      }
    },
    
    /**
     * Extract session ID and encryption key from URL parameters
     * @returns {Object} URL parameters
     */
    extractUrlParameters: function() {
      const urlParams = new URLSearchParams(window.location.search);
      const pathParts = window.location.pathname.split('/');
      
      // Extract session ID from path (e.g., /s/session-id)
      let sessionId = null;
      const sIndex = pathParts.indexOf('s');
      if (sIndex !== -1 && pathParts[sIndex + 1]) {
        sessionId = pathParts[sIndex + 1];
      }
      
      // Extract encryption key from query parameter
      const key = urlParams.get('k');
      
      console.log('📋 Extracted URL parameters:', { sessionId, key: key ? 'present' : 'missing' });
      
      return { sessionId, key };
    },
    
    /**
     * Detect if SecureShare extension is available
     * @returns {boolean} True if extension is detected
     */
    detectExtensionAvailability: function() {
      // Check for extension-specific objects or methods
      return !!(window.chrome && window.chrome.runtime && window.chrome.cookies);
    },
    
    /**
     * Process session with extension support
     */
    processWithExtension: async function() {
      try {
        // Track session transfer start
        if (window.analytics) {
          window.analytics.trackSessionTransferStart();
        }

        this.showProgress(1, 'Retrieving session...', 'Fetching encrypted session data');
        
        // Fetch session data from API
        const sessionData = await this.fetchSessionData(this.sessionId, this.encryptionKey);
        this.sessionData = sessionData;
        this.targetUrl = sessionData.url;
        
        this.showProgress(2, 'Applying cookies...', 'Setting up session cookies');
        
        // Apply cookies using extension API
        const appliedCount = await this.applyCookiesToBrowser(sessionData.cookies, sessionData.domain);
        
        this.showProgress(3, 'Session ready!', `Applied ${appliedCount} cookies successfully`);

        // Track mobile processing success
        if (window.analytics) {
          window.analytics.trackMobileProcessingSuccess();
        }

        // Show success and prepare redirect
        this.showSuccess(sessionData, appliedCount);

      } catch (error) {
        console.error('❌ Extension processing failed:', error);

        // Track mobile processing failure
        if (window.analytics) {
          window.analytics.trackMobileProcessingFailure('extension_processing_error', error.message);
        }

        this.showError(`Session processing failed: ${error.message}`);
      }
    },
    
    /**
     * Process session without extension (fallback mode)
     */
    processWithoutExtension: async function() {
      try {
        // Track session transfer start (if not already tracked)
        if (window.analytics && !this.transferStartTracked) {
          window.analytics.trackSessionTransferStart();
          this.transferStartTracked = true;
        }

        this.showProgress(1, 'Retrieving session...', 'Fetching session data');
        
        // Fetch session data
        const sessionData = await this.fetchSessionData(this.sessionId, this.encryptionKey);
        this.sessionData = sessionData;
        this.targetUrl = sessionData.url;
        
        this.showProgress(2, 'Applying cookies...', 'Using document.cookie API');
        
        // Apply cookies using document.cookie (limited functionality)
        const appliedCount = await this.applyCookiesWithDocumentAPI(sessionData.cookies, sessionData.domain);
        
        if (appliedCount > 0) {
          this.showProgress(3, 'Session ready!', `Applied ${appliedCount} cookies`);

          // Track fallback success
          if (window.analytics) {
            window.analytics.trackMobileProcessingSuccess();
          }

          this.showSuccess(sessionData, appliedCount);
        } else {
          throw new Error('Unable to apply cookies without extension');
        }

      } catch (error) {
        console.error('❌ Fallback processing failed:', error);

        // Track fallback failure
        if (window.analytics) {
          window.analytics.trackMobileProcessingFailure('fallback_processing_error', error.message);
        }

        this.showManualInstructions(error.message);
      }
    },
    
    /**
     * Fetch session data from storage API
     * @param {string} sessionId - Session identifier
     * @param {string} key - Decryption key
     * @returns {Promise<Object>} Session data
     */
    fetchSessionData: async function(sessionId, key) {
      try {
        console.log('📡 Fetching session data from API...');
        
        const response = await fetch(`${this.SESSION_STORAGE_API}/api/sessions/${sessionId}?key=${key}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 410) {
            throw new Error('Session expired or already used');
          } else if (response.status === 404) {
            throw new Error('Session not found');
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
        }
        
        const result = await response.json();

        if (!result.sessionData) {
          throw new Error('Invalid session data received');
        }

        // Store metadata for expiration tracking
        if (result.metadata && result.metadata.timeRemaining) {
          this.sessionTimeRemaining = result.metadata.timeRemaining;
        }

        console.log('✅ Session data fetched successfully');
        return result.sessionData;
        
      } catch (error) {
        console.error('❌ Failed to fetch session data:', error);
        throw new Error(`Failed to retrieve session: ${error.message}`);
      }
    },
    
    /**
     * Apply cookies using Chrome extension API
     * @param {Array} cookies - Cookies to apply
     * @param {string} domain - Target domain
     * @returns {Promise<number>} Number of cookies applied
     */
    applyCookiesToBrowser: async function(cookies, domain) {
      try {
        if (!window.chrome || !window.chrome.cookies) {
          throw new Error('Chrome cookies API not available');
        }
        
        let appliedCount = 0;
        
        for (const cookie of cookies) {
          try {
            const cookieDetails = {
              url: this.targetUrl,
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain,
              path: cookie.path || '/',
              secure: cookie.secure || false,
              httpOnly: cookie.httpOnly || false
            };
            
            // Set expiration if provided
            if (cookie.expirationDate) {
              cookieDetails.expirationDate = cookie.expirationDate;
            }
            
            await new Promise((resolve, reject) => {
              chrome.cookies.set(cookieDetails, (result) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve(result);
                }
              });
            });
            
            appliedCount++;
            console.log(`✅ Applied cookie: ${cookie.name}`);
            
          } catch (error) {
            console.warn(`⚠️ Failed to apply cookie ${cookie.name}:`, error.message);
          }
        }
        
        console.log(`🍪 Applied ${appliedCount}/${cookies.length} cookies`);
        return appliedCount;
        
      } catch (error) {
        console.error('❌ Cookie application failed:', error);
        throw new Error(`Failed to apply cookies: ${error.message}`);
      }
    },
    
    /**
     * Apply cookies using document.cookie API (limited functionality)
     * @param {Array} cookies - Cookies to apply
     * @param {string} domain - Target domain
     * @returns {Promise<number>} Number of cookies applied
     */
    applyCookiesWithDocumentAPI: async function(cookies, domain) {
      try {
        let appliedCount = 0;
        
        for (const cookie of cookies) {
          try {
            // Skip httpOnly cookies (cannot be set via document.cookie)
            if (cookie.httpOnly) {
              console.warn(`⚠️ Skipping httpOnly cookie: ${cookie.name}`);
              continue;
            }
            
            // Build cookie string
            let cookieString = `${cookie.name}=${cookie.value}`;
            
            if (cookie.path) {
              cookieString += `; path=${cookie.path}`;
            }
            
            if (cookie.domain) {
              cookieString += `; domain=${cookie.domain}`;
            }
            
            if (cookie.secure) {
              cookieString += `; secure`;
            }
            
            if (cookie.expirationDate) {
              const expireDate = new Date(cookie.expirationDate * 1000);
              cookieString += `; expires=${expireDate.toUTCString()}`;
            }
            
            // Set cookie
            document.cookie = cookieString;
            appliedCount++;
            console.log(`✅ Applied cookie via document.cookie: ${cookie.name}`);
            
          } catch (error) {
            console.warn(`⚠️ Failed to apply cookie ${cookie.name}:`, error.message);
          }
        }
        
        console.log(`🍪 Applied ${appliedCount}/${cookies.length} cookies via document.cookie`);
        return appliedCount;
        
      } catch (error) {
        console.error('❌ Document cookie application failed:', error);
        throw new Error(`Failed to apply cookies: ${error.message}`);
      }
    },
    
    /**
     * Redirect to target website after successful session application
     * @param {string} url - Target URL (optional, uses stored targetUrl if not provided)
     */
    redirectToTarget: function(url = null) {
      const targetUrl = url || this.targetUrl;

      // Track successful session transfer
      if (window.analytics) {
        window.analytics.trackSessionTransferSuccess();
      }
      
      if (!targetUrl) {
        console.error('❌ No target URL available for redirect');
        return;
      }
      
      console.log('🔄 Redirecting to target website:', targetUrl);
      
      // Clear any existing timers
      if (this.redirectTimer) {
        clearTimeout(this.redirectTimer);
      }
      
      // Redirect immediately
      window.location.href = targetUrl;
    },
    
    /**
     * Retry session processing
     */
    retryProcessing: async function() {
      if (this.currentAttempt >= this.RETRY_ATTEMPTS) {
        this.showError('Maximum retry attempts reached. Please generate a new QR code.');
        return;
      }
      
      this.currentAttempt++;
      console.log(`🔄 Retrying session processing (attempt ${this.currentAttempt}/${this.RETRY_ATTEMPTS})`);
      
      // Reset UI to loading state
      this.showLoadingState();
      
      // Retry processing
      if (this.detectExtensionAvailability()) {
        await this.processWithExtension();
      } else {
        await this.processWithoutExtension();
      }
    },
    
    /**
     * Copy session data to clipboard for manual use
     */
    copySessionDataToClipboard: async function() {
      if (!this.sessionData) {
        console.error('❌ No session data available to copy');
        return;
      }
      
      try {
        const sessionDataString = JSON.stringify(this.sessionData, null, 2);
        
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(sessionDataString);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = sessionDataString;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        
        console.log('📋 Session data copied to clipboard');
        
        // Show feedback
        const button = document.querySelector('button[onclick="copySessionData()"]');
        if (button) {
          const originalText = button.textContent;
          button.textContent = '✅ Copied!';
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }
        
      } catch (error) {
        console.error('❌ Failed to copy session data:', error);
        alert('Failed to copy session data. Please copy manually from the browser console.');
        console.log('Session Data:', this.sessionData);
      }
    },

    // UI State Management Methods

    /**
     * Show loading state with progress
     */
    showLoadingState: function() {
      document.getElementById('loading-state').classList.remove('hidden');
      document.getElementById('success-state').classList.add('hidden');
      document.getElementById('error-state').classList.add('hidden');
      document.getElementById('extension-prompt').classList.add('hidden');
    },

    /**
     * Show progress step with message
     * @param {number} step - Current step (1-3)
     * @param {string} message - Progress message
     * @param {string} detail - Detailed description
     */
    showProgress: function(step, message, detail) {
      console.log(`📊 Progress Step ${step}: ${message}`);

      // Update progress text
      const progressText = document.getElementById('progress-text');
      const progressDetail = document.getElementById('progress-detail');

      if (progressText) progressText.textContent = message;
      if (progressDetail) progressDetail.textContent = detail;

      // Update progress steps
      for (let i = 1; i <= 3; i++) {
        const stepEl = document.getElementById(`step-${i}`);
        if (stepEl) {
          stepEl.classList.remove('active', 'complete');

          if (i < step) {
            stepEl.classList.add('complete');
          } else if (i === step) {
            stepEl.classList.add('active');
          }
        }
      }

      // Update progress line
      const progressLine = document.getElementById('progress-line');
      if (progressLine) {
        const percentage = ((step - 1) / 2) * 100; // 0%, 50%, 100%
        progressLine.style.width = `${percentage}%`;
      }
    },

    /**
     * Show success state with session info
     * @param {Object} sessionData - Session data
     * @param {number} cookieCount - Number of cookies applied
     */
    showSuccess: function(sessionData, cookieCount) {
      console.log('🎉 Showing success state');

      document.getElementById('loading-state').classList.add('hidden');
      document.getElementById('success-state').classList.remove('hidden');
      document.getElementById('error-state').classList.add('hidden');

      // Update session info
      const websiteEl = document.getElementById('session-website');
      const cookiesEl = document.getElementById('session-cookies');

      if (websiteEl) {
        try {
          const domain = new URL(sessionData.url).hostname;
          websiteEl.textContent = sessionData.title || domain;
        } catch (error) {
          websiteEl.textContent = sessionData.title || 'Unknown';
        }
      }

      if (cookiesEl) {
        cookiesEl.textContent = cookieCount.toString();
      }

      // Add session expiration countdown if time remaining is available
      if (this.sessionTimeRemaining && this.sessionTimeRemaining > 0) {
        this.addExpirationCountdownToUI(this.sessionTimeRemaining);
      }

      // Start countdown for redirect
      this.startRedirectCountdown();
    },

    /**
     * Show error state with message
     * @param {string} message - Error message
     */
    showError: function(message) {
      console.error('❌ Showing error state:', message);

      document.getElementById('loading-state').classList.add('hidden');
      document.getElementById('success-state').classList.add('hidden');
      document.getElementById('error-state').classList.remove('hidden');

      const errorMessageEl = document.getElementById('error-message');
      if (errorMessageEl) {
        errorMessageEl.textContent = message;
      }
    },

    /**
     * Show extension installation prompt
     */
    showExtensionPrompt: function() {
      console.log('🔌 Showing extension prompt');

      document.getElementById('loading-state').classList.add('hidden');
      document.getElementById('extension-prompt').classList.remove('hidden');
    },

    /**
     * Show manual instructions for session restoration
     * @param {string} reason - Reason for manual fallback
     */
    showManualInstructions: function(reason) {
      console.log('📖 Showing manual instructions:', reason);

      this.showError(`Automatic session application failed: ${reason}`);

      const manualInstructions = document.getElementById('manual-instructions');
      if (manualInstructions) {
        manualInstructions.classList.remove('hidden');
      }
    },

    /**
     * Show compatibility error with specific recommendations
     * @param {Object} compatibility - Compatibility information from device detection
     */
    showCompatibilityError: function(compatibility) {
      console.error('❌ Browser compatibility issues:', compatibility);

      let errorMessage = 'Your browser is not compatible with automatic session processing.';

      if (compatibility.issues.length > 0) {
        errorMessage += '\n\nIssues found:\n• ' + compatibility.issues.join('\n• ');
      }

      if (compatibility.recommendations.length > 0) {
        errorMessage += '\n\nRecommendations:\n• ' + compatibility.recommendations.join('\n• ');
      }

      this.showError(errorMessage);

      // Show enhanced manual instructions for incompatible browsers
      if (window.deviceDetection) {
        const fallbackInstructions = window.deviceDetection.getFallbackInstructions();
        this.showEnhancedFallbackInstructions(fallbackInstructions);
      }
    },

    /**
     * Show enhanced fallback instructions based on device capabilities
     * @param {Object} instructions - Fallback instruction data
     */
    showEnhancedFallbackInstructions: function(instructions) {
      const manualInstructions = document.getElementById('manual-instructions');
      if (!manualInstructions) return;

      // Update the manual instructions with device-specific guidance
      const instructionsHtml = `
        <h3>${instructions.title}</h3>
        <ol>
          ${instructions.steps.map(step => `<li>${step}</li>`).join('')}
        </ol>
        <div class="compatibility-info">
          <p><strong>Compatibility Level:</strong> ${instructions.compatibility}</p>
          ${this.deviceInfo ? `
            <p><strong>Device:</strong> ${this.deviceInfo.device.isMobile ? 'Mobile' : this.deviceInfo.device.isTablet ? 'Tablet' : 'Desktop'}</p>
            <p><strong>Browser:</strong> ${this.deviceInfo.browser.name} ${this.deviceInfo.browser.version}</p>
          ` : ''}
        </div>
      `;

      manualInstructions.innerHTML = instructionsHtml;
      manualInstructions.classList.remove('hidden');
    },

    /**
     * Start countdown timer for redirect
     */
    startRedirectCountdown: function() {
      let countdown = 3;
      const countdownEl = document.getElementById('redirect-countdown');

      const updateCountdown = () => {
        if (countdownEl) {
          countdownEl.textContent = `Redirecting in ${countdown} seconds...`;
        }

        countdown--;

        if (countdown < 0) {
          this.redirectToTarget();
        } else {
          setTimeout(updateCountdown, 1000);
        }
      };

      // Store timer reference for cleanup
      this.redirectTimer = setTimeout(updateCountdown, 0);
    },

    /**
     * Start session expiration countdown
     * @param {number} timeRemaining - Time remaining in milliseconds
     */
    startExpirationCountdown: function(timeRemaining) {
      if (timeRemaining <= 0) return;

      const countdownEl = document.getElementById('session-expiration-countdown');
      if (!countdownEl) return;

      let remaining = Math.floor(timeRemaining / 1000); // Convert to seconds

      const updateExpirationCountdown = () => {
        if (remaining <= 0) {
          if (countdownEl) {
            countdownEl.textContent = 'Session expired';
            countdownEl.style.color = '#dc3545';
          }
          this.showError('Session has expired. Please generate a new QR code.');
          return;
        }

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (countdownEl) {
          countdownEl.textContent = `Expires in ${timeString}`;

          // Change color as expiration approaches
          if (remaining <= 60) {
            countdownEl.style.color = '#dc3545'; // Red for last minute
          } else if (remaining <= 300) {
            countdownEl.style.color = '#ffc107'; // Yellow for last 5 minutes
          } else {
            countdownEl.style.color = '#28a745'; // Green for plenty of time
          }
        }

        remaining--;

        if (remaining >= 0) {
          setTimeout(updateExpirationCountdown, 1000);
        }
      };

      // Start countdown immediately
      updateExpirationCountdown();
    },

    /**
     * Add session expiration countdown to UI
     * @param {number} timeRemaining - Time remaining in milliseconds
     */
    addExpirationCountdownToUI: function(timeRemaining) {
      // Add countdown element to session info if it doesn't exist
      const sessionInfo = document.getElementById('session-info');
      if (sessionInfo && !document.getElementById('session-expiration-countdown')) {
        const countdownDiv = document.createElement('div');
        countdownDiv.className = 'session-detail';
        countdownDiv.innerHTML = `
          <span class="label">Session expires:</span>
          <span class="value countdown" id="session-expiration-countdown">Calculating...</span>
        `;
        sessionInfo.appendChild(countdownDiv);
      }

      // Start the countdown
      this.startExpirationCountdown(timeRemaining);
    }
  };

  // Export to global scope
  window.sessionProcessor = sessionProcessor;

  console.log('📱 Mobile Session Processor loaded successfully');

})();
