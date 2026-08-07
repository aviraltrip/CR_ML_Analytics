import { test as base } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { LeaderboardPage } from '../pages/leaderboard.page';
import { CardsPage } from '../pages/cards.page';
import { EvaluatorPage } from '../pages/evaluator.page';
import { MatchupPage } from '../pages/matchup.page';

type TestFixtures = {
  dashboardPage: DashboardPage;
  leaderboardPage: LeaderboardPage;
  cardsPage: CardsPage;
  evaluatorPage: EvaluatorPage;
  matchupPage: MatchupPage;
};

export const test = base.extend<TestFixtures>({
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  leaderboardPage: async ({ page }, use) => {
    await use(new LeaderboardPage(page));
  },
  cardsPage: async ({ page }, use) => {
    await use(new CardsPage(page));
  },
  evaluatorPage: async ({ page }, use) => {
    await use(new EvaluatorPage(page));
  },
  matchupPage: async ({ page }, use) => {
    await use(new MatchupPage(page));
  },
});

export { expect } from '@playwright/test';
