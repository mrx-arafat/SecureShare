/**
 * SecureShare Analytics Module
 * Privacy-respecting analytics and monitoring system
 * No personal data or session content is tracked
 */

class SecureShareAnalytics {
    constructor() {
        this.isEnabled = true;
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.metrics = {
            qrGeneration: {
                attempts: 0,
                successes: 0,
                failures: 0,
                avgTime: 0,
                totalTime: 0
            },
            mobileProcessing: {
                attempts: 0,
                successes: 0,
                failures: 0,
                avgTime: 0,
                totalTime: 0
            },
            sessionTransfer: {
                attempts: 0,
                successes: 0,
                avgTime: 0,
                totalTime: 0
            },
            errors: {},
            performance: {
                apiResponseTimes: [],
                qrGenerationTimes: [],
                mobileLoadTimes: []
            },
            security: {
                suspiciousActivities: 0,
                failedDecryptions: 0,
                expiredLinkAccess: 0,
                rapidGenerations: 0
            },
            userExperience: {
                commonWebsites: {},
                errorRecoveries: 0,
                abandonedSessions: 0
            }
        };

        this.init();
    }

    init() {
        // Load existing metrics from storage
        this.loadMetrics();

        // Set up periodic metric saves
        setInterval(() => this.saveMetrics(), 30000); // Save every 30 seconds

        // Set up cleanup for old data
        this.cleanupOldData();

        console.log('SecureShare Analytics initialized');
    }

