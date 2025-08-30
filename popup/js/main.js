/* globals log, configuration, Clipboard, shareText, cryptography, cookieManager, _t */

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
            displayLink(encryptedData)
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

      function displayLink(encryptedData) {
        shareText.getLink(encryptedData,
          function success(link) {
            getElementById('js-share-text-link').innerHTML = link
            show('js-share-text-actions')
            window.scrollBy({ top: 500, left: 0, behavior: 'smooth' })
          },
          function error() {
            getElementById('js-share-text-link').innerHTML = 'Whops, couldn\'t get the link'
          }
        )
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

                    try {
                      const loginUrl = await window.qrShareDirect.generateDirectLoginQR(sessionData, 'js-qr-canvas-share')
                      console.log('✅ Generated login URL:', loginUrl);

                      // Hide loading and show QR result
                      hide('js-qr-loading')
                      show('js-qr-result')

                      // Store URL for copy functionality
                      window.currentQRUrl = loginUrl
                      console.log('QR URL stored in window.currentQRUrl');

                      log('QR code generated successfully')
                    } catch (qrError) {
                      console.error('❌ QR generation failed:', qrError);
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

        const encryptedData = keys.encrypt(publicKey, data)

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

