/**
 * GitHub Gist Integration Module
 * Handles saving encrypted sessions to GitHub Gists
 * @module github
 */
(function() {
  'use strict'

  /**
   * GitHub API configuration
   * @const {Object}
   */
  const GITHUB_CONFIG = {
    API_BASE: 'https://api.github.com',
    GIST_ENDPOINT: '/gists',
    DEFAULT_DESCRIPTION: 'SecureShare Encrypted Session',
    DEFAULT_FILENAME: 'secureshare-session.json'
  }

  /**
   * GitHub Gist API
   * @namespace
   */
  const github = {
    /**
     * Save GitHub API token to storage
     * @param {string} token - GitHub personal access token
     * @param {Function} callback - Callback after saving
     */
    saveToken: function(token, callback) {
      // Validate token format (basic check)
      if (!token || typeof token !== 'string' || token.length < 20) {
        callback(new Error('Invalid GitHub token format'))
        return
      }

      // Store encrypted token in local storage
      configuration.set({ githubToken: token }, function() {
        if (chrome.runtime.lastError) {
          callback(chrome.runtime.lastError)
        } else {
          log('[GitHub] Token saved successfully')
          callback(null)
        }
      })
    },

    /**
     * Get GitHub API token from storage
     * @param {Function} callback - Callback with token
     */
    getToken: function(callback) {
      configuration.get('githubToken', function(token) {
        if (!token) {
          callback(null, null)
        } else {
          callback(null, token)
        }
      })
    },

    /**
     * Check if GitHub token is configured
     * @param {Function} callback - Callback with boolean result
     */
    hasToken: function(callback) {
      this.getToken(function(error, token) {
        callback(!error && token !== null)
      })
    },

    /**
     * Create a new GitHub Gist with encrypted session
     * @param {Object} options - Gist options
     * @param {string} options.encryptedData - Encrypted session data
     * @param {string} options.description - Gist description
     * @param {boolean} options.public - Whether gist should be public
     * @param {number} options.expirationHours - Hours until expiration
     * @param {string} options.url - Original URL of the session
     * @param {string} options.title - Title of the website/tab
     * @param {string} options.domain - Domain of the website
     * @param {Function} callback - Callback with gist URL
     */
    createGist: function(options, callback) {
      const {
        encryptedData,
        description = GITHUB_CONFIG.DEFAULT_DESCRIPTION,
        public: isPublic = false,
        expirationHours = 168,
        url = '',
        title = '',
        domain = ''
      } = options

      this.getToken(function(error, token) {
        if (error) {
          callback(error)
          return
        }

        if (!token) {
          callback(new Error('GitHub token not configured'))
          return
        }

        // Parse the encrypted data if it's a JSON string
        let parsedEncryptedData
        try {
          parsedEncryptedData = JSON.parse(encryptedData)
        } catch (e) {
          // If it's not valid JSON, use it as is
          parsedEncryptedData = encryptedData
        }

        // Prepare gist content with metadata
        const gistContent = {
          encrypted_session: parsedEncryptedData,
          metadata: {
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + (expirationHours * 3600000)).toISOString(),
            source_url: url,
            site_title: title || 'Unknown',
            site_domain: domain || this.extractDomain(url),
            version: '1.3.0',
            type: 'secureshare-session'
          }
        }

        log('[GitHub] Gist content prepared:', {
          hasEncryptedData: !!gistContent.encrypted_session,
          encryptedDataType: typeof gistContent.encrypted_session,
          encryptedDataKeys: typeof gistContent.encrypted_session === 'object' ? Object.keys(gistContent.encrypted_session) : 'string',
          metadata: gistContent.metadata
        })

        // Create gist payload
        const gistPayload = {
          description: `${description} (Expires: ${gistContent.metadata.expires_at})`,
          public: isPublic,
          files: {}
        }

        // Add file to gist
        gistPayload.files[GITHUB_CONFIG.DEFAULT_FILENAME] = {
          content: JSON.stringify(gistContent, null, 2)
        }

        log('[GitHub] Gist payload size:', JSON.stringify(gistPayload).length, 'bytes')

        // Make API request to create gist
        log('[GitHub] Making API request to:', GITHUB_CONFIG.API_BASE + GITHUB_CONFIG.GIST_ENDPOINT)

        fetch(GITHUB_CONFIG.API_BASE + GITHUB_CONFIG.GIST_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gistPayload)
        })
        .then(response => {
          log('[GitHub] Response status:', response.status)

          if (!response.ok) {
            // Try to get error details from response
            return response.text().then(text => {
              let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`
              try {
                const errorData = JSON.parse(text)
                if (errorData.message) {
                  errorMessage = errorData.message
                }
                if (errorData.errors) {
                  errorMessage += ' - ' + JSON.stringify(errorData.errors)
                }
              } catch (e) {
                // If response is not JSON, use the text
                if (text) {
                  errorMessage += ' - ' + text
                }
              }
              throw new Error(errorMessage)
            })
          }
          return response.json()
        })
        .then(gist => {
          log('[GitHub] Gist created successfully:', gist.id)
          callback(null, {
            url: gist.html_url,
            id: gist.id,
            raw_url: gist.files[GITHUB_CONFIG.DEFAULT_FILENAME].raw_url
          })
        })
        .catch(error => {
          logError('[GitHub] Failed to create gist:', error.message || error)

          // Check for common issues
          if (error.message && error.message.includes('Failed to fetch')) {
            error = new Error('Network error: Unable to connect to GitHub. Please reload the extension and try again.')
          } else if (error.message && error.message.includes('401')) {
            error = new Error('Authentication failed: Invalid GitHub token. Please check your token in Settings.')
          } else if (error.message && error.message.includes('403')) {
            error = new Error('Permission denied: Token may not have "gist" scope or rate limit exceeded.')
          } else if (error.message && error.message.includes('422')) {
            error = new Error('Invalid request: The gist data may be too large or malformed.')
          }

          callback(error)
        })
      })
    },

    /**
     * Get a gist by ID
     * @param {string} gistId - Gist ID
     * @param {Function} callback - Callback with gist data
     */
    getGist: function(gistId, callback) {
      this.getToken(function(error, token) {
        if (error) {
          callback(error)
          return
        }

        const headers = {
          'Accept': 'application/vnd.github.v3+json'
        }

        // Add auth header if token exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        fetch(`${GITHUB_CONFIG.API_BASE}${GITHUB_CONFIG.GIST_ENDPOINT}/${gistId}`, {
          method: 'GET',
          headers: headers
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
          }
          return response.json()
        })
        .then(gist => {
          // Extract session data from gist
          const file = gist.files[GITHUB_CONFIG.DEFAULT_FILENAME]
          if (!file) {
            throw new Error('Session file not found in gist')
          }

          const content = JSON.parse(file.content)
          callback(null, {
            encryptedData: content.encrypted_session,
            metadata: content.metadata,
            gistUrl: gist.html_url
          })
        })
        .catch(error => {
          logError('[GitHub] Failed to get gist:', error)
          callback(error)
        })
      })
    },

    /**
     * Delete a gist
     * @param {string} gistId - Gist ID to delete
     * @param {Function} callback - Callback after deletion
     */
    deleteGist: function(gistId, callback) {
      this.getToken(function(error, token) {
        if (error) {
          callback(error)
          return
        }

        if (!token) {
          callback(new Error('GitHub token not configured'))
          return
        }

        fetch(`${GITHUB_CONFIG.API_BASE}${GITHUB_CONFIG.GIST_ENDPOINT}/${gistId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })
        .then(response => {
          if (response.status === 204) {
            log('[GitHub] Gist deleted successfully:', gistId)
            callback(null)
          } else {
            throw new Error(`Failed to delete gist: ${response.status}`)
          }
        })
        .catch(error => {
          logError('[GitHub] Failed to delete gist:', error)
          callback(error)
        })
      })
    },

    /**
     * Extract gist ID from URL
     * @param {string} url - GitHub gist URL
     * @returns {string|null} Gist ID or null
     */
    extractGistId: function(url) {
      const match = url.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]+)/i)
      return match ? match[1] : null
    },

    /**
     * Extract domain from URL
     * @param {string} url - Full URL
     * @returns {string} Domain name
     */
    extractDomain: function(url) {
      try {
        const urlObj = new URL(url)
        return urlObj.hostname
      } catch (e) {
        return url
      }
    }
  }

  // Export to global scope
  window.github = github
})()
