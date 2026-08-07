import { test, expect } from '../fixtures/test-fixtures';
import { TEST_DATA } from '../data/test-data';

test.describe('E2E Functional User Journeys', () => {

  test.beforeAll(async ({ request }) => {
    // Wait for backend to wake up on Render
    let healthy = false;
    console.log('Checking backend service status...');
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

  test('Should navigate to Dashboard and verify key layout elements', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.headerTitle).toBeVisible();
    await expect(dashboardPage.deckLeaderboardCard).toBeVisible();
    await expect(dashboardPage.cardAnalyticsCard).toBeVisible();
    await expect(dashboardPage.deckEvaluatorCard).toBeVisible();
    await expect(dashboardPage.matchupPredictorCard).toBeVisible();
  });

  test('Should navigate between tools using sidebar navigation', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    // Desktop sidebar links
    const sidebar = page.locator('aside.hidden.lg\\:flex');
    
    // Leaderboard nav click
    await sidebar.locator('a[href="/leaderboard"]').click();
    await expect(page).toHaveURL(/\/leaderboard/);
    await expect(page.locator('h1')).toHaveText('Deck Leaderboard');

    // Card Analytics click
    await sidebar.locator('a[href="/cards"]').click();
    await expect(page).toHaveURL(/\/cards/);
    await expect(page.locator('h1')).toHaveText('Card Analytics');

    // Deck Evaluator click
    await sidebar.locator('a[href="/evaluator"]').click();
    await expect(page).toHaveURL(/\/evaluator/);
    await expect(page.locator('h1')).toHaveText('Deck Evaluator');

    // Matchup Predictor click
    await sidebar.locator('a[href="/matchup"]').click();
    await expect(page).toHaveURL(/\/matchup/);
    await expect(page.locator('h1')).toHaveText('Matchup Predictor');
  });

  test('Should display Leaderboard decks and support page transitions', async ({ leaderboardPage, page }) => {
    await leaderboardPage.goto();
    
    // Check info card details
    await expect(leaderboardPage.infoCard).toBeVisible();

    // Verify decks render
    await expect(leaderboardPage.deckRows.first()).toBeVisible({ timeout: 20000 });
    const historicalCount = await leaderboardPage.getDeckCount();
    expect(historicalCount).toBeGreaterThan(0);

    // Switch to ML Predicted tab and verify results update
    await leaderboardPage.switchTab('ml');
    await expect(page.locator('text=Sim WR:').first()).toBeVisible({ timeout: 10000 });
    const mlCount = await leaderboardPage.getDeckCount();
    expect(mlCount).toBeGreaterThan(0);

    // Test transition from Leaderboard to Deck Evaluator
    await leaderboardPage.switchTab('historical');
    await leaderboardPage.clickEvaluateOnDeck(0);
    await expect(page).toHaveURL(/\/evaluator\?deck=/);
    
    // Verify that the Evaluator page has auto-triggered simulation
    const evaluatorTitle = page.locator('h1');
    await expect(evaluatorTitle).toHaveText('Deck Evaluator');
    await expect(page.locator('div.text-center:has-text("Win Probability")')).toBeVisible({ timeout: 20000 });
  });

  test('Should sort, filter, and paginate through Card Analytics', async ({ cardsPage, page }) => {
    await cardsPage.goto();
    
    // Wait for card items to load
    await expect(page.locator('div.glass-panel:has(h4)').first()).toBeVisible({ timeout: 20000 });

    const totalInGrid = await cardsPage.getCardCount();
    expect(totalInGrid).toBeGreaterThan(0);

    // Switch to table view
    await cardsPage.switchView('table');
    await expect(cardsPage.tableRows.first()).toBeVisible();
    const totalInTable = await cardsPage.getCardCount();
    expect(totalInTable).toBeGreaterThan(0);

    // Filter by status (Underrated)
    await cardsPage.switchView('grid');
    await cardsPage.filterByStatus('Underrated');
    await expect(page.locator('span:text-is("Underrated")').first()).toBeVisible();

    // Hover card to check detail overlay
    await cardsPage.hoverCard(0);
    const detailText = await cardsPage.getDetailedStatsText(0);
    expect(detailText).toContain('Detailed Stats');
    expect(detailText).toContain('Margin vs 50%');
  });

  test('Should support building, resetting, and evaluating custom decks in Deck Evaluator', async ({ evaluatorPage, page }) => {
    await evaluatorPage.goto();
    
    // Check initial state
    await expect(page.locator('h3:has-text("Ready for Simulation")')).toBeVisible();

    // Perform reset to clear default deck
    await evaluatorPage.clickReset();

    // Re-build deck card-by-card from list
    const newDeck = TEST_DATA.validDeck2;
    for (const card of newDeck) {
      await evaluatorPage.selectCardFromDatabase(card);
    }

    // Set custom card levels
    await evaluatorPage.setCardLevel(newDeck[0], 14);
    await evaluatorPage.setCardLevel(newDeck[1], 12);

    // Run evaluation synergy check
    await evaluatorPage.clickEvaluate();
    
    // Check gauge output
    await expect(evaluatorPage.winRateGauge).toBeVisible({ timeout: 25000 });
    await expect(evaluatorPage.compStatsBreakdown).toBeVisible();

    // Verify recommendations presence (LOO analysis)
    const swapsCount = await evaluatorPage.getSwapCount();
    if (swapsCount > 0) {
      const originalWinRateText = await page.locator('div.text-center:has-text("Win Probability") h3').textContent();
      await evaluatorPage.clickSwapCard(0);
      
      await expect(evaluatorPage.winRateGauge).toBeVisible({ timeout: 25000 });
      const newWinRateText = await page.locator('div.text-center:has-text("Win Probability") h3').textContent();
      expect(newWinRateText).not.toBe(originalWinRateText);
    }
  });

  test('Should simulate head-to-head match predictor battle splits', async ({ matchupPage, page }) => {
    await matchupPage.goto();
    
    await matchupPage.clickPredict();
    
    await expect(matchupPage.winRateBar).toBeVisible({ timeout: 25000 });
    await expect(matchupPage.advantagesBox).toBeVisible();
    await expect(matchupPage.threatsBox).toBeVisible();
    await expect(matchupPage.contributionsGrid).toBeVisible();

    await matchupPage.removeCardFromCorner('red', 'Knight');
    await matchupPage.selectCardInCorner('red', 'Valkyrie');

    await matchupPage.clickPredict();
    await expect(matchupPage.winRateBar).toBeVisible({ timeout: 20000 });
  });

});
