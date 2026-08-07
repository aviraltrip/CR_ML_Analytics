import { Locator, Page } from '@playwright/test';

export class LeaderboardPage {
  readonly page: Page;
  readonly historicalTabBtn: Locator;
  readonly mlTabBtn: Locator;
  readonly deckRows: Locator;
  readonly infoCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.historicalTabBtn = page.locator('button', { hasText: 'Historical' });
    this.mlTabBtn = page.locator('button', { hasText: 'ML-Predicted' });
    this.deckRows = page.locator('.glass-panel, .glass-card'); // Decks are loaded in these containers
    this.infoCard = page.locator('div.p-4.rounded-2xl.bg-indigo-500\\/5');
  }

  async goto() {
    await this.page.goto('/leaderboard');
  }

  async switchTab(tab: 'historical' | 'ml') {
    if (tab === 'historical') {
      await this.historicalTabBtn.click();
    } else {
      await this.mlTabBtn.click();
    }
  }

  async getDeckCount() {
    return await this.deckRows.count();
  }

  async clickEvaluateOnDeck(index: number) {
    const deck = this.deckRows.nth(index);
    await deck.locator('button', { hasText: 'Evaluate' }).click();
  }

  async clickCompareOnDeck(index: number) {
    const deck = this.deckRows.nth(index);
    await deck.locator('button', { hasText: 'Compare' }).click();
  }
}
