# SecureShare Context Gathering - Quick Reference Guide

## One-Line Summary
SecureShare captures **only cookies + basic tab metadata** from the active browser tab, packages them securely, and shares via encrypted QR codes. No DOM, localStorage, or network data is captured.

---

## Data Flow at a Glance

```
User Action
    ↓
Get Active Tab (URL, Title, ID)
    ↓
Extract ALL Cookies (chrome.cookies.getAll)
    ↓
Filter Tracking Cookies (remove _ga, _gid, ads)
    ↓
Analyze Login Status (auth pattern matching)
    ↓
Package Data (standardize format)
    ↓
Compress (optional RawDeflate)
    ↓
Encrypt (optional SJCL)
    ↓
Encode (Base64URL for QR)
    ↓
Generate QR Code
    ↓
User scans with mobile
```

---

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `sessionCapture.js` | 156 | Primary context extraction |
| `loginDetection.js` | 503 | Analyze login status |
| `cookieManager.js` | 47 | Chrome cookies API wrapper |
| `payloadManager.js` | 336 | Compress & encrypt payload |
| `main.js` | 1576 | UI orchestration |
| `qrShareDirect.js` | 623 | QR generation |

---

## What Gets Captured (6 Things)

1. ✓ Cookie names
2. ✓ Cookie values (including tokens)
3. ✓ Cookie security flags (secure, httpOnly)
4. ✓ Tab URL
5. ✓ Tab title
6. ✓ Login status (confidence 0-100%)

---

## What's NOT Captured (9 Things)

1. ✗ DOM/HTML content
2. ✗ Page visible text
3. ✗ Form inputs
4. ✗ localStorage
5. ✗ sessionStorage
6. ✗ Authorization headers
7. ✗ Network requests
8. ✗ JavaScript state
9. ✗ User email/ID from page

---

## Core Functions

### 1. `sessionCapture.captureCurrentSession()`
```
Input: None (gets active tab internally)
Output: { url, title, domain, cookies[], timestamp, metadata }
Time: ~50-100ms
```

### 2. `cookieManager.get(url, callback)`
```
Input: URL string
Output: [{ name, value, domain, path, secure, httpOnly, expirationDate }]
Time: ~10-30ms
```

### 3. `loginDetection.analyzeCookies(cookies, domain)`
```
Input: cookies array, domain string
Output: { isLoggedIn, confidence (0-100), indicators[], userInfo }
Time: ~5-10ms
```

### 4. `payloadManager.createPayload(sessionData)`
```
Input: { url, title, cookies[] }
Output: { data (encoded), size, compressed, encrypted, needsTokenization }
Time: ~50-200ms (includes compression/encryption)
```

---

## Cookie Filtering Logic

### Removed (Tracking Cookies)
```
_ga, _gid, _gat, _utm
analytics, tracking, pixel, ads, marketing
```

### Kept (Essential Cookies)
```
session, auth, login, token, jwt, bearer
user, uid, account, profile
csrf, xsrf, state, nonce, remember
(Site-specific: Netflix, YouTube, GitHub, AWS, etc.)
```

---

## Login Confidence Scoring

```
3+ auth cookies      → 70%
2 auth cookies       → 50%
1 auth cookie        → 30%
+ secure flag        → +5%
+ httpOnly flag      → +5%
+ site-specific match → ±30%
+ page content match → +20%
```

---

## Entry Points (3 Ways Context Gets Captured)

### Path 1: Standard Share
```
User clicks "Share Session"
→ session.store(publicKey)
→ cookieManager.get(url)
→ Encrypt → Display result
```

### Path 2: QR Share
```
User clicks "Generate QR"
→ getCurrentTab()
→ cookieManager.get(url)
→ qrShareDirect.generateDirectLoginQR()
→ Display QR on canvas
```

### Path 3: Session Preview
```
User opens QR share page
→ LoginDetection.detectLoginStatus()
→ Display login indicators
→ Show cookie count
```

---

## Payload Optimization Pipeline

```
Raw Data
↓
Phase 1: Clean
  - Validate required fields
  - Remove empty cookies
  - Filter invalid data
↓
Phase 2: Standardize
  - Normalize cookie format
  - Add metadata
  - Set version number
↓
Phase 3: Compress (Optional)
  - RawDeflate compression
  - Only if effective (saves ~30-50%)
↓
Phase 4: Encrypt (Optional)
  - SJCL ElGamal or AES-256-GCM
  - Preserve security metadata
↓
Phase 5: Encode
  - Base64URL
  - QR-safe format
↓
Final Payload
Size: 500-3000 bytes (targeting <2500 for reliable QR)
```

