/**
 * Configuration Module
 * Manages extension settings and storage
 * @module configuration
 */
(function () {
  'use strict'

  /**
   * Default configuration values
   * @const {Object}
   */
  const DEFAULT_CONFIGURATION = {
    publicKey: null,      // User's public key for receiving shares
    privateKey: null,     // User's private key for decryption
    sessions: {},         // Share history: { timestamp: [{url, title}] }
    hasSessions: false,   // Quick flag to check if any sessions exist
    githubToken: null,    // GitHub personal access token for Gist integration
    gistHistory: []       // History of created gists: [{id, url, created_at}]
  }

  /**
   * Configuration API
   * @namespace
   */
  const configuration = {
    DEFAULT: DEFAULT_CONFIGURATION,

    /**
     * Iterate over default configuration properties
     * @param {Function} callback - Function to call for each property
     */
    forEachDefault: function(callback) {
      for(const prop in DEFAULT_CONFIGURATION) {
        callback(prop, DEFAULT_CONFIGURATION[prop])
      }
    },

    /**
     * Get configuration values from storage
     * @param {string|Object|Function} search - Keys to retrieve or callback
     * @param {Function} callback - Callback with retrieved values
     */
    get: function(search, callback) {
      if (typeof search === 'function') {
        callback = search
        chrome.storage.local.get(DEFAULT_CONFIGURATION, callback)
      } else {
        chrome.storage.local.get(search, function(result) {
          let values = []
          let keys = {}

          if (typeof search === 'string') {
            keys[search] = null
          } else {
            keys = Object.assign({}, search)
          }

          values = Object.keys(keys).map(function(name) {
            return result[name] || DEFAULT_CONFIGURATION[name]
          })

          callback.apply(null, values)
        })
      }
    },

    /**
     * Set configuration values in storage
     * @param {Object} values - Key-value pairs to store
     * @param {Function} callback - Callback after storage
     */
    set: function(values, callback) {
      chrome.storage.local.set(values, callback)
    },

    /**
     * Listen for configuration changes
     * @param {Function} callback - Function to call on changes
     */
    onChanged: function(callback) {
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        callback(changes)
      })
    },

    /**
     * Iterate over current configuration values
     * @param {Function} callback - Function to call for each property
     */
    forEachCurrent: function(callback) {
      configuration.get(function (config) {
        for(const prop in config) {
          callback(prop, config[prop])
        }
      })
    }
  }

  // Export to global scope
  window.configuration = configuration
})()
