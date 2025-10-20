# SecureShare UI - Quick Start Guide

## Project at a Glance

SecureShare is a Chrome extension built as a single-page application (SPA) with:
- **Modern Dark Theme** with glassmorphism effects
- **Vanilla JavaScript** (no frameworks)
- **Micro-templating** for dynamic rendering
- **Custom CSS** design system
- **Multiple feature modules** for complex functionality

## File Locations

| File | Purpose | Lines |
|------|---------|-------|
| `/popup/index.html` | Main HTML with templates | 850 |
| `/popup/css/styles.css` | All styling | 3,731 |
| `/popup/js/main.js` | Core UI logic | 53,261 |
| `/popup/js/app.js` | Modern alternative | 19,866 |
| `/manifest.json` | Extension config | 37 |

## Quick Navigation Map

```
Main Menu
├── Share Session (encrypt & send)
├── Restore Session (decrypt & apply)
├── Share Current Session (QR code flow)
├── Session History (view past shares)
└── Settings (GitHub integration)
```

## Key Technologies Used

### Libraries
- **_t.min.js**: Micro-templating (renders templates with data)
- **sjcl.min.js**: Encryption/decryption library
- **clipboard.min.js**: Copy to clipboard
- **qrious.min.js**: QR code generation
- **balloon.min.css**: Tooltips

### Design
- **CSS Variables**: 50+ custom properties for theming
- **Glassmorphism**: Backdrop blur + transparency effects
- **Flexbox/Grid**: Modern responsive layouts
- **Animations**: Smooth transitions and keyframe animations

## Color System

Primary Red: `#ef4444` with gradient to `#dc2626`
Dark Backgrounds: `#0f0f23` → `#1a1a2e` → `#16213e`
Accent: Indigo `#6366f1` and Amber `#f59e0b`

## Component Patterns

### Main UI Components
1. **Menu** - Navigation hub with 5 buttons
2. **Share Form** - 2-step encrypted session sharing
3. **Restore Form** - Device code + encrypted data input
4. **QR Share** - Canvas-based QR generation with fallback
5. **History** - List of shared accounts by date
6. **Settings** - GitHub token and gist integration

### Icon System
- **Emoji**: Primary icons (🔐 🔓 📱 📋 ⚙️)
- **Inline SVG**: Action icons (back, copy, refresh, etc.)
- **Asset Images**: Logo and GitHub icon

## Event Handling Pattern

```
User clicks button [data-menu="share"]
    ↓
Template renders with data via _t engine
    ↓
Events attach for that template section
    ↓
Form inputs validated in real-time
    ↓
Submit triggers async operation
    ↓
Success/error state displayed
    ↓
Back button available to return to menu
```

## DOM Structure Essentials

```html
<div id="app" class="app">
  <!-- Template renders here -->
</div>

<!-- Template definitions -->
<template id="js-template-menu">...</template>
<template id="js-template-share">...</template>
<template id="js-template-restore">...</template>
<template id="js-template-qr-share">...</template>
<template id="js-template-history">...</template>
<template id="js-template-settings">...</template>

<!-- Error display (per section) -->
<div id="js-error" class="error hidden"></div>
```

## Form Interaction Flow

1. **Input Phase**: User types/pastes data
2. **Validation Phase**: Real-time JSON validation
3. **Enable Phase**: Submit button enabled when valid
4. **Submit Phase**: Form processes data
5. **Result Phase**: Show encrypted output or error
6. **Action Phase**: Copy, save, or regenerate options

## CSS Organization

```
Top sections:
├── CSS Variables (design tokens)
├── Base Styles (reset, body, app)
├── Utility Classes (.hidden, .flex-center, etc.)
├── Component Styles (buttons, inputs, cards)
├── Animation Keyframes
└── Responsive Media Queries
```

## Module Dependencies

```
main.js (core UI)
├── _t.min.js (templating)
├── clipboard.min.js (copy functionality)
├── qrious.min.js (QR generation)
├── cryptography.js (encryption)
├── configuration.js (storage)
├── github.js (Gist integration)
└── ... (other feature modules)
```

## Common Tasks

### To add a new button:
1. Add to template with `data-menu="name"`
2. Create template `#js-template-name`
3. Add `events['attach-name']` function
4. Style with `.name-*` classes

### To modify colors:
1. Edit CSS variables in `:root {}`
2. Primary color: `--primary-color: #ef4444`
3. Changes apply globally

### To add form validation:
1. Use `addEventListener('[name="field"]', 'input', handler)`
2. Enable/disable submit button based on validation
3. Show error in `#js-error` element

### To add animations:
1. Define `@keyframes` in CSS
2. Apply with `animation: name duration easing`
3. Use CSS variables for consistent timing

## Responsive Design

**Breakpoints:**
- Mobile: <= 480px (primary target)
- Tablet: <= 768px
- Desktop: >= 1024px
- Retina: 2x pixel ratio

**Mobile-First Approach:**
- Base styles for mobile
- Enhance for larger screens
- Touch: no hover effects

## Accessibility Checklist

- Semantic HTML (labels, form groups)
- Keyboard navigation (Tab, Enter)
- Color contrast (WCAG AA)
- Focus states on all inputs
- Reduced motion support
- Proper heading hierarchy

## Performance Notes

- All vendor libraries are minified
- CSS uses efficient selectors
- JavaScript uses event delegation
- No framework overhead
- Chrome Storage API for persistence

## Browser Support

- Chrome (primary)
- Edge (should work)
- Brave (should work)
- Any Chromium-based browser

## Extension Permissions

- `tabs`: Current tab info
- `storage`: Chrome Storage API
- `cookies`: Session cookies
- `notifications`: System alerts

## Testing URLs

Mock data included in index.html for browser testing when:
- `window.chrome.tabs` not available
- `window.chrome.cookies` not available
- Running outside extension context

## Next Steps

1. **To understand styling**: Read `UI_CODE_EXAMPLES.md` CSS section
2. **To modify templates**: See HTML patterns in examples doc
3. **To add features**: Follow event attachment pattern in main.js
4. **To customize colors**: Edit CSS variables in styles.css
5. **To add new module**: Follow existing module pattern in js/ folder

## Related Documentation

- `UI_STRUCTURE_ANALYSIS.md` - Comprehensive architecture
- `UI_CODE_EXAMPLES.md` - Code patterns and examples
- `/manifest.json` - Extension configuration
- `/DEVELOPMENT.md` - Development setup

## Version Info

- Current: v1.3.0
- Last Update: Oct 20, 2025
- Author: Easin Arafat

