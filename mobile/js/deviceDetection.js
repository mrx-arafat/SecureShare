/**
 * Device Detection and Browser Optimization
 * Handles mobile device detection, browser capability testing, and UI optimization
 * @version 1.0.0
 */

(function() {
  'use strict';

  const deviceDetection = {
    // Device information cache
    deviceInfo: null,
    browserInfo: null,
    capabilities: null,
    
    /**
     * Initialize device detection and optimization
     */
    initialize: function() {
      console.log('📱 Initializing device detection...');
      
      this.deviceInfo = this.detectMobileDevice();
      this.browserInfo = this.detectBrowser();
      this.capabilities = this.checkBrowserCapabilities();
      
      // Apply optimizations based on detection results
      this.optimizeForMobile();
      
      console.log('✅ Device detection initialized:', {
        device: this.deviceInfo,
        browser: this.browserInfo,
        capabilities: this.capabilities
      });
      
      return {
        device: this.deviceInfo,
        browser: this.browserInfo,
        capabilities: this.capabilities
      };
    },
    
    /**
     * Detect if device is mobile and get device characteristics
     * @returns {Object} Device information
     */
    detectMobileDevice: function() {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Mobile device patterns
      const mobilePatterns = [
        /android/i,
        /webos/i,
        /iphone/i,
        /ipad/i,
        /ipod/i,
        /blackberry/i,
        /windows phone/i,
        /mobile/i
      ];
      
      // Tablet patterns
      const tabletPatterns = [
        /ipad/i,
        /android(?!.*mobile)/i,
        /tablet/i
      ];
      
      const isMobile = mobilePatterns.some(pattern => pattern.test(userAgent));
      const isTablet = tabletPatterns.some(pattern => pattern.test(userAgent));
      const isDesktop = !isMobile && !isTablet;
      
      // Determine device type based on screen size as well
      const isSmallScreen = screenWidth <= 768;
      const isMediumScreen = screenWidth > 768 && screenWidth <= 1024;
      const isLargeScreen = screenWidth > 1024;
      
      // Touch capability detection
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Orientation detection
      const isPortrait = screenHeight > screenWidth;
      const isLandscape = screenWidth > screenHeight;
      
      return {
        isMobile: isMobile || (isSmallScreen && hasTouch),
        isTablet: isTablet || (isMediumScreen && hasTouch),
        isDesktop: isDesktop && !hasTouch,
        hasTouch,
        screenWidth,
        screenHeight,
        pixelRatio,
        isPortrait,
        isLandscape,
        isSmallScreen,
        isMediumScreen,
        isLargeScreen,
        userAgent
      };
    },
    
    /**
     * Detect browser type and version
     * @returns {Object} Browser information
     */
    detectBrowser: function() {
      const userAgent = navigator.userAgent;
      const browsers = {
        chrome: /Chrome\/(\d+)/,
        firefox: /Firefox\/(\d+)/,
        safari: /Safari\/(\d+)/,
        edge: /Edge\/(\d+)/,
        opera: /Opera\/(\d+)/,
        samsung: /SamsungBrowser\/(\d+)/,
        webview: /wv\)/
      };
      
      let browserName = 'unknown';
      let browserVersion = 'unknown';
      
      for (const [name, pattern] of Object.entries(browsers)) {
        const match = userAgent.match(pattern);
        if (match) {
          browserName = name;
          browserVersion = match[1] || 'unknown';
          break;
        }
      }
      
      // Special handling for iOS Safari
      if (/iPhone|iPad|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent)) {
        browserName = 'safari';
        const match = userAgent.match(/Version\/(\d+)/);
        browserVersion = match ? match[1] : 'unknown';
      }
      
      return {
        name: browserName,
        version: browserVersion,
        userAgent,
        isWebView: /wv\)/.test(userAgent),
        isInApp: /FBAN|FBAV|Instagram|Twitter|LinkedIn/.test(userAgent)
      };
    },
    
    /**
     * Check browser capabilities for session processing
     * @returns {Object} Capability information
     */
    checkBrowserCapabilities: function() {
      const capabilities = {
        cookies: false,
        localStorage: false,
        sessionStorage: false,
        fetch: false,
        promises: false,
        crypto: false,
        clipboard: false,
        notifications: false,
        serviceWorker: false,
        webShare: false
      };
      
      try {
        // Cookie support
        capabilities.cookies = navigator.cookieEnabled;
        
        // Storage support
        capabilities.localStorage = typeof Storage !== 'undefined' && !!window.localStorage;
        capabilities.sessionStorage = typeof Storage !== 'undefined' && !!window.sessionStorage;
        
        // Modern JavaScript features
        capabilities.fetch = typeof fetch !== 'undefined';
        capabilities.promises = typeof Promise !== 'undefined';
        
        // Crypto support
        capabilities.crypto = !!(window.crypto && window.crypto.getRandomValues);
        
        // Clipboard API
        capabilities.clipboard = !!(navigator.clipboard && navigator.clipboard.writeText);
        
        // Notifications
        capabilities.notifications = 'Notification' in window;
        
        // Service Worker
        capabilities.serviceWorker = 'serviceWorker' in navigator;
        
        // Web Share API
        capabilities.webShare = 'share' in navigator;
        
      } catch (error) {
        console.warn('⚠️ Error checking browser capabilities:', error);
      }
      
      return capabilities;
    },
    
    /**
     * Optimize UI for mobile devices
     */
    optimizeForMobile: function() {
      if (!this.deviceInfo) return;
      
      const body = document.body;
      const container = document.querySelector('.container');
      
      // Add device-specific classes
      if (this.deviceInfo.isMobile) {
        body.classList.add('device-mobile');
      }
      if (this.deviceInfo.isTablet) {
        body.classList.add('device-tablet');
      }
      if (this.deviceInfo.hasTouch) {
        body.classList.add('device-touch');
      }
      if (this.deviceInfo.isSmallScreen) {
        body.classList.add('screen-small');
      }
      
      // Optimize for specific browsers
      if (this.browserInfo) {
        body.classList.add(`browser-${this.browserInfo.name}`);
        
        if (this.browserInfo.isWebView) {
          body.classList.add('browser-webview');
        }
        if (this.browserInfo.isInApp) {
          body.classList.add('browser-inapp');
        }
      }
      
      // Adjust viewport for mobile
      if (this.deviceInfo.isMobile) {
        this.adjustViewportForMobile();
      }
      
      // Optimize touch interactions
      if (this.deviceInfo.hasTouch) {
        this.optimizeTouchInteractions();
      }
      
      console.log('📱 Mobile optimizations applied');
    },
    
    /**
     * Adjust viewport settings for mobile devices
     */
    adjustViewportForMobile: function() {
      let viewport = document.querySelector('meta[name="viewport"]');
      
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
      }
      
      // Optimize viewport for mobile session processing
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      
      // Add mobile-specific meta tags
      const mobileMetaTags = [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'format-detection', content: 'telephone=no' }
      ];
      
      mobileMetaTags.forEach(tag => {
        if (!document.querySelector(`meta[name="${tag.name}"]`)) {
          const meta = document.createElement('meta');
          meta.name = tag.name;
          meta.content = tag.content;
          document.head.appendChild(meta);
        }
      });
    },
    
    /**
     * Optimize touch interactions
     */
    optimizeTouchInteractions: function() {
      // Add touch-friendly styles
      const style = document.createElement('style');
      style.textContent = `
        .device-touch .btn {
          min-height: 44px;
          min-width: 44px;
          padding: 12px 24px;
        }
        
        .device-touch .step {
          min-width: 44px;
          min-height: 44px;
        }
        
        .device-touch button,
        .device-touch .btn {
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
          touch-action: manipulation;
        }
        
        .device-mobile .container {
          margin: 10px;
          padding: 20px;
        }
        
        .screen-small .container {
          max-width: 100%;
          margin: 5px;
          padding: 15px;
        }
        
        .screen-small h1 {
          font-size: 20px;
        }
        
        .screen-small .subtitle {
          font-size: 14px;
        }
      `;
      document.head.appendChild(style);
    },
    
    /**
     * Check if SecureShare extension is available
     * @returns {boolean} True if extension is detected
     */
    detectExtensionAvailability: function() {
      // Check for extension-specific objects
      const hasExtension = !!(
        window.chrome && 
        window.chrome.runtime && 
        window.chrome.cookies
      );
      
      // Additional checks for extension context
      const isExtensionContext = !!(
        window.chrome && 
        window.chrome.runtime && 
        window.chrome.runtime.id
      );
      
      return hasExtension || isExtensionContext;
    },
    
    /**
     * Show installation prompt for SecureShare extension
     */
    showInstallPrompt: function() {
      if (this.detectExtensionAvailability()) {
        console.log('✅ SecureShare extension detected');
        return false;
      }
      
      console.log('🔌 SecureShare extension not detected, showing install prompt');
      
      // Show extension installation prompt
      const promptEl = document.getElementById('extension-prompt');
      if (promptEl) {
        promptEl.classList.remove('hidden');
        
        // Update install button based on browser
        const installBtn = promptEl.querySelector('button[onclick="installExtension()"]');
        if (installBtn && this.browserInfo) {
          switch (this.browserInfo.name) {
            case 'chrome':
              installBtn.textContent = '📦 Install from Chrome Web Store';
              break;
            case 'firefox':
              installBtn.textContent = '🦊 Install from Firefox Add-ons';
              break;
            case 'edge':
              installBtn.textContent = '🌐 Install from Edge Add-ons';
              break;
            default:
              installBtn.textContent = '📦 Install Extension';
          }
        }
      }
      
      return true;
    },
    
    /**
     * Get fallback instructions for unsupported browsers
     * @returns {Object} Fallback instruction data
     */
    getFallbackInstructions: function() {
      const instructions = {
        title: 'Manual Session Setup',
        steps: [],
        compatibility: 'limited'
      };
      
      if (!this.capabilities.cookies) {
        instructions.steps.push('Enable cookies in your browser settings');
        instructions.compatibility = 'incompatible';
      }
      
      if (!this.capabilities.fetch) {
        instructions.steps.push('Update your browser to a newer version');
        instructions.compatibility = 'incompatible';
      }
      
      if (this.browserInfo.isWebView || this.browserInfo.isInApp) {
        instructions.steps.push('Open this link in your default browser instead of the app');
        instructions.compatibility = 'limited';
      }
      
      // Add general fallback steps
      instructions.steps.push(
        'Copy the session data from the QR code',
        'Install the SecureShare browser extension',
        'Open the extension and select "Restore Session"',
        'Paste the session data and click "Apply"'
      );
      
      return instructions;
    },
    
    /**
     * Create browser compatibility matrix
     * @returns {Object} Compatibility information
     */
    getBrowserCompatibility: function() {
      const compatibility = {
        supported: false,
        level: 'none',
        issues: [],
        recommendations: []
      };
      
      // Check minimum requirements
      if (this.capabilities.cookies && this.capabilities.fetch && this.capabilities.promises) {
        compatibility.supported = true;
        compatibility.level = 'basic';
      }
      
      // Enhanced features
      if (compatibility.supported && this.capabilities.crypto && this.capabilities.clipboard) {
        compatibility.level = 'enhanced';
      }
      
      // Full features
      if (compatibility.level === 'enhanced' && this.detectExtensionAvailability()) {
        compatibility.level = 'full';
      }
      
      // Identify issues
      if (!this.capabilities.cookies) {
        compatibility.issues.push('Cookies are disabled or not supported');
        compatibility.recommendations.push('Enable cookies in browser settings');
      }
      
      if (!this.capabilities.fetch) {
        compatibility.issues.push('Modern JavaScript features not supported');
        compatibility.recommendations.push('Update to a newer browser version');
      }
      
      if (this.browserInfo.isWebView) {
        compatibility.issues.push('Running in WebView context');
        compatibility.recommendations.push('Open in default browser for better compatibility');
      }
      
      if (this.browserInfo.isInApp) {
        compatibility.issues.push('Running inside another app');
        compatibility.recommendations.push('Use "Open in Browser" option');
      }
      
      return compatibility;
    }
  };

  // Export to global scope
  window.deviceDetection = deviceDetection;

  console.log('📱 Device Detection module loaded successfully');

})();
