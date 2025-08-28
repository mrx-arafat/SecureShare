# SecureShare Development Guidelines

## Introduction

This document outlines the coding standards, architectural patterns, and best practices for the SecureShare project - a Chrome extension that enables secure, temporary account sharing without revealing passwords.

## Critical Development Rules

### 1. Never Commit or Push Without User Approval

- **ALWAYS** ask the user to test changes before committing
- **NEVER** commit and push changes without explicit user confirmation
- **NEVER** use `git reset --hard` or any commands that would require force pushing
- Test functionality thoroughly before any git operations

### 2. Understand the Problem Before Making Changes

- Fully investigate and understand the issue before proposing solutions
- Ask clarifying questions if the problem is not clear
- Make minimal, targeted changes rather than broad modifications
- Verify the root cause before implementing fixes

### 3. Follow these rules must

- don't break the functionalities by creating new ones

- extension must work after the new changes 

- Adhere to the architectural patterns and guidelines established in this document
- Maintain consistency in coding style and patterns

## Project Overview

SecureShare is a Chrome extension that revolutionizes account sharing by enabling secure, temporary session sharing without password exposure. Built with:

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Cryptography**: Stanford JavaScript Crypto Library (SJCL) with EC-ElGamal
- **Extension Architecture**: Manifest V3 Chrome Extension
- **APIs**: Chrome Extensions API (cookies, tabs, storage)
- **Build System**: Gulp.js for production builds
- **Package Management**: npm for dependencies

## Architecture Patterns

### 1. Extension Structure Management

**Follow Chrome Extension best practices:**

```javascript
// ✅ Preferred - Proper extension structure
manifest.json          // Extension configuration
popup/
├── index.html         // Main popup interface
├── css/              // Stylesheets
├── js/               // JavaScript modules
└── images/           // UI assets
icons/                // Extension icons
```

**Use modular JavaScript architecture:**

```javascript
// ✅ Preferred - Modular approach
const cookieManager = {
  get: function(url, callback) { /* implementation */ },
  set: function(url, cookies) { /* implementation */ }
}

const cryptography = {
  encrypt: function(data, publicKey) { /* implementation */ },
  decrypt: function(encryptedData, privateKey) { /* implementation */ }
}

// ❌ Avoid monolithic scripts
```

### 2. Cookie Management Patterns

**Use Chrome Cookies API properly:**

```javascript
// ✅ Preferred - Proper cookie handling
chrome.cookies.getAll({ url: tabUrl }, function(cookies) {
  const filteredCookies = cookies.map(cookie => 
    pick(cookie, ['name', 'domain', 'value', 'path', 'secure', 'httpOnly'])
  )
  callback(filteredCookies)
})

// ❌ Avoid direct document.cookie manipulation in extension context
```

**Handle cookie expiration properly:**

```javascript
// ✅ Preferred - Set proper expiration
const expirationDate = Math.floor(Date.now() / 1000) + (hours * 3600)
cookie.expirationDate = expirationDate

// ❌ Avoid permanent cookies without expiration
```

### 3. Cryptography Implementation

**Use SJCL library consistently:**

```javascript
// ✅ Preferred - Proper encryption pattern
const keys = {
  generate: function() {
    const curve = sjcl.ecc.curves.k256
    const keyPair = sjcl.ecc.elGamal.generateKeys(curve)
    return {
      pub: keyPair.pub.get(),
      sec: keyPair.sec.get()
    }
  },
  
  encrypt: function(publicKey, data) {
    const pub = new sjcl.ecc.elGamal.publicKey(sjcl.ecc.curves.k256, publicKey)
    return sjcl.encrypt(pub, JSON.stringify(data))
  }
}

// ❌ Avoid custom crypto implementations
```

### 4. State Management

**Use AppState pattern for centralized state:**

```javascript
// ✅ Preferred - Centralized state management
const AppState = {
  currentTab: null,
  isProcessing: false,
  shareHistory: [],
  
  update: function(newState) {
    Object.assign(this, newState)
    this.notifyListeners()
  },
  
  reset: function() {
    this.isProcessing = false
    this.currentTab = null
  }
}

// ❌ Avoid scattered global variables
```

## Frontend Patterns

### 1. Popup UI Structure

**Use semantic HTML with proper accessibility:**

```html
<!-- ✅ Preferred -->
<div class="container">
  <header class="header">
    <h1>SecureShare</h1>
  </header>
  <main class="content">
    <section class="share-section" role="tabpanel">
      <button class="btn btn-primary" aria-label="Share current account">
        Share Account
      </button>
    </section>
  </main>
</div>

<!-- ❌ Avoid non-semantic markup -->
```

**Use CSS custom properties for theming:**

```css
/* ✅ Preferred - CSS custom properties */
:root {
  --primary-color: #d94343;
  --secondary-color: #f8f9fa;
  --border-radius: 8px;
  --transition-speed: 0.3s;
}

.btn-primary {
  background-color: var(--primary-color);
  border-radius: var(--border-radius);
  transition: all var(--transition-speed);
}

/* ❌ Avoid hardcoded values */
```

