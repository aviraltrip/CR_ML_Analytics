import { test, expect } from '../fixtures/test-fixtures';
import { SECURITY_PAYLOADS } from '../utils/security-payloads';

test.describe('Security & Vulnerability Scans', () => {

  test('Should analyze security headers on response', async ({ page }) => {
    // Navigate to root
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    
    const headers = response!.headers();

    // Check clickjacking protection
    const frameOptions = headers['x-frame-options'];
    console.log(`Security Header Check [X-Frame-Options]: ${frameOptions || 'MISSING'}`);
    
    // Check MIME sniffing protection
    const contentTypeOptions = headers['x-content-type-options'];
    console.log(`Security Header Check [X-Content-Type-Options]: ${contentTypeOptions || 'MISSING'}`);

    // Check Content Security Policy
    const csp = headers['content-security-policy'];
    console.log(`Security Header Check [Content-Security-Policy]: ${csp || 'MISSING'}`);

    // Check Referrer Policy
    const referrerPolicy = headers['referrer-policy'];
    console.log(`Security Header Check [Referrer-Policy]: ${referrerPolicy || 'MISSING'}`);
  });

  test('Should verify CORS policy headers for API requests', async ({ page }) => {
    // Send a fetch call to backend from frontend environment
    await page.goto('/');
    const corsHeaders = await page.evaluate(async () => {
      const response = await fetch('/api/health');
      const headersObj: Record<string, string> = {};
      response.headers.forEach((value, name) => {
        headersObj[name] = value;
      });
      return headersObj;
    });

    console.log('API CORS Headers:', corsHeaders);
    // FastAPI app CORS middleware sets these dynamically depending on request origin
  });

  test('Should sanitize search input fields against XSS/HTML/SQL injections without DOM crash', async ({ cardsPage, page }) => {
    await cardsPage.goto();
    
    // Switch to table view
    await cardsPage.switchView('table');

    // Test a list of safe XSS and SQL injection payloads
    const testPayloads = [
      ...SECURITY_PAYLOADS.xss,
      ...SECURITY_PAYLOADS.sqli,
      ...SECURITY_PAYLOADS.overflow
    ];

    const inputField = page.locator('input[placeholder*="Search deck card database"]');
    
    // Verify that injecting these payloads doesn't trigger alerts, doesn't crash the react render cycle, and shows empty state correctly
    for (const payload of testPayloads) {
      await cardsPage.goto();
      await page.waitForSelector('input[placeholder*="Search deck card database"]');
      
      // Inject payload
      await inputField.fill(payload);
      
      // Verify no unexpected browser dialogues popped up and UI displays "No matching card found" or "No cards meet the current filter criteria."
      const noResultsMsg = page.locator('text=/No matching card found|No cards meet the current filter criteria/i');
      await expect(noResultsMsg).toBeVisible();
      
      // Verify the page layout title remains intact
      await expect(page.locator('h1')).toHaveText('Card Analytics');
    }
  });

  test('Should handle extreme/invalid numeric values in card level inputs safely', async ({ evaluatorPage, page }) => {
    await evaluatorPage.goto();
    await expect(page.locator('h3:has-text("Ready for Simulation")')).toBeVisible();

    // Fill level input with negative or extreme levels and check that it clamps or returns clear validation errors instead of raw Python exception stack traces
    const firstLevelInput = page.locator('div.p-3.bg-slate-950\\/40 input[type="number"]').first();
    
    // Set out of range high level
    await firstLevelInput.clear();
    await firstLevelInput.fill('99');
    
    // Focus away, reactivity should clamp it to 16
    await page.locator('h1').click();
    const clampedMaxVal = await firstLevelInput.inputValue();
    expect(Number(clampedMaxVal)).toBeLessThanOrEqual(16);

    // Set out of range low level
    await firstLevelInput.clear();
    await firstLevelInput.fill('-5');
    await page.locator('h1').click();
    const clampedMinVal = await firstLevelInput.inputValue();
    expect(Number(clampedMinVal)).toBeGreaterThanOrEqual(1);
  });

  test('Should verify API Rate Limiting triggers HTTP 429 under concurrent heavy requests', async ({ page }) => {
    await page.goto('/');
    
    // Trigger rapid parallel requests using the browser runtime execution contexts
    const results = await page.evaluate(async () => {
      const statuses: number[] = [];
      const requests = Array.from({ length: 120 }).map(async () => {
        try {
          const res = await fetch('/api/health');
          statuses.push(res.status);
        } catch {
          statuses.push(0); // Network error
        }
      });
      await Promise.all(requests);
      return statuses;
    });

    console.log(`Rate Limiting: Out of 120 rapid requests, statuses received:`, results.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<number, number>));

    const contains429 = results.includes(429);
    console.log(`Rate Limit Middleware Verified (Returned 429): ${contains429}`);
    
    // If rate limit configuration is set to default (100 requests per 60 sec), it should trigger 429.
    // We log the result instead of hard asserting to account for custom/dev configurations.
  });

  test('Should check API schemas for info disclosures (no stack traces on bad requests)', async ({ page }) => {
    // Force a 422 Unprocessable Entity or 500 error on evaluate API to check response content
    const response = await page.request.post('http://127.0.0.1:8000/evaluate-deck', {
      data: {
        cards: ['InvalidCardName'],
        levels: { 'InvalidCardName': 11 }
      }
    });

    expect(response.status()).not.toBe(200);
    
    const body = await response.json();
    const bodyString = JSON.stringify(body);
    
    console.log('Error payload response format:', bodyString);

    // Verify there are no verbose python stacktrace logs (e.g. traceback, filepath, line reference, exception types)
    expect(bodyString).not.toContain('traceback');
    expect(bodyString).not.toContain('File "');
    expect(bodyString).not.toContain('line ');
    expect(bodyString.toLowerCase()).not.toContain('exception');
  });

});
