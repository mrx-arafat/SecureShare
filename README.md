<div align="center">

<img src="/icons/128.png" width="128" alt="SecureShare Logo">

# SecureShare

### 🔐 Share Your Sessions Without Sharing Your Passwords

  [![Version](https://img.shields.io/badge/version-1.3.0-blue?style=flat-square)](https://github.com/mrx-arafat/SecureShare/releases)
  [![Manifest](https://img.shields.io/badge/manifest-v3-green?style=flat-square)](https://github.com/mrx-arafat/SecureShare/blob/main/manifest.json)
  [![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)](https://github.com/mrx-arafat/SecureShare/blob/main/LICENSE)
  [![Chrome](https://img.shields.io/badge/platform-Chrome-orange?style=flat-square&logo=google-chrome&logoColor=white)](https://www.google.com/chrome/)
  [![GitHub Stars](https://img.shields.io/github/stars/mrx-arafat/SecureShare?style=flat-square)](https://github.com/mrx-arafat/SecureShare/stargazers)
  [![GitHub Issues](https://img.shields.io/github/issues/mrx-arafat/SecureShare?style=flat-square)](https://github.com/mrx-arafat/SecureShare/issues)

  **A modern Chrome extension for secure, encrypted session sharing with end-to-end encryption**

  [**Install Extension**](#-installation) • [**Quick Start**](#-quick-start) • [**Features**](#-features) • [**Security**](#-security)

</div>

---

## 🎯 Overview

SecureShare revolutionizes online account sharing by enabling secure, temporary session transfers without ever exposing passwords. Using advanced elliptic curve cryptography (EC-ElGamal), it creates encrypted session snapshots that only the intended recipient can decrypt.

### ✨ Key Features

- 🔒 **End-to-End Encryption** - EC-ElGamal encryption ensures only the recipient can decrypt
- 🔑 **Zero Password Exposure** - Share sessions without revealing credentials
- 📱 **QR Code Sharing** - Instantly share sessions to mobile devices via QR codes
- 🐙 **GitHub Gist Integration** - Save encrypted sessions as private GitHub Gists
- ⏱️ **Customizable Expiration** - Set session timeout from 1 hour to 30 days
- 🎨 **Modern UI Design** - Beautiful glassmorphism interface with smooth animations
- 🌐 **Universal Compatibility** - Works with any website that uses cookies
- 📋 **Session History** - Track and manage your shared sessions
- 🔄 **One-Click Restore** - Easily restore shared sessions with a single click
- 🛡️ **Privacy-First** - All encryption happens locally in your browser

### 💡 Use Cases

- **👨‍👩‍👧‍👦 Family Sharing** - Share streaming services with family members securely
- **👥 Team Collaboration** - Provide temporary access to work accounts
- **🆘 Remote Support** - Help others access their accounts without password sharing
- **📱 Cross-Device Access** - Transfer desktop sessions to mobile devices instantly
- **🎮 Gaming Accounts** - Share game accounts temporarily without password risks
- **💼 Development Testing** - Share test account sessions with QA teams

---

## 🎨 Features

### Core Functionality
- **🔐 Share Session** - Share your current browser session securely
- **🔓 Restore Session** - Restore a shared session from encrypted data
- **📱 QR Code Sharing** - Generate QR codes for mobile device sharing
- **🐙 GitHub Gist Integration** - Save encrypted sessions as private Gists
- **📋 Session History** - View and manage your sharing history
- **⚙️ Settings** - Configure GitHub token and preferences

### Modern UI/UX
- **Glass Morphism Design** - Beautiful frosted glass effects
- **Smooth Animations** - Fluid transitions and hover effects
- **Dark Theme** - Eye-friendly dark interface
- **Responsive Layout** - Adapts to different screen sizes
- **Step-by-Step Guidance** - Clear numbered steps for sharing
- **Visual Feedback** - Success/error states with clear messaging

---

## 📦 Installation

### Option 1: Chrome Web Store
*Coming soon - Currently in review*

### Option 2: Manual Installation

1. **Download the Extension**
   ```bash
   git clone https://github.com/mrx-arafat/SecureShare.git
   cd SecureShare
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)

3. **Load Extension**
   - Click "Load unpacked"
   - Select the `SecureShare` folder
   - The SecureShare icon will appear in your toolbar

---

## 🚀 Quick Start

### Share a Session

1. **Navigate** to any website where you're logged in
2. **Click** the SecureShare icon in Chrome toolbar
3. **Select** "Share Session"
4. **Enter** the recipient's device code
5. **Set** expiration time (1 hour to 30 days)
6. **Generate** encrypted session
7. **Send** the encrypted data to recipient

### Restore a Session

1. **Click** SecureShare icon
2. **Select** "Restore Session"
3. **Share** your device code with the sender
4. **Paste** the encrypted session data
5. **Click** "Restore Session"
6. The website opens with the session active!

### Save to GitHub Gist

1. **Go to Settings** in SecureShare
2. **Add GitHub Token** (with gist permissions)
3. **Share any session**
4. **Click** "Save to Gist" button
5. Session is saved as a private Gist

### Share via QR Code

1. **Select** "Share Current Session"
2. **Enter** recipient code
3. **Generate** QR code
4. **Scan** with mobile device
5. Session transfers instantly!

---

## 🔧 How It Works

### Technical Architecture

1. **🔑 Key Generation**
   - Unique EC-ElGamal keypair per installation
   - Public key for encryption, private key for decryption
   - Keys stored locally in Chrome storage

2. **🍪 Session Extraction**
   - Captures all cookies from current tab
   - Includes domain, path, and security flags
   - Preserves session state completely

3. **🔐 Encryption Process**
   - Uses recipient's public key
   - EC-ElGamal encryption (elliptic curve)
   - Creates tamper-proof encrypted payload

4. **📤 Data Transfer**
   - No server involvement
   - Direct peer-to-peer via text/QR
   - Optional GitHub Gist storage

5. **🔓 Decryption & Restore**
   - Only recipient's private key works
   - Cookies restored with original properties
   - Session becomes immediately active

---

## 🔒 Security

### Encryption Standards
- **Algorithm**: EC-ElGamal (Elliptic Curve Cryptography)
- **Library**: Stanford JavaScript Crypto Library (SJCL)
- **Curve**: secp256k1 (256-bit security)
- **Key Exchange**: ECDH (Elliptic Curve Diffie-Hellman)
### Privacy Features
- ✅ **No Password Storage** - Passwords never leave your device
- ✅ **Local Encryption** - All encryption happens in your browser
- ✅ **No Tracking** - Zero analytics or user tracking
- ✅ **Automatic Expiration** - Sessions expire at configured time
- ✅ **One-Time Use** - Shared sessions can't be reused
- ✅ **Key Regeneration** - Generate new keys anytime

### Security Best Practices
- 🔐 Never share your private key
- ⏱️ Use short expiration times for sensitive accounts
- 🔄 Regenerate keys periodically
- 🚫 Only share with trusted recipients
- 📱 Use QR codes for secure mobile transfer

---

## 🛠️ Development

### Prerequisites
- Node.js 14+ and npm
- Chrome Browser
- Git

### Setup
```bash
# Clone repository
git clone https://github.com/mrx-arafat/SecureShare.git
cd SecureShare

# Install dependencies
npm install

# Build for production
gulp build:prod
```

### Project Structure
```
SecureShare/
├── manifest.json           # Extension configuration
├── icons/                  # Extension icons
├── popup/                  # Extension popup UI
│   ├── index.html         # Main popup HTML
│   ├── css/               # Stylesheets
│   │   └── styles.css     # Main styles
│   ├── js/                # JavaScript modules
│   │   ├── main.js        # Core application logic
│   │   ├── cryptography.js # Encryption/decryption
│   │   ├── cookieManager.js # Cookie operations
│   │   ├── github.js      # GitHub Gist integration
│   │   └── qrcode.js      # QR code generation
│   └── images/            # UI assets
├── gulpfile.js            # Build configuration
├── package.json           # Dependencies
└── README.md              # Documentation
```

### Available Scripts
```bash
npm run build:prod         # Build for production
npm run package           # Create distribution package
```

---

## 🚧 Roadmap

### Version 1.4.0 (Upcoming)
- [ ] Mara Khau Kono Planning Nai


## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add: Amazing new feature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Commit Convention
```
TYPE: #ISSUE_ID, Description

Types: FIX | FEAT | DOCS | REFACTOR | TEST | CHORE
Example: FIX: #123, Resolve cookie extraction on Netflix
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Easin Arafat**
- GitHub: [@mrx-arafat](https://github.com/mrx-arafat)
- Email: [arafatmrx@gmail.com](mailto:arafatmrx@gmail.com)
- Website: [profile.arafatops.com](https://profile.arafatops.com)

---

## ⭐ Support

If you find SecureShare useful, please consider:
- ⭐ **Star** this repository
- 🐛 **Report** [issues](https://github.com/mrx-arafat/SecureShare/issues)
- 💡 **Request** [features](https://github.com/mrx-arafat/SecureShare/issues)
- 🔀 **Share** with friends and colleagues

---

## 🙏 Acknowledgments

- [Stanford JavaScript Crypto Library](https://github.com/bitwiseshiftleft/sjcl) - Encryption library
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) - QR code generation
- Chrome Extension community for guidance and support

---

<div align="center">

  **Made with ❤️ by [Easin Arafat](https://github.com/mrx-arafat)**

  <sub>Secure sharing for a safer internet</sub>

</div>
- 🍴 [Fork the project](https://github.com/mrx-arafat/SecureShare/fork)

---

<div align="center">

**SecureShare - Because Security Shouldn't Compromise Convenience**

Made with ❤️ by [Easin Arafat](https://github.com/mrx-arafat)

</div>
