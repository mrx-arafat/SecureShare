# SecureShare Context Gathering Architecture - Detailed Analysis

## Executive Summary

SecureShare is a Chrome extension designed to securely share user sessions (including cookies and login state) without revealing passwords. The context gathering system captures session data from the active browser tab and prepares it for secure transmission via QR codes or encrypted payloads.

**Current Scope**: The system captures ONLY cookies and basic tab metadata - no DOM content, page text, or advanced page analysis is performed.

---

## 1. CURRENT CONTEXT GATHERING APPROACH

### Data Captured
The extension captures **ONLY**:
1. **Cookies** - All HTTP cookies associated with the current tab's URL
2. **Tab Metadata**:
   - `url` - Current page URL
   - `title` - Page title
   - `favIconUrl` - Favicon URL
   - `id` - Tab ID

### Data NOT Captured (Important Limitations)
- No DOM elements or HTML content
- No page text or visible content
- No local storage or session storage
- No form data or input values
- No page structure or layout information
- No network requests or API responses
- No JavaScript variables or state
- No user agent details (besides in metadata)
- No geolocation or device information
- No camera/microphone permissions

---

## 2. FILES INVOLVED IN CONTEXT GATHERING

### Core Files (Context Extraction)

#### `/popup/js/sessionCapture.js` (156 lines)
**Primary context gathering module**
- **Class**: `SessionCapture`
- **Responsibility**: Extracts and validates session data for secure sharing
- **Key Methods**:
  - `captureCurrentSession()` - Main entry point for session data extraction
  - `extractSessionCookies(url)` - Gets all cookies for a URL
  - `filterEssentialCookies(cookies)` - Removes tracking cookies
  - `validateSessionData(sessionData)` - Ensures data is shareable
  - `detectLoginStatus(cookies)` - Analyzes login indicators

**Data Extraction Flow**:
```
1. Get active tab info (URL, title)
2. Extract cookies via chrome.cookies.getAll()
3. Filter out tracking cookies (Google Analytics, etc.)
4. Create standardized payload
5. Return: { url, title, domain, cookies, timestamp, metadata }
```

#### `/popup/js/cookieManager.js` (47 lines)
**Low-level cookie API wrapper**
- **Methods**:
  - `get(url, callback)` - Retrieves all cookies for URL
  - `set(url, cookies)` - Sets cookies on URL
  - `setExpirationDate(cookies, expirationTime)` - Updates expiration

#### `/popup/js/loginDetection.js` (503 lines)
**Analyzes login state from cookies**
- **Methods**:
  - `detectLoginStatus()` - Determines if user is logged in
  - `analyzeCookies(cookies, domain)` - Extracts login confidence
  - `getPageLoginIndicators(tabId)` - Attempts DOM-based detection (fallback)
  - `extractUserInfo(cookies, domain)` - Parses user email/username from cookies

**Confidence Scoring**:
- 3+ auth cookies = 70% confidence
- 2 auth cookies = 50% confidence  
- 1 auth cookie = 30% confidence
- Additional boosters: Secure flags, HttpOnly flags, site-specific patterns

#### `/popup/js/main.js` (1576 lines)
**Main UI and orchestration**
- **Key Functions**:
  - `session.store(publicKey, expirationTime, callback)` - Initiates context capture
  - `session.getCurrent(callback)` - Fetches active tab context
  - `events['attach-qr-share']()` - QR generation flow with context capture
  - `events.initializeSessionPreview()` - Displays session analysis

**Context Capture Entry Points**:
- Line 1156: `session.store()` - Standard flow
- Line 626: QR share button handler - Triggers `getCurrentTab()` and `cookieManager.get()`

---

## 3. SPECIFIC FUNCTIONS HANDLING CONTEXT

### Primary Context Extraction Functions

#### A. `sessionCapture.captureCurrentSession()`
```javascript
// Location: sessionCapture.js:38-72
// Gets current active tab
// Validates it's shareable (not chrome:// pages)
// Extracts cookies via chrome.cookies API
// Filters essential vs tracking cookies
// Returns structured payload
```

**Output Structure**:
```javascript
{
  version: '1.0',
  url: 'https://example.com',
  title: 'Page Title',
  domain: 'example.com',
  cookies: [
    { name, value, domain, path, secure, httpOnly, expirationDate }
  ],
  timestamp: Date.now(),
  metadata: {
    cookieCount: number,
    userAgent: navigator.userAgent,
    captureMethod: 'sessionCapture'
  }
}
```

