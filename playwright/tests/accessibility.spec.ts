import { test } from '../fixtures/test-fixtures';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Audits (Axe WCAG Standard Checks)', () => {

  test('Dashboard accessibility scan', async ({ page, dashboardPage }) => {
    await dashboardPage.goto();
    await injectAxe(page);
    // Scan dashboard page
    await checkA11y(page, undefined, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'best-practice']
        }
      },
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('Leaderboard page accessibility scan', async ({ page, leaderboardPage }) => {
    await leaderboardPage.goto();
    await injectAxe(page);
    // Scan leaderboard page (letting it load rows first)
    await page.waitForSelector('.glass-panel', { timeout: 15000 });
    await checkA11y(page, undefined, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'best-practice']
        }
      },
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('Card Analytics page accessibility scan', async ({ page, cardsPage }) => {
    await cardsPage.goto();
    await injectAxe(page);
    await page.waitForSelector('div.glass-panel', { timeout: 15000 });
    await checkA11y(page, undefined, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'best-practice']
        }
      },
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('Deck Evaluator page accessibility scan', async ({ page, evaluatorPage }) => {
    await evaluatorPage.goto();
    await injectAxe(page);
    await checkA11y(page, undefined, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'best-practice']
        }
      },
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('Matchup Predictor page accessibility scan', async ({ page, matchupPage }) => {
    await matchupPage.goto();
    await injectAxe(page);
    await checkA11y(page, undefined, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'best-practice']
        }
      },
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

});