### 2. Event Handling

**Use event delegation and proper error handling:**

```javascript
// ✅ Preferred - Proper event handling
document.addEventListener('click', function(e) {
  if (e.target.matches('.btn-share')) {
    handleShareClick(e)
  } else if (e.target.matches('.btn-receive')) {
    handleReceiveClick(e)
  }
})

async function handleShareClick(e) {
  try {
    AppState.update({ isProcessing: true })
    const result = await processShare()
    showSuccess(result)
  } catch (error) {
    showError(error.message)
  } finally {
    AppState.update({ isProcessing: false })
  }
}

// ❌ Avoid inline event handlers
```

## Security Guidelines

### 1. Data Protection

**Never store sensitive data in plain text:**

```javascript
// ✅ Preferred - Encrypt sensitive data
chrome.storage.local.set({
  'shareHistory': encryptedHistory,
  'userPreferences': preferences // Non-sensitive data
})

// ❌ Avoid storing private keys or unencrypted sessions
chrome.storage.local.set({
  'privateKey': privateKey, // NEVER DO THIS
  'sessionCookies': cookies // NEVER DO THIS
})
```

### 2. Input Validation

**Validate all user inputs:**

```javascript
// ✅ Preferred - Proper validation
function validatePublicKey(keyString) {
  try {
    const key = JSON.parse(keyString)
    if (!key.x || !key.y || typeof key.x !== 'string') {
      throw new Error('Invalid key format')
    }
    return true
  } catch (error) {
    throw new Error('Invalid public key format')
  }
}

// ❌ Avoid trusting user input
```

### 3. Content Security Policy

**Follow strict CSP guidelines:**

```json
// ✅ Preferred - Strict CSP in manifest.json
{
  "content_security_policy": {
    "extension_pages": "default-src 'self'; script-src 'self'; img-src 'self' data:"
  }
}

// ❌ Avoid 'unsafe-eval' or 'unsafe-inline'
```

## Testing Guidelines

### 1. Manual Testing Procedures

**Test complete user flows:**

```javascript
// ✅ Test checklist for each release
const testCases = [
  'Share session from logged-in site',
  'Receive session and verify login',
  'Test expiration functionality',
  'Verify encryption/decryption',
  'Test error handling',
  'Cross-browser compatibility',
  'Permission handling'
]
```

### 2. Error Scenarios

**Test edge cases and error conditions:**

```javascript
// ✅ Test error scenarios
const errorTests = [
  'No cookies available on current site',
  'Invalid recipient public key',
  'Expired session data',
  'Network connectivity issues',
  'Malformed encrypted data',
  'Permission denied scenarios'
]
```

## Performance Guidelines

### 1. Extension Load Time

**Optimize for fast startup:**

```javascript
// ✅ Preferred - Lazy loading
const modules = {
  cryptography: null,
  
  getCrypto: function() {
    if (!this.cryptography) {
      this.cryptography = loadCryptographyModule()
    }
    return this.cryptography
  }
}

// ❌ Avoid loading everything at startup
```

### 2. Memory Management

**Clean up resources properly:**

```javascript
// ✅ Preferred - Proper cleanup
function cleanup() {
  AppState.reset()
  clearSensitiveData()
  removeEventListeners()
}

window.addEventListener('beforeunload', cleanup)

// ❌ Avoid memory leaks
```

## Cross-Platform Considerations

### 1. Browser Compatibility

**Plan for multi-browser support:**

```javascript
// ✅ Preferred - Browser detection and compatibility
const browserAPI = {
  isFirefox: typeof browser !== 'undefined',
  isChrome: typeof chrome !== 'undefined',
  
  cookies: function() {
    return this.isFirefox ? browser.cookies : chrome.cookies
  },
  
  promisify: function(fn, ...args) {
    if (this.isFirefox) {
      return fn(...args) // Firefox returns promises
    }
    return new Promise((resolve, reject) => {
      fn(...args, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(result)
        }
      })
    })
  }
}
```

### 2. Mobile Strategy

**Design with mobile limitations in mind:**

```javascript
// ✅ Consider mobile alternatives
const mobileSupport = {
  generateQRCode: function(encryptedData) {
    // QR code for mobile sharing
  },
  
  createBookmarklet: function(sessionData) {
    // Bookmarklet for mobile browsers
  }
}
```

## Code Organization

### 1. File Structure

**Maintain consistent organization:**

```
SecureShare/
├── manifest.json           # Extension configuration
├── popup/
│   ├── index.html         # Main popup
│   ├── css/
│   │   ├── style.css      # Main styles
│   │   └── components.css # Component styles
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   ├── cookieManager.js # Cookie operations
│   │   ├── cryptography.js  # Encryption/decryption
│   │   ├── ui.js          # UI interactions
│   │   └── utils.js       # Utility functions
│   └── images/            # UI assets
├── icons/                 # Extension icons
├── docs/                  # Documentation
├── gulpfile.js           # Build configuration
└── package.json          # Dependencies
```

