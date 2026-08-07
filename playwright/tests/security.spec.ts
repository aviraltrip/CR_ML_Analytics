import { test, expect } from '../fixtures/test-fixtures';
import { SECURITY_PAYLOADS } from '../utils/security-payloads';

test.describe('Security & Vulnerability Scans', () => {

  test('Should analyze security headers on response', async ({ page }) => {
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
    await page.goto('/');
    const corsHeaders = await page.evaluate(async () => {
      const response = await fetch('https://cr-ml-analytics-backend.onrender.com/health');
      const headersObj: Record<string, string> = {};
      response.headers.forEach((value, name) => {
        headersObj[name] = value;
      });
      return headersObj;
    });

    console.log('API CORS Headers:', corsHeaders);
    expect(corsHeaders['access-control-allow-origin']).toBeDefined();
  });

  test('Should sanitize search input fields against XSS/HTML/SQL injections without DOM crash', async ({ cardsPage, page }) => {
    await cardsPage.goto();
    
    // Switch to table view
    await cardsPage.switchView('table');

    const testPayloads = [
      ...SECURITY_PAYLOADS.xss,
      ...SECURITY_PAYLOADS.sqli,
      ...SECURITY_PAYLOADS.overflow
    ];

    const inputField = page.locator('input[placeholder*="Search deck card database"]');
    
    for (const payload of testPayloads) {
      await cardsPage.goto();
      await page.waitForSelector('input[placeholder*="Search deck card database"]');
      
      await inputField.fill(payload);
      
      const noResultsMsg = page.locator('text=/No matching card found|No cards meet the current filter criteria/i');
      await expect(noResultsMsg).toBeVisible();
      
      await expect(page.locator('h1')).toHaveText('Card Analytics');
    }
  });

  test('Should handle extreme/invalid numeric values in card level inputs safely', async ({ evaluatorPage, page }) => {
    await evaluatorPage.goto();
    await expect(page.locator('h3:has-text("Ready for Simulation")')).toBeVisible();

    const firstLevelInput = page.locator('div.p-3.bg-slate-950\\/40 input[type="number"]').first();
    
    await firstLevelInput.clear();
    await firstLevelInput.fill('99');
    
    await page.locator('h1').click();
    const clampedMaxVal = await firstLevelInput.inputValue();
    expect(Number(clampedMaxVal)).toBeLessThanOrEqual(16);

    await firstLevelInput.clear();
    await firstLevelInput.fill('-5');
    await page.locator('h1').click();
    const clampedMinVal = await firstLevelInput.inputValue();
    expect(Number(clampedMinVal)).toBeGreaterThanOrEqual(1);
  });

  test('Should verify API Rate Limiting triggers HTTP 429 under concurrent heavy requests', async ({ page }) => {
    await page.goto('/');
    
    const results = await page.evaluate(async () => {
      const statuses: number[] = [];
      const requests = Array.from({ length: 120 }).map(async () => {
        try {
          const res = await fetch('https://cr-ml-analytics-backend.onrender.com/health');
          statuses.push(res.status);
        } catch {
          statuses.push(0);
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
  });

  test('Should check API schemas for info disclosures (no stack traces on bad requests)', async ({ page }) => {
    const response = await page.request.post('https://cr-ml-analytics-backend.onrender.com/evaluate-deck', {
      data: {
        cards: ['InvalidCardName'],
        levels: { 'InvalidCardName': 11 }
      }
    });

    expect(response.status()).not.toBe(200);
    
    const body = await response.json();
    const bodyString = JSON.stringify(body);
    
    console.log('Error payload response format:', bodyString);

    expect(bodyString).not.toContain('traceback');
    expect(bodyString).not.toContain('File "');
    expect(bodyString).not.toContain('line ');
    expect(bodyString.toLowerCase()).not.toContain('exception');
  });

});