    generateSessionId() {
        return 'analytics_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // QR Generation Metrics
    trackQRGenerationStart() {
        if (!this.isEnabled) return;

        this.metrics.qrGeneration.attempts++;
        this.currentQRStart = Date.now();

        this.logEvent('qr_generation_start', {
            timestamp: Date.now(),
            sessionId: this.sessionId
        });
    }

    trackQRGenerationSuccess(websiteDomain = null) {
        if (!this.isEnabled || !this.currentQRStart) return;

        const duration = Date.now() - this.currentQRStart;
        this.metrics.qrGeneration.successes++;
        this.metrics.qrGeneration.totalTime += duration;
        this.metrics.qrGeneration.avgTime = this.metrics.qrGeneration.totalTime / this.metrics.qrGeneration.successes;

        this.metrics.performance.qrGenerationTimes.push(duration);

        // Track common websites (domain only, no personal data)
        if (websiteDomain) {
            const domain = this.sanitizeDomain(websiteDomain);
            this.metrics.userExperience.commonWebsites[domain] =
                (this.metrics.userExperience.commonWebsites[domain] || 0) + 1;
        }

        this.logEvent('qr_generation_success', {
            duration,
            domain: websiteDomain ? this.sanitizeDomain(websiteDomain) : null,
            timestamp: Date.now()
        });

        this.currentQRStart = null;
    }

    trackQRGenerationFailure(errorType, errorMessage = null) {
        if (!this.isEnabled) return;

        this.metrics.qrGeneration.failures++;
        this.trackError('qr_generation', errorType, errorMessage);

        this.currentQRStart = null;
    }

    // Mobile Processing Metrics
    trackMobileProcessingStart() {
        if (!this.isEnabled) return;

        this.metrics.mobileProcessing.attempts++;
        this.currentMobileStart = Date.now();

        this.logEvent('mobile_processing_start', {
            timestamp: Date.now(),
            userAgent: this.sanitizeUserAgent(navigator.userAgent)
        });
    }

    trackMobileProcessingSuccess() {
        if (!this.isEnabled || !this.currentMobileStart) return;

        const duration = Date.now() - this.currentMobileStart;
        this.metrics.mobileProcessing.successes++;
        this.metrics.mobileProcessing.totalTime += duration;
        this.metrics.mobileProcessing.avgTime = this.metrics.mobileProcessing.totalTime / this.metrics.mobileProcessing.successes;

        this.metrics.performance.mobileLoadTimes.push(duration);

        this.logEvent('mobile_processing_success', {
            duration,
            timestamp: Date.now()
        });

        this.currentMobileStart = null;
    }

    trackMobileProcessingFailure(errorType, errorMessage = null) {
        if (!this.isEnabled) return;

        this.metrics.mobileProcessing.failures++;
        this.trackError('mobile_processing', errorType, errorMessage);

        this.currentMobileStart = null;
    }

    // Session Transfer Metrics
    trackSessionTransferStart() {
        if (!this.isEnabled) return;

        this.metrics.sessionTransfer.attempts++;
        this.currentTransferStart = Date.now();

        this.logEvent('session_transfer_start', {
            timestamp: Date.now()
        });
    }

    trackSessionTransferSuccess() {
        if (!this.isEnabled || !this.currentTransferStart) return;

        const duration = Date.now() - this.currentTransferStart;
        this.metrics.sessionTransfer.successes++;
        this.metrics.sessionTransfer.totalTime += duration;
        this.metrics.sessionTransfer.avgTime = this.metrics.sessionTransfer.totalTime / this.metrics.sessionTransfer.successes;

        this.logEvent('session_transfer_success', {
            duration,
            timestamp: Date.now()
        });

        this.currentTransferStart = null;
    }

    // Error Tracking
    trackError(category, errorType, errorMessage = null, context = {}) {
        if (!this.isEnabled) return;

        const errorKey = `${category}_${errorType}`;
        this.metrics.errors[errorKey] = (this.metrics.errors[errorKey] || 0) + 1;

        this.logEvent('error', {
            category,
            errorType,
            errorMessage: errorMessage ? this.sanitizeErrorMessage(errorMessage) : null,
            context: this.sanitizeContext(context),
            timestamp: Date.now()
        });

        // Check for critical errors that need immediate attention
        this.checkCriticalError(category, errorType);
    }

    // Performance Monitoring
    trackAPIResponseTime(endpoint, duration) {
        if (!this.isEnabled) return;

        this.metrics.performance.apiResponseTimes.push({
            endpoint: this.sanitizeEndpoint(endpoint),
            duration,
            timestamp: Date.now()
        });

        // Keep only last 100 measurements
        if (this.metrics.performance.apiResponseTimes.length > 100) {
            this.metrics.performance.apiResponseTimes.shift();
        }
    }

    // Security Event Logging
    trackSecurityEvent(eventType, details = {}) {
        if (!this.isEnabled) return;

        switch (eventType) {
            case 'rapid_generation':
                this.metrics.security.rapidGenerations++;
                break;
            case 'failed_decryption':
                this.metrics.security.failedDecryptions++;
                break;
            case 'expired_link_access':
                this.metrics.security.expiredLinkAccess++;
                break;
            case 'suspicious_activity':
                this.metrics.security.suspiciousActivities++;
                break;
        }

        this.logEvent('security_event', {
            eventType,
            details: this.sanitizeContext(details),
            timestamp: Date.now()
        });

        // Alert for security events
        this.checkSecurityAlert(eventType);
    }

    // User Experience Metrics
    trackErrorRecovery(errorType, recoveryMethod) {
        if (!this.isEnabled) return;

        this.metrics.userExperience.errorRecoveries++;

        this.logEvent('error_recovery', {
            errorType,
            recoveryMethod,
            timestamp: Date.now()
        });
    }

    trackAbandonedSession(stage) {
        if (!this.isEnabled) return;

        this.metrics.userExperience.abandonedSessions++;

        this.logEvent('abandoned_session', {
            stage,
            timestamp: Date.now()
        });
    }

    // Data Sanitization Methods
    sanitizeDomain(domain) {
        // Extract only the main domain, remove subdomains and paths
        try {
            const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
            const parts = url.hostname.split('.');
            if (parts.length >= 2) {
                return parts.slice(-2).join('.');
            }
            return url.hostname;
        } catch {
            return 'unknown';
        }
    }

    sanitizeUserAgent(userAgent) {
        // Extract only browser type and version, remove identifying information
        const browserRegex = /(Chrome|Firefox|Safari|Edge)\/[\d.]+/;
        const match = userAgent.match(browserRegex);
        return match ? match[0] : 'unknown';
    }

    sanitizeErrorMessage(message) {
        // Remove any potential personal data from error messages
        return message
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
            .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip]')
            .replace(/[a-f0-9]{32,}/gi, '[hash]')
            .substring(0, 200); // Limit length
    }