### 2. Naming Conventions

**Follow consistent naming patterns:**

- **Files**: camelCase (e.g., `cookieManager.js`)
- **Functions**: camelCase (e.g., `handleShareClick`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_EXPIRATION`)
- **CSS Classes**: kebab-case (e.g., `.btn-primary`)
- **IDs**: camelCase (e.g., `#shareButton`)

## Documentation

### 1. Code Comments

**Document complex logic and security considerations:**

```javascript
/**
 * Encrypts session data using EC-ElGamal encryption
 * @param {Object} sessionData - Contains cookies, URL, and metadata
 * @param {string} publicKey - Recipient's public key in JSON format
 * @returns {string} Encrypted data as JSON string
 * @throws {Error} If encryption fails or key is invalid
 */
function encryptSession(sessionData, publicKey) {
  // Validate public key format
  validatePublicKey(publicKey)
  
  // Add timestamp and expiration
  const dataWithMeta = {
    ...sessionData,
    timestamp: Date.now(),
    version: '1.0'
  }
  
  // Encrypt using SJCL
  return keys.encrypt(publicKey, dataWithMeta)
}
```

### 2. User Documentation

**Maintain clear user guides:**

```markdown
## Quick Start Guide

### Sharing an Account
1. Navigate to the website where you're logged in
2. Click the SecureShare icon
3. Click "Share Account"
4. Get recipient's code and paste it
5. Set expiration time
6. Copy and send the encrypted result

### Security Notes
- Your password never leaves your device
- Sessions expire automatically
- Only the recipient can decrypt your data
```

## Build and Deployment

### 1. Build Process

**Use Gulp for consistent builds:**

```javascript
// ✅ Preferred - Automated build process
gulp.task('build:prod', function() {
  return gulp.src('popup/**/*')
    .pipe(minify())
    .pipe(gulp.dest('dist/'))
})

gulp.task('package', function() {
  return gulp.src('dist/**/*')
    .pipe(zip('secureshare.zip'))
    .pipe(gulp.dest('./'))
})
```

### 2. Version Management

**Follow semantic versioning:**

```json
// ✅ Update version in manifest.json and package.json
{
  "version": "1.2.1", // MAJOR.MINOR.PATCH
  "version_name": "1.2.1 Beta" // Optional display name
}
```

## Commit Message Requirements

**CRITICAL: When user requests "commit and push" or similar:**

1. **ALWAYS ASK for GitHub issue ID first**: "What GitHub issue ID should I reference for this commit? (e.g., #123)"
2. **WAIT for user response** before proceeding with any git operations
3. **Use SecureShare commit format**: `<TYPE>: #<ISSUE_ID>, <description>`
4. **Types must be UPPERCASE**: FIX, WIP, FEAT, DOCS, REFACTOR, CHORE
5. **Examples**:
   - `FIX: #123, Resolve cookie extraction issue on Netflix`
   - `WIP: #124, Add Firefox browser compatibility`
   - `FEAT: #125, Complete QR code sharing feature`

### Branch-Issue Memory System

**AI Assistant Memory Management:**

1. **Automatic Association**: When users mention an issue ID with a branch, automatically associate and remember that branch-issue mapping
2. **Smart Commit Workflow**:
   - If user requests commit without mentioning issue ID, check memory for current branch's associated issue
   - Use remembered issue ID automatically if found
   - Only ask for issue ID if no association exists in memory
3. **Memory Updates**: Keep branch-issue associations updated as users work on different branches
4. **Override Capability**: Users can still specify different issue IDs to override remembered associations

## Work Update Guidelines

**When user requests work updates (e.g., "today's update", "work update", "today's work update"):**

1. **Keep it concise**: Use bullet points showing actual work completed
2. **Focus on substance**: Show real commits, issues worked on, and concrete progress
3. **Avoid verbosity**: Don't copy GitHub descriptions or add unnecessary technical details
4. **Be authentic**: Reflect actual work done, not aspirational or copied content
5. **Read file changes intelligently**:
   - First check commit messages - if they're clear and descriptive, use them
   - If commit messages are unclear or too technical, read the actual file changes
   - Translate technical changes into business-friendly language
   - Make updates understandable by non-technical users (managers, stakeholders)
   - Use general English instead of technical jargon and avoid complex English words
6. **Smart change detection**:
   - Use `git show --name-only` to see which files were modified
   - Use `git show --stat` to see change summary
   - For unclear commits, use `git diff` to understand actual changes
   - Focus on what was fixed/improved rather than technical implementation details

**Example format:**

```
## Work Update - Today

• Fixed cookie encryption issue for Netflix sharing
• Added Firefox browser compatibility layer
• Completed QR code generation for mobile sharing
• Resolved issue #156 on mobile-support branch
```

This guidelines document should be regularly updated as the project evolves and new patterns emerge. Always prioritize security, user privacy, and cross-browser compatibility in your code contributions.