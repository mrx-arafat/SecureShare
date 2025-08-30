# 🚀 SecureShare QR Mobile Flow

## Overview

The SecureShare QR Mobile Flow is an advanced system that enables seamless account sharing between desktop and mobile devices through QR codes. It features automatic session application when the mobile extension is installed, with intelligent fallback to manual instructions when not available.

## 🎯 Key Features

### 1. **Dual-Mode Operation**
- **Auto-Apply Mode**: When SecureShare mobile extension is installed, scanning QR automatically applies cookies and redirects to target site
- **Fallback Mode**: When extension is not available, shows mobile-optimized instruction page with copy/paste functionality

### 2. **Payload Optimization**
- **Compression**: Uses RawDeflate to compress large session data
- **Encryption**: SJCL encryption when recipient public key is available
- **Tokenization**: PrivateBin integration for oversized payloads
- **Base64URL Encoding**: URL-safe encoding for QR compatibility

### 3. **Deep Link Integration**
- **Custom Protocol**: `secureshare://apply` for direct extension handling
- **HTTPS Catcher**: `https://secureshare.app/apply` as fallback
- **Parameter Support**: Direct data or tokenized references

## 🔧 Technical Architecture

### Core Modules

#### 1. **base64url.js**
```javascript
// URL-safe Base64 encoding without padding
base64url.encode(string) → base64url_string
base64url.decode(base64url_string) → string
base64url.encodeObject(object) → base64url_string
base64url.decodeObject(base64url_string) → object
```

#### 2. **payloadManager.js**
```javascript
// Payload creation and optimization
payloadManager.createPayload(sessionData, publicKey?) → {
  data: string,           // Encoded payload
  size: number,          // Payload size in bytes
  compressed: boolean,   // Whether compression was used
  encrypted: boolean,    // Whether encryption was used
  needsTokenization: boolean  // Whether payload exceeds QR limits
}
```

#### 3. **mobileFlow.js**
```javascript
// Deep link and mobile flow management
mobileFlow.generateDeepLink(payload, options?) → deep_link_url
mobileFlow.createFallbackPage(sessionData, payload) → fallback_page_url
mobileFlow.processDeepLink(url) → sessionData
mobileFlow.applySessionCookies(sessionData) → applied_count
```

#### 4. **qrShareDirect.js** (Enhanced)
```javascript
// Advanced QR generation with auto-apply
qrShareDirect.generateDirectLoginQR(sessionData, canvasId, publicKey?) → qr_url
qrShareDirect.handleMobileDeepLink(deepLinkUrl) → void
```

## 📱 Mobile Flow Scenarios

### Scenario 1: Auto-Apply (Extension Installed)
```
1. User scans QR code with mobile camera
2. Camera app detects secureshare:// deep link
3. Mobile browser opens SecureShare extension
4. Extension processes deep link parameters
5. Extension decodes/decrypts session data
6. Extension applies cookies via chrome.cookies API
7. Extension redirects to target URL
8. User is automatically logged in (3-5 seconds)
```

### Scenario 2: Fallback (No Extension)
```
1. User scans QR code with mobile camera
2. Camera app opens fallback instruction page
3. Page displays session info and instructions
4. User taps "Copy Session Data" button
5. User installs SecureShare extension
6. User opens extension → "Restore Session"
7. User pastes session data and clicks "Receive"
8. User navigates to website and is logged in
```

## 🔗 Deep Link Format

### Direct Payload
```
secureshare://apply?v=1&data={base64url_encoded_payload}
```

### Tokenized Payload
```
secureshare://apply?v=1&token={privatebin_id}&k={decryption_secret}
```

### HTTPS Catcher (Fallback)
```
https://secureshare.app/apply?v=1&data={base64url_encoded_payload}
```

## 📦 Payload Structure

### Session Data Format
```json
{
  "v": 1,                    // Version
  "t": 1640995200,          // Timestamp (Unix)
  "ttl": 3600,              // TTL in seconds
  "url": "https://github.com/user",
  "title": "GitHub - User",
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123",
      "domain": "github.com",
      "path": "/",
      "secure": true,
      "httpOnly": true,
      "expirationDate": 1640998800
    }
  ]
}
```

### Payload Processing Pipeline
```
Raw Session Data
    ↓
Clean & Validate
    ↓
JSON Stringify
    ↓
Compress (RawDeflate) [if beneficial]
    ↓
Encrypt (SJCL) [if public key available]
    ↓
Base64URL Encode
    ↓
Check Size → [if > 2.5KB] → Tokenize via PrivateBin
    ↓
Generate Deep Link or Fallback Page
    ↓
Render QR Code
```

## 🛡️ Security Considerations

### 1. **Data Protection**
- Session data encrypted with SJCL when recipient public key available
- Temporary storage only - no persistent sensitive data
- TTL enforcement prevents expired session usage

### 2. **Transport Security**
- Base64URL encoding prevents URL parsing issues
- Deep links use custom protocol for extension-only handling
- HTTPS fallback for non-extension scenarios

### 3. **Privacy**
- No external servers required for basic operation
- PrivateBin used only for oversized payloads
- Encrypted payloads never sent in plaintext

## 🧪 Testing

### Test Page
Open `test/advanced-qr-test.html` to test the complete flow:

```bash
# Start local server
cd SecureShare
python -m http.server 5500

# Open test page
open http://localhost:5500/test/advanced-qr-test.html
```

### Test Scenarios
1. **Small Payload**: Direct QR with uncompressed data
2. **Large Payload**: Compressed QR with RawDeflate
3. **Encrypted Payload**: SJCL-encrypted session data
4. **Tokenized Payload**: PrivateBin integration for oversized data

### Mobile Testing
1. Generate QR code on desktop
2. Scan with mobile device camera
3. Verify appropriate flow (auto-apply or fallback)
4. Test session application and redirect

## 📋 Implementation Checklist

### Desktop Extension
- [x] Enhanced QR generation with payload optimization
- [x] Compression and encryption support
- [x] Tokenization for large payloads
- [x] Deep link generation
- [x] Fallback page creation

### Mobile Extension (To Implement)
- [ ] Deep link handler registration in manifest.json
- [ ] Background script for deep link processing
- [ ] Cookie application via chrome.cookies API
- [ ] Error handling and user feedback
- [ ] Fallback detection and graceful degradation

### Infrastructure (Optional)
- [ ] HTTPS catcher service at secureshare.app/apply
- [ ] Analytics for QR usage patterns
- [ ] Error reporting and monitoring

## 🔄 Migration from Old QR System

The new system is backward compatible:

1. **Old QR codes** continue to work as fallback pages
2. **New QR codes** provide enhanced auto-apply functionality
3. **Gradual rollout** possible with feature flags
4. **User education** through improved UI and instructions

## 📈 Performance Metrics

### Target Metrics
- **QR Size**: < 2.5KB for reliable scanning
- **Generation Time**: < 500ms for standard payloads
- **Auto-Apply Time**: 3-5 seconds from scan to login
- **Fallback Success**: > 90% successful manual application

### Monitoring
- Payload size distribution
- Compression effectiveness
- QR scan success rates
- Mobile flow completion rates

## 🚀 Future Enhancements

1. **Biometric Authentication**: Touch/Face ID for mobile session approval
2. **Multi-Device Sync**: Share sessions across multiple mobile devices
3. **Temporary Accounts**: Create limited-time guest accounts
4. **Enterprise Features**: Bulk session sharing and management
5. **Cross-Platform**: Support for iOS Safari and other mobile browsers

---

*This documentation covers the advanced QR Mobile Flow implementation. For basic usage, see the main README.md file.*
