#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

console.log('🚀 SecureShare Extension Development Server');
console.log('📁 Watching for changes in popup/ directory...');
console.log('🔄 Auto-reload: Make changes and refresh your extension in chrome://extensions/');
console.log('');

// Watch for changes in the popup directory
const watcher = chokidar.watch(['popup/**/*', 'manifest.json'], {
  ignored: /node_modules/,
  persistent: true,
  ignoreInitial: true
});

watcher
  .on('change', (filePath) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 📝 Changed: ${filePath}`);
    console.log('   ↳ Refresh your extension in chrome://extensions/ to see changes');
  })
  .on('add', (filePath) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ➕ Added: ${filePath}`);
  })
  .on('unlink', (filePath) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ❌ Removed: ${filePath}`);
  })
  .on('error', (error) => {
    console.error('❌ Watcher error:', error);
  });

console.log('✅ Development server started!');
console.log('');
console.log('📋 Quick Setup:');
console.log('1. Open chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked" and select this folder');
console.log('4. Make changes to your files');
console.log('5. Click the refresh icon on your extension card');
console.log('');
console.log('Press Ctrl+C to stop watching...');
