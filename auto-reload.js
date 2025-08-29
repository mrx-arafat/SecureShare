// Auto-reload script for Chrome extension development
// This script can be injected into your extension to automatically reload it when files change

(function() {
  'use strict';
  
  // Only run in development mode
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    const manifest = chrome.runtime.getManifest();
    
    // Check if we're in development (unpacked extension)
    if (chrome.runtime.getManifest().update_url === undefined) {
      console.log('🔄 Auto-reload enabled for SecureShare extension');
      
      // Check for updates every 2 seconds
      setInterval(() => {
        chrome.runtime.reload();
      }, 2000);
    }
  }
})();
