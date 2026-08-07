import { Locator, Page } from '@playwright/test';

export class CardsPage {
  readonly page: Page;
  readonly statusFilters: Locator;
  readonly gridViewBtn: Locator;
  readonly tableViewBtn: Locator;
  readonly cardGridItems: Locator;
  readonly tableRows: Locator;
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statusFilters = page.locator('button', { hasText: /All|Underrated|Strong\/Meta|Weak\/Niche|Overrated/ });
    this.gridViewBtn = page.locator('button[title="Grid View"]');
    this.tableViewBtn = page.locator('button[title="Table View"]');
    this.cardGridItems = page.locator('div.grid.grid-cols-2 > div.glass-panel'); // The card items container in grid mode
    this.tableRows = page.locator('table tbody tr'); // Table rows in list mode
    this.paginationPrev = page.locator('button', { hasText: 'Prev' });
    this.paginationNext = page.locator('button', { hasText: 'Next' });
  }

  async goto() {
    await this.page.goto('/cards');
  }

  async filterByStatus(status: 'All' | 'Underrated' | 'Strong/Meta' | 'Weak/Niche' | 'Overrated') {
    const filterBtn = this.page.locator('button', { hasText: `${status} (` });
    await filterBtn.click();
  }

  async switchView(view: 'grid' | 'table') {
    if (view === 'grid') {
      await this.gridViewBtn.click();
    } else {
      await this.tableViewBtn.click();
    }
  }

  async getCardCount() {
    const isVisible = await this.gridViewBtn.evaluate((el) => el.classList.contains('bg-indigo-600'));
    if (isVisible) {
      return await this.page.locator('div.glass-panel:has(h4)').count();
    } else {
      return await this.tableRows.count();
    }
  }

  async hoverCard(index: number) {
    const card = this.page.locator('div.glass-panel:has(h4)').nth(index);
    await card.scrollIntoViewIfNeeded();
    await card.hover();
  }

  async getDetailedStatsText(index: number) {
    const card = this.page.locator('div.glass-panel:has(h4)').nth(index);
    const detailOverlay = card.locator('div.absolute.inset-0.bg-\\[\\#0c1220\\]\\/95');
    await card.hover();
    return await detailOverlay.textContent();
  }
}