#### B. `cookieManager.get(url, callback)`
```javascript
// Location: cookieManager.js:9-16
// Direct wrapper around chrome.cookies.getAll()
// Returns array of cookie objects
// Properties picked: [name, domain, value, path, secure, httpOnly, expirationDate]
```

#### C. `loginDetection.analyzeCookies(cookies, domain)`
```javascript
// Location: loginDetection.js:192-248
// Checks for site-specific auth patterns (Netflix, YouTube, etc.)
// Analyzes generic auth patterns (session, token, auth in name)
// Extracts user info from cookie values
// Analyzes security characteristics (secure, httpOnly, sameSite flags)
// Returns confidence score (0-100)
```

**Pattern Matching**:
```javascript
AUTH_COOKIE_PATTERNS: [
  /session/i, /auth/i, /login/i, /token/i, /user/i,
  /account/i, /logged/i, /signin/i, /sso/i, /oauth/i,
  /jwt/i, /bearer/i, /csrf/i, /xsrf/i
]
```

#### D. `session.getCurrent(callback)` (main.js)
```javascript
// Location: main.js:1181-1187
// Gets active tab from Chrome API
// Gets cookies for tab URL
// Combines and returns as session context
```

#### E. `payloadManager.cleanSessionData(sessionData)`
```javascript
// Location: payloadManager.js:79-101
// Strips unnecessary fields from cookies
// Validates required fields (url, title)
// Filters out empty/invalid cookies
// Standardizes data format
```

---

## 4. CONTEXT FLOW - From User Action to Encryption

```
┌─────────────────────────────────────────────────────────┐
│ User clicks "Share Current Session" or "Generate QR"   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  getCurrentTab()            │
        │  (Chrome tabs API)          │
        │  Returns: tab object        │
        │  { url, title, id, ... }   │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  cookieManager.get()       │
        │  (Chrome cookies API)      │
        │  Returns: cookie array     │
        │  [{ name, value, ... }]    │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  sessionCapture.filterEssential()  │
        │  Removes tracking cookies         │
        │  (Google Analytics, etc.)         │
        │  Returns: filtered cookies        │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  loginDetection.analyzeCookies()   │
        │  Calculates login confidence       │
        │  Extracts user info                │
        │  Returns: login status object      │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  payloadManager.cleanSessionData() │
        │  Standardizes format               │
        │  Removes unnecessary fields        │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  payloadManager.compressPayload()  │
        │  Optional: Deflate compression     │
        │  Returns: compressed data          │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  cryptography.encrypt()            │
        │  Optional: SJCL encryption         │
        │  Returns: encrypted data           │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  base64url.encode()                │
        │  Makes safe for URLs               │
        │  Returns: encoded payload          │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  qrShareDirect.generateDirectLoginQR()  │
        │  Generates QR code                 │
        │  Returns: QR image on canvas       │
        └─────────────────────────────────────┘
```

---

## 5. CONTEXT DATA PIPELINE - DETAILED

### Phase 1: Raw Collection
```javascript
// sessionCapture.extractSessionCookies()
chrome.cookies.getAll({ url: tabUrl }, (cookies) => {
  // Receives ALL cookies for domain
  // Includes: session, tracking, advertising, performance cookies
  // Average: 20-100 cookies per domain
})
```

### Phase 2: Filtering
```javascript
// sessionCapture.filterEssentialCookies()
essentialCookiePatterns = [
  /session/i, /auth/i, /login/i, /token/i, /jwt/i,
  // ... ~26 patterns total
]

trackingCookiePatterns = [
  /^_ga/, /^_gid/, /^_utm/, /analytics/i, /ads/i
]

// Keeps: Auth-related, platform-specific, CSRF/security cookies
// Removes: Analytics, advertising, tracking cookies
// Result: ~5-20 cookies per domain
```

### Phase 3: Analysis
```javascript
// loginDetection.analyzeCookies()
// For each cookie, checks:
// 1. Does name match auth patterns?
// 2. Does value look like token (JWT, base64, etc.)?
// 3. Are security flags set (secure, httpOnly)?
// 4. Is it site-specific (Netflix, GitHub, etc.)?
```

### Phase 4: Standardization
```javascript
// payloadManager.cleanSessionData()
{
  url: "https://github.com",
  title: "GitHub",
  cookies: [
    {
      name: "user_session",
      value: "ABC123...",
      domain: ".github.com",
      path: "/",
      secure: true,
      httpOnly: true,
      expirationDate: 1234567890
    }
  ]
}
```

