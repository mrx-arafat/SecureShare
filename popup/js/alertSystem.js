/**
 * SecureShare Alert System
 * Monitors critical events and sends notifications
 */

class AlertSystem {
    constructor(analytics) {
        this.analytics = analytics;
        this.alertThresholds = {
            errorRate: 10, // 10% error rate
            responseTime: 5000, // 5 seconds
            securityEvents: 5, // 5 security events per hour
            failureStreak: 3, // 3 consecutive failures
            rapidGeneration: 20 // 20 generations per minute
        };
        
        this.alertHistory = [];
        this.lastAlertTimes = {};
        this.cooldownPeriod = 300000; // 5 minutes cooldown
        
        this.init();
    }

    init() {
        // Load alert history
        this.loadAlertHistory();
        
        // Set up monitoring intervals
        this.startMonitoring();
        
        console.log('Alert System initialized');
    }

    startMonitoring() {
        // Monitor every minute
        setInterval(() => {
            this.checkAllThresholds();
        }, 60000);

        // Monitor security events more frequently
        setInterval(() => {
            this.checkSecurityThresholds();
        }, 30000);
    }

    checkAllThresholds() {
        if (!this.analytics || !this.analytics.metrics) return;

        const metrics = this.analytics.metrics;
        
        // Check error rates
        this.checkErrorRate(metrics);
        
        // Check response times
        this.checkResponseTimes(metrics);
        
        // Check failure streaks
        this.checkFailureStreaks(metrics);
        
        // Check rapid generation
        this.checkRapidGeneration(metrics);
    }

    checkErrorRate(metrics) {
        const qrErrorRate = this.calculateErrorRate(
            metrics.qrGeneration.failures,
            metrics.qrGeneration.attempts
        );
        
        const mobileErrorRate = this.calculateErrorRate(
            metrics.mobileProcessing.failures,
            metrics.mobileProcessing.attempts
        );

        if (qrErrorRate > this.alertThresholds.errorRate) {
            this.sendAlert('high_error_rate', {
                type: 'QR Generation',
                errorRate: qrErrorRate,
                threshold: this.alertThresholds.errorRate,
                failures: metrics.qrGeneration.failures,
                attempts: metrics.qrGeneration.attempts
            }, 'warning');
        }

        if (mobileErrorRate > this.alertThresholds.errorRate) {
            this.sendAlert('high_error_rate', {
                type: 'Mobile Processing',
                errorRate: mobileErrorRate,
                threshold: this.alertThresholds.errorRate,
                failures: metrics.mobileProcessing.failures,
                attempts: metrics.mobileProcessing.attempts
            }, 'warning');
        }
    }

    checkResponseTimes(metrics) {
        const avgQRTime = metrics.qrGeneration.avgTime;
        const avgMobileTime = metrics.mobileProcessing.avgTime;
        const avgTransferTime = metrics.sessionTransfer.avgTime;

        if (avgQRTime > this.alertThresholds.responseTime) {
            this.sendAlert('slow_response_time', {
                type: 'QR Generation',
                avgTime: avgQRTime,
                threshold: this.alertThresholds.responseTime
            }, 'warning');
        }

        if (avgMobileTime > this.alertThresholds.responseTime) {
            this.sendAlert('slow_response_time', {
                type: 'Mobile Processing',
                avgTime: avgMobileTime,
                threshold: this.alertThresholds.responseTime
            }, 'warning');
        }

        if (avgTransferTime > this.alertThresholds.responseTime * 2) {
            this.sendAlert('slow_response_time', {
                type: 'Session Transfer',
                avgTime: avgTransferTime,
                threshold: this.alertThresholds.responseTime * 2
            }, 'critical');
        }
    }

