import { Locator, Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly headerTitle: Locator;
  readonly deckLeaderboardCard: Locator;
  readonly cardAnalyticsCard: Locator;
  readonly deckEvaluatorCard: Locator;
  readonly matchupPredictorCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerTitle = page.locator('h2', { hasText: 'Clash Royale' });
    this.deckLeaderboardCard = page.locator('a[href="/leaderboard"]');
    this.cardAnalyticsCard = page.locator('a[href="/cards"]');
    this.deckEvaluatorCard = page.locator('a[href="/evaluator"]');
    this.matchupPredictorCard = page.locator('a[href="/matchup"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async launchTool(tool: 'leaderboard' | 'cards' | 'evaluator' | 'matchup') {
    switch (tool) {
      case 'leaderboard':
        await this.deckLeaderboardCard.click();
        break;
      case 'cards':
        await this.cardAnalyticsCard.click();
        break;
      case 'evaluator':
        await this.deckEvaluatorCard.click();
        break;
      case 'matchup':
        await this.matchupPredictorCard.click();
        break;
    }
  }
}