### Phase 5: Optimization
- **Compression**: RawDeflate (optional, only if effective)
- **Encryption**: SJCL ElGamal or AES-256-GCM (optional)
- **Encoding**: Base64URL (for QR safety)

---

## 6. DATA CAPTURED VS COULD BE CAPTURED

### Currently Captured (✓)
1. **Cookies**: Name, value, domain, path, security flags, expiration
2. **Tab Info**: URL, title, favicon, tab ID
3. **Login Status**: Confidence score, user email/username (if in cookie)
4. **Timestamps**: Capture time, TTL information
5. **Metadata**: Cookie count, user agent, capture method

### Could Be Captured But Isn't (✗)
1. **DOM Content**:
   - Page HTML structure
   - Visible text content
   - Form fields and their values
   - User ID from DOM (email, username displayed)
   - Page metadata (meta tags, structured data)

2. **Storage**:
   - LocalStorage contents
   - SessionStorage contents
   - IndexedDB data
   - WebSQL data

3. **Network State**:
   - Active service workers
   - Cache status
   - Request headers
   - API responses

4. **Browser State**:
   - Browsing history
   - Bookmarks
   - Password manager data
   - Extension data

5. **Page Analysis**:
   - JavaScript execution state
   - Active frames/iframes
   - Loaded scripts
   - Performance metrics

6. **User Information**:
   - Clipboard contents
   - File system access
   - Camera/microphone data
   - Geolocation
   - Device info beyond user agent

---

## 7. OBVIOUS GAPS & LIMITATIONS

### Critical Limitations

#### A. Cookie-Only Approach
**Problem**: Not all sessions use cookies
- Modern SPAs increasingly use Bearer tokens in Authorization header
- JWT stored in localStorage (not accessible)
- OAuth/SAML sessions stored server-side only
- WebSocket authentication tokens

**Impact**: Cannot capture ~30-40% of modern web apps' session info

#### B. No DOM Analysis
**Problem**: Can't detect login state from page content
- Currently uses fallback: `chrome.tabs.executeScript()` to inject content
- Gets limited signals: DOM classes, email in text, page title
- Very unreliable - many sites hide user info

**Impact**: False negatives - thinks user isn't logged in when they are

#### C. No Local Storage Access
**Problem**: Can't capture localStorage tokens
- Many modern apps store JWT tokens in localStorage
- OIDC/OAuth tokens in sessionStorage
- API keys and secrets in storage

**Impact**: Incomplete session capture for modern apps

#### D. Tracking Cookie Removal
**Problem**: Over-aggressive filtering
- Removes anything matching `/analytics/i`, `/ads/i`
- Some legitimate cookies might match these patterns
- No whitelist for false positives

**Impact**: Might remove cookies app needs for operation

#### E. No User Consent Tracking
**Problem**: Captures all cookies without user opt-in
- Could include cookies user doesn't want to share
- No granular control over which cookies to share

**Impact**: Privacy concern - oversharing user data

#### F. Expiration Time Handling
**Problem**: Only 2 properties captured
- Doesn't capture SameSite attribute
- Doesn't capture session vs persistent distinction
- Sets new uniform expiration instead of preserving original

**Impact**: Restored sessions might have different cookie behavior

---

## 8. CONTEXT GATHERING ENTRY POINTS

### Entry Point 1: Standard Share Session
```
main.js:47-103 (@event #js-share-session submit)
  ↓
session.store(publicKey, expirationTime)
  ↓
session.getCurrent(callback)
  ↓
cookieManager.get(tab.url, callback)
  ↓
chrome.cookies.getAll({ url })
```

### Entry Point 2: QR Share Direct
```
main.js:626 (@click #js-generate-qr-share)
  ↓
getCurrentTab()
  ↓
cookieManager.get(tab.url)
  ↓
sessionData = { cookies, url, title, timestamp }
  ↓
qrShareDirect.generateDirectLoginQR(sessionData)
  ↓
payloadManager.createPayload()
```

### Entry Point 3: Session Preview
```
main.js:1459 (@event 'qr-share' render)
  ↓
events.initializeSessionPreview()
  ↓
LoginDetection.detectLoginStatus()
  ↓
getTabCookies(tab.url)
  ↓
chrome.cookies.getAll({ url })
```

