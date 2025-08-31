/**
 * Login Status Detection Module
 * Analyzes cookies and page content to determine user login status
 * @version 1.0.0
 */

(function() {
  'use strict';

  const LoginDetection = {
    // Common authentication cookie patterns
    AUTH_COOKIE_PATTERNS: [
      /session/i,
      /auth/i,
      /login/i,
      /token/i,
      /user/i,
      /account/i,
      /logged/i,
      /signin/i,
      /sso/i,
      /oauth/i,
      /jwt/i,
      /bearer/i,
      /csrf/i,
      /xsrf/i
    ],

    // Site-specific login indicators
    SITE_SPECIFIC_PATTERNS: {
      'netflix.com': {
        cookies: ['NetflixId', 'SecureNetflixId', 'nfvdid'],
        indicators: ['profilesGate', 'browse']
      },
      'youtube.com': {
        cookies: ['SAPISID', 'SSID', 'LOGIN_INFO'],
        indicators: ['logged_in', 'VISITOR_INFO']
      },
      'facebook.com': {
        cookies: ['c_user', 'xs', 'sb'],
        indicators: ['user_id']
      },
      'twitter.com': {
        cookies: ['auth_token', 'twid', 'ct0'],
        indicators: ['logged_in']
      },
      'instagram.com': {
        cookies: ['sessionid', 'csrftoken', 'mid'],
        indicators: ['logged_in']
      },
      'linkedin.com': {
        cookies: ['li_at', 'JSESSIONID', 'liap'],
        indicators: ['voyager']
      },
      'github.com': {
        cookies: ['user_session', '_gh_sess', 'logged_in'],
        indicators: ['logged_in']
      },
      'amazon.com': {
        cookies: ['session-id', 'at-main', 'x-main'],
        indicators: ['nav-user-name']
      },
      'google.com': {
        cookies: ['SAPISID', 'SSID', 'APISID'],
        indicators: ['logged_in']
      }
    },

    /**
     * Detect login status for current tab
     * @returns {Promise<Object>} Login status information
     */
    detectLoginStatus: async function() {
      try {
        const tab = await this.getCurrentTab();
        const domain = this.extractDomain(tab.url);
        const cookies = await this.getTabCookies(tab.url);
        
        const loginInfo = {
          isLoggedIn: false,
          confidence: 0,
          indicators: [],
          userInfo: null,
          sessionCookies: [],
          domain: domain,
          url: tab.url,
          title: tab.title,
          favicon: tab.favIconUrl
        };

        // Analyze cookies for login indicators
        const cookieAnalysis = this.analyzeCookies(cookies, domain);
        loginInfo.isLoggedIn = cookieAnalysis.isLoggedIn;
        loginInfo.confidence = cookieAnalysis.confidence;
        loginInfo.indicators = cookieAnalysis.indicators;
        loginInfo.sessionCookies = cookieAnalysis.sessionCookies;
        loginInfo.userInfo = cookieAnalysis.userInfo;

        // Get additional page-based indicators if possible
        try {
          const pageInfo = await this.getPageLoginIndicators(tab.id);
          if (pageInfo) {
            loginInfo.indicators.push(...pageInfo.indicators);
            if (pageInfo.userInfo) {
              loginInfo.userInfo = { ...loginInfo.userInfo, ...pageInfo.userInfo };
            }
            // Boost confidence if page indicators confirm login
            if (pageInfo.isLoggedIn) {
              loginInfo.confidence = Math.min(100, loginInfo.confidence + 20);
            }
          }
        } catch (error) {
          console.log('Could not get page indicators:', error.message);
        }

        console.log('🔍 Login detection result:', loginInfo);
        return loginInfo;

      } catch (error) {
        console.error('❌ Login detection failed:', error);
        return {
          isLoggedIn: false,
          confidence: 0,
          indicators: ['detection_failed'],
          userInfo: null,
          sessionCookies: [],
          domain: null,
          url: null,
          title: null,
          favicon: null,
          error: error.message
        };
      }
    },

    /**
     * Get current active tab
     * @returns {Promise<Object>} Tab information
     */
    getCurrentTab: function() {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (tabs && tabs.length > 0) {
            resolve(tabs[0]);
          } else {
            reject(new Error('No active tab found'));
          }
        });
      });
    },

    /**
     * Get cookies for a specific URL
     * @param {string} url - URL to get cookies for
     * @returns {Promise<Array>} Array of cookies
     */
    getTabCookies: function(url) {
      return new Promise((resolve, reject) => {
        chrome.cookies.getAll({ url: url }, (cookies) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(cookies || []);
          }
        });
      });
    },

    /**
     * Extract domain from URL
     * @param {string} url - URL to extract domain from
     * @returns {string} Domain name
     */
    extractDomain: function(url) {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
      } catch (error) {
        console.error('Invalid URL:', url);
        return null;
      }
    },

    /**
     * Analyze cookies to determine login status
     * @param {Array} cookies - Array of cookie objects
     * @param {string} domain - Domain name
     * @returns {Object} Analysis result
     */
    analyzeCookies: function(cookies, domain) {
      const analysis = {
        isLoggedIn: false,
        confidence: 0,
        indicators: [],
        sessionCookies: [],
        userInfo: {}
      };

      if (!cookies || cookies.length === 0) {
        analysis.indicators.push('no_cookies');
        return analysis;
      }

      // Check site-specific patterns first
      const sitePatterns = this.SITE_SPECIFIC_PATTERNS[domain];
      if (sitePatterns) {
        const siteAnalysis = this.analyzeSiteSpecificCookies(cookies, sitePatterns);
        if (siteAnalysis.isLoggedIn) {
          analysis.isLoggedIn = true;
          analysis.confidence = 85; // High confidence for site-specific patterns
          analysis.indicators.push('site_specific_cookies');
          analysis.sessionCookies.push(...siteAnalysis.sessionCookies);
          analysis.userInfo = siteAnalysis.userInfo;
        }
      }

      // Check generic authentication patterns
      const genericAnalysis = this.analyzeGenericAuthCookies(cookies);
      if (genericAnalysis.authCookieCount > 0) {
        analysis.isLoggedIn = true;
        analysis.confidence = Math.max(analysis.confidence, genericAnalysis.confidence);
        analysis.indicators.push('auth_cookies_found');
        analysis.sessionCookies.push(...genericAnalysis.sessionCookies);
      }

      // Check for user identification cookies
      const userAnalysis = this.extractUserInfo(cookies, domain);
      if (userAnalysis.userInfo) {
        analysis.userInfo = { ...analysis.userInfo, ...userAnalysis.userInfo };
        analysis.confidence = Math.min(100, analysis.confidence + 10);
        analysis.indicators.push('user_info_found');
      }

      // Check cookie characteristics
      const charAnalysis = this.analyzeCookieCharacteristics(cookies);
      if (charAnalysis.hasSecureCookies) {
        analysis.confidence = Math.min(100, analysis.confidence + 5);
        analysis.indicators.push('secure_cookies');
      }
      if (charAnalysis.hasHttpOnlyCookies) {
        analysis.confidence = Math.min(100, analysis.confidence + 5);
        analysis.indicators.push('httponly_cookies');
      }

      return analysis;
    },

    /**
     * Analyze site-specific authentication cookies
     * @param {Array} cookies - Array of cookies
     * @param {Object} patterns - Site-specific patterns
     * @returns {Object} Analysis result
     */
    analyzeSiteSpecificCookies: function(cookies, patterns) {
      const analysis = {
        isLoggedIn: false,
        sessionCookies: [],
        userInfo: {}
      };

      const cookieNames = cookies.map(c => c.name.toLowerCase());
      const matchedCookies = patterns.cookies.filter(pattern => 
        cookieNames.some(name => name.includes(pattern.toLowerCase()))
      );

      if (matchedCookies.length > 0) {
        analysis.isLoggedIn = true;
        analysis.sessionCookies = cookies.filter(cookie => 
          matchedCookies.some(pattern => 
            cookie.name.toLowerCase().includes(pattern.toLowerCase())
          )
        );
      }

      return analysis;
    },

    /**
     * Analyze generic authentication cookie patterns
     * @param {Array} cookies - Array of cookies
     * @returns {Object} Analysis result
     */
    analyzeGenericAuthCookies: function(cookies) {
      const analysis = {
        authCookieCount: 0,
        confidence: 0,
        sessionCookies: []
      };

      cookies.forEach(cookie => {
        const isAuthCookie = this.AUTH_COOKIE_PATTERNS.some(pattern => 
          pattern.test(cookie.name) || pattern.test(cookie.value)
        );

        if (isAuthCookie) {
          analysis.authCookieCount++;
          analysis.sessionCookies.push(cookie);
        }
      });

      // Calculate confidence based on number of auth cookies
      if (analysis.authCookieCount >= 3) {
        analysis.confidence = 70;
      } else if (analysis.authCookieCount >= 2) {
        analysis.confidence = 50;
      } else if (analysis.authCookieCount >= 1) {
        analysis.confidence = 30;
      }

      return analysis;
    },

    /**
     * Extract user information from cookies
     * @param {Array} cookies - Array of cookies
     * @param {string} domain - Domain name
     * @returns {Object} User information
     */
    extractUserInfo: function(cookies, domain) {
      const userInfo = {};

      // Look for common user identifier patterns
      cookies.forEach(cookie => {
        const name = cookie.name.toLowerCase();
        const value = cookie.value;

        // Email patterns
        if (name.includes('email') || name.includes('user') || name.includes('account')) {
          if (value.includes('@') && value.includes('.')) {
            userInfo.email = value;
          } else if (value.length > 3 && value.length < 50) {
            userInfo.username = value;
          }
        }

        // User ID patterns
        if (name.includes('userid') || name.includes('uid') || name === 'id') {
          if (/^\d+$/.test(value)) {
            userInfo.userId = value;
          }
        }

        // Display name patterns
        if (name.includes('name') || name.includes('display')) {
          if (value.length > 1 && value.length < 100 && !value.includes('=')) {
            userInfo.displayName = value;
          }
        }
      });

      return { userInfo: Object.keys(userInfo).length > 0 ? userInfo : null };
    },

    /**
     * Analyze cookie security characteristics
     * @param {Array} cookies - Array of cookies
     * @returns {Object} Characteristics analysis
     */
    analyzeCookieCharacteristics: function(cookies) {
      const analysis = {
        hasSecureCookies: false,
        hasHttpOnlyCookies: false,
        hasSameSiteCookies: false,
        totalCookies: cookies.length
      };

      cookies.forEach(cookie => {
        if (cookie.secure) analysis.hasSecureCookies = true;
        if (cookie.httpOnly) analysis.hasHttpOnlyCookies = true;
        if (cookie.sameSite && cookie.sameSite !== 'no_restriction') {
          analysis.hasSameSiteCookies = true;
        }
      });

      return analysis;
    },

    /**
     * Get page-based login indicators using content script
     * @param {number} tabId - Tab ID
     * @returns {Promise<Object>} Page indicators
     */
    getPageLoginIndicators: function(tabId) {
      return new Promise((resolve, reject) => {
        // Inject content script to check for login indicators
        chrome.tabs.executeScript(tabId, {
          code: `
            (function() {
              const indicators = [];
              let userInfo = {};
              
              // Check for common login indicators in DOM
              const loginSelectors = [
                '[data-testid*="user"]',
                '[class*="user"]',
                '[class*="profile"]',
                '[class*="account"]',
                '[id*="user"]',
                '[id*="profile"]',
                '.logged-in',
                '.authenticated'
              ];
              
              loginSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                  indicators.push('dom_login_indicator');
                }
              });
              
              // Check for user name or email in page
              const textContent = document.body.textContent || '';
              const emailMatch = textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
              if (emailMatch) {
                userInfo.email = emailMatch[0];
                indicators.push('email_in_page');
              }
              
              // Check page title for login indicators
              const title = document.title.toLowerCase();
              if (title.includes('dashboard') || title.includes('profile') || title.includes('account')) {
                indicators.push('login_page_title');
              }
              
              return {
                isLoggedIn: indicators.length > 0,
                indicators: indicators,
                userInfo: Object.keys(userInfo).length > 0 ? userInfo : null
              };
            })();
          `
        }, (results) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (results && results[0]) {
            resolve(results[0]);
          } else {
            resolve(null);
          }
        });
      });
    },

    /**
     * Format login status for display
     * @param {Object} loginInfo - Login information
     * @returns {Object} Formatted display information
     */
    formatLoginStatus: function(loginInfo) {
      const formatted = {
        statusText: 'Unknown',
        statusIcon: '❓',
        statusClass: 'status-unknown',
        userDisplay: 'Not detected',
        confidenceText: `${loginInfo.confidence}%`,
        sessionCount: loginInfo.sessionCookies.length
      };

      if (loginInfo.isLoggedIn) {
        if (loginInfo.confidence >= 80) {
          formatted.statusText = 'Logged In';
          formatted.statusIcon = '✅';
          formatted.statusClass = 'status-logged-in';
        } else if (loginInfo.confidence >= 50) {
          formatted.statusText = 'Likely Logged In';
          formatted.statusIcon = '🟡';
          formatted.statusClass = 'status-likely-logged-in';
        } else {
          formatted.statusText = 'Possibly Logged In';
          formatted.statusIcon = '🟠';
          formatted.statusClass = 'status-possibly-logged-in';
        }
      } else {
        formatted.statusText = 'Not Logged In';
        formatted.statusIcon = '❌';
        formatted.statusClass = 'status-not-logged-in';
      }

      // Format user display
      if (loginInfo.userInfo) {
        if (loginInfo.userInfo.email) {
          formatted.userDisplay = loginInfo.userInfo.email;
        } else if (loginInfo.userInfo.displayName) {
          formatted.userDisplay = loginInfo.userInfo.displayName;
        } else if (loginInfo.userInfo.username) {
          formatted.userDisplay = loginInfo.userInfo.username;
        } else if (loginInfo.userInfo.userId) {
          formatted.userDisplay = `User ID: ${loginInfo.userInfo.userId}`;
        }
      }

      return formatted;
    }
  };

  // Export to global scope
  window.LoginDetection = LoginDetection;

  console.log('🔍 Login Detection module loaded successfully');

})();
