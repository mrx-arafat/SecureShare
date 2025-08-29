# SecureShare Extension - Development Guide

## 🚀 Live Development Setup

### Method 1: File Watcher (Recommended)

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Load extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select this project folder (`SecureShare`)

3. **Development workflow:**
   - Make changes to any file in `popup/` or `manifest.json`
   - The dev server will detect changes and notify you
   - Click the refresh icon (🔄) on your extension card in `chrome://extensions/`
   - Test your changes immediately

### Method 2: Manual Refresh

If you prefer not to use the file watcher:

1. Load the extension as described above
2. Make your changes
3. Go to `chrome://extensions/`
4. Click the refresh icon on your extension card
5. Test your changes

## 🛠️ Development Tools

### Available Scripts

- `npm run dev` - Start file watcher for live development
- `npm run build` - Build the extension (legacy Gulp)
- `npm run lint` - Lint JavaScript files
- `npm test` - Run tests (not configured yet)

### Debugging

1. **Popup debugging:**
   - Right-click the extension icon → "Inspect popup"
   - Opens DevTools for the popup

2. **Background script debugging:**
   - Go to `chrome://extensions/`
   - Click "background page" link under your extension
   - Opens DevTools for background scripts

3. **Content script debugging:**
   - Open DevTools on any webpage
   - Content script logs appear in the console

## 📁 Project Structure

```
SecureShare/
├── popup/                 # Extension popup files
│   ├── index.html        # Popup HTML
│   ├── css/              # Stylesheets
│   └── js/               # JavaScript files
├── icons/                # Extension icons
├── manifest.json         # Extension manifest
├── dev-server.js         # Development file watcher
└── DEVELOPMENT.md        # This file
```

## 🔧 Testing Features

### Core Features to Test

1. **Popup Interface:**
   - Click extension icon to open popup
   - Test all buttons and forms
   - Verify styling and layout

2. **QR Code Generation:**
   - Test share functionality
   - Verify QR codes are generated correctly
   - Test different input scenarios

3. **Storage & Permissions:**
   - Test data persistence
   - Verify required permissions work
   - Test on different websites

### Cross-Browser Testing

While primarily for Chrome, you can also test on:
- Microsoft Edge (Chromium-based)
- Other Chromium-based browsers

## 🚨 Common Issues

### Extension Not Loading
- Check console for errors in `chrome://extensions/`
- Verify `manifest.json` syntax
- Ensure all referenced files exist

### Changes Not Reflecting
- Make sure to refresh the extension after changes
- Clear browser cache if needed
- Check if files are being watched by dev server

### Permission Errors
- Review `manifest.json` permissions
- Test on appropriate websites (http/https)

## 📝 Development Tips

1. **Use the dev server** - It makes development much faster
2. **Keep DevTools open** - Monitor console for errors
3. **Test incrementally** - Make small changes and test frequently
4. **Use different websites** - Test your extension on various sites
5. **Check the manifest** - Ensure all files are properly referenced

## 🔄 Hot Reload (Advanced)

For even faster development, you can set up automatic extension reloading:

1. The `auto-reload.js` script is available for advanced users
2. Include it in your extension during development
3. It will automatically reload the extension when changes are detected

**Note:** Use this carefully as it can interfere with debugging.
