/**
 * SecureShare Main Application
 * Version: 1.0.0
 * Consolidates and modernizes the extension functionality
 */

(function() {
  'use strict'

  /**
   * Application State Management
   */
  const AppState = {
    currentView: 'menu',
    currentTab: null,
    isProcessing: false,
    
    /**
     * Update application state
     * @param {Object} updates - State updates
     */
    update(updates) {
      Object.assign(this, updates)
      log('[AppState] Updated:', updates)
    }
  }

  /**
   * UI Controller
   */
  const UI = {
    /**
     * Initialize UI components
     */
    init() {
      this.attachGlobalEvents()
      this.render('menu')
    },

    /**
     * Render a view template
     * @param {string} viewName - Name of the view to render
     * @param {Object} data - Data for the template
     */
    render(viewName, data = {}) {
      log('[UI] Rendering view:', viewName, data)
      
      const templateId = `js-template-${viewName}`
      const templateEl = document.getElementById(templateId)
      
      if (!templateEl) {
        logError('Template not found:', templateId)
        return
      }
      
      const template = new _t(templateEl.innerHTML)
      document.getElementById('app').innerHTML = template.render(data)
      
      AppState.update({ currentView: viewName })
      this.attachViewEvents(viewName)
      
      // Track page view (privacy-respecting)
      if (window.analytics) {
        window.analytics.trackPageView(viewName)
      }
    },

    /**
     * Attach events for specific view
     * @param {string} viewName - Name of the view
     */
    attachViewEvents(viewName) {
      const eventHandlers = {
        'menu': this.attachMenuEvents,
        'share': this.attachShareEvents,
        'restore': this.attachRestoreEvents,
        'history': this.attachHistoryEvents
      }
      
      const handler = eventHandlers[viewName]
      if (handler) {
        handler.call(this)
      }
      
      this.attachBackButton()
    },

    /**
     * Attach global events
     */
    attachGlobalEvents() {
      // Handle errors globally
      window.addEventListener('error', (e) => {
        logError('Global error:', e.error)
        this.showError('An unexpected error occurred')
      })
    },

    /**
     * Attach menu events
     */
    attachMenuEvents() {
      document.querySelectorAll('[data-menu]').forEach(button => {
        button.addEventListener('click', (e) => {
          const menu = e.currentTarget.dataset.menu
          this.handleMenuClick(menu)
        })
      })
    },

    /**
     * Handle menu navigation
     * @param {string} menu - Menu item clicked
     */
    handleMenuClick(menu) {
      log('[UI] Menu clicked:', menu)
      
      switch(menu) {
        case 'share':
          this.prepareShareView()
          break
        case 'restore':
          this.render('restore')
          break
        case 'history':
          this.prepareHistoryView()
          break
        default:
          logWarn('Unknown menu:', menu)
      }
    },

    /**
     * Prepare share view with current tab info
     */
    async prepareShareView() {
      try {
        const tab = await this.getCurrentTab()
        AppState.update({ currentTab: tab })
        this.render('share', { tab })
      } catch (error) {
        logError('Failed to get current tab:', error)
        this.showError('Failed to get current tab information')
      }
    },

    /**
     * Get current active tab
     * @returns {Promise<Object>} Current tab info
     */
    getCurrentTab() {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else if (tabs && tabs[0]) {
            resolve(tabs[0])
          } else {
            reject(new Error('No active tab found'))
          }
        })
      })
    },

    /**
     * Attach share view events
     */
    attachShareEvents() {
      const form = document.getElementById('js-share-session')
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault()
          this.handleShare(new FormData(form))
        })
        
        // Enable submit button when recipient code is entered
        const pubkeyInput = form.querySelector('[name="pubkey"]')
        const submitButton = form.querySelector('[type="submit"]')
        
        if (pubkeyInput && submitButton) {
          pubkeyInput.addEventListener('input', () => {
            submitButton.disabled = !pubkeyInput.value.trim()
          })
        }
        
        // Handle timeout input
        const timeoutInput = form.querySelector('[name="timeout"]')
        if (timeoutInput) {
          timeoutInput.addEventListener('input', () => {
            this.updateExpirationDisplay(timeoutInput.value)
          })
        }
      }
    },

    /**
     * Update expiration time display
     * @param {string} hours - Number of hours
     */
    updateExpirationDisplay(hours) {
      const expiresEl = document.getElementById('js-expires-on')
      if (!expiresEl) return
      
      if (!hours) {
        expiresEl.textContent = 'Default: 1 week'
        return
      }
      
      const expirationDate = new Date()
      expirationDate.setHours(expirationDate.getHours() + parseInt(hours))
      expiresEl.textContent = `Expires: ${expirationDate.toLocaleString()}`
    },

    /**
     * Handle share form submission
     * @param {FormData} formData - Form data
     */
    async handleShare(formData) {
      if (AppState.isProcessing) return
      
      try {
        AppState.update({ isProcessing: true })
        this.showLoading('Encrypting session...')
        
        const recipientKey = formData.get('pubkey')
        const timeout = formData.get('timeout') || 168 // Default 1 week
        
        // Get cookies for current tab
        const cookies = await cookieManager.get(AppState.currentTab.url)
        
        // Encrypt the session
        const encrypted = await cryptography.encrypt({
          cookies,
          url: AppState.currentTab.url,
          title: AppState.currentTab.title,
          timeout: parseInt(timeout)
        }, recipientKey)
        
        // Save to history
        await this.saveToHistory(AppState.currentTab)
        
        // Show result
        this.showShareResult(encrypted)
        
      } catch (error) {
        logError('Share failed:', error)
        this.showError('Failed to share session: ' + error.message)
      } finally {
        AppState.update({ isProcessing: false })
      }
    },

    /**
     * Attach back button functionality
     */
    attachBackButton() {
      const backButtons = document.querySelectorAll('.js-go-back')
      backButtons.forEach(button => {
        button.addEventListener('click', () => {
          this.render('menu')
        })
      })
    },

    /**
     * Show loading state
     * @param {string} message - Loading message
     */
    showLoading(message) {
      // Implementation for loading state
      log('[UI] Loading:', message)
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
      const errorEl = document.getElementById('js-error')
      if (errorEl) {
        errorEl.textContent = message
        errorEl.classList.remove('hidden')
        setTimeout(() => {
          errorEl.classList.add('hidden')
        }, 5000)
      }
    },

    /**
     * Show share result
     * @param {string} encrypted - Encrypted data
     */
    showShareResult(encrypted) {
      // Implementation for showing share result
      log('[UI] Share result ready')
    },

    /**
     * Save session to history
     * @param {Object} tab - Tab information
     */
    async saveToHistory(tab) {
      // Implementation for saving to history
      log('[UI] Saving to history:', tab.url)
    },

    /**
     * Prepare history view
     */
    prepareHistoryView() {
      // Implementation for history view
      this.render('history')
    },

    /**
     * Attach restore view events
     */
    attachRestoreEvents() {
      // Implementation for restore events
      log('[UI] Attaching restore events')
    }
  }

  /**
   * Initialize application when DOM is ready
   */
  document.addEventListener('DOMContentLoaded', () => {
    log('[App] Initializing SecureShare')
    UI.init()
  })

  // Export for debugging
  window.SecureShareApp = { UI, AppState }

})()
