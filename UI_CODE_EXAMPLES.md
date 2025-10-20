# SecureShare UI - Code Examples Reference

## Key HTML Patterns

### Template-Based Rendering
```html
<!-- Template Definition -->
<template id="js-template-menu">
  <div class="menu">
    <!-- Content -->
  </div>
</template>

<!-- Rendering Container -->
<div id="app" class="app"></div>
```

### Form Input Patterns
```html
<!-- Text Input with Label and Help -->
<div class="recipient-input-group">
  <div class="input-header">
    <label for="recipient-code" class="input-label">
      <svg width="16" height="16"><!-- icon --></svg>
      Recipient's Device Code
    </label>
    <span class="help-tooltip" data-tooltip="Helper text">
      <svg><!-- help icon --></svg>
    </span>
  </div>
  <input type="text" id="recipient-code" name="pubkey" 
         class="share-input" placeholder="..." required />
</div>
```

### Copy-to-Clipboard Pattern
```html
<div class="result-data-wrapper">
  <pre id="js-shared-session-text" class="result-data">data</pre>
  <button type="button" class="copy-btn" 
          data-clipboard 
          data-clipboard-target="#js-shared-session-text">
    <svg><!-- copy icon --></svg>
    Copy
  </button>
</div>
```

### Step-Based Form Layout
```html
<div class="share-card">
  <div class="share-card-header">
    <div class="step-number">1</div>
    <div>
      <h3 class="share-card-title">Step Title</h3>
      <p class="share-card-description">Description</p>
    </div>
  </div>
  <!-- Step content -->
</div>
```

### Info Card Pattern
```html
<div class="session-info-card">
  <div class="session-info-icon">
    <svg><!-- icon --></svg>
  </div>
  <div class="session-info-content">
    <div class="session-info-label">Label</div>
    <div class="session-info-title">{{=data.title}}</div>
    <div class="session-info-url">{{=data.url}}</div>
  </div>
</div>
```

## Key JavaScript Patterns

### Template Rendering
```javascript
template.render('share', {
  tab: { title: 'Website', url: 'https://example.com' },
  publicKey: 'key...'
});
```

### Event Attachment
```javascript
// Generic event delegation
addEventListener('[data-menu]', 'click', function(event) {
  let menu = event.currentTarget.dataset.menu
  fullRender(menu)
});

// Specific element events
addEventListener('#js-share-session', 'submit', function(event) {
  // Handle form submission
});

// Multiple event types
addEventListener('[name="timeout"]', 'keyup', handler);
addEventListener('[name="timeout"]', 'input', handler);
addEventListener('[name="timeout"]', 'change', handler);
```

### Form Element Access
```javascript
function getFormElement(form, name) {
  return form.querySelector(`[name="${name}"]`);
}

// Usage
let publicKey = getFormElement(this, 'pubkey').value
let timeout = getFormElement(this, 'timeout').value
```

### DOM Manipulation
```javascript
// Show/Hide elements
show('js-shared-session')   // Removes 'hidden' class
hide('js-shared-session')   // Adds 'hidden' class

// Get elements
getElementById('js-expires-on')
document.querySelector('button[name="submit"]')

// Update content
getElementById('js-shared-session-text').innerHTML = encryptedData
```

### Real-Time Input Validation
```javascript
this.onTextSubmitted('[name="pubkey"]', function(textarea) {
  const submitButton = document.querySelector('button[name="submit"]')
  
  try {
    let obj = JSON.parse(textarea.value)
    // Validation logic
    submitButton.disabled = false
  } catch (e) {
    submitButton.disabled = true
  }
});
```

### Async Operations
```javascript
addEventListener('#js-generate-qr-share', 'click', async function(event) {
  show('js-qr-loading')
  
  try {
    // Async operation
    await generateQRCode();
    show('js-qr-result')
  } catch (e) {
    showError('Error message')
  } finally {
    hide('js-qr-loading')
  }
});
```

## Key CSS Patterns

### Design System Variables
```css
:root {
  /* Colors */
  --primary-color: #ef4444;
  --secondary-color: #6366f1;
  
  /* Spacing */
  --space-md: 1rem;
  --space-lg: 1.5rem;
  
  /* Shadows */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-normal: all 0.3s ease;
}
```

