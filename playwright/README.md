# Clash Royale Deck Analytics — Playwright Test Suite

This directory contains a completely isolated, production-grade automated testing framework. It audits functional flows, UI/UX responsiveness, WCAG accessibility, and backend security protections without altering any application source code.

---

## 📂 Folder Structure

```
playwright/
├── tests/                  # Automated test files
│   ├── functional.spec.ts  # End-to-end user journeys & POM flows
│   ├── accessibility.spec.ts # axe-playwright scans for accessibility (WCAG compliance)
│   ├── security.spec.ts    # Input validation, CORS, API rate limits, & info disclosures
│   └── performance.spec.ts # Timing benchmarks, latencies, & caching checks
├── pages/                  # Page Object Models (POMs) for clean selector modularity
│   ├── dashboard.page.ts
│   ├── leaderboard.page.ts
│   ├── cards.page.ts
│   ├── evaluator.page.ts
│   └── matchup.page.ts
├── fixtures/               # Extended test contexts mapping POM hooks
│   └── test-fixtures.ts
├── utils/                  # Benign test payloads (HTML, script, SQL, overflow boundaries)
│   └── security-payloads.ts
├── data/                   # Default decks, mock card items, and constants
│   └── test-data.ts
├── reports/                # Local directory for generated E2E HTML reports (gitignored)
├── package.json            # Local testing dependencies
├── playwright.config.ts    # Main runner configurations & local server orchestrations
└── README.md               # Setup and user execution guide (this file)
```

---

## 🛠️ Installation & Setup

1. **Pre-requisites:** Make sure you have [Node.js](https://nodejs.org/) (v18+) installed.
2. Navigate into the `playwright/` folder:
   ```bash
   cd playwright
   ```
3. Install the dependencies locally (isolated inside `playwright/node_modules/`):
   ```bash
   npm install
   ```
4. Install Playwright browser engines:
   ```bash
   npx playwright install chromium firefox webkit
   ```

---

## 🚀 Running Tests

All test commands should be executed from the `playwright/` directory.

### Run All Tests
This command automatically starts the Python backend and Vite frontend servers in the background, executes the full suite across all configured browsers/viewports, and saves the output:
```bash
npx playwright test
```

### Run a Specific Test Suite
* **E2E Functional Tests:**
  ```bash
  npx playwright test tests/functional.spec.ts
  ```
* **Security & Injection Scans:**
  ```bash
  npx playwright test tests/security.spec.ts
  ```
* **Accessibility WCAG Scans:**
  ```bash
  npx playwright test tests/accessibility.spec.ts
  ```
* **Performance Timings:**
  ```bash
  npx playwright test tests/performance.spec.ts
  ```

### Run in Headed/Interactive Mode
* **Headed Execution:**
  ```bash
  npx playwright test --headed
  ```
* **Playwright Interactive UI Mode (Highly Recommended):**
  ```bash
  npx playwright test --ui
  ```
* **Debugging Mode:**
  ```bash
  npx playwright test --debug
  ```

---

## 📊 Viewing Test Reports

On completion, Playwright generates a rich HTML report detailing test statuses, assertion steps, failure screenshots, videos, and network traces.

To launch the interactive dashboard, run:
```bash
npx playwright show-report reports
```

---

## 🔍 Troubleshooting

* **Server Port Conflicts:** 
  The configuration attempts to launch the backend on port `8000` and the frontend on port `3000` (`reuseExistingServer` is enabled). If you already have active processes running on these ports, the tests will run against your existing instances. If they are occupied by unrelated applications, please close those processes first.
  
* **Python virtual environment not found:**
  If the command `venv\Scripts\python` fails on your shell configuration, ensure a virtual environment is active or created under the `backend/` directory:
  ```bash
  cd backend
  python -m venv venv
  venv\Scripts\pip install -r requirements.txt
  ```