    checkSecurityThresholds() {
        if (!this.analytics || !this.analytics.metrics) return;

        const security = this.analytics.metrics.security;
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        // Check for rapid security events
        const recentSecurityEvents = this.countRecentEvents('security_event', oneHourAgo);
        
        if (recentSecurityEvents > this.alertThresholds.securityEvents) {
            this.sendAlert('security_threshold_exceeded', {
                recentEvents: recentSecurityEvents,
                threshold: this.alertThresholds.securityEvents,
                timeWindow: '1 hour'
            }, 'critical');
        }

        // Check specific security metrics
        if (security.failedDecryptions > 10) {
            this.sendAlert('multiple_decryption_failures', {
                count: security.failedDecryptions,
                threshold: 10
            }, 'critical');
        }

        if (security.rapidGenerations > 50) {
            this.sendAlert('excessive_rapid_generation', {
                count: security.rapidGenerations,
                threshold: 50
            }, 'warning');
        }
    }

    checkFailureStreaks(metrics) {
        // This would require tracking consecutive failures
        // For now, we'll check if failure rate is very high recently
        const recentFailures = this.countRecentEvents('error', Date.now() - 300000); // 5 minutes
        
        if (recentFailures >= this.alertThresholds.failureStreak) {
            this.sendAlert('failure_streak', {
                consecutiveFailures: recentFailures,
                threshold: this.alertThresholds.failureStreak,
                timeWindow: '5 minutes'
            }, 'critical');
        }
    }

    checkRapidGeneration(metrics) {
        const oneMinuteAgo = Date.now() - (60 * 1000);
        const recentGenerations = this.countRecentEvents('qr_generation_start', oneMinuteAgo);
        
        if (recentGenerations > this.alertThresholds.rapidGeneration) {
            this.sendAlert('rapid_generation_detected', {
                generationsPerMinute: recentGenerations,
                threshold: this.alertThresholds.rapidGeneration
            }, 'warning');
            
            // Also track this as a security event
            this.analytics.trackSecurityEvent('rapid_generation', {
                count: recentGenerations,
                timeWindow: '1 minute'
            });
        }
    }

    calculateErrorRate(failures, attempts) {
        return attempts > 0 ? Math.round((failures / attempts) * 100) : 0;
    }

    countRecentEvents(eventType, since) {
        if (!this.analytics || !this.analytics.recentEvents) return 0;
        
        return this.analytics.recentEvents.filter(event => 
            event.eventType === eventType && event.timestamp > since
        ).length;
    }

    sendAlert(alertType, data, severity = 'info') {
        // Check cooldown
        const lastAlertTime = this.lastAlertTimes[alertType];
        if (lastAlertTime && Date.now() - lastAlertTime < this.cooldownPeriod) {
            return; // Skip alert due to cooldown
        }

        const alert = {
            id: this.generateAlertId(),
            type: alertType,
            severity,
            data,
            timestamp: Date.now(),
            acknowledged: false
        };

        // Store alert
        this.alertHistory.push(alert);
        this.lastAlertTimes[alertType] = Date.now();

        // Send notification
        this.sendNotification(alert);

        // Log to analytics
        if (this.analytics) {
            this.analytics.logEvent('alert_sent', {
                alertType,
                severity,
                data: this.sanitizeAlertData(data)
            });
        }

        // Save to storage
        this.saveAlertHistory();

        console.warn(`SecureShare Alert [${severity.toUpperCase()}]:`, alert);
    }

