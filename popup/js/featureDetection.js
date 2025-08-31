/**
 * Feature Detection Module
 * Detects browser capabilities and website compatibility for SecureShare
 */

class FeatureDetection {
    constructor() {
        this.capabilities = {
            cookies: false,
            storage: false,
            notifications: false,
            qrGeneration: false,
            mobileSharing: false,
            analytics: false
        };
        
        this.websiteCompatibility = {
            supported: false,
            reason: null,
            recommendations: []
        };
        
        this.init();
    }

    init() {
        this.detectBrowserCapabilities();
        console.log('🔍 Feature detection initialized:', this.capabilities);
    }

    detectBrowserCapabilities() {
        // Check Chrome extension APIs
        this.capabilities.cookies = typeof chrome !== 'undefined' && 
                                   chrome.cookies !== undefined;
        
        this.capabilities.storage = typeof chrome !== 'undefined' && 
                                   chrome.storage !== undefined;
        
        this.capabilities.notifications = typeof chrome !== 'undefined' && 
                                         chrome.notifications !== undefined;
        
        // Check QR generation capabilities
        this.capabilities.qrGeneration = typeof window.qrShareDirect !== 'undefined' ||
                                        typeof QRious !== 'undefined';
        
        // Check mobile sharing capabilities
        this.capabilities.mobileSharing = this.capabilities.cookies && 
                                         this.capabilities.storage &&
                                         this.capabilities.qrGeneration;
        
        // Check analytics capabilities
        this.capabilities.analytics = typeof window.analytics !== 'undefined';
    }

    async checkWebsiteCompatibility(tab) {
        try {
            if (!tab || !tab.url) {
                this.websiteCompatibility = {
                    supported: false,
                    reason: 'no_tab_info',
                    recommendations: ['Please refresh the page and try again']
                };
                return this.websiteCompatibility;
            }

            const url = new URL(tab.url);
            
            // Check for unsupported protocols
            if (!['http:', 'https:'].includes(url.protocol)) {
                this.websiteCompatibility = {
                    supported: false,
                    reason: 'unsupported_protocol',
                    recommendations: [
                        'SecureShare only works on websites (http/https)',
                        'Navigate to a website like google.com and try again'
                    ]
                };
                return this.websiteCompatibility;
            }

            // Check for browser internal pages
            const internalPages = [
                'chrome://', 'chrome-extension://', 'moz-extension://',
                'edge://', 'opera://', 'brave://', 'about:'
            ];
            
            if (internalPages.some(prefix => tab.url.startsWith(prefix))) {
                this.websiteCompatibility = {
                    supported: false,
                    reason: 'browser_internal_page',
                    recommendations: [
                        'Cannot share browser internal pages',
                        'Navigate to a website and try again'
                    ]
                };
                return this.websiteCompatibility;
            }

            // Check for local development
            if (['localhost', '127.0.0.1'].includes(url.hostname) || 
                url.hostname.endsWith('.local')) {
                this.websiteCompatibility = {
                    supported: true,
                    reason: 'local_development',
                    recommendations: [
                        'Local development detected',
                        'Mobile sharing may not work across different networks'
                    ]
                };
                return this.websiteCompatibility;
            }

            // Check for HTTPS requirement for secure features
            if (url.protocol === 'http:' && url.hostname !== 'localhost') {
                this.websiteCompatibility = {
                    supported: true,
                    reason: 'http_warning',
                    recommendations: [
                        'HTTP site detected - some features may be limited',
                        'HTTPS sites provide better security for session sharing'
                    ]
                };
                return this.websiteCompatibility;
            }

            // Check if we can access cookies
            try {
                const cookies = await this.getCookiesForTab(tab);
                
                if (!cookies || cookies.length === 0) {
                    this.websiteCompatibility = {
                        supported: false,
                        reason: 'no_cookies',
                        recommendations: [
                            'No cookies found for this site',
                            'Please log in to the website first',
                            'Some sites may not be compatible with session sharing'
                        ]
                    };
                    return this.websiteCompatibility;
                }

                // Check for essential login cookies
                const hasLoginCookies = this.hasEssentialLoginCookies(cookies);
                
                if (!hasLoginCookies) {
                    this.websiteCompatibility = {
                        supported: true,
                        reason: 'limited_cookies',
                        recommendations: [
                            'Limited session cookies detected',
                            'Session sharing may not work completely',
                            'Try logging in again if sharing fails'
                        ]
                    };
                    return this.websiteCompatibility;
                }

                // All checks passed
                this.websiteCompatibility = {
                    supported: true,
                    reason: 'fully_compatible',
                    recommendations: []
                };
                
            } catch (error) {
                console.warn('Cookie check failed:', error);
                this.websiteCompatibility = {
                    supported: false,
                    reason: 'cookie_access_failed',
                    recommendations: [
                        'Unable to access cookies for this site',
                        'Please check extension permissions'
                    ]
                };
            }

            return this.websiteCompatibility;
            
        } catch (error) {
            console.error('Website compatibility check failed:', error);
            this.websiteCompatibility = {
                supported: false,
                reason: 'compatibility_check_failed',
                recommendations: [
                    'Unable to check website compatibility',
                    'Please try refreshing the page'
                ]
            };
            return this.websiteCompatibility;
        }
    }