### Button Styles
```css
.btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  border: var(--glass-border);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
  cursor: pointer;
}

.btn:hover {
  background: var(--glass-bg);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary {
  background: var(--primary-gradient);
  border: 1px solid var(--primary-color);
}

.btn-primary:hover {
  box-shadow: var(--shadow-glow);
}
```

### Input Styles
```css
.share-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: var(--border-primary);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  font-family: 'JetBrains Mono', monospace;
  transition: var(--transition-normal);
}

.share-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.share-input::placeholder {
  color: var(--text-muted);
}
```

### Card Layouts
```css
.share-card {
  background: var(--bg-card);
  border: var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  backdrop-filter: var(--glass-backdrop);
  -webkit-backdrop-filter: var(--glass-backdrop);
}

.share-card-header {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--primary-color);
  border-radius: 50%;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}
```

### Animation Patterns
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal {
  animation: slideIn 0.3s ease-out;
}

/* Spinner animation */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid var(--bg-tertiary);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### Responsive Patterns
```css
/* Mobile First */
.menu-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Tablet */
@media (max-width: 768px) {
  .menu-actions {
    grid-template-columns: 1fr;
  }
}

/* Remove hover on touch devices */
@media (hover: none) {
  .btn:hover {
    transform: none;
  }
}

/* High DPI screens */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .btn {
    border-width: 0.5px;
  }
}
```

### Utility Classes
```css
/* Margin utilities */
.m-t { margin-top: var(--space-md); }
.m-b { margin-bottom: var(--space-md); }
.m-l { margin-left: var(--space-md); }
.m-r { margin-right: var(--space-md); }
.m-t-sm { margin-top: var(--space-sm); }

/* Padding utilities */
.p-md { padding: var(--space-md); }
.p-lg { padding: var(--space-lg); }

/* Text utilities */
.text-center { text-align: center; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }

/* Display utilities */
.hidden { display: none; }
.flex-center { display: flex; align-items: center; justify-content: center; }
```

## Color Reference

### Primary Palette
- Primary: `#ef4444` (Red)
- Primary Hover: `#dc2626`
- Primary Light: `#fca5a5`
- Primary Dark: `#b91c1c`
- Primary Gradient: `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`

### Semantic Colors
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)
- Secondary: `#6366f1` (Indigo)

### Dark Theme
- Background Primary: `#0f0f23`
- Background Secondary: `#1a1a2e`
- Background Tertiary: `#16213e`
- Text Primary: `#ffffff`
- Text Secondary: `#a1a1aa`
- Text Muted: `#71717a`

## Icon Patterns

### Inline SVG Pattern
```html
<button class="btn">
  <svg width="16" height="16" viewBox="0 0 24 24" 
       fill="none" stroke="currentColor" stroke-width="2">
    <path d="..."/>
  </svg>
  <span>Button Text</span>
</button>
```

### Emoji Icon Pattern
```html
<button class="btn">
  <span class="btn-icon">🔐</span>
  <span class="btn-text">Share Session</span>
</button>
```

### Image Icon Pattern
```html
<button type="button" class="code-action-btn">
  <img src="./images/github.svg" alt="GitHub" width="16" />
</button>
```

## Accessibility Patterns

### Semantic Form Structure
```html
<form id="js-share-session" class="share-form">
  <fieldset>
    <legend>Share Session</legend>
    
    <div class="form-group">
      <label for="recipient-code">Recipient Code</label>
      <input type="text" id="recipient-code" name="pubkey" 
             aria-label="Recipient's device code" required />
      <small id="recipient-help">Get this from the recipient</small>
    </div>
  </fieldset>
</form>
```

### ARIA Labels
```html
<span class="help-tooltip" 
      data-tooltip="Helper text description"
      role="tooltip" 
      aria-label="Additional help information">
  <svg><!-- icon --></svg>
</span>
```

### Keyboard Navigation
```css
/* Focus styles */
.btn:focus,
.share-input:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Skip to content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Layout Patterns

### Flex Container
```css
.menu-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  width: 100%;
}

.session-info-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  flex: 1;
}
```

### Grid Layouts
```css
.qr-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}

.gist-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
```

### Absolute Positioning
```css
.result-close {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
```

