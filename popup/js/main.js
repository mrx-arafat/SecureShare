/* globals log, configuration, Clipboard, shareText, cryptography, cookieManager, _t, analytics, alertSystem */

(function() {
  'use strict'

  // --------------------------------------------------------------------
  // Main objects

  const template = {
    render: function(name, data) {
      log('[Template] Rendering', name,' with data', data)

      let template = this.get(name)
      getElementById('app').innerHTML = template.render(data || {})
      events.attach(name)
    },

    get: function(name) {
      let id = 'js-template-' + name
      let templateEl = getElementById(id)
      if (! templateEl) throw new Error('Whoops! template ' + id + ' does not exist')

      return new _t(templateEl.innerHTML)
    }
  }

  const events = {
    attach: function(name, extra) {
      let attachName = 'attach-' + name

      if (this[attachName]) {
        this[attachName](extra)
      }

      this.attachGoBack()
    },

    'attach-menu': function() {
      log('[Events] Attaching Menu events')

      addEventListener('[data-menu]', 'click', function(event) {
        let menu = event.currentTarget.dataset.menu
        fullRender(menu)
      })
    },

    'attach-share': function() {
      log('[Events] Attaching Share events')

      let expiresTimeoutId = null

      function updateExpiresText(event) {
        clearTimeout(expiresTimeoutId)

        let expiresOn = getElementById('js-expires-on')
        let timeout = event.target.value

        if (timeout.trim() && parseInt(timeout) > 0) {
          expiresOn.innerText = `Expires on: ${expires.getExpirationString(timeout)}`
          expiresTimeoutId = setTimeout(function() {
            updateExpiresText(event)
          }, 1000)
        } else {
          expiresOn.innerText = ''
        }
      }

      // Listen to multiple events for better responsiveness
      addEventListener('[name="timeout"]', 'keyup', updateExpiresText)
      addEventListener('[name="timeout"]', 'input', updateExpiresText)
      addEventListener('[name="timeout"]', 'change', updateExpiresText)

      addEventListener('#js-share-session', 'submit', function() {
        try {
          let publicKey = getFormElement(this, 'pubkey').value
          let timeout = getFormElement(this, 'timeout').value

          let expirationTime = expires.getExpirationTime(timeout)

          session.store(publicKey, expirationTime, function(encryptedData, tab) {
            show('js-shared-session')

            getElementById('js-shared-session-text').innerHTML = encryptedData

            // Add GitHub Gist integration
            addGitHubGistOption(encryptedData, tab, expirationTime)
          })

        } catch(e) {
          console.warn(e)
          showError('An error occurred trying to encrypt your session. Check that the code is correct.')
        }
      })

      addEventListener('#js-session-hide', 'click', () => hide('js-shared-session'))

      addEventListener('#js-copy-share-text', 'click', () => hide('js-shared-session'))

      this.onTextSubmitted('[name="pubkey"]', function(textarea) {
        const submitButton = document.querySelector('input[name="submit"]')
        enableIfText(textarea.value, submitButton)
      })

      // --------------------------------------------------------------------
      // attach-share specific helpers

      function addGitHubGistOption(encryptedData, tab, expirationTime) {
        // Check if GitHub module is available
        if (!window.github) {
          console.warn('GitHub module not loaded')
          return
        }

        // Check if token is configured
        github.hasToken(function(hasToken) {
          const shareSection = getElementById('js-shared-session')
          if (!shareSection) return

          // Remove existing gist section if any
          const existingGistSection = getElementById('js-gist-section')
          if (existingGistSection) {
            existingGistSection.remove()
          }

          // Create gist section
          const gistSection = document.createElement('div')
          gistSection.id = 'js-gist-section'
          gistSection.className = 'm-t'

          if (hasToken) {
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

            // Attach save to gist handler
            setTimeout(function() {
              const saveButton = getElementById('js-save-to-gist')
              if (saveButton) {
                saveButton.addEventListener('click', function() {
                  saveToGitHubGist(encryptedData, tab, expirationTime)
                })
              }

              // Re-initialize clipboard for the new copy button
              if (window.ClipboardJS) {
                new ClipboardJS('[data-clipboard]')
              }
            }, 100)
          } else {
            gistSection.innerHTML = `
              <div class="small m-b-xs">💡 Want to save to GitHub Gist?</div>
              <div class="explanation">
                Configure your GitHub token in settings to save encrypted sessions as Gists.
              </div>
              <button id="js-open-github-settings" class="btn btn-secondary m-t-xs">
                Configure GitHub
              </button>
            `

            // Attach settings button handler
            setTimeout(function() {
              const settingsButton = getElementById('js-open-github-settings')
              if (settingsButton) {
                settingsButton.addEventListener('click', function() {
                  // Navigate to settings - we'll need to implement this
                  alert('Please go to Settings from the main menu to configure your GitHub token.')
                })
              }
            }, 100)
          }

          shareSection.appendChild(gistSection)
        })
      }

      function saveToGitHubGist(encryptedData, tab, expirationTime) {
        const saveButton = getElementById('js-save-to-gist')
        const resultEl = getElementById('js-gist-result')
        const errorEl = getElementById('js-gist-error')

        console.log('[GitHub Gist] Preparing to save encrypted session to Gist')
        console.log('[GitHub Gist] Encrypted data length:', encryptedData ? encryptedData.length : 0)
        console.log('[GitHub Gist] Tab info:', { url: tab.url, title: tab.title })

        if (saveButton) {
          saveButton.disabled = true
          saveButton.textContent = 'Saving...'
        }

        // Hide previous results
        if (resultEl) resultEl.classList.add('hidden')
        if (errorEl) {
          errorEl.classList.add('hidden')
          errorEl.textContent = ''
        }

        // Calculate expiration hours
        const now = Date.now()
        const expirationHours = Math.ceil((expirationTime - now) / (1000 * 60 * 60))

        console.log('[GitHub Gist] Expiration hours:', expirationHours)

        // Extract domain from URL
        let domain = ''
        try {
          const urlObj = new URL(tab.url)
          domain = urlObj.hostname
        } catch (e) {
          domain = tab.url
        }

        // Create gist with encrypted data
        github.createGist({
          encryptedData: encryptedData,
          description: `SecureShare Session - ${tab.title}`,
          public: false,
          expirationHours: expirationHours,
          url: tab.url,
          title: tab.title,
          domain: domain
        }, function(error, result) {
          if (saveButton) {
            saveButton.disabled = false
            saveButton.innerHTML = `
              <img src="./images/github.svg" alt="GitHub" width="16" style="vertical-align: middle; margin-right: 5px;" />
              Save to Gist
            `
          }

          if (error) {
            console.error('Failed to save to Gist:', error)
            if (errorEl) {
              errorEl.textContent = `❌ Error: ${error.message}`
              errorEl.classList.remove('hidden')
            }
          } else {
            console.log('Gist created:', result)
            if (resultEl) {
              const linkEl = getElementById('js-gist-link')
              if (linkEl) {
                linkEl.href = result.url
                linkEl.textContent = result.url
              }
              resultEl.classList.remove('hidden')
            }

            // Save to gist history
            saveGistToHistory(result, tab)
          }
        })
      }

      function saveGistToHistory(gistInfo, tab) {
        configuration.get('gistHistory', function(history) {
          const updatedHistory = history || []
          updatedHistory.unshift({
            id: gistInfo.id,
            url: gistInfo.url,
            created_at: new Date().toISOString(),
            title: tab.title
          })

          // Keep only last 50 gists in history
          if (updatedHistory.length > 50) {
            updatedHistory.length = 50
          }

          configuration.set({ gistHistory: updatedHistory }, function() {
            console.log('Gist saved to history')
          })
        })
      }
    },

    'attach-restore': function() {
      log('[Events] Attaching Restore events')

      addEventListener('#js-regenerate-keys', 'click', function(event) {
        const { publicKey } = keys.generate()
        session.removeAll()

        getElementById('js-user-pubkey').value = publicKey
        flash(event.currentTarget, 'data-balloon', 'Restored!')
      })

      addEventListener('#js-restore-session', 'submit', function(event) {
        try {
          let textarea = getFormElement(event.currentTarget, 'encrypted-data')

          session.restore(textarea.value)
          event.currentTarget.reset()

        } catch(e) {
          console.warn(e)
          showError('An error occurred trying to restore the session. Check that the encrypted text is correct and was generated with your code.')
        }
      })

      this.onTextSubmitted('[name="encrypted-data"]', function(textarea) {
        const submitButton = document.querySelector('input[name="submit"]')
        enableIfText(textarea.value, submitButton)

        let notice = ''

        try {
          const { title, expirationTime } = session.decrypt(textarea.value)
          notice = `Restore "${title}" session.`

          if (expires.isExpired(expirationTime)) notice += '\nThe session seems to be expired!'

        } catch(e) {
          notice = ''
          console.warn(e)
        }

        getElementById('js-restore-notice').innerText = notice
      })
    },

    'attach-history': function() {
      log('[Events] Attaching History events')

      addEventListener('.js-delete', 'click', function(event) {
        let key = event.currentTarget.dataset.key
        session.remove(key, () => fullRender('history'))
      })
    },

    'attach-settings': function() {
      log('[Events] Attaching Settings events')

      const form = getElementById('js-github-settings')
      const testButton = getElementById('js-test-token')
      const removeButton = getElementById('js-remove-token')
      const tokenInput = getElementById('github-token')
      const toggleButton = getElementById('js-toggle-token')
      const tokenStatus = getElementById('js-token-status')

      // Add token visibility toggle
      if (toggleButton && tokenInput) {
        toggleButton.addEventListener('click', function() {
          if (tokenInput.type === 'password') {
            tokenInput.type = 'text'
            toggleButton.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            `
          } else {
            tokenInput.type = 'password'
            toggleButton.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            `
          }
        })
      }

      // Load existing token if available
      if (window.github) {
        github.getToken(function(error, token) {
          if (!error && token) {
            if (tokenInput) {
              tokenInput.value = token
            }
            if (removeButton) {
              removeButton.classList.remove('hidden')
            }
            if (tokenStatus) {
              tokenStatus.textContent = '✓ Configured'
              tokenStatus.classList.add('active')
            }
            showGitHubStatus('✅ GitHub token configured', 'success')
          }
        })
      }

      // Handle form submission
      if (form) {
        addEventListener('#js-github-settings', 'submit', function() {
          const token = tokenInput.value.trim()

          if (!token) {
            showGitHubStatus('❌ Please enter a token', 'error')
            return
          }

          // Save the token
          github.saveToken(token, function(error) {
            if (error) {
              showGitHubStatus(`❌ Error: ${error.message}`, 'error')
            } else {
              showGitHubStatus('✅ Token saved successfully!', 'success')
              if (removeButton) {
                removeButton.classList.remove('hidden')
              }
            }
          })
        })
      }

      // Handle test connection
      if (testButton) {
        addEventListener('#js-test-token', 'click', function() {
          const token = tokenInput.value.trim()

          if (!token) {
            showGitHubStatus('❌ Please enter a token first', 'error')
            return
          }

          testButton.disabled = true
          testButton.textContent = 'Testing...'

          // First save the token
          github.saveToken(token, function(saveError) {
            if (saveError) {
              testButton.disabled = false
              testButton.textContent = 'Test Connection'
              showGitHubStatus(`❌ Error saving token: ${saveError.message}`, 'error')
              return
            }

            // Test the token by creating a test gist
            github.createGist({
              encryptedData: 'test',
              description: 'SecureShare Test Gist (can be deleted)',
              public: false,
              expirationHours: 1,
              url: 'https://test.example.com',
              title: 'Test Session',
              domain: 'test.example.com'
            }, function(error, result) {
              testButton.disabled = false
              testButton.textContent = 'Test Connection'

              if (error) {
                showGitHubStatus(`❌ Connection failed: ${error.message}`, 'error')
              } else {
                showGitHubStatus('✅ Connection successful! Test gist created.', 'success')

                // Delete the test gist
                github.deleteGist(result.id, function(deleteError) {
                  if (!deleteError) {
                    console.log('Test gist deleted')
                  }
                })
              }
            })
          })
        })
      }

      // Handle token removal
      if (removeButton) {
        addEventListener('#js-remove-token', 'click', function() {
          if (confirm('Are you sure you want to remove the GitHub token?')) {
            configuration.set({ githubToken: null }, function() {
              tokenInput.value = ''
              removeButton.classList.add('hidden')
              showGitHubStatus('Token removed', 'info')
            })
          }
        })
      }

      // Load gist history
      loadGistHistory()

      // Helper function to show GitHub status
      function showGitHubStatus(message, type) {
        const statusEl = getElementById('js-github-status')
        if (statusEl) {
          const messageEl = statusEl.querySelector('.status-message')
          if (messageEl) {
            messageEl.textContent = message
          }
          statusEl.className = `settings-status ${type}`
          statusEl.classList.remove('hidden')

          if (type !== 'error') {
            setTimeout(function() {
              statusEl.classList.add('hidden')
            }, 3000)
          }
        }
      }

      // Helper function to load gist history
      let gistHistoryLimit = 5

      function loadGistHistory(showAll = false) {
        configuration.get('gistHistory', function(history) {
          const historyEl = getElementById('js-gist-history')
          if (!historyEl) return

          if (!history || history.length === 0) {
            historyEl.innerHTML = `
              <div class="gist-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <p>No gists created yet</p>
                <span class="gist-empty-hint">Share a session and save it to GitHub to see it here</span>
              </div>
            `
            return
          }

          const limit = showAll ? history.length : gistHistoryLimit
          let historyHTML = '<div class="gist-list">'

          history.slice(0, limit).forEach(function(gist) {
            const date = new Date(gist.created_at)
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})

            // Extract gist ID from URL for display
            const gistId = gist.url.split('/').pop()
            const displayTitle = gist.title || 'SecureShare Session'

            historyHTML += `
              <div class="gist-item">
                <div class="gist-item-content">
                  <div class="gist-item-title" title="${displayTitle}">
                    ${displayTitle}
                  </div>
                  <div class="gist-item-url">
                    <a href="${gist.url}" target="_blank" rel="noopener" title="${gist.url}">
                      gist:${gistId.substring(0, 8)}...
                    </a>
                  </div>
                </div>
                <div class="gist-item-date">${dateStr}</div>
              </div>
            `
          })

          if (history.length > gistHistoryLimit && !showAll) {
            historyHTML += `
              <div class="gist-load-more">
                <button id="js-load-more-gists" class="settings-btn settings-btn-secondary">
                  Show ${history.length - gistHistoryLimit} more
                </button>
              </div>
            `
          } else if (showAll && history.length > gistHistoryLimit) {
            historyHTML += `
              <div class="gist-load-more">
                <button id="js-show-less-gists" class="settings-btn settings-btn-secondary">
                  Show less
                </button>
              </div>
            `
          }

          historyHTML += '</div>'
          historyEl.innerHTML = historyHTML

          // Add event listeners for load more/less buttons
          const loadMoreBtn = getElementById('js-load-more-gists')
          const showLessBtn = getElementById('js-show-less-gists')

          if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function() {
              loadGistHistory(true)
            })
          }

          if (showLessBtn) {
            showLessBtn.addEventListener('click', function() {
              loadGistHistory(false)
            })
          }
        })
      }
    },

    'attach-qr-share': function() {
      log('[Events] Attaching QR Share events')
      console.log('🔧 QR Share events being attached...');

      // Check if button exists
      const qrButton = document.getElementById('js-generate-qr-share');
      console.log('🔍 QR button found:', qrButton ? 'YES' : 'NO');

      if (!qrButton) {
        console.error('❌ QR button not found in DOM');
        return;
      }

      // Initialize session detection and preview
      this.initializeSessionPreview();

      // Refresh session button
      addEventListener('#js-refresh-session', 'click', async function(event) {
        try {
          console.log('🔄 Refresh session button clicked');
          await events.initializeSessionPreview();
        } catch (error) {
          console.error('❌ Session refresh failed:', error);
        }
      });

      // Generate QR code button
      addEventListener('#js-generate-qr-share', 'click', async function(event) {
        try {
          console.log('🚀 Generate QR Share button clicked!');
          const button = event.currentTarget
          const originalText = button.textContent

          // Show loading state
          button.textContent = '⏳ Generating...'
          button.disabled = true
          console.log('Button state updated, getting current tab...');

          // Get current tab and cookies
          getCurrentTab(async (tab) => {
            try {
              console.log('Current tab:', tab);
              // Get cookies for current tab
              cookieManager.get(tab.url, async (cookies) => {
                try {
                  console.log('Retrieved cookies:', cookies);
                  console.log('Number of cookies:', cookies.length);
                  const sessionData = {
                    cookies: cookies,
                    url: tab.url,
                    title: tab.title,
                    timestamp: Date.now()
                  }

                  // Generate QR code
                  console.log('🔍 Checking QR module availability...');
                  console.log('window.qrShareDirect:', typeof window.qrShareDirect);
                  console.log('window.payloadManager:', typeof window.payloadManager);
                  console.log('window.mobileFlow:', typeof window.mobileFlow);
                  console.log('window.base64url:', typeof window.base64url);
                  console.log('QRious:', typeof QRious);

                  if (window.qrShareDirect) {
                    console.log('✅ qrShareDirect module is available');
                    console.log('About to generate QR code with sessionData:', sessionData);

                    // Show loading state
                    show('js-qr-loading')
                    hide('js-qr-result')

                    // Track QR generation start
                    if (window.analytics) {
                      window.analytics.trackQRGenerationStart();
                    }

                    try {
                      const loginUrl = await window.qrShareDirect.generateDirectLoginQR(sessionData, 'js-qr-canvas-share')
                      console.log('✅ Generated login URL:', loginUrl);

                      // Hide loading and show QR result
                      hide('js-qr-loading')
                      show('js-qr-result')

                      // Store URL for copy functionality
                      window.currentQRUrl = loginUrl
                      console.log('QR URL stored in window.currentQRUrl');

                      // Track QR generation success
                      if (window.analytics) {
                        const domain = sessionData.url ? new URL(sessionData.url).hostname : null;
                        window.analytics.trackQRGenerationSuccess(domain);
                      }

                      log('QR code generated successfully')
                    } catch (qrError) {
                      console.error('❌ QR generation failed:', qrError);

                      // Track QR generation failure
                      if (window.analytics) {
                        window.analytics.trackQRGenerationFailure('generation_error', qrError.message);
                      }

                      throw qrError;
                    }
                  } else {
                    console.error('❌ QR Share module not loaded');
                    console.log('Available window properties:', Object.keys(window).filter(k => k.includes('qr') || k.includes('payload') || k.includes('mobile')));

                    // Try emergency fallback QR generation
                    console.log('🚨 Attempting emergency fallback QR generation...');
                    try {
                      await generateEmergencyQR(sessionData);
                    } catch (fallbackError) {
                      console.error('💥 Emergency fallback also failed:', fallbackError);
                      throw new Error('QR Share module not loaded and fallback failed')
                    }
                  }

                } catch (error) {
                  log('QR generation error:', error)
                  hide('js-qr-loading')

                  // Track error with analytics
                  if (window.analytics) {
                    let errorType = 'unknown_error';
                    if (error.message.includes('Cannot share browser internal pages')) {
                      errorType = 'invalid_page';
                    } else if (error.message.includes('QR Share module not loaded')) {
                      errorType = 'module_not_loaded';
                    }
                    window.analytics.trackError('qr_generation', errorType, error.message);
                  }

                  // Show user-friendly error messages
                  if (error.message.includes('Cannot share browser internal pages')) {
                    showError('Cannot generate QR for this page. Please navigate to a website (like google.com) and try again.')
                  } else if (error.message.includes('QR Share module not loaded')) {
                    showError('QR generation module failed to load. Please refresh the extension.')
                  } else {
                    showError('Failed to generate QR code: ' + error.message)
                  }
                } finally {
                  // Restore button
                  button.textContent = originalText
                  button.disabled = false
                }
              })
            } catch (error) {
              log('Cookie retrieval error:', error)
              showError('Failed to get session cookies: ' + error.message)
              button.textContent = originalText
              button.disabled = false
            }
          })

        } catch (error) {
          log('QR share error:', error)
          showError('Failed to start QR generation: ' + error.message)
        }
      })

      // Copy QR link button
      addEventListener('#js-copy-qr-link', 'click', async function(event) {
        try {
          if (window.currentQRUrl && window.qrShareDirect) {
            const success = await window.qrShareDirect.copyToClipboard(window.currentQRUrl)
            if (success) {
              const button = event.currentTarget
              const originalText = button.innerHTML
              button.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Copied!</span>'
              setTimeout(() => {
                button.innerHTML = originalText
              }, 2000)
            } else {
              showError('Failed to copy link to clipboard')
            }
          } else {
            showError('No QR link available to copy')
          }
        } catch (error) {
          log('Copy link error:', error)
          showError('Failed to copy link: ' + error.message)
        }
      })

      // Regenerate QR button
      addEventListener('#js-regenerate-qr', 'click', function(event) {
        // Hide current QR result and trigger regeneration
        hide('js-qr-result')
        getElementById('js-generate-qr-share').click()
      })

      // Download QR button
      addEventListener('#js-download-qr', 'click', function(event) {
        try {
          const canvas = document.getElementById('js-qr-canvas-share')
          if (canvas) {
            // Create download link
            const link = document.createElement('a')
            link.download = 'secureshare-qr-code.png'
            link.href = canvas.toDataURL()
            link.click()
          } else {
            showError('No QR code available to download')
          }
        } catch (error) {
          log('Download QR error:', error)
          showError('Failed to download QR code: ' + error.message)
        }
      })

      // Copy fallback link button
      addEventListener('#js-copy-fallback-link', 'click', async function(event) {
        try {
          const fallbackUrlEl = document.getElementById('js-fallback-url')
          let urlToCopy = null

          // Try to get URL from fallback element first, then from window.currentQRUrl
          if (fallbackUrlEl && fallbackUrlEl.textContent && fallbackUrlEl.textContent.trim()) {
            urlToCopy = fallbackUrlEl.textContent.trim()
          } else if (window.currentQRUrl) {
            urlToCopy = window.currentQRUrl
          }

          if (urlToCopy && window.qrShareDirect) {
            const success = await window.qrShareDirect.copyToClipboard(urlToCopy)
            if (success) {
              const button = event.currentTarget
              const originalText = button.innerHTML
              button.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Copied!</span>'
              setTimeout(() => {
                button.innerHTML = originalText
              }, 2000)
            } else {
              showError('Failed to copy link to clipboard')
            }
          } else {
            showError('No link available to copy')
          }
        } catch (error) {
          log('Copy fallback link error:', error)
          showError('Failed to copy link: ' + error.message)
        }
      })

      log('[Events] QR Share events attached successfully')
    },

    /**
     * Initialize session preview and login detection
     */
    initializeSessionPreview: async function() {
      try {
        console.log('🔍 Initializing session preview...');

        // Update status to show analysis in progress
        const statusEl = document.getElementById('js-session-status');
        if (statusEl) {
          statusEl.innerHTML = `
            <div class="status-item">
              <span class="status-icon">🔍</span>
              <span class="status-text">Analyzing session...</span>
            </div>
          `;
        }

        // Use enhanced login detection if available
        if (window.LoginDetection) {
          const loginInfo = await window.LoginDetection.detectLoginStatus();
          const formatted = window.LoginDetection.formatLoginStatus(loginInfo);

          // Update login status display
          this.updateLoginStatus(formatted, loginInfo);

          // Update session preview with enhanced information
          this.updateEnhancedSessionPreview(loginInfo);

          // Update main status
          if (statusEl) {
            statusEl.innerHTML = `
              <div class="status-item">
                <span class="status-icon">${formatted.statusIcon}</span>
                <span class="status-text">Analysis complete</span>
              </div>
            `;
          }
        } else {
          // Fallback to basic session analysis
          await this.basicSessionAnalysis();
        }

      } catch (error) {
        console.error('❌ Failed to initialize session preview:', error);
        const statusEl = document.getElementById('js-session-status');
        if (statusEl) {
          statusEl.innerHTML = `
            <div class="status-item">
              <span class="status-icon">❌</span>
              <span class="status-text">Failed to analyze session</span>
            </div>
          `;
        }
      }
    },

    /**
     * Update login status display with enhanced information
     * @param {Object} formatted - Formatted login status
     * @param {Object} loginInfo - Raw login information
     */
    updateLoginStatus: function(formatted, loginInfo) {
      const loginStatusEl = document.getElementById('js-login-status');
      const loginIconEl = document.getElementById('js-login-icon');
      const loginTextEl = document.getElementById('js-login-text');
      const loginConfidenceEl = document.getElementById('js-login-confidence');
      const userInfoEl = document.getElementById('js-user-info');
      const userDisplayEl = document.getElementById('js-user-display');

      if (loginStatusEl) {
        loginStatusEl.style.display = 'block';
        loginStatusEl.className = `login-status ${formatted.statusClass}`;
      }

      if (loginIconEl) loginIconEl.textContent = formatted.statusIcon;
      if (loginTextEl) loginTextEl.textContent = formatted.statusText;
      if (loginConfidenceEl) loginConfidenceEl.textContent = formatted.confidenceText;

      // Show user info if available
      if (userInfoEl && userDisplayEl) {
        if (loginInfo.userInfo && formatted.userDisplay !== 'Not detected') {
          userInfoEl.style.display = 'block';
          userDisplayEl.textContent = formatted.userDisplay;
        } else {
          userInfoEl.style.display = 'none';
        }
      }
    },

    /**
     * Update session preview with enhanced information
     * @param {Object} loginInfo - Login information from detection
     */
    updateEnhancedSessionPreview: function(loginInfo) {
      const previewEl = document.getElementById('js-session-preview');
      const websiteEl = document.getElementById('js-preview-website');
      const cookiesEl = document.getElementById('js-preview-cookies');
      const securityEl = document.getElementById('js-preview-security');
      const durationEl = document.getElementById('js-preview-duration');

      if (previewEl) {
        previewEl.style.display = 'block';
      }

      // Update website info
      if (websiteEl && loginInfo.domain) {
        const displayName = loginInfo.title || loginInfo.domain;
        websiteEl.textContent = displayName.length > 30 ?
          displayName.substring(0, 30) + '...' : displayName;
      }

      // Update cookie count with session-specific info
      if (cookiesEl) {
        const sessionCount = loginInfo.sessionCookies ? loginInfo.sessionCookies.length : 0;
        cookiesEl.textContent = `${sessionCount} session cookies`;
      }

      // Update security level
      if (securityEl) {
        let securityLevel = 'Basic';
        let securityIcon = '🔒';

        if (loginInfo.confidence >= 80) {
          securityLevel = 'High';
          securityIcon = '🔐';
        } else if (loginInfo.confidence >= 50) {
          securityLevel = 'Medium';
          securityIcon = '🔒';
        } else {
          securityLevel = 'Low';
          securityIcon = '⚠️';
        }

        securityEl.innerHTML = `${securityIcon} ${securityLevel}`;
      }

      // Update duration (could be dynamic based on session type)
      if (durationEl) {
        durationEl.textContent = '30 minutes';
      }
    },

    /**
     * Fallback method for basic session analysis
     */
    basicSessionAnalysis: async function() {
      return new Promise((resolve) => {
        getCurrentTab((tab) => {
          cookieManager.get(tab.url, (cookies) => {
            const domain = this.extractDomain(tab.url);
            const sessionInfo = {
              domain: domain,
              cookieCount: cookies.length,
              hasAuthCookies: this.hasAuthenticationCookies(cookies),
              isSecure: tab.url.startsWith('https://'),
              title: tab.title
            };

            // Update basic preview
            this.updateSessionPreview(tab, cookies, {
              status: sessionInfo.hasAuthCookies ? 'logged_in' : 'unknown',
              message: sessionInfo.hasAuthCookies ? 'Session ready to share' : 'Limited session detected',
              cookieCount: cookies.length
            });

            resolve();
          });
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
        return 'unknown';
      }
    },

    /**
     * Check if cookies contain authentication patterns
     * @param {Array} cookies - Array of cookies
     * @returns {boolean} True if auth cookies found
     */
    hasAuthenticationCookies: function(cookies) {
      const authPatterns = [
        /session/i, /auth/i, /login/i, /token/i, /user/i, /account/i
      ];

      return cookies.some(cookie =>
        authPatterns.some(pattern =>
          pattern.test(cookie.name) || pattern.test(cookie.value)
        )
      );
    },

    /**
     * Update session status display
     */
    updateSessionStatus: function(loginStatus, tab) {
      const statusEl = document.getElementById('js-session-status');
      if (!statusEl) return;

      let statusIcon = '❓';
      let statusClass = 'status-unknown';
      let statusText = loginStatus.message;

      switch (loginStatus.status) {
        case 'logged_in':
          statusIcon = '✅';
          statusClass = 'status-logged-in';
          statusText = 'User appears to be logged in';
          break;
        case 'possibly_logged_in':
          statusIcon = '🟡';
          statusClass = 'status-maybe-logged-in';
          statusText = 'User might be logged in';
          break;
        case 'not_logged_in':
          statusIcon = '❌';
          statusClass = 'status-not-logged-in';
          statusText = 'No login detected - please log in first';
          break;
        case 'error':
          statusIcon = '⚠️';
          statusClass = 'status-error';
          break;
      }

      statusEl.innerHTML = `
        <div class="status-item ${statusClass}">
          <span class="status-icon">${statusIcon}</span>
          <span class="status-text">${statusText}</span>
        </div>
        <div class="status-details">
          <span class="status-detail">${loginStatus.cookieCount} cookies found</span>
        </div>
      `;
    },

    /**
     * Update session preview information
     */
    updateSessionPreview: function(tab, cookies, loginStatus) {
      const previewEl = document.getElementById('js-session-preview');
      const domainEl = document.getElementById('js-preview-domain');
      const cookiesEl = document.getElementById('js-preview-cookies');

      if (previewEl && loginStatus.status !== 'not_logged_in') {
        previewEl.style.display = 'block';
      }

      if (domainEl) {
        try {
          const domain = new URL(tab.url).hostname;
          domainEl.textContent = domain;
        } catch (error) {
          domainEl.textContent = 'Unknown';
        }
      }

      if (cookiesEl) {
        const essentialCount = window.sessionCapture ?
          window.sessionCapture.filterEssentialCookies(cookies).length :
          cookies.length;
        cookiesEl.textContent = `${essentialCount} essential`;
      }
    },

    attachClipboard: function() {
      log('[Events] Attaching clipboard')

      new Clipboard('[data-clipboard]')
        .on('success', function(event) {
          flash(event.trigger, 'data-balloon', 'Copied!')
          event.clearSelection()
        })
    },

    attachGoBack: function() {
      log('[Events] Attaching go back')
      addEventListener('.js-go-back', 'click', () => template.render('menu'))
      addEventListener('.js-go-back-top', 'click', () => template.render('menu'))
    },

    onTextSubmitted: function(selector, callback) {
      addEventListener(selector, 'keyup', event => {
        callback(event.currentTarget)
      })

      addEventListener(selector, 'paste', event => {
        const pastedData = event.clipboardData.getData('Text')
        window.document.execCommand('insertText', false, pastedData)

        callback(event.currentTarget)
      })
    }
  }

  const session = {
    store: function(publicKey, expirationTime, callback) {
      this.getCurrent(function(tab, cookies) {
        let data = {
          url: tab.url,
          title: tab.title,
          cookies: cookieManager.setExpirationDate(cookies, expirationTime),
          expirationTime: expirationTime
        }

        console.log('[Session Store] Data to encrypt:', {
          url: data.url,
          title: data.title,
          cookieCount: data.cookies ? data.cookies.length : 0,
          expirationTime: new Date(data.expirationTime).toISOString()
        })

        const encryptedData = keys.encrypt(publicKey, data)

        console.log('[Session Store] Encrypted data preview:', encryptedData.substring(0, 100) + '...')
        console.log('[Session Store] Full encrypted data will be saved to Gist')

        session.record(tab.url, tab.title)
        callback(encryptedData, tab)
      })
    },

    getCurrent(callback) {
      getCurrentTab(function(tab) {
        cookieManager.get(tab.url, function(cookies) {
          return callback(tab, cookies)
        })
      })
    },

    record: function(url, title) {
      session.modify(function(sessions) {
        let timestamp = new Date()
        let sessionKey = session.getKey(timestamp)

        sessions[sessionKey] = sessions[sessionKey] || []
        sessions[sessionKey].push({
          url,
          title,
          timestamp: timestamp.getTime()
        })

        return session.filterOlderKeys(sessions)
      })
    },

    restore: function(data) {
      const { url, cookies } = this.decrypt(data)

      cookieManager.set(url, cookies)
      chrome.tabs.create({ url })
    },

    decrypt(data) {
      return keys.decrypt(data)
    },

    removeAll: function(key) {
      session.modify(function() { return {} })
    },

    remove: function(key, callback) {
      session.modify(function(sessions) {
        delete sessions[key]
        return sessions
      }, callback)
    },

    modify: function(modifier, callback) {
      configuration.get('sessions', function(sessions) {
        sessions = modifier(sessions)
        configuration.set({ sessions, hasSessions: ! isEmptyObject(sessions) })

        callback && callback()
      })
    },

    getKey: function(timestamp) {
      return [
        timestamp.getMonth(),
        timestamp.getDate(),
        timestamp.getYear()
      ].join('/')
    },

    filterOlderKeys: function(sessions) {
      let currentMonth = new Date().getMonth()
      let filteredSessions = {}

      for (let key in sessions) {
        let month = this.getMonthFromKey(key)

        if (currentMonth == month) {
          filteredSessions[key] = sessions[key]
        }
      }

      return filteredSessions
    },

    getMonthFromKey: function(key) {
      return key.split('/')[0]
    }
  }

  const keys = {
    pair: {
      publicKey: null,
      privateKey: null,
    },

    upsert: function() {
      if (this.isGenerated()) return

      configuration.get(this.pair, function(publicKey, privateKey) {
        if (! publicKey || ! privateKey) {
          this.generate()
        } else {
          this.pair = { publicKey, privateKey }
        }

      }.bind(this))
    },

    generate: function() {
      log('Saving user keys for later signing')

      const pair = cryptography.createKeys()

      this.pair = pair
      configuration.set(pair)
      return this.pair
    },

    isGenerated: function() {
      return this.publicKey && this.privateKey
    },

    encrypt: function(publicKey, message) {
      const secret = cryptography.decodePublicKey(publicKey)
      return cryptography.encrypt(secret, JSON.stringify(message))
    },

    decrypt: function(encrypted) {
      const secret = cryptography.decodePrivateKey(this.pair.privateKey)
      const decryption = cryptography.decrypt(secret, encrypted)
      return JSON.parse(decryption)
    }
  }

  const expires = {
    DEFAULT: 7 * 24, // A week

    getExpirationTime(timeoutInHours) {
      timeoutInHours = this.isValidTimeout(timeoutInHours) ? timeoutInHours : this.DEFAULT

      return Date.now() + this.hoursToMs(timeoutInHours)
    },

    getExpirationString(timeout) {
      const expirationTime = this.getExpirationTime(timeout)
      return new Date(expirationTime).toLocaleString()
    },

    isExpired(time) {
      return Date.now() >= time
    },

    isValidTimeout(timeout) {
      return parseInt(timeout, 10) > 0
    },

    hoursToMs(hours) {
      return hours * 60 * 60 * 1000
    }
  }

  // --------------------------------------------------------------------
  // Utils

  async function generateEmergencyQR(sessionData) {
    try {
      console.log('🚨 Emergency QR generation starting...');

      // Show loading state
      show('js-qr-loading')
      hide('js-qr-result')

      // Create simple session data for extension
      const emergencyData = JSON.stringify({
        iv: "emergency_qr_session",
        v: 1,
        iter: 10000,
        ks: 128,
        ts: 64,
        mode: "ccm",
        adata: "",
        cipher: "aes",
        kemtag: "emergency",
        ct: btoa(JSON.stringify(sessionData))
      }, null, 2);

      // Create minimal instruction page
      const instructionPage = `data:text/html;charset=utf-8,${encodeURIComponent(`
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SecureShare Emergency</title>
<style>
body{font-family:Arial;padding:20px;background:#d94343;color:white;text-align:center}
.box{background:white;color:#333;padding:20px;border-radius:15px;max-width:400px;margin:0 auto}
.btn{background:#d94343;color:white;padding:15px;border:none;border-radius:8px;width:100%;margin:10px 0;font-size:16px;cursor:pointer}
.data{background:#f5f5f5;padding:10px;border-radius:5px;font-family:monospace;font-size:11px;word-break:break-all;margin:10px 0;max-height:120px;overflow-y:auto}
</style></head><body><div class="box">
<h2>🔐 SecureShare Emergency</h2>
<p><strong>${sessionData.title || 'Emergency Session'}</strong></p>
<p>1. Install SecureShare extension<br>2. Copy data below<br>3. Paste in "Restore Session"</p>
<button class="btn" onclick="copy()">📋 Copy Session Data</button>
<div class="data" id="d">${emergencyData}</div>
<button class="btn" onclick="window.open('${sessionData.url}')">🌐 Open Site</button>
</div><script>
function copy(){
const t=document.getElementById('d').textContent;
if(navigator.clipboard){
navigator.clipboard.writeText(t).then(()=>alert('✅ Copied!'))
}else{
const e=document.createElement('textarea');
e.value=t;document.body.appendChild(e);
e.select();document.execCommand('copy');
document.body.removeChild(e);alert('✅ Copied!')
}
}
</script></body></html>
      `)}`;

      // Try to generate QR with QRious if available
      const canvas = document.getElementById('js-qr-canvas-share');
      if (canvas && typeof QRious !== 'undefined') {
        try {
          const qr = new QRious({
            element: canvas,
            value: instructionPage,
            size: 200,
            level: 'M',
            background: '#ffffff',
            foreground: '#000000'
          });

          console.log('✅ Emergency QR generated with QRious');

          // Hide loading and show result
          hide('js-qr-loading')
          show('js-qr-result')

          // Store URL
          window.currentQRUrl = instructionPage;

          return instructionPage;

        } catch (qrError) {
          console.log('⚠️ QRious failed in emergency mode:', qrError.message);
        }
      }

      // Ultimate fallback - use API
      console.log('🌐 Using API fallback for emergency QR...');
      const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(instructionPage)}`;

      if (canvas) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, 200, 200);

          console.log('✅ Emergency QR generated with API');
          hide('js-qr-loading')
          show('js-qr-result')
          window.currentQRUrl = instructionPage;
        };
        img.onerror = () => {
          throw new Error('Emergency QR generation completely failed');
        };
        img.src = apiUrl;
      }

      return instructionPage;

    } catch (error) {
      console.error('💥 Emergency QR generation failed:', error);
      hide('js-qr-loading')
      throw error;
    }
  }

  function fullRender(name) {
    getCurrentTab(tab =>
      configuration.get(config => {
        template.render(name, Object.assign({ tab }, config))

        // Ensure QR share events are attached when rendering qr-share template
        if (name === 'qr-share') {
          console.log('🔧 Attaching QR share events for template:', name);
          events['attach-qr-share']();

          // Initialize session preview after a short delay to ensure DOM is ready
          setTimeout(() => {
            events.initializeSessionPreview();
          }, 100);

          // Check feature compatibility and show onboarding if needed
          setTimeout(async () => {
            if (window.featureDetection) {
              await window.featureDetection.checkWebsiteCompatibility(tab);

              // Show onboarding for first-time users
              if (window.onboardingSystem && window.onboardingSystem.shouldShowOnboarding()) {
                setTimeout(() => {
                  window.onboardingSystem.start();
                }, 500);
              }
            }
          }, 200);
        }
      })
    )
  }

  function getCurrentTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      callback(tabs[0])
    })
  }

  function showError(text) {
    let errorEl = getElementById('js-error')
    errorEl.innerHTML = text
    flash(errorEl, 'className', 'error', 4500)
  }

  function addEventListener(selector, event, fn) {
    let els = document.querySelectorAll(selector)
    if (! els.length) log('[WARN] Could not find an element for selector ' + selector)

    for (let i = 0; i < els.length; i++) {
      els[i].addEventListener(event, preventDefault(fn), false)
    }
  }

  function getFormElement(form, name) {
    let elements = form.elements

    for (let i = 0; i < elements.length; i++) {
      if (elements[i].name === name) {
        return elements[i]
      }
    }
  }

  function preventDefault(fn) {
    return function(event) {
      event.preventDefault()
      fn.call(this, event)
    }
  }

  function enableIfText(value, target) {
    if (value.trim()) {
      target.removeAttribute('disabled', false)
    } else {
      target.setAttribute('disabled', false)
    }
  }

  function flash(element, prop, value, delay) {
    const setVal = function(val) {
      if (element[prop] === undefined) {
        element.setAttribute(prop, val)
      } else {
        element[prop] = val
      }
    }

    let originalValue = element[prop] || element.getAttribute(prop)
    setVal(value)
    setTimeout(() => setVal(originalValue), delay || 1000)
  }

  function show(id) {
    let el = getElementById(id)
    el.classList.remove('hidden')
    return el
  }

  function hide(id) {
    let el = getElementById(id)
    el.classList.add('hidden')
    return el
  }

  function getElementById(id) {
    return document.getElementById(id)
  }

  function isEmptyObject(obj) {
    return Object.keys(obj).length === 0
  }


  // --------------------------------------------------------------------
  // Start

  keys.upsert()

  template.render('menu')
  events.attachClipboard()

})()

