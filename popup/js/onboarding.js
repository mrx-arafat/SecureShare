/**
 * Onboarding System for SecureShare Mobile Session Sharing
 * Provides guided introduction to new features
 */

class OnboardingSystem {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.hasSeenOnboarding = false;
        
        this.steps = [
            {
                id: 'welcome',
                title: '🎉 Welcome to Mobile Session Sharing!',
                content: 'SecureShare now lets you share your login sessions to mobile devices via QR codes - no passwords needed!',
                target: null,
                position: 'center'
            },
            {
                id: 'session-detection',
                title: '🔍 Automatic Session Detection',
                content: 'We automatically detect when you\'re logged into a website and show session details.',
                target: '#session-preview',
                position: 'bottom'
            },
            {
                id: 'qr-generation',
                title: '📱 Generate QR Code',
                content: 'Click this button to generate a secure QR code that you can scan with your mobile device.',
                target: '#js-generate-qr-share',
                position: 'top'
            },
            {
                id: 'mobile-scanning',
                title: '📲 Scan with Mobile',
                content: 'Scan the QR code with your mobile device to instantly log in to the same account.',
                target: '#js-qr-canvas-share',
                position: 'bottom'
            },
            {
                id: 'security',
                title: '🔐 Security & Privacy',
                content: 'Your sessions are encrypted and expire after 30 minutes. Your password never leaves your device.',
                target: null,
                position: 'center'
            },
            {
                id: 'complete',
                title: '✅ You\'re All Set!',
                content: 'Try generating a QR code now. You can always access help from the menu.',
                target: null,
                position: 'center'
            }
        ];
        
