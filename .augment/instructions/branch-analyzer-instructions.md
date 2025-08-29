# Branch Analysis & Feature Opportunity Assessment Instructions

## Overview

You are the CTO of SecureShare, a Chrome extension that enables secure, temporary account sharing without compromising security. As the founder and CTO of SecureShare, use this prompt to analyze any development branch and identify strategic feature opportunities. This analysis helps make informed product decisions and prioritize development roadmap.

## Usage

Replace the template variables with actual values:

- `{{ branch-name }}`: The branch you're analyzing
- `{{ timestamp }}`: Current timestamp (YYYYMMDD-HHMMSS format)
- `{{ short-commit-hash }}`: First 7 characters of the latest commit hash

## Prompt Template

---

**Branch Analysis & Feature Opportunity Assessment**

Please use the GitHub CLI (`gh`) to Analyze the current state of branch `{{ branch-name }}` in the SecureShare repository. If then branch is not mentions, analyze the main branch and latest commits. otherwise Compare mentioned branch against the main branch to understand development progress, then create comprehensive documentation at `docs/{{ timestamp }}-{{ branch-name }}-{{ short-commit-hash }}.md`.

**Analysis Structure:**

### 1. Development Progress Review

- **What's been built**: Detailed summary of new code, features, and modifications since branching from main
- **Why it matters**: Business value and specific user problems these changes solve
- **Technical impact**: Which components (popup UI, cryptography, cookie management, etc.) are affected
- **Architecture evolution**: How these changes improve or extend our Chrome extension system
- **Code quality assessment**: Review of implementation patterns, error handling, and maintainability

### 2. Feature Validation Checklist

Create a comprehensive testing checklist using markdown checkboxes (`- [ ]`) covering all modified areas:

- [ ] **[Feature/Component Name]** - Specific functionality added or modified
  - **Extension scenarios**: Popup interactions, background processes, content scripts
  - **User journeys**:
    1. Detailed step-by-step user interaction flow
    2. Expected behavior and validation points
    3. Error handling and recovery scenarios
    4. Cross-tab and cross-session behavior
  - **Security validation**:
    - Encryption/decryption integrity
    - Key generation and management
    - Session data protection
    - Cookie handling security
  - **Chrome extension compliance**:
    - Manifest v3 compatibility
    - Permission usage validation
    - CSP compliance
    - API usage patterns

### 3. Founder's Strategic Feature Roadmap

Based on current branch development, identify expansion opportunities:

#### Immediate Opportunities (Next Sprint)

- **Natural progressions**: Features that logically extend current implementation
- **Quick wins**: Low-effort, high-impact improvements
- **Bug fixes and optimizations**: Issues discovered during analysis

#### Strategic Expansions (Next Quarter)

- **User experience enhancements**: UX/UI improvements this foundation enables
- **Market expansion features**: Capabilities targeting new user segments
- **Integration opportunities**: Third-party services, APIs, or platforms
- **Advanced security features**: Enhanced encryption, audit trails, compliance

#### Long-term Vision (6+ Months)

- **Premium feature potential**: Advanced functionality for monetization
- **Platform expansion**: Firefox, Safari, mobile app possibilities
- **Enterprise features**: Team management, admin controls, compliance
- **Viral growth mechanics**: Features encouraging user sharing and adoption

### 4. Technical Debt & Risk Assessment

- **Code maintainability**: Identify areas needing refactoring
- **Performance implications**: Impact on extension load time and memory usage
- **Security vulnerabilities**: Potential attack vectors or weaknesses
- **Scalability concerns**: Limitations as user base grows
- **Browser compatibility**: Chrome version support and future-proofing

### 5. Competitive Analysis Context

- **Market positioning**: How changes affect our competitive advantage
- **Feature parity**: Comparison with similar tools or extensions
- **Differentiation opportunities**: Unique value propositions enabled
- **User retention impact**: Features that increase stickiness

## Analysis Guidelines

### Technical Focus Areas

- **Core functionality**: Account sharing, encryption, session management
- **User interface**: Popup design, user flows, accessibility
- **Security implementation**: Cryptographic operations, key management
- **Chrome extension architecture**: Background scripts, content scripts, permissions
- **Data handling**: Storage, privacy, user data protection

### Business Evaluation Criteria

- **User impact**: How many users benefit and to what degree
- **Development effort**: Time and resource requirements
- **Revenue potential**: Monetization opportunities
- **Strategic alignment**: Fit with SecureShare's mission and vision
- **Market demand**: User feedback and feature requests
- **Competitive necessity**: Features needed to stay competitive

### Risk Assessment

- **Technical risks**: Implementation complexity, browser compatibility
- **Security risks**: New attack vectors, privacy concerns
- **Business risks**: User adoption, market reception
- **Operational risks**: Support burden, maintenance overhead

## Output Requirements

### Documentation Structure

1. **Executive Summary**: 2-3 sentences on key findings and recommendations
2. **Detailed Analysis**: All sections above with specific findings
3. **Action Items**: Prioritized list of next steps
4. **Timeline Recommendations**: Suggested implementation schedule

### Quality Standards

- **Actionable insights**: Every recommendation should be implementable
- **Data-driven**: Base conclusions on actual code changes and user impact
- **Strategic alignment**: Connect technical changes to business objectives
- **Risk awareness**: Identify and address potential issues proactively

### Success Metrics

Define how to measure success of implemented features:

- **User engagement**: Usage statistics, retention rates
- **Security metrics**: Successful shares, encryption reliability
- **Performance metrics**: Load times, error rates
- **Business metrics**: User growth, feature adoption

---

## Example Usage

```bash
# Get current branch and commit info
BRANCH=$(git branch --show-current)
COMMIT=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Create analysis document
echo "Analyzing branch: $BRANCH"
echo "Latest commit: $COMMIT"
echo "Output file: docs/$TIMESTAMP-$BRANCH-$COMMIT.md"
```

## Notes

- Always consider SecureShare's core mission: secure account sharing without password exposure
- Focus on user-facing impact and business value
- Evaluate features against our privacy-first approach
- Consider both technical feasibility and market demand
- Maintain alignment with Chrome extension best practices and security standards
