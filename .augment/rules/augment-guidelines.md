---
type: "always_apply"
---

# Augmented Development Ruleset (Project-Agnostic)

## 0) Purpose & Scope
This document defines **coding standards, change control, security policies, and delivery practices** for any software project (frontend, backend, services, extensions). It aims to:
- Prevent regressions and security incidents
- Keep changes minimal, reviewable, and reversible
- Enforce consistent structure, tests, and documentation

---

## 1) Critical Change-Control Rules

### 1.1 Never Commit/Push Without Approval
- **ALWAYS** surface changes for stakeholder testing/approval before pushing to shared branches.
- **NEVER** run destructive git operations on shared branches (`git reset --hard`, force-push) without written approval.
- Use PRs with required reviews; protect `main`/`release/*` branches.

### 1.2 Understand Before You Change
- Reproduce the issue; capture logs, inputs, environment.
- Identify root cause (not just symptoms). Document the hypothesis and verification steps.
- Prefer **minimal, targeted** diffs over broad refactors.

### 1.3 Preserve Working Functionality
- New features must **not break** existing flows. Maintain forward/backward compatibility or add feature flags.
- Post-change smoke tests must pass before merge.

---

## 2) Repository Organization

### 2.1 Canonical Structure (adapt per project)


project/
├─ docs/                     # User & developer docs
├─ src/                      # Application code (split by domain/module)
│  ├─ app/                   # App composition/bootstrap
│  ├─ core/                  # Domain logic, pure modules
│  ├─ infra/                 # IO, platform APIs, gateways
│  ├─ ui/                    # Presentation (if applicable)
│  └─ utils/                 # Shared utilities (pure, tested)
├─ test/                     # Unit/integration tests mirror src/
├─ e2e/                      # End-to-end tests & fixtures
├─ scripts/                  # Dev/build/release scripts
├─ tools/                    # One-off tooling; remove when obsolete
├─ configs/                  # Lint, format, CI, app configs
├─ .github/                  # PR templates, workflows (or CI dir)
├─ package.json / pyproject.toml / go.mod … # Package manifest
└─ README.md                 # Quick start, run, test, release

````

> **Temporary or exploratory work**: create a clearly named folder (`/debugging`, `/spikes`, `/experiments`) and **delete** when done.

### 2.2 Naming
- **Files & functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **CSS classes**: `kebab-case`
- **IDs**: `camelCase`
- **Tests**: mirror source path, e.g. `src/core/calc.js` → `test/core/calc.test.js`

---

## 3) Architecture & Code Patterns

### 3.1 Modularity & Boundaries
- Keep **domain logic pure** (no IO) under `src/core`.
- **Infra adapters** (network, storage, OS, browser APIs) live in `src/infra`.
- UI/presentation in `src/ui`; wire modules in `src/app`.

### 3.2 Centralized State (optional for apps/extensions)
```js
export const AppState = {
  data: { busy: false, currentContext: null, history: [] },
  listeners: new Set(),
  update(patch) { Object.assign(this.data, patch); this.listeners.forEach(f=>f(this.data)); },
  reset() { this.data = { busy: false, currentContext: null, history: [] }; this.update({}); }
};
````

### 3.3 Error Handling

* Wrap IO with **typed errors** and **user-safe messages**.
* Fail closed (secure defaults); log context without secrets.

---

## 4) Security Baseline

### 4.1 Secrets & Sensitive Data

* **Never** commit secrets. Use env vars + secret managers.
* Classify data: **Public / Internal / Sensitive / Secret**; store Sensitive/Secret **encrypted at rest**.
* Minimize data retention; set expirations and secure deletion.

### 4.2 Input Validation & Output Encoding

* Validate all inputs (type, range, format). Reject or sanitize early.
* Encode outputs by context (HTML, attribute, URL, JSON).
* For APIs: schema-validate requests/responses.

### 4.3 Content Security Policy (web/extension/UIs)

* Strict CSP (no `unsafe-inline`/`unsafe-eval`). Allow only required origins.
* Sandbox untrusted content.
* Use Subresource Integrity (SRI) for third-party scripts.

### 4.4 Dependency Hygiene

* Pin versions; use lockfiles.
* Run **SCA** and **lint** on CI.
* For native builds: consider reproducible builds.

### 4.5 Cryptography (if applicable)

* **Do not roll your own crypto**. Use well-maintained libs.
* Key material must never be stored unencrypted.

---

## 5) Platform APIs & Data Handling

* Separate **ephemeral** vs **persistent** data.
* Encrypt sensitive fields before persistence.
* Enforce HTTPS/TLS; validate server responses.
* Add retries with backoff for flaky endpoints.

---

## 6) Testing Strategy

### 6.1 Layers

* **Unit**: pure logic
* **Integration**: infra adapters
* **E2E**: user flows
* **Security tests**: negative cases

### 6.2 Baseline Checklists

* CRUD, login/session, permissions.
* Error paths (network, expired tokens, malformed data).
* Config parity across environments.

---

## 7) Performance & Reliability

* Define SLAs (e.g., API p95 < 300ms).
* Monitor with APM/RUM.
* Lazy-load heavy modules.
* Clean up timers/listeners to prevent leaks.

---

## 8) Cross-Platform Considerations

* Abstract platform differences.
* Provide compatibility wrappers.
* Design for mobile/low-resource environments.

---

## 9) Build, CI/CD, and Release

* Single entry `build:prod` pipeline with lint, tests, bundle.
* Required PR gates: lint, typecheck, tests.
* Semantic versioning with changelogs.
* Rollback plan for releases.

---

## 10) Git Policy & Commit Messages

```
<TYPE>(<scope>): <tracker-id optional>, <short description>
```

* **TYPE**: FEAT | FIX | PERF | REFACTOR | DOCS | TEST | CHORE | WIP
* Examples:

  * `FIX(auth): #123, handle expired refresh token`
  * `FEAT(ui): add QR code flow behind flag`

Branches: `feat/<issue-id>-<slug>`

---

## 11) Documentation

* **README**: quick start, run, test, release.
* **/docs**: ADRs, threat model, API contracts.
* Inline comments for complex/security-sensitive code.

---

## 12) Work Update Guidelines

* Use bullet points; concrete updates.
* Summarize commits/issues into business-friendly language.
* Example:

```
## Work Update – <DATE>
• Fixed token refresh loop causing periodic logouts (#456)
• Added rate limiter to upload API (reduced 429s by ~80%)
• Wrote E2E tests for profile flow
```

---

## 13) Definition of Done

* Root cause confirmed & test added
* Tests green in CI
* No secrets leaked
* Performance budget respected
* Docs updated if needed
* PR approved & merged

---

## 14) Cleanup & Governance

* Remove unused experiments/debugging code.
* Record decisions in ADRs.
* Revisit rules quarterly or after incidents.

```
```