        this.init();
    }

    async init() {
        // Check if user has seen onboarding
        try {
            const stored = await chrome.storage.local.get(['onboarding_completed', 'onboarding_version']);
            this.hasSeenOnboarding = stored.onboarding_completed && stored.onboarding_version === '1.3.0';
        } catch (error) {
            console.warn('Failed to load onboarding state:', error);
        }

        // Create onboarding overlay
        this.createOverlay();
        
        console.log('🎓 Onboarding system initialized');
    }

    createOverlay() {
        // Remove existing overlay
        const existing = document.getElementById('onboarding-overlay');
        if (existing) {
            existing.remove();
        }

        // Create overlay HTML
        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.className = 'onboarding-overlay hidden';
        overlay.innerHTML = `
            <div class="onboarding-backdrop"></div>
            <div class="onboarding-tooltip">
                <div class="onboarding-header">
                    <h3 class="onboarding-title"></h3>
                    <button class="onboarding-close" aria-label="Close onboarding">×</button>
                </div>
                <div class="onboarding-content"></div>
                <div class="onboarding-footer">
                    <div class="onboarding-progress">
                        <span class="onboarding-step-counter"></span>
                        <div class="onboarding-progress-bar">
                            <div class="onboarding-progress-fill"></div>
                        </div>
                    </div>
                    <div class="onboarding-buttons">
                        <button class="onboarding-btn onboarding-skip">Skip Tour</button>
                        <button class="onboarding-btn onboarding-prev" disabled>Previous</button>
                        <button class="onboarding-btn onboarding-next primary">Next</button>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                pointer-events: none;
            }
            
            .onboarding-overlay.active {
                pointer-events: all;
            }
            
            .onboarding-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .onboarding-overlay.active .onboarding-backdrop {
                opacity: 1;
            }
            
            .onboarding-tooltip {
                position: absolute;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                max-width: 320px;
                min-width: 280px;
                opacity: 0;
                transform: scale(0.8);
                transition: all 0.3s ease;
                z-index: 10001;
            }
            
            .onboarding-overlay.active .onboarding-tooltip {
                opacity: 1;
                transform: scale(1);
            }
            
            .onboarding-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 20px 0 20px;
            }
            
            .onboarding-title {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
            
            .onboarding-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #666;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .onboarding-close:hover {
                color: #333;
            }
            
            .onboarding-content {
                padding: 15px 20px;
                color: #555;
                line-height: 1.5;
            }
            
            .onboarding-footer {
                padding: 0 20px 20px 20px;
                border-top: 1px solid #eee;
                margin-top: 10px;
                padding-top: 15px;
            }
            
            .onboarding-progress {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .onboarding-step-counter {
                font-size: 12px;
                color: #666;
                white-space: nowrap;
            }
            
            .onboarding-progress-bar {
                flex: 1;
                height: 4px;
                background: #eee;
                border-radius: 2px;
                overflow: hidden;
            }
            
            .onboarding-progress-fill {
                height: 100%;
                background: #667eea;
                border-radius: 2px;
                transition: width 0.3s ease;
            }
            
            .onboarding-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            .onboarding-btn {
                padding: 8px 16px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: white;
                color: #333;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .onboarding-btn:hover:not(:disabled) {
                background: #f5f5f5;
            }
            
            .onboarding-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .onboarding-btn.primary {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }
            
            .onboarding-btn.primary:hover:not(:disabled) {
                background: #5a6fd8;
            }
            
            .onboarding-skip {
                margin-right: auto;
            }
            
            .onboarding-highlight {
                position: relative;
                z-index: 10002;
                box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.3);
                border-radius: 8px;
            }
            
            .hidden {
                display: none !important;
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(overlay);

        // Attach event listeners
        this.attachEventListeners();
    }

    attachEventListeners() {
        const overlay = document.getElementById('onboarding-overlay');
        
        // Close button
        overlay.querySelector('.onboarding-close').addEventListener('click', () => {
            this.close();
        });
        
        // Skip button
        overlay.querySelector('.onboarding-skip').addEventListener('click', () => {
            this.complete();
        });
        
        // Previous button
        overlay.querySelector('.onboarding-prev').addEventListener('click', () => {
            this.previousStep();
        });
        
        // Next button
        overlay.querySelector('.onboarding-next').addEventListener('click', () => {
            this.nextStep();
        });
        
        // Backdrop click
        overlay.querySelector('.onboarding-backdrop').addEventListener('click', () => {
            this.close();
        });
    }

    shouldShowOnboarding() {
        return !this.hasSeenOnboarding;
    }

    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentStep = 0;
        
        const overlay = document.getElementById('onboarding-overlay');
        overlay.classList.remove('hidden');
        
        setTimeout(() => {
            overlay.classList.add('active');
            this.showStep(0);
        }, 100);
        
        // Track onboarding start
        if (window.analytics) {
            window.analytics.logEvent('onboarding_started', { timestamp: Date.now() });
        }
    }

    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        
        // Update content
        const overlay = document.getElementById('onboarding-overlay');
        overlay.querySelector('.onboarding-title').textContent = step.title;
        overlay.querySelector('.onboarding-content').textContent = step.content;
        
        // Update progress
        const progress = ((stepIndex + 1) / this.steps.length) * 100;
        overlay.querySelector('.onboarding-progress-fill').style.width = `${progress}%`;
        overlay.querySelector('.onboarding-step-counter').textContent = `Step ${stepIndex + 1} of ${this.steps.length}`;
        
        // Update buttons
        const prevBtn = overlay.querySelector('.onboarding-prev');
        const nextBtn = overlay.querySelector('.onboarding-next');
        
        prevBtn.disabled = stepIndex === 0;
        
        if (stepIndex === this.steps.length - 1) {
            nextBtn.textContent = 'Finish';
        } else {
            nextBtn.textContent = 'Next';
        }
        
        // Position tooltip
        this.positionTooltip(step);
        
        // Highlight target element
        this.highlightTarget(step.target);
    }

    positionTooltip(step) {
        const tooltip = document.querySelector('.onboarding-tooltip');
        const overlay = document.getElementById('onboarding-overlay');
        
        if (step.target && step.position !== 'center') {
            const target = document.querySelector(step.target);
            if (target) {
                const rect = target.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                
                let top, left;
                
                switch (step.position) {
                    case 'top':
                        top = rect.top - tooltipRect.height - 20;
                        left = rect.left + (rect.width - tooltipRect.width) / 2;
                        break;
                    case 'bottom':
                        top = rect.bottom + 20;
                        left = rect.left + (rect.width - tooltipRect.width) / 2;
                        break;
                    case 'left':
                        top = rect.top + (rect.height - tooltipRect.height) / 2;
                        left = rect.left - tooltipRect.width - 20;
                        break;
                    case 'right':
                        top = rect.top + (rect.height - tooltipRect.height) / 2;
                        left = rect.right + 20;
                        break;
                }
                
                // Ensure tooltip stays within viewport
                top = Math.max(20, Math.min(top, window.innerHeight - tooltipRect.height - 20));
                left = Math.max(20, Math.min(left, window.innerWidth - tooltipRect.width - 20));
                
                tooltip.style.top = `${top}px`;
                tooltip.style.left = `${left}px`;
                return;
            }
        }
        
        // Center position (default)
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%) scale(1)';
    }

    highlightTarget(selector) {
        // Remove previous highlights
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });
        
        if (selector) {
            const target = document.querySelector(selector);
            if (target) {
                target.classList.add('onboarding-highlight');
            }
        }
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    close() {
        if (!this.isActive) return;
        
        const overlay = document.getElementById('onboarding-overlay');
        overlay.classList.remove('active');
        
        setTimeout(() => {
            overlay.classList.add('hidden');
            this.cleanup();
        }, 300);
        
        this.isActive = false;
        
        // Track onboarding closed
        if (window.analytics) {
            window.analytics.logEvent('onboarding_closed', { 
                step: this.currentStep,
                completed: false,
                timestamp: Date.now() 
            });
        }
    }

    async complete() {
        // Mark onboarding as completed
        try {
            await chrome.storage.local.set({
                onboarding_completed: true,
                onboarding_version: '1.3.0',
                onboarding_completed_at: Date.now()
            });
            this.hasSeenOnboarding = true;
        } catch (error) {
            console.warn('Failed to save onboarding completion:', error);
        }
        
        // Track onboarding completion
        if (window.analytics) {
            window.analytics.logEvent('onboarding_completed', { 
                totalSteps: this.steps.length,
                timestamp: Date.now() 
            });
        }
        
        this.close();
    }

    cleanup() {
        // Remove highlights
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });
    }

    // Public API
    restart() {
        this.hasSeenOnboarding = false;
        this.start();
    }

    isCompleted() {
        return this.hasSeenOnboarding;
    }
}

// Global onboarding instance
window.OnboardingSystem = OnboardingSystem;

// Auto-initialize
if (typeof window !== 'undefined') {
    window.onboardingSystem = new OnboardingSystem();
}
