import { Locator, Page } from '@playwright/test';

export class EvaluatorPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly evaluateBtn: Locator;
  readonly resetBtn: Locator;
  readonly winRateGauge: Locator;
  readonly compStatsBreakdown: Locator;
  readonly swapCardsList: Locator;
  readonly historicalBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[placeholder*="Search deck card database"]');
    this.evaluateBtn = page.locator('button', { hasText: 'Evaluate Synergy' });
    this.resetBtn = page.locator('button[title="Reset Deck"]');
    this.winRateGauge = page.locator('div.text-center:has-text("Win Probability")'); // Custom wrapper for the Gauge
    this.compStatsBreakdown = page.locator('div.grid-cols-2.sm\\:grid-cols-4');
    this.swapCardsList = page.locator('h4:has-text("Synergy Recommendations") + p + div > div'); // recommendations container
    this.historicalBanner = page.locator('h4:has-text("Active Historical Meta Deck")');
  }

  async goto(deckParam?: string) {
    if (deckParam) {
      await this.page.goto(`/evaluator?deck=${encodeURIComponent(deckParam)}`);
    } else {
      await this.page.goto('/evaluator');
    }
  }

  async searchCard(cardName: string) {
    await this.searchInput.clear();
    await this.searchInput.fill(cardName);
  }

  async selectCardFromDatabase(cardName: string) {
    await this.searchCard(cardName);
    const cardBtn = this.page.locator(`button[title="${cardName}"]`);
    await cardBtn.click();
  }

  async removeCardFromDeck(cardName: string) {
    // Selected cards in the active deck have removeCard function triggered on click
    const activeCard = this.page.locator(`div.relative.group.aspect-\\[2\\/3\\]:has(img[alt="${cardName}"])`);
    await activeCard.click();
  }

  async setCardLevel(cardName: string, level: number) {
    // Find the input within the level customize box that matches the cardName
    const levelInput = this.page.locator(`div.p-3.bg-slate-950\\/40:has(span:text-is("${cardName}")) input[type="number"]`);
    await levelInput.clear();
    await levelInput.fill(level.toString());
  }

  async clickEvaluate() {
    await this.evaluateBtn.click();
  }

  async clickReset() {
    await this.resetBtn.click();
  }

  async getSwapCount() {
    return await this.swapCardsList.count();
  }

  async clickSwapCard(index: number) {
    const swapItem = this.swapCardsList.nth(index);
    await swapItem.locator('button', { hasText: 'Swap Card' }).click();
  }
}