    sanitizeEndpoint(endpoint) {
        // Remove query parameters and IDs from endpoints
        return endpoint.replace(/\/[a-f0-9-]{20,}/gi, '/[id]').split('?')[0];
    }

    sanitizeContext(context) {
        // Remove sensitive data from context objects
        const sanitized = {};
        for (const [key, value] of Object.entries(context)) {
            if (typeof value === 'string' && value.length < 100) {
                sanitized[key] = this.sanitizeErrorMessage(value);
            } else if (typeof value === 'number') {
                sanitized[key] = value;
            } else if (typeof value === 'boolean') {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    // Alert Systems
    checkCriticalError(category, errorType) {
        const criticalErrors = [
            'encryption_failure',
            'api_unavailable',
            'security_breach',
            'data_corruption'
        ];

        if (criticalErrors.includes(errorType)) {
            this.sendAlert('critical_error', {
                category,
                errorType,
                timestamp: Date.now()
            });
        }
    }

    checkSecurityAlert(eventType) {
        const alertThresholds = {
            rapid_generation: 10, // 10 rapid generations
            failed_decryption: 5,  // 5 failed decryptions
            suspicious_activity: 3 // 3 suspicious activities
        };

        const count = this.metrics.security[eventType.replace('_', '') + 's'] || 0;
        const threshold = alertThresholds[eventType];

        if (threshold && count >= threshold) {
            this.sendAlert('security_threshold', {
                eventType,
                count,
                threshold,
                timestamp: Date.now()
            });
        }
    }

    sendAlert(alertType, data) {
        // In a real implementation, this would send alerts to monitoring system
        console.warn(`SecureShare Alert [${alertType}]:`, data);

        // Store alert for dashboard
        this.logEvent('alert', {
            alertType,
            data,
            timestamp: Date.now()
        });
    }

    // Metrics Calculation
    getSuccessRates() {
        return {
            qrGeneration: this.calculateSuccessRate(
                this.metrics.qrGeneration.successes,
                this.metrics.qrGeneration.attempts
            ),
            mobileProcessing: this.calculateSuccessRate(
                this.metrics.mobileProcessing.successes,
                this.metrics.mobileProcessing.attempts
            ),
            sessionTransfer: this.calculateSuccessRate(
                this.metrics.sessionTransfer.successes,
                this.metrics.sessionTransfer.attempts
            )
        };
    }

    calculateSuccessRate(successes, attempts) {
        return attempts > 0 ? Math.round((successes / attempts) * 100) : 0;
    }

    getPerformanceMetrics() {
        return {
            avgQRGenerationTime: this.metrics.qrGeneration.avgTime,
            avgMobileProcessingTime: this.metrics.mobileProcessing.avgTime,
            avgSessionTransferTime: this.metrics.sessionTransfer.avgTime,
            avgAPIResponseTime: this.calculateAverageAPIResponseTime()
        };
    }

    calculateAverageAPIResponseTime() {
        const times = this.metrics.performance.apiResponseTimes;
        if (times.length === 0) return 0;

        const total = times.reduce((sum, item) => sum + item.duration, 0);
        return Math.round(total / times.length);
    }

    getTopWebsites(limit = 10) {
        const websites = Object.entries(this.metrics.userExperience.commonWebsites)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit);

        return websites.map(([domain, count]) => ({ domain, count }));
    }

    // Data Persistence
    async loadMetrics() {
        try {
            const stored = await chrome.storage.local.get(['analytics_metrics']);
            if (stored.analytics_metrics) {
                this.metrics = { ...this.metrics, ...stored.analytics_metrics };
            }
        } catch (error) {
            console.warn('Failed to load analytics metrics:', error);
        }
    }

    async saveMetrics() {
        try {
            await chrome.storage.local.set({
                analytics_metrics: this.metrics,
                analytics_last_save: Date.now()
            });
        } catch (error) {
            console.warn('Failed to save analytics metrics:', error);
        }
    }

    cleanupOldData() {
        // Remove performance data older than 24 hours
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

        this.metrics.performance.apiResponseTimes = this.metrics.performance.apiResponseTimes
            .filter(item => item.timestamp > oneDayAgo);

        this.metrics.performance.qrGenerationTimes = this.metrics.performance.qrGenerationTimes
            .filter(time => time > oneDayAgo);

        this.metrics.performance.mobileLoadTimes = this.metrics.performance.mobileLoadTimes
            .filter(time => time > oneDayAgo);
    }

    // Event Logging
    logEvent(eventType, data) {
        if (!this.isEnabled) return;

        // In development, log to console
        if (process.env.NODE_ENV === 'development') {
            console.log(`Analytics [${eventType}]:`, data);
        }

        // Store recent events for dashboard
        this.storeRecentEvent(eventType, data);
    }

    async storeRecentEvent(eventType, data) {
        try {
            const stored = await chrome.storage.local.get(['analytics_recent_events']);
            let recentEvents = stored.analytics_recent_events || [];

            recentEvents.push({
                eventType,
                data,
                timestamp: Date.now()
            });

            // Keep only last 100 events
            if (recentEvents.length > 100) {
                recentEvents = recentEvents.slice(-100);
            }

            await chrome.storage.local.set({ analytics_recent_events: recentEvents });
        } catch (error) {
            console.warn('Failed to store recent event:', error);
        }
    }

    // Public API
    getMetricsSummary() {
        return {
            successRates: this.getSuccessRates(),
            performance: this.getPerformanceMetrics(),
            topWebsites: this.getTopWebsites(),
            errorCounts: Object.keys(this.metrics.errors).length,
            securityEvents: this.metrics.security,
            userExperience: {
                errorRecoveries: this.metrics.userExperience.errorRecoveries,
                abandonedSessions: this.metrics.userExperience.abandonedSessions
            }
        };
    }

    // Privacy Controls
    enableAnalytics() {
        this.isEnabled = true;
        this.logEvent('analytics_enabled', { timestamp: Date.now() });
    }

    disableAnalytics() {
        this.isEnabled = false;
        this.logEvent('analytics_disabled', { timestamp: Date.now() });
    }

    async clearAllData() {
        this.metrics = {
            qrGeneration: { attempts: 0, successes: 0, failures: 0, avgTime: 0, totalTime: 0 },
            mobileProcessing: { attempts: 0, successes: 0, failures: 0, avgTime: 0, totalTime: 0 },
            sessionTransfer: { attempts: 0, successes: 0, avgTime: 0, totalTime: 0 },
            errors: {},
            performance: { apiResponseTimes: [], qrGenerationTimes: [], mobileLoadTimes: [] },
            security: { suspiciousActivities: 0, failedDecryptions: 0, expiredLinkAccess: 0, rapidGenerations: 0 },
            userExperience: { commonWebsites: {}, errorRecoveries: 0, abandonedSessions: 0 }
        };

        await chrome.storage.local.remove(['analytics_metrics', 'analytics_recent_events']);
        this.logEvent('analytics_data_cleared', { timestamp: Date.now() });
    }

    // Legacy compatibility methods for existing code
    trackEvent(category, action, label) {
        this.trackError(category, action, label);
    }

    trackPageView(page) {
        this.logEvent('page_view', { page, timestamp: Date.now() });
    }
}

// Global analytics instance
window.SecureShareAnalytics = SecureShareAnalytics;

// Auto-initialize if in extension context
if (typeof chrome !== 'undefined' && chrome.runtime) {
    window.analytics = new SecureShareAnalytics();
} else {
    // Fallback for non-extension contexts
    window.analytics = {
        trackEvent: () => {},
        trackPageView: () => {},
        trackQRGenerationStart: () => {},
        trackQRGenerationSuccess: () => {},
        trackQRGenerationFailure: () => {},
        trackMobileProcessingStart: () => {},
        trackMobileProcessingSuccess: () => {},
        trackMobileProcessingFailure: () => {},
        trackSessionTransferStart: () => {},
        trackSessionTransferSuccess: () => {},
        trackError: () => {},
        trackAPIResponseTime: () => {},
        trackSecurityEvent: () => {},
        trackErrorRecovery: () => {},
        trackAbandonedSession: () => {},
        getMetricsSummary: () => ({}),
        enableAnalytics: () => {},
        disableAnalytics: () => {},
        clearAllData: () => {}
    };
}
