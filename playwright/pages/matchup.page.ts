import { Locator, Page } from '@playwright/test';

export class MatchupPage {
  readonly page: Page;
  readonly predictBtn: Locator;
  readonly resetBtn: Locator;
  readonly winRateBar: Locator;
  readonly advantagesBox: Locator;
  readonly threatsBox: Locator;
  readonly contributionsGrid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.predictBtn = page.locator('button', { hasText: 'Predict Matchup' });
    this.resetBtn = page.locator('button[title="Reset Decks"]');
    this.winRateBar = page.locator('div.h-6.w-full.rounded-full'); // Split win rate split bar container
    this.advantagesBox = page.locator('h4:has-text("Matchup Advantages") + div');
    this.threatsBox = page.locator('h4:has-text("Matchup Threats") + div');
    this.contributionsGrid = page.locator('h4:has-text("Full Card Contribution Breakdown") + div');
  }

  async goto(deck1Param?: string) {
    if (deck1Param) {
      await this.page.goto(`/matchup?deck1=${encodeURIComponent(deck1Param)}`);
    } else {
      await this.page.goto('/matchup');
    }
  }

  private getCorner(corner: 'blue' | 'red'): Locator {
    return this.page.locator(`div.glass-panel:has-text("${corner === 'blue' ? 'Blue' : 'Red'} Corner")`);
  }

  async searchCardInCorner(corner: 'blue' | 'red', cardName: string) {
    const cornerEl = this.getCorner(corner);
    const searchInput = cornerEl.locator('input[placeholder*="Search deck card database"]');
    await searchInput.clear();
    await searchInput.fill(cardName);
  }

  async selectCardInCorner(corner: 'blue' | 'red', cardName: string) {
    await this.searchCardInCorner(corner, cardName);
    const cornerEl = this.getCorner(corner);
    const cardBtn = cornerEl.locator(`button[title="${cardName}"]`);
    await cardBtn.click();
  }

  async removeCardFromCorner(corner: 'blue' | 'red', cardName: string) {
    const cornerEl = this.getCorner(corner);
    const activeCard = cornerEl.locator(`div.relative.group.aspect-\\[2\\/3\\]:has(img[alt="${cardName}"])`);
    await activeCard.click();
  }

  async setTrophiesInCorner(corner: 'blue' | 'red', trophies: number) {
    const cornerEl = this.getCorner(corner);
    const rangeInput = cornerEl.locator('input[type="range"]');
    // Using manual typing or sliding is tricky, we can evaluate a change event or slide
    await rangeInput.fill(trophies.toString());
  }

  async clickPredict() {
    await this.predictBtn.click();
  }

  async clickReset() {
    await this.resetBtn.click();
  }
}
