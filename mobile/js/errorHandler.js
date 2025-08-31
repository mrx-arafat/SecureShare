/**
 * Comprehensive Error Handling System
 * Manages all error scenarios with user-friendly messages and recovery options
 * @version 1.0.0
 */

(function() {
  'use strict';

  const ErrorHandler = {
    // Error tracking
    errorLog: [],
    retryAttempts: new Map(),
    maxRetries: 3,
    baseRetryDelay: 1000, // 1 second
    
    // Error types
    ERROR_TYPES: {
      EXPIRED_LINK: 'expired_link',
      INVALID_SESSION: 'invalid_session',
      COOKIE_FAILURE: 'cookie_failure',
      NETWORK_ERROR: 'network_error',
      BROWSER_INCOMPATIBLE: 'browser_incompatible',
      EXTENSION_MISSING: 'extension_missing',
      PERMISSION_DENIED: 'permission_denied',
      UNKNOWN_ERROR: 'unknown_error'
    },
    
    /**
     * Initialize error handler
     */
    initialize: function() {
      console.log('🛡️ Initializing error handler...');
      
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      // Initialize retry tracking
      this.retryAttempts.clear();
      
      console.log('✅ Error handler initialized');
    },
    
    /**
     * Set up global error handlers for unhandled errors
     */
    setupGlobalErrorHandlers: function() {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        console.error('🚨 Unhandled promise rejection:', event.reason);
        this.handleError(event.reason, 'unhandled_promise', {
          promise: event.promise,
          reason: event.reason
        });
        event.preventDefault();
      });
      
      // Handle JavaScript errors
      window.addEventListener('error', (event) => {
        console.error('🚨 JavaScript error:', event.error);
        this.handleError(event.error, 'javascript_error', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });
    },
    
    /**
     * Main error handling function
     * @param {Error|string} error - Error object or message
     * @param {string} type - Error type
     * @param {Object} context - Additional context
     */
    handleError: function(error, type = 'unknown_error', context = {}) {
      const errorInfo = {
        error: error instanceof Error ? error.message : error,
        type,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // Log error (privacy-safe)
      this.logError(errorInfo);
      
      // Handle specific error types
      switch (type) {
        case this.ERROR_TYPES.EXPIRED_LINK:
          this.handleExpiredLink(errorInfo);
          break;
        case this.ERROR_TYPES.INVALID_SESSION:
          this.handleInvalidSession(errorInfo);
          break;
        case this.ERROR_TYPES.COOKIE_FAILURE:
          this.handleCookieFailure(errorInfo);
          break;
        case this.ERROR_TYPES.NETWORK_ERROR:
          this.handleNetworkError(errorInfo);
          break;
        case this.ERROR_TYPES.BROWSER_INCOMPATIBLE:
          this.handleBrowserIncompatible(errorInfo);
          break;
        case this.ERROR_TYPES.EXTENSION_MISSING:
          this.handleExtensionMissing(errorInfo);
          break;
        case this.ERROR_TYPES.PERMISSION_DENIED:
          this.handlePermissionDenied(errorInfo);
          break;
        default:
          this.handleUnknownError(errorInfo);
      }
    },
    
    /**
     * Handle expired link errors
     * @param {Object} errorInfo - Error information
     */
    handleExpiredLink: function(errorInfo) {
      console.log('⏰ Handling expired link error');
      
      this.showUserFriendlyError({
        title: '⏰ Session Expired',
        message: 'This session link has expired and can no longer be used.',
        explanation: 'Session links expire after 30 minutes for security reasons.',
        nextSteps: [
          'Ask the sender to generate a new QR code',
          'Scan the new QR code to access the session',
          'Session links can only be used once'
        ],
        actionButton: {
          text: '🔄 Request New Link',
          action: () => this.requestNewLink()
        },
        severity: 'warning'
      });
    },
    
    /**
     * Handle invalid session errors
     * @param {Object} errorInfo - Error information
     */
    handleInvalidSession: function(errorInfo) {
      console.log('🚫 Handling invalid session error');
      
      this.showUserFriendlyError({
        title: '🚫 Invalid Session',
        message: 'The session data could not be processed.',
        explanation: 'This could happen if the link was corrupted or tampered with.',
        nextSteps: [
          'Check that you scanned the complete QR code',
          'Ask for a new QR code to be generated',
          'Make sure you\'re using the latest link'
        ],
        actionButton: {
          text: '🔄 Try Again',
          action: () => this.retryOperation('session_processing')
        },
        severity: 'error'
      });
    },
    
    /**
     * Handle cookie application failures
     * @param {Object} errorInfo - Error information
     */
    handleCookieFailure: function(errorInfo) {
      console.log('🍪 Handling cookie failure error');
      
      this.showUserFriendlyError({
        title: '🍪 Cookie Setup Failed',
        message: 'Unable to apply session cookies to your browser.',
        explanation: 'This usually happens when cookies are blocked or browser security settings prevent automatic cookie setting.',
        nextSteps: [
          'Enable cookies in your browser settings',
          'Disable any cookie-blocking extensions temporarily',
          'Try opening the link in a different browser',
          'Use the manual setup option below'
        ],
        actionButton: {
          text: '⚙️ Manual Setup',
          action: () => this.fallbackToManualMode()
        },
        secondaryButton: {
          text: '🔄 Retry',
          action: () => this.retryOperation('cookie_application')
        },
        severity: 'warning'
      });
    },
    
    /**
     * Handle network errors
     * @param {Object} errorInfo - Error information
     */
    handleNetworkError: function(errorInfo) {
      console.log('🌐 Handling network error');
      
      this.showUserFriendlyError({
        title: '🌐 Connection Problem',
        message: 'Unable to connect to the session server.',
        explanation: 'This could be due to network connectivity issues or server problems.',
        nextSteps: [
          'Check your internet connection',
          'Try again in a few moments',
          'If the problem persists, the server may be temporarily unavailable'
        ],
        actionButton: {
          text: '🔄 Retry Connection',
          action: () => this.retryOperation('network_request')
        },
        severity: 'error'
      });
    },
    
    /**
     * Handle browser incompatibility
     * @param {Object} errorInfo - Error information
     */
    handleBrowserIncompatible: function(errorInfo) {
      console.log('🌐 Handling browser incompatibility');
      
      const browserInfo = window.deviceDetection ? window.deviceDetection.detectBrowser() : null;
      
      this.showUserFriendlyError({
        title: '🌐 Browser Not Supported',
        message: 'Your browser doesn\'t support automatic session processing.',
        explanation: `${browserInfo ? browserInfo.name : 'This browser'} lacks required features for secure session handling.`,
        nextSteps: [
          'Update your browser to the latest version',
          'Try using Chrome, Firefox, or Safari',
          'Use the manual setup option below'
        ],
        actionButton: {
          text: '📖 Manual Setup',
          action: () => this.fallbackToManualMode()
        },
        severity: 'warning'
      });
    },
    
    /**
     * Handle missing extension
     * @param {Object} errorInfo - Error information
     */
    handleExtensionMissing: function(errorInfo) {
      console.log('🔌 Handling missing extension');
      
      this.showUserFriendlyError({
        title: '🔌 Extension Required',
        message: 'SecureShare browser extension is needed for automatic session processing.',
        explanation: 'The extension provides enhanced security and automatic cookie handling.',
        nextSteps: [
          'Install the SecureShare browser extension',
          'Refresh this page after installation',
          'Or continue with limited functionality'
        ],
        actionButton: {
          text: '📦 Install Extension',
          action: () => this.redirectToExtensionStore()
        },
        secondaryButton: {
          text: '📱 Continue Anyway',
          action: () => this.continueWithoutExtension()
        },
        severity: 'info'
      });
    },
    
    /**
     * Handle permission denied errors
     * @param {Object} errorInfo - Error information
     */
    handlePermissionDenied: function(errorInfo) {
      console.log('🔒 Handling permission denied');
      
      this.showUserFriendlyError({
        title: '🔒 Permission Required',
        message: 'Browser permissions are needed to process the session.',
        explanation: 'SecureShare needs permission to manage cookies and access storage.',
        nextSteps: [
          'Click "Allow" when prompted for permissions',
          'Check browser settings for blocked permissions',
          'Refresh the page and try again'
        ],
        actionButton: {
          text: '🔄 Request Permissions',
          action: () => this.requestPermissions()
        },
        severity: 'warning'
      });
    },
    
    /**
     * Handle unknown errors
     * @param {Object} errorInfo - Error information
     */
    handleUnknownError: function(errorInfo) {
      console.log('❓ Handling unknown error');
      
      this.showUserFriendlyError({
        title: '❓ Unexpected Error',
        message: 'Something went wrong while processing your session.',
        explanation: 'An unexpected error occurred. This might be a temporary issue.',
        nextSteps: [
          'Try refreshing the page',
          'Generate a new QR code',
          'Contact support if the problem continues'
        ],
        actionButton: {
          text: '🔄 Try Again',
          action: () => this.retryOperation('general')
        },
        secondaryButton: {
          text: '📖 Manual Setup',
          action: () => this.fallbackToManualMode()
        },
        severity: 'error'
      });
    },
    
    /**
     * Show user-friendly error message
     * @param {Object} errorConfig - Error configuration
     */
    showUserFriendlyError: function(errorConfig) {
      // Hide loading states
      document.getElementById('loading-state')?.classList.add('hidden');
      document.getElementById('success-state')?.classList.add('hidden');
      
      // Show error state
      const errorState = document.getElementById('error-state');
      if (errorState) {
        errorState.classList.remove('hidden');
        
        // Update error content
        const errorTitle = errorState.querySelector('h2');
        const errorMessage = errorState.querySelector('#error-message');
        
        if (errorTitle) errorTitle.textContent = errorConfig.title;
        if (errorMessage) errorMessage.textContent = errorConfig.message;
        
        // Add detailed explanation if container exists
        this.addErrorDetails(errorState, errorConfig);
        
        // Update action buttons
        this.updateErrorButtons(errorState, errorConfig);
      }
    },
    
    /**
     * Add detailed error explanation
     * @param {Element} errorState - Error state container
     * @param {Object} errorConfig - Error configuration
     */
    addErrorDetails: function(errorState, errorConfig) {
      // Remove existing details
      const existingDetails = errorState.querySelector('.error-details');
      if (existingDetails) {
        existingDetails.remove();
      }
      
      // Create new details section
      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'error-details';
      detailsDiv.innerHTML = `
        <div class="error-explanation">
          <h4>What happened?</h4>
          <p>${errorConfig.explanation}</p>
        </div>
        <div class="error-next-steps">
          <h4>What can you do?</h4>
          <ol>
            ${errorConfig.nextSteps.map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>
      `;
      
      // Insert before buttons
      const buttons = errorState.querySelector('.error-buttons') || errorState.querySelector('button');
      if (buttons) {
        errorState.insertBefore(detailsDiv, buttons);
      } else {
        errorState.appendChild(detailsDiv);
      }
    },
    
    /**
     * Update error action buttons
     * @param {Element} errorState - Error state container
     * @param {Object} errorConfig - Error configuration
     */
    updateErrorButtons: function(errorState, errorConfig) {
      // Find or create button container
      let buttonContainer = errorState.querySelector('.error-buttons');
      if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'error-buttons';
        errorState.appendChild(buttonContainer);
      }
      
      // Clear existing buttons
      buttonContainer.innerHTML = '';
      
      // Add primary action button
      if (errorConfig.actionButton) {
        const primaryBtn = document.createElement('button');
        primaryBtn.className = 'btn';
        primaryBtn.textContent = errorConfig.actionButton.text;
        primaryBtn.onclick = errorConfig.actionButton.action;
        buttonContainer.appendChild(primaryBtn);
      }
      
      // Add secondary action button
      if (errorConfig.secondaryButton) {
        const secondaryBtn = document.createElement('button');
        secondaryBtn.className = 'btn btn-secondary';
        secondaryBtn.textContent = errorConfig.secondaryButton.text;
        secondaryBtn.onclick = errorConfig.secondaryButton.action;
        buttonContainer.appendChild(secondaryBtn);
      }
    },

    /**
     * Retry mechanism with exponential backoff
     * @param {string} operation - Operation to retry
     * @param {Function} retryFunction - Function to retry
     * @param {Object} context - Additional context
     */
    retryOperation: function(operation, retryFunction = null, context = {}) {
      const currentAttempts = this.retryAttempts.get(operation) || 0;

      if (currentAttempts >= this.maxRetries) {
        console.log(`❌ Max retry attempts reached for ${operation}`);
        this.handleError(`Max retry attempts reached for ${operation}`, this.ERROR_TYPES.UNKNOWN_ERROR, context);
        return;
      }

      const delay = this.baseRetryDelay * Math.pow(2, currentAttempts); // Exponential backoff
      this.retryAttempts.set(operation, currentAttempts + 1);

      console.log(`🔄 Retrying ${operation} (attempt ${currentAttempts + 1}/${this.maxRetries}) in ${delay}ms`);

      // Show retry message to user
      this.showRetryMessage(operation, currentAttempts + 1, delay);

      setTimeout(() => {
        if (retryFunction) {
          retryFunction();
        } else {
          // Default retry behavior based on operation
          this.performDefaultRetry(operation);
        }
      }, delay);
    },

    /**
     * Fallback to manual mode with copy-paste instructions
     */
    fallbackToManualMode: function() {
      console.log('📖 Falling back to manual mode');

      // Show manual instructions
      const manualInstructions = document.getElementById('manual-instructions');
      if (manualInstructions) {
        manualInstructions.classList.remove('hidden');

        // Update instructions with current session data if available
        if (window.sessionProcessor && window.sessionProcessor.sessionData) {
          this.updateManualInstructions(window.sessionProcessor.sessionData);
        }
      }

      // Hide error state, show manual mode
      document.getElementById('error-state')?.classList.add('hidden');
      document.getElementById('loading-state')?.classList.add('hidden');
    },

    /**
     * Log error for debugging (privacy-safe)
     * @param {Object} errorInfo - Error information
     */
    logError: function(errorInfo) {
      // Create privacy-safe log entry
      const logEntry = {
        timestamp: errorInfo.timestamp,
        type: errorInfo.type,
        message: errorInfo.error,
        browser: this.getBrowserInfo(),
        context: this.sanitizeContext(errorInfo.context)
      };

      this.errorLog.push(logEntry);

      // Keep only last 50 errors to prevent memory issues
      if (this.errorLog.length > 50) {
        this.errorLog.shift();
      }

      console.log('📝 Error logged:', logEntry);
    },

    /**
     * Get browser information for logging
     * @returns {Object} Browser information
     */
    getBrowserInfo: function() {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      };
    },

    /**
     * Sanitize context to remove sensitive information
     * @param {Object} context - Original context
     * @returns {Object} Sanitized context
     */
    sanitizeContext: function(context) {
      const sanitized = { ...context };

      // Remove sensitive fields
      delete sanitized.sessionData;
      delete sanitized.cookies;
      delete sanitized.encryptionKey;
      delete sanitized.sessionId;

      return sanitized;
    },

    /**
     * Graceful degradation - ensure basic functionality works
     */
    gracefulDegradation: function() {
      console.log('🛡️ Implementing graceful degradation');

      // Check for essential features and provide fallbacks
      const essentialFeatures = {
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined',
        localStorage: typeof Storage !== 'undefined' && !!window.localStorage,
        cookies: navigator.cookieEnabled
      };

      const missingFeatures = Object.entries(essentialFeatures)
        .filter(([feature, available]) => !available)
        .map(([feature]) => feature);

      if (missingFeatures.length > 0) {
        console.warn('⚠️ Missing essential features:', missingFeatures);

        this.handleError(
          `Missing essential browser features: ${missingFeatures.join(', ')}`,
          this.ERROR_TYPES.BROWSER_INCOMPATIBLE,
          { missingFeatures }
        );
        return false;
      }

      return true;
    }
  };

  // Export to global scope
  window.ErrorHandler = ErrorHandler;

  console.log('🛡️ Error Handler module loaded successfully');

})();
