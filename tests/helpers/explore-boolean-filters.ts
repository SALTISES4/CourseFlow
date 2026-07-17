import { expect, type Page } from '@playwright/test';

import {
  cardChipWithLabel,
  expectCardFavouriteToggleShowsFavourited,
} from '../shared/locators/cards';
import { libraryCards } from '../shared/locators/library';

/**
* FR-EXP-005 — every visible listing card is favourited (yellow star per FR-CARD-005).
* */
export async function expectExploreResultsContainOnlyFavouritedCards(page: Page): Promise<void> {
  const cards = libraryCards(page);
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    await expectCardFavouriteToggleShowsFavourited(cards.nth(i));
  }
}

/** FR-EXP-005 — every visible listing card is a template (cardTemplateChip per FR-CARD-001/002). */
export async function expectExploreResultsContainOnlyTemplateCards(page: Page): Promise<void> {
  const cards = libraryCards(page);
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    await expect(cardChipWithLabel(cards.nth(i), 'Template')).toBeVisible();
  }
}