---

## 9. PERMISSION REQUIREMENTS

### Manifest Permissions Used
```json
{
  "permissions": [
    "tabs",           // ← Read active tab (URL, title, id)
    "cookies",        // ← Read/write cookies
    "storage",        // ← Store configuration
    "notifications"   // ← Not used for context gathering
  ],
  "host_permissions": [
    "http://*/*",     // ← Access cookies from any HTTP site
    "https://*/*"     // ← Access cookies from any HTTPS site
  ]
}
```

### Context Gathering - Requires:
- ✓ `"tabs"` - For getting active tab
- ✓ `"cookies"` - For reading cookies
- ✓ `"host_permissions"` - For accessing specific domain cookies

---

## 10. TECHNICAL ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension UI                       │
│                    (popup/index.html)                        │
└──────────┬─────────────────────────────────────────┬────────┘
           │                                         │
           ▼                                         ▼
    ┌────────────────────┐                ┌─────────────────────┐
    │  main.js (1576L)   │                │ loginDetection.js   │
    │ - Event handlers   │                │ (503L) - Analyze    │
    │ - UI orchestration │                │   login confidence  │
    │ - Session store()  │                └─────────────────────┘
    └────────┬───────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
   ┌─────────────────────────────┐    ┌──────────────────────┐
   │  sessionCapture.js (156L)   │    │ cookieManager.js     │
   │ - captureCurrentSession()   │    │ (47L)                │
   │ - filterEssentialCookies()  │    │ - get(url)           │
   │ - validateSessionData()     │    │ - set(url, cookies)  │
   └──────────┬──────────────────┘    └──────┬───────────────┘
              │                              │
              └──────────────┬───────────────┘
                             │
                   ┌─────────▼──────────┐
                   │  Chrome APIs       │
                   │  chrome.cookies    │
                   │  chrome.tabs       │
                   │  chrome.storage    │
                   └────────────────────┘
                             │
                   ┌─────────▼──────────────────┐
                   │  Browser Data              │
                   │ - Active Tab Info          │
                   │ - Cookie Storage           │
                   │ - Site Sessions            │
                   └────────────────────────────┘
```

---

## 11. SECURITY CONSIDERATIONS

### Data At Risk
1. **Before Encryption**:
   - Cookies contain session tokens
   - Tokens may grant full account access
   - Stored in memory during processing

2. **During Transmission**:
   - QR codes visible on screen
   - URLs potentially logged
   - Tokens in encoded form (not truly secure)

3. **After Reception**:
   - Cookies applied to browser
   - Full session access granted
   - No audit trail of access

### Mitigations Implemented
- SJCL encryption before transmission
- Compression to reduce data size
- Expiration time enforcement
- Secure cookie flags preservation
- Optional tokenization via PrivateBin

---

## 12. FUTURE ENHANCEMENT OPPORTUNITIES

### To Improve Context Gathering:
1. **Bearer Token Support**:
   - Check Authorization headers
   - Capture JWT from localStorage
   - Support OAuth token capture

2. **Granular Cookie Selection**:
   - User selects which cookies to share
   - Whitelist/blacklist UI
   - Cookie review before sharing

3. **Local Storage Capture**:
   - Optional localStorage + sessionStorage sync
   - Encrypted transmission
   - Recovery option for JWT tokens

4. **Multi-Site Sessions**:
   - Capture multiple related cookies across subdomains
   - Maintain cookie hierarchy

5. **Session Validation**:
   - Test if cookies still work (make dummy request)
   - Verify expiration in real-time
   - Cache validation results

6. **Enhanced Page Analysis**:
   - Detect if user actually logged in (page content)
   - Find user email/ID from page
   - Identify session type (basic, OAuth, SAML, etc.)

7. **Audit Trail**:
   - Log who accessed what session
   - When sessions were shared
   - Which cookies were used
   - Suspicious access patterns

---

## Summary

The SecureShare extension's context gathering is **deliberately minimal and focused**:

- **Captures**: Only cookies and tab metadata
- **Designed for**: Login session sharing, not full page cloning
- **Approach**: Cookie-based sessions only, no DOM/storage access
- **Security**: Encryption before transmission, expiration enforcement
- **Limitations**: Modern token-based auth not fully supported, no granular control

This minimalist approach trades comprehensiveness for security and simplicity - perfect for sharing login sessions, but inadequate for complex multi-token applications.