    sendNotification(alert) {
        const message = this.formatAlertMessage(alert);
        
        // Try to send browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('SecureShare Alert', {
                body: message,
                icon: '/icons/icon-48.png',
                tag: alert.type
            });
        }
        
        // Try to send Chrome extension notification
        if (typeof chrome !== 'undefined' && chrome.notifications) {
            chrome.notifications.create(alert.id, {
                type: 'basic',
                iconUrl: '/icons/icon-48.png',
                title: 'SecureShare Alert',
                message: message,
                priority: alert.severity === 'critical' ? 2 : 1
            });
        }

        // Console notification for development
        const consoleMethod = alert.severity === 'critical' ? 'error' : 
                             alert.severity === 'warning' ? 'warn' : 'info';
        console[consoleMethod]('SecureShare Alert:', message);
    }

    formatAlertMessage(alert) {
        const messages = {
            high_error_rate: `High error rate detected: ${alert.data.errorRate}% for ${alert.data.type}`,
            slow_response_time: `Slow response time: ${alert.data.avgTime}ms for ${alert.data.type}`,
            security_threshold_exceeded: `Security threshold exceeded: ${alert.data.recentEvents} events in ${alert.data.timeWindow}`,
            multiple_decryption_failures: `Multiple decryption failures: ${alert.data.count} failures detected`,
            excessive_rapid_generation: `Excessive rapid generation: ${alert.data.count} rapid generations`,
            failure_streak: `Failure streak detected: ${alert.data.consecutiveFailures} failures in ${alert.data.timeWindow}`,
            rapid_generation_detected: `Rapid generation detected: ${alert.data.generationsPerMinute} generations per minute`
        };

        return messages[alert.type] || `Alert: ${alert.type}`;
    }

    generateAlertId() {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    sanitizeAlertData(data) {
        // Remove sensitive information from alert data
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'number' || typeof value === 'string' && value.length < 100) {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    // Alert Management
    acknowledgeAlert(alertId) {
        const alert = this.alertHistory.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = Date.now();
            this.saveAlertHistory();
        }
    }

    getUnacknowledgedAlerts() {
        return this.alertHistory.filter(alert => !alert.acknowledged);
    }

    getRecentAlerts(hours = 24) {
        const since = Date.now() - (hours * 60 * 60 * 1000);
        return this.alertHistory.filter(alert => alert.timestamp > since);
    }

    clearOldAlerts(days = 7) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > cutoff);
        this.saveAlertHistory();
    }

    // Configuration
    updateThreshold(metric, value) {
        if (this.alertThresholds.hasOwnProperty(metric)) {
            this.alertThresholds[metric] = value;
            this.saveConfiguration();
        }
    }

    getThresholds() {
        return { ...this.alertThresholds };
    }

    // Data Persistence
    async loadAlertHistory() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const stored = await chrome.storage.local.get(['alert_history', 'alert_thresholds']);
                
                if (stored.alert_history) {
                    this.alertHistory = stored.alert_history;
                }
                
                if (stored.alert_thresholds) {
                    this.alertThresholds = { ...this.alertThresholds, ...stored.alert_thresholds };
                }
            }
        } catch (error) {
            console.warn('Failed to load alert history:', error);
        }
    }

    async saveAlertHistory() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({
                    alert_history: this.alertHistory.slice(-100), // Keep last 100 alerts
                    alert_last_save: Date.now()
                });
            }
        } catch (error) {
            console.warn('Failed to save alert history:', error);
        }
    }

    async saveConfiguration() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({
                    alert_thresholds: this.alertThresholds
                });
            }
        } catch (error) {
            console.warn('Failed to save alert configuration:', error);
        }
    }

    // Public API
    getAlertSummary() {
        const recent = this.getRecentAlerts(24);
        const unacknowledged = this.getUnacknowledgedAlerts();
        
        return {
            totalAlerts: this.alertHistory.length,
            recentAlerts: recent.length,
            unacknowledgedAlerts: unacknowledged.length,
            criticalAlerts: recent.filter(a => a.severity === 'critical').length,
            warningAlerts: recent.filter(a => a.severity === 'warning').length,
            lastAlert: this.alertHistory.length > 0 ? this.alertHistory[this.alertHistory.length - 1] : null
        };
    }

    // Request notification permission
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }
}

// Global alert system instance
window.AlertSystem = AlertSystem;

// Auto-initialize if analytics is available
if (typeof window !== 'undefined' && window.analytics) {
    window.alertSystem = new AlertSystem(window.analytics);
}
