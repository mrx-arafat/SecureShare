# Changelog

All notable changes to SecureShare will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-25

### Added
- Initial release of SecureShare Chrome Extension
- Core account sharing functionality using EC-ElGamal encryption
- Time-limited session sharing with customizable expiration
- Share history tracking to monitor shared sessions
- Transparent icon design for better visibility
- Privacy-first approach with no external servers
- Manifest V3 support for modern Chrome compatibility
- Comprehensive documentation and README

### Security
- Implemented Stanford Javascript Crypto Library (SJCL) for encryption
- 256-bit elliptic curve keys for maximum security
- Local-only data storage, no external communication
- Automatic session expiration for enhanced security

### Technical
- Migrated from Manifest V2 to V3
- Removed Google Analytics for privacy
- Modernized codebase structure
- Added proper error handling
- Improved UI/UX with better feedback

## [0.9.0] - 2025-07-01 (Pre-release)

### Added
- Beta testing version
- Basic sharing functionality
- Initial UI implementation

### Known Issues
- Manifest V2 deprecation warnings
- Limited error handling
- No session history

## Future Releases

### [1.1.0] - Planned
- [ ] Dark mode support
- [ ] Bulk session sharing
- [ ] Import/Export settings
- [ ] Enhanced error messages
- [ ] Keyboard shortcuts

### [1.2.0] - Planned
- [ ] Firefox extension support
- [ ] Advanced encryption options
- [ ] Session templates
- [ ] Team sharing features

---

For more information about changes, see the [commit history](https://github.com/mrx-arafat/secure-share/commits/main).
