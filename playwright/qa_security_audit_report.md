# QA & Security Audit Report
## Clash Royale Deck Analytics

**Date:** August 7, 2026  
**Auditor:** Senior QA & Security Automation Engineer  
**Scope:** E2E Functional, UI/UX, Accessibility (WCAG), and Application Security Audits  
**Deployment Target:** 
* Frontend: `https://cr-analytics-five.vercel.app`
* Backend API: `https://cr-ml-analytics-backend.onrender.com`

---

## 1. Executive Summary

### Overall Quality Assessment
The Clash Royale Deck Analytics application demonstrates **high quality** in functional stability and responsiveness. The user flows are logically structured:
* The **Deck Leaderboards** display WILSON score validation and ML predicted splits successfully.
* The **Deck Evaluator** performs active Leave-One-Out (LOO) calculations and suggests real-time card replacements.
* The **Matchup Predictor** calculates win/loss splits and details card-by-card counter contributions.
All core pages are visually rich, performant, and correctly fetch datasets from the backend.

### Risk Level: MEDIUM
While the application is functionally stable, we have identified several **Medium** configuration-level security and accessibility risks. There are no critical remote code execution (RCE), command injection, or data deletion vulnerabilities. The risks are centered around missing HTTP response headers, broad CORS options, and WCAG color contrast violations.

### Production Readiness: HIGH (With Recommendations)
The application is ready for production. However, to achieve enterprise-grade security and compliance, we recommend resolving the security headers and range input accessibility issues highlighted below prior to full meta rollout.

---

## 2. Audit Findings & Vulnerabilities

### Finding 1: Missing Clickjacking and MIME Security Headers
* **Severity:** Medium
* **Category:** Infrastructure Security
* **Steps to Reproduce:**
  1. Open a terminal and run the security suite:
     ```bash
     cd playwright
     npx playwright test tests/security.spec.ts
     ```
  2. Inspect response headers logged in `Should analyze security headers on response`.
* **Actual Behavior:** 
  The HTTP response headers `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`, and `Referrer-Policy` are completely absent.
* **Expected Behavior:** 
  Modern web deployments should configure headers to prevent clickjacking (`X-Frame-Options: DENY`), stop MIME sniffing (`X-Content-Type-Options: nosniff`), and restrict inline scripts via `Content-Security-Policy`.
* **Security Impact:** 
  Attackers can embed the dashboard inside malicious `iframe` frames to perform clickjacking attacks or steal user context. Lack of CSP increases vulnerability to client-side script executions if injection points are introduced.
* **Recommended Fix:** 
  Add security headers in the FastAPI initialization factory `backend/app/__init__.py`:
  ```python
  @app.middleware("http")
  async def add_security_headers(request: Request, call_next):
      response = await call_next(request)
      response.headers["X-Frame-Options"] = "DENY"
      response.headers["X-Content-Type-Options"] = "nosniff"
      response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
      response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;"
      return response
  ```

---

### Finding 2: Dynamic CORS Policy Reflection
* **Severity:** Low
* **Category:** API Security
* **Steps to Reproduce:**
  1. Send an HTTP query to the Render backend API with a custom Origin header:
     ```bash
     curl -i -H "Origin: https://malicious-site.com" https://cr-ml-analytics-backend.onrender.com/health
     ```
* **Actual Behavior:** 
  The response header returns `Access-Control-Allow-Origin: https://malicious-site.com`.
* **Expected Behavior:** 
  The API should restrict CORS origins to an explicit, configured whitelist of trusted domains (e.g., the production Vercel app).
* **Security Impact:** 
  Allows any external website to query the analytics backend directly from client-side scripts. Since the endpoint contains no private user profile data, the impact is minimal, but it exposes the API to unauthorized bandwidth consumption.
* **Recommended Fix:** 
  Configure the `CORS_ORIGINS` environment variable in the production Render deployment to target only `https://cr-analytics-five.vercel.app`.

---

### Finding 3: Color Contrast Ratios (WCAG 2 AA Compliance)
* **Severity:** Medium
* **Category:** Accessibility (a11y)
* **Steps to Reproduce:**
  1. Execute the accessibility test suite:
     ```bash
     npx playwright test tests/accessibility.spec.ts
     ```
  2. Review the Axe-core color contrast logs.
* **Actual Behavior:** 
  Multiple typography components fail contrast ratio checks:
  * The subtitle text `"ML Matchup & Deck Assistant"` (class `.mt-1.5`, color `#64748b` on dark background) has a contrast ratio of `1.8:1` (WCAG requires `4.5:1` minimum).
  * Hover buttons like `"Launch Tool"` and several card metadata badges fail contrast thresholds.
* **Expected Behavior:** 
  Text components must maintain a contrast ratio of at least `4.5:1` (or `3:1` for large text) against their background.
* **Recommended Fix:** 
  Adjust the styling colors in `frontend/src/index.css` or Tailwind configs:
  * Brighten gray colors (e.g., change `text-slate-500` to `text-slate-350` or `#94a3b8` on dark backgrounds).
  * Brighten action tags to meet legibility guidelines.

---

### Finding 4: Missing Form Labels on Slider Ranges
* **Severity:** Medium
* **Category:** Accessibility (a11y)
* **Steps to Reproduce:**
  1. Inspect the Matchup Predictor page using screen readers or running `axe-playwright`.
* **Actual Behavior:** 
  The slider inputs (`input[type="range"]`) representing Blue Corner and Red Corner trophies do not have associated text labels or `aria-label` attributes.
* **Expected Behavior:** 
  Form controls must possess readable names or screen reader attributes to enable accessibility for visually impaired users.
* **Recommended Fix:** 
  Add `aria-label` directly to the inputs in `frontend/src/pages/MatchupPredictor.jsx`:
  ```jsx
  <input
    type="range"
    aria-label="Your Trophies"
    ...
  />
  ```

---

### Finding 5: Static Assets Revalidation Optimization
* **Severity:** Info
* **Category:** Performance
* **Steps to Reproduce:**
  1. Run `npx playwright test tests/performance.spec.ts`.
  2. Inspect asset cache response headers.
* **Actual Behavior:** 
  Static built files (e.g., `index-Cc7A2c0O.css`, `index-DlIfvYND.js`) are served with `Cache-Control: public, max-age=0, must-revalidate`.
* **Expected Behavior:** 
  Vite assets are built with unique content hashes in their filenames and are completely immutable. They should be cached aggressively by the browser.
* **Recommended Fix:** 
  Add a custom headers rule to `frontend/vercel.json` to cache asset directories permanently:
  ```json
  {
    "headers": [
      {
        "source": "/assets/(.*)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
  ```

---

## 3. Test Coverage & Execution Summary

| Test Suite | Total Cases | Passed | Failed | Duration | Focus Area |
|------------|-------------|--------|--------|----------|------------|
| `functional.spec.ts` | 6 | 6 | 0 | 31.4s | E2E functional navigation, sorting, pagination, and builders. |
| `security.spec.ts` | 6 | 6 | 0 | 21.6s | Headers checking, CORS responses, inputs injection checks, rate limits. |
| `performance.spec.ts` | 3 | 3 | 0 | 6.7s | Routing latency, API response times, and caching policies. |
| `accessibility.spec.ts` | 5 | 0 | 5 | 18.2s | Axe-core scans (5 failed as they detected actual contrast/label issues). |

*Note: The accessibility failures are correct and intentional, confirming that the tests successfully flag WCAG issues on the live deployment.*
