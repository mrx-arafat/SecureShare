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
        'history': this.attachHistoryEvents,
        'settings': this.attachSettingsEvents
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
      log('[UI] Share result ready')

      // Show the share result section
      const shareResultEl = document.getElementById('js-shared-session')
      const shareTextEl = document.getElementById('js-shared-session-text')

      if (shareResultEl && shareTextEl) {
        // Display encrypted data
        shareTextEl.textContent = encrypted
        shareResultEl.classList.remove('hidden')

        // Add GitHub Gist save option if token is configured
        github.hasToken((hasToken) => {
          if (hasToken) {
            this.addGistSaveOption(encrypted)
          } else {
            this.addGistConfigPrompt()
          }
        })
      }

      // Hide the form
      const shareForm = document.getElementById('js-share-session')
      if (shareForm) {
        shareForm.classList.add('hidden')
      }
    },

    /**
     * Add GitHub Gist save option to share result
     * @param {string} encrypted - Encrypted data
     */
    addGistSaveOption(encrypted) {
      // Check if gist section already exists
      let gistSection = document.getElementById('js-gist-section')

      if (!gistSection) {
        // Create gist section
        const shareResultEl = document.getElementById('js-shared-session')
        gistSection = document.createElement('div')
        gistSection.id = 'js-gist-section'
        gistSection.className = 'm-t'
        gistSection.innerHTML = `
          <div class="small m-b-xs">Save to GitHub Gist:</div>
          <button id="js-save-to-gist" class="btn btn-secondary">
            <img src="./images/github.svg" alt="GitHub" width="16" style="vertical-align: middle; margin-right: 5px;" />
            Save to Gist
          </button>
          <div id="js-gist-result" class="m-t-sm hidden">
            <div class="small success">✅ Saved to GitHub Gist!</div>
            <div class="share-text-link m-t-xs">
              <a id="js-gist-link" href="#" target="_blank" rel="noopener"></a>
            </div>
            <div class="action-icon" data-clipboard data-clipboard-target="#js-gist-link" data-balloon="Copy Gist URL" data-balloon-pos="right">
              <img src="./images/copy.svg" alt="Copy link" width="12" />
            </div>
          </div>
          <div id="js-gist-error" class="m-t-sm error hidden"></div>
        `
        shareResultEl.appendChild(gistSection)
      }

      // Attach event to save button
      const saveButton = document.getElementById('js-save-to-gist')
      if (saveButton) {
        saveButton.addEventListener('click', () => {
          this.saveToGist(encrypted)
        })
      }
    },

    /**
     * Add prompt to configure GitHub token
     */
    addGistConfigPrompt() {
      let gistSection = document.getElementById('js-gist-section')

      if (!gistSection) {
        const shareResultEl = document.getElementById('js-shared-session')
        gistSection = document.createElement('div')
        gistSection.id = 'js-gist-section'
        gistSection.className = 'm-t'
        gistSection.innerHTML = `
          <div class="small m-b-xs">💡 Want to save to GitHub Gist?</div>
          <div class="explanation">
            Configure your GitHub token in settings to save encrypted sessions as Gists.
          </div>
          <button id="js-open-settings" class="btn btn-secondary m-t-xs">
            Configure GitHub
          </button>
        `
        shareResultEl.appendChild(gistSection)

        // Attach event to settings button
        const settingsButton = document.getElementById('js-open-settings')
        if (settingsButton) {
          settingsButton.addEventListener('click', () => {
            this.render('settings')
          })
        }
      }
    },

    /**
     * Save encrypted session to GitHub Gist
     * @param {string} encrypted - Encrypted data
     */
    async saveToGist(encrypted) {
      const saveButton = document.getElementById('js-save-to-gist')
      const resultEl = document.getElementById('js-gist-result')
      const errorEl = document.getElementById('js-gist-error')

      if (saveButton) {
        saveButton.disabled = true
        saveButton.textContent = 'Saving...'
      }

      // Hide previous results
      if (resultEl) resultEl.classList.add('hidden')
      if (errorEl) errorEl.classList.add('hidden')

      github.createGist({
        encryptedData: encrypted,
        description: `SecureShare Session - ${AppState.currentTab.title}`,
        public: false,
        expirationHours: 168, // Default 1 week
        url: AppState.currentTab.url
      }, (error, result) => {
        if (saveButton) {
          saveButton.disabled = false
          saveButton.innerHTML = `
            <img src="./images/github.svg" alt="GitHub" width="16" style="vertical-align: middle; margin-right: 5px;" />
            Save to Gist
          `
        }

        if (error) {
          logError('Failed to save to Gist:', error)
          if (errorEl) {
            errorEl.textContent = `❌ Error: ${error.message}`
            errorEl.classList.remove('hidden')
          }
        } else {
          log('Gist created:', result)
          if (resultEl) {
            const linkEl = document.getElementById('js-gist-link')
            if (linkEl) {
              linkEl.href = result.url
              linkEl.textContent = result.url
            }
            resultEl.classList.remove('hidden')
          }

          // Save to gist history
          this.saveGistToHistory(result)
        }
      })
    },

    /**
     * Save gist to history
     * @param {Object} gistInfo - Gist information
     */
    saveGistToHistory(gistInfo) {
      configuration.get('gistHistory', (history) => {
        const updatedHistory = history || []
        updatedHistory.unshift({
          id: gistInfo.id,
          url: gistInfo.url,
          created_at: new Date().toISOString(),
          title: AppState.currentTab.title
        })

        // Keep only last 50 gists in history
        if (updatedHistory.length > 50) {
          updatedHistory.length = 50
        }

        configuration.set({ gistHistory: updatedHistory }, () => {
          log('Gist saved to history')
        })
      })
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
    },

    /**
     * Attach history view events
     */
    attachHistoryEvents() {
      log('[UI] Attaching history events')
      // Load and display gist history
      this.loadGistHistory()
    },

    /**
     * Attach settings view events
     */
    attachSettingsEvents() {
      log('[UI] Attaching settings events')

      const form = document.getElementById('js-github-settings')
      const testButton = document.getElementById('js-test-token')
      const removeButton = document.getElementById('js-remove-token')
      const tokenInput = document.getElementById('github-token')

      // Load existing token if available
      github.getToken((error, token) => {
        if (!error && token) {
          if (tokenInput) {
            tokenInput.value = token
          }
          if (removeButton) {
            removeButton.classList.remove('hidden')
          }
          this.showGitHubStatus('✅ GitHub token configured', 'success')
        }
      })

      // Handle form submission
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault()
          const token = tokenInput.value.trim()

          if (!token) {
            this.showGitHubStatus('❌ Please enter a token', 'error')
            return
          }

          // Save the token
          github.saveToken(token, (error) => {
            if (error) {
              this.showGitHubStatus(`❌ Error: ${error.message}`, 'error')
            } else {
              this.showGitHubStatus('✅ Token saved successfully!', 'success')
              if (removeButton) {
                removeButton.classList.remove('hidden')
              }
            }
          })
        })
      }

      // Handle test connection
      if (testButton) {
        testButton.addEventListener('click', () => {
          const token = tokenInput.value.trim()

          if (!token) {
            this.showGitHubStatus('❌ Please enter a token first', 'error')
            return
          }

          testButton.disabled = true
          testButton.textContent = 'Testing...'

          // Test the token by creating a test gist
          github.createGist({
            encryptedData: 'test',
            description: 'SecureShare Test Gist (can be deleted)',
            public: false,
            expirationHours: 1,
            url: 'test'
          }, (error, result) => {
            testButton.disabled = false
            testButton.textContent = 'Test Connection'

            if (error) {
              this.showGitHubStatus(`❌ Connection failed: ${error.message}`, 'error')
            } else {
              this.showGitHubStatus('✅ Connection successful! Test gist created.', 'success')

              // Delete the test gist
              github.deleteGist(result.id, (deleteError) => {
                if (!deleteError) {
                  log('Test gist deleted')
                }
              })
            }
          })
        })
      }

      // Handle token removal
      if (removeButton) {
        removeButton.addEventListener('click', () => {
          if (confirm('Are you sure you want to remove the GitHub token?')) {
            configuration.set({ githubToken: null }, () => {
              tokenInput.value = ''
              removeButton.classList.add('hidden')
              this.showGitHubStatus('Token removed', 'info')
            })
          }
        })
      }

      // Load gist history
      this.loadGistHistory()
    },

    /**
     * Show GitHub status message
     * @param {string} message - Status message
     * @param {string} type - Message type (success, error, info)
     */
    showGitHubStatus(message, type = 'info') {
      const statusEl = document.getElementById('js-github-status')
      if (statusEl) {
        const messageEl = statusEl.querySelector('.status-message')
        if (messageEl) {
          messageEl.textContent = message
          messageEl.className = `status-message ${type}`
        }
        statusEl.classList.remove('hidden')

        if (type !== 'error') {
          setTimeout(() => {
            statusEl.classList.add('hidden')
          }, 3000)
        }
      }
    },

    /**
     * Load and display gist history
     */
    loadGistHistory() {
      configuration.get('gistHistory', (history) => {
        const historyEl = document.getElementById('js-gist-history')
        if (!historyEl) return

        if (!history || history.length === 0) {
          historyEl.innerHTML = '<div class="explanation">No gists created yet</div>'
          return
        }

        let historyHTML = '<div class="gist-list">'
        history.slice(0, 10).forEach(gist => {
          const date = new Date(gist.created_at).toLocaleString()
          historyHTML += `
            <div class="gist-item">
              <div class="gist-title">${gist.title || 'Untitled'}</div>
              <div class="gist-date small">${date}</div>
              <a href="${gist.url}" target="_blank" rel="noopener" class="gist-link">View on GitHub</a>
            </div>
          `
        })
        historyHTML += '</div>'

        historyEl.innerHTML = historyHTML
      })
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
