<div align="center">

<img src="/icons/128.png" width="128" alt="SecureShare Logo">

# SecureShare

### 🔐 Share Your Accounts Without Sharing Your Passwords

  [![Version](https://img.shields.io/badge/version-1.3.0-blue?style=flat-square)](https://github.com/mrx-arafat/SecureShare/releases)
  [![Manifest](https://img.shields.io/badge/manifest-v3-green?style=flat-square)](https://github.com/mrx-arafat/SecureShare/blob/main/manifest.json)
  [![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)](https://github.com/mrx-arafat/SecureShare/blob/main/LICENSE)
  [![Chrome](https://img.shields.io/badge/platform-Chrome-orange?style=flat-square&logo=google-chrome&logoColor=white)](https://www.google.com/chrome/)
  [![GitHub Stars](https://img.shields.io/github/stars/mrx-arafat/SecureShare?style=flat-square)](https://github.com/mrx-arafat/SecureShare/stargazers)
  [![GitHub Issues](https://img.shields.io/github/issues/mrx-arafat/SecureShare?style=flat-square)](https://github.com/mrx-arafat/SecureShare/issues)

  **A Chrome extension that enables secure, temporary account sharing without revealing passwords**

  [**Install Extension**](#-installation) • [**Quick Start**](#-quick-start) • [**How It Works**](#-how-it-works) • [**Security**](#-security)

</div>

---

## 🎯 Overview

SecureShare is a revolutionary Chrome extension that solves a common problem: sharing access to online accounts without compromising security. Using military-grade encryption, it allows you to share your logged-in sessions temporarily without ever revealing your passwords.

### ✨ Key Features

- 🔒 **Zero Password Exposure** - Share accounts without revealing credentials
- 📱 **Mobile Session Sharing** - Generate QR codes to instantly share sessions to mobile devices
- ⏱️ **Time-Limited Access** - Automatic 30-minute expiration for all shared sessions
- 🔐 **Military-Grade Encryption** - AES-256-GCM encryption with secure key exchange
- 🌐 **Universal Compatibility** - Works with any website or web application
- 🚀 **One-Click Sharing** - Simple, intuitive interface with guided onboarding
- 📊 **Analytics & Monitoring** - Privacy-respecting usage analytics and system health monitoring
- 🛡️ **Privacy-First** - Secure server infrastructure with one-time use semantics
- 🔄 **Instant Revocation** - Sessions automatically expire and can be cancelled anytime

### 💡 Use Cases

- **👨‍👩‍👧‍👦 Family Sharing** - Share streaming services with family members
- **👥 Team Collaboration** - Provide temporary access to work accounts
- **🆘 Remote Support** - Help others access their accounts securely
- **📱 Mobile Access** - Instantly transfer desktop sessions to mobile devices via QR codes
- **🎮 Gaming Accounts** - Share game accounts without password risks
- **💼 Cross-Device Work** - Seamlessly continue work sessions on different devices

---

## 📦 Installation

### Option 1: Chrome Web Store (Recommended)

*Coming soon - Currently in review*

### Option 2: Manual Installation

1. **Download the Extension**

   ```bash
   git clone https://github.com/mrx-arafat/SecureShare.git
   cd SecureShare
   ```
2. **Open Chrome Extensions Page**

   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions
3. **Enable Developer Mode**

   - Toggle the "Developer mode" switch in the top-right corner
4. **Load the Extension**

   - Click "Load unpacked"
   - Select the `SecureShare` folder
   - The SecureShare icon will appear in your toolbar

---

## 🚀 Quick Start

### Sharing an Account (Sender)

1. **Navigate to the website** where you're logged in
2. **Click the SecureShare icon** in your Chrome toolbar
3. **Get recipient's code** - Ask them to open SecureShare and click "Receive Account"
4. **Click "Share Account"** and paste the recipient's code
5. **Set expiration time** (optional - defaults to 1 week)
6. **Click "Share"** and copy the encrypted session data
7. **Send the encrypted data** to the recipient via any messaging app

### Receiving an Account (Recipient)

1. **Open SecureShare** and click "Receive Account"
2. **Copy your unique code** and share it with the sender
3. **Paste the encrypted data** you received from the sender
4. **Click "Receive"** - The website will open with the shared session active!

---

## 🔧 How It Works

SecureShare uses advanced cryptographic techniques to ensure your passwords never leave your device:

1. **Key Generation** - Each installation generates a unique public-private key pair
2. **Session Extraction** - Cookies from the current tab are extracted locally
3. **Encryption** - Session data is encrypted using the recipient's public key
4. **Transfer** - Encrypted data is shared as text (no servers involved)
5. **Decryption** - Only the recipient's private key can decrypt the session
6. **Session Restoration** - Cookies are restored and the session becomes active

---

## 🔒 Security

### Encryption Standards
- **Algorithm**: EC-ElGamal (Elliptic Curve Cryptography)
- **Library**: Stanford Javascript Crypto Library (SJCL)
- **Key Size**: 256-bit elliptic curve keys
- **Security Level**: Military-grade encryption

### Privacy Features
- ✅ **No Password Storage** - Passwords never leave your device
- ✅ **No External Servers** - All processing happens locally
- ✅ **No Tracking** - Zero analytics or data collection
- ✅ **Automatic Expiration** - Sessions expire at set times
- ✅ **Key Regeneration** - Generate new keys anytime

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
npm run build:prod
```

### Project Structure
```
SecureShare/
├── manifest.json        # Extension configuration
├── icons/              # Extension icons
├── popup/              # Extension popup UI
│   ├── index.html      # Main popup HTML
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── images/         # UI assets
├── package.json        # Dependencies
└── README.md           # Documentation
```

---

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

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
- ⭐ [Star this repository](https://github.com/mrx-arafat/SecureShare)
- 🐛 [Report issues](https://github.com/mrx-arafat/SecureShare/issues)
- 💡 [Suggest features](https://github.com/mrx-arafat/SecureShare/issues)
- 🍴 [Fork the project](https://github.com/mrx-arafat/SecureShare/fork)

---

<div align="center">

**SecureShare - Because Security Shouldn't Compromise Convenience**

Made with ❤️ by [Easin Arafat](https://github.com/mrx-arafat)

</div>
