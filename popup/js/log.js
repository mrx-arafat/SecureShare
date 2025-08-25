/**
 * Logging Module
 * Provides centralized logging with ability to disable in production
 * @module log
 */
(function() {
  'use strict'

  // Set to false in production builds
  const DEBUG_MODE = true

  /**
   * Main logging function
   * @param {...any} args - Arguments to log
   */
  window.log = function(...args) {
    if (DEBUG_MODE) {
      console.log('[SecureShare]', ...args)
    }
  }

  /**
   * Error logging
   * @param {...any} args - Arguments to log
   */
  window.logError = function(...args) {
    console.error('[SecureShare Error]', ...args)
  }

  /**
   * Warning logging
   * @param {...any} args - Arguments to log
   */
  window.logWarn = function(...args) {
    if (DEBUG_MODE) {
      console.warn('[SecureShare Warning]', ...args)
    }
  }
})()