---

## Critical Limitations

| Limitation | Impact | Why |
|-----------|--------|-----|
| No localStorage | ~30% of modern apps won't fully restore | JWT tokens stored there |
| No DOM analysis | False negatives on login detection | Can't see "logged in" indicator |
| No Authorization headers | OAuth/SAML sessions incomplete | Not cookie-based |
| Aggressive filtering | May remove needed cookies | Pattern matching too broad |
| No granular control | Privacy concern | All matching cookies included |

---

## Security Considerations

### Before Encryption
- Cookies visible in memory
- Session tokens at risk if extension compromised
- No access control on what gets captured

### During Transmission
- QR codes visible on screen (print-ability risk)
- Encoded data still vulnerable to screenshot
- No time-based expiration on QR itself

### After Reception
- Full account access granted to recipient
- No audit trail of use
- Session cookies persist across sessions

---

## Configuration Constants

```javascript
// sessionCapture.js
MAX_QR_SIZE: 2500 bytes (target)
HARD_CAP_SIZE: 3000 bytes (absolute max)

// payloadManager.js
PAYLOAD_VERSION: '1.0'
DEFAULT_TTL: 3600 seconds (1 hour)

// loginDetection.js
AUTH_PATTERNS: 14 regex patterns
TRACKING_PATTERNS: 5 base patterns
SITE_SPECIFIC_PATTERNS: 9 domains configured
```

---

## Performance Metrics

| Operation | Time | Size |
|-----------|------|------|
| Get cookies | 10-30ms | Varies |
| Filter cookies | 5-10ms | 30-60% reduction |
| Analyze login | 5-10ms | N/A |
| Compress payload | 20-50ms | 30-50% reduction |
| Encrypt payload | 100-200ms | ~20% increase |
| Encode to Base64URL | 10-30ms | ~33% increase |
| Generate QR | 50-100ms | 300x300px |
| **Total** | **~250-500ms** | **500-3000 bytes** |

---

## Chrome Permissions Required

```
"permissions": [
  "tabs",              // Read active tab
  "cookies",           // Read/write cookies
  "storage",           // Store config
  "notifications"      // N/A for context gathering
]

"host_permissions": [
  "http://*/*",        // All HTTP sites
  "https://*/*"        // All HTTPS sites
]
```

---

## Common Issues & Diagnostics

### Issue: "Cannot share browser internal pages"
- **Cause**: URL is `chrome://`, `about:`, `file://`
- **Fix**: Navigate to regular website

### Issue: "No cookies found"
- **Cause**: User not logged in or site uses localStorage
- **Fix**: Log in first, or site uses tokens not cookies

### Issue: "QR too large to scan"
- **Cause**: Payload >2500 bytes
- **Fix**: Too many cookies, try tokenization

### Issue: "Low login confidence"
- **Cause**: <1 auth cookie detected
- **Fix**: May not be logged in, or auth token in localStorage

---

## Testing Context Capture

### Manual Test
```javascript
// In console on popup page:
window.sessionCapture.captureCurrentSession().then(data => {
  console.log('Captured:', data)
  console.log('Cookies:', data.cookies.length)
  console.log('Size:', JSON.stringify(data).length)
})
```

### Expected Output
```javascript
{
  version: "1.0",
  url: "https://github.com",
  title: "GitHub",
  domain: "github.com",
  cookies: [
    { name: "user_session", value: "ABC123...", ... }
  ],
  timestamp: 1729356000000,
  metadata: {
    cookieCount: 5,
    userAgent: "Mozilla/5.0...",
    captureMethod: "sessionCapture"
  }
}
```

---

## Enhancement Opportunities (Priority Order)

1. **HIGH** - localStorage capture for JWT tokens
2. **HIGH** - Granular cookie selection UI
3. **MEDIUM** - Authorization header support
4. **MEDIUM** - Session validation (test cookies work)
5. **LOW** - Audit trail for shared sessions
6. **LOW** - Custom cookie whitelisting

---

## Related Files

- Architecture: `CONTEXT_GATHERING_ANALYSIS.md` (detailed analysis)
- Manifest: `manifest.json` (permissions)
- UI: `popup/index.html` (user interface)
- HTML: Full context structure

---

## Version Info

- Extension Version: 1.3.0
- Context Capture Version: 1.0
- Last Updated: October 2024
- Scope: Current tab only (no cross-tab capture)

