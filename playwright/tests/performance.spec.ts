import { test, expect } from '../fixtures/test-fixtures';

test.describe('Performance Metrics & Caching Audits', () => {

  test.beforeAll(async ({ request }) => {
    let healthy = false;
    console.log('Checking backend service status for performance tests...');
    for (let i = 0; i < 20; i++) {
      try {
        const response = await request.get('https://cr-ml-analytics-backend.onrender.com/health');
        if (response.status() === 200) {
          healthy = true;
          console.log('Backend service is online and ready.');
          break;
        }
      } catch {
        // Suppress and wait
      }
      console.log(`Backend is starting up... Waiting 5s (Attempt ${i + 1}/20)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    if (!healthy) {
      throw new Error('Backend failed to respond. Aborting test suite.');
    }
  });

  test('Should measure page load timings for all major routes', async ({ page }) => {
    const routes = ['/', '/leaderboard', '/cards', '/evaluator', '/matchup'];
    const performanceLog: Record<string, any> = {};

    for (const route of routes) {
      await page.goto(route);
      
      const timing = await page.evaluate(() => {
        const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (!nav) return null;
        return {
          duration: nav.duration,
          domInteractive: nav.domInteractive,
          domContentLoadedEventEnd: nav.domContentLoadedEventEnd,
          loadEventEnd: nav.loadEventEnd
        };
      });

      if (timing) {
        performanceLog[route] = {
          'Load Duration (ms)': Math.round(timing.duration),
          'DOM Interactive (ms)': Math.round(timing.domInteractive),
          'DOMContentLoaded (ms)': Math.round(timing.domContentLoadedEventEnd),
          'Fully Loaded (ms)': Math.round(timing.loadEventEnd)
        };
      }
    }

    console.table(performanceLog);
  });

  test('Should record API endpoint latencies', async ({ page }) => {
    await page.goto('/');
    
    const latencies = await page.evaluate(async () => {
      const endpoints = [
        { name: 'Health check', url: 'https://cr-ml-analytics-backend.onrender.com/health' },
        { name: 'Leaderboards stats', url: 'https://cr-ml-analytics-backend.onrender.com/leaderboard?min_games=5' },
        { name: 'Card Stats list', url: 'https://cr-ml-analytics-backend.onrender.com/card-stats' }
      ];
      
      const records: Record<string, number> = {};
      for (const endpoint of endpoints) {
        const start = performance.now();
        await fetch(endpoint.url);
        const duration = performance.now() - start;
        records[endpoint.name] = Math.round(duration);
      }
      return records;
    });

    console.log('API Latency Benchmarks (ms):', latencies);
    for (const [name, ms] of Object.entries(latencies)) {
      expect(ms).toBeLessThan(1500); // 1.5s max threshold
    }
  });

  test('Should inspect Cache-Control headers on static page assets', async ({ page }) => {
    const assetRequests: { url: string; cacheControl: string }[] = [];
    
    page.on('response', (response) => {
      const url = response.url();
      const headers = response.headers();
      const isStaticAsset = url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.png') || url.endsWith('.jpg') || url.includes('/assets/');
      
      if (isStaticAsset) {
        assetRequests.push({
          url: url.split('/').pop() || url,
          cacheControl: headers['cache-control'] || 'MISSING'
        });
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    console.log('Static Assets Caching Headers:', assetRequests);
  });

});