    async getCookiesForTab(tab) {
        return new Promise((resolve) => {
            if (!this.capabilities.cookies) {
                resolve([]);
                return;
            }

            chrome.cookies.getAll({ url: tab.url }, (cookies) => {
                resolve(cookies || []);
            });
        });
    }

    hasEssentialLoginCookies(cookies) {
        // Look for common login-related cookie patterns
        const loginPatterns = [
            /session/i, /auth/i, /token/i, /login/i, /user/i,
            /sid/i, /jsessionid/i, /phpsessid/i, /asp\.net_sessionid/i,
            /connect\.sid/i, /laravel_session/i, /django/i
        ];

        return cookies.some(cookie => {
            // Check cookie name patterns
            const nameMatch = loginPatterns.some(pattern => pattern.test(cookie.name));
            
            // Check for substantial cookie values (likely session data)
            const hasSubstantialValue = cookie.value && cookie.value.length > 10;
            
            // Check for secure/httpOnly flags (common for session cookies)
            const hasSecurityFlags = cookie.secure || cookie.httpOnly;
            
            return nameMatch || (hasSubstantialValue && hasSecurityFlags);
        });
    }

    getFeatureAvailability() {
        return {
            mobileSharing: this.capabilities.mobileSharing && this.websiteCompatibility.supported,
            qrGeneration: this.capabilities.qrGeneration,
            analytics: this.capabilities.analytics,
            notifications: this.capabilities.notifications,
            basicSharing: this.capabilities.cookies && this.capabilities.storage
        };
    }

    getCompatibilityReport() {
        return {
            capabilities: this.capabilities,
            websiteCompatibility: this.websiteCompatibility,
            featureAvailability: this.getFeatureAvailability(),
            recommendations: this.websiteCompatibility.recommendations
        };
    }

    // Feature-specific checks
    canUseMobileSharing() {
        return this.capabilities.mobileSharing && this.websiteCompatibility.supported;
    }

    canUseQRGeneration() {
        return this.capabilities.qrGeneration;
    }

    canUseAnalytics() {
        return this.capabilities.analytics;
    }

    canUseNotifications() {
        return this.capabilities.notifications;
    }

    // Get user-friendly messages
    getUnsupportedFeatureMessage(feature) {
        const messages = {
            mobileSharing: this.getMobileSharingMessage(),
            qrGeneration: 'QR code generation is not available. Please check if required libraries are loaded.',
            analytics: 'Analytics tracking is not available.',
            notifications: 'Browser notifications are not available.'
        };

        return messages[feature] || 'This feature is not available.';
    }

    getMobileSharingMessage() {
        if (!this.capabilities.mobileSharing) {
            return 'Mobile sharing requires cookie and storage access. Please check extension permissions.';
        }

        if (!this.websiteCompatibility.supported) {
            const reason = this.websiteCompatibility.reason;
            const recommendations = this.websiteCompatibility.recommendations;

            switch (reason) {
                case 'browser_internal_page':
                    return 'Cannot share browser internal pages. Please navigate to a website.';
                case 'unsupported_protocol':
                    return 'SecureShare only works on websites (http/https).';
                case 'no_cookies':
                    return 'No session cookies found. Please log in to the website first.';
                case 'cookie_access_failed':
                    return 'Unable to access cookies. Please check extension permissions.';
                default:
                    return recommendations.length > 0 ? recommendations[0] : 'Mobile sharing is not available for this site.';
            }
        }

        return null; // Feature is available
    }

    // Refresh detection
    async refresh(tab) {
        this.detectBrowserCapabilities();
        if (tab) {
            await this.checkWebsiteCompatibility(tab);
        }
        return this.getCompatibilityReport();
    }
}

// Global feature detection instance
window.FeatureDetection = FeatureDetection;

// Auto-initialize
if (typeof window !== 'undefined') {
    window.featureDetection = new FeatureDetection();
}
