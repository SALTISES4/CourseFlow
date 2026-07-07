import { expect, type Locator, type Page } from '@playwright/test';
import { globalMessageSnackbar } from './global';

/**
 * Shared projectCard / workflowCard sub-regions — canonical_locators.yaml (card* uiObjects).
 * Scope cards with a parent locator (e.g. library resultsRegion) or use library* helpers below.
 */

/** Matches course_flow/e2e_seed/constants.py E2E_FIXTURE_WORKFLOW_TITLE */
export const E2E_FIXTURE_WORKFLOW_TITLE = 'E2E Activity Workflow';

/** Matches course_flow/e2e_seed/orchestrator.py workflow description seed copy */
export const E2E_FIXTURE_WORKFLOW_DESCRIPTION =
  'Activity workflow for section editing E2E tests.';

/** canonical: cardHeaderRegion */
export function cardHeaderRegion(card: Locator): Locator {
  return card.locator('header');
}

/** canonical: cardFooterRegion */
export function cardFooterRegion(card: Locator): Locator {
  return card.locator('footer');
}

/** canonical: cardFooterTagsRegion — first chip group row in footer (no cardFooterInfo content). */
export function cardFooterTagsRegion(card: Locator): Locator {
  return cardFooterRegion(card).locator('> div').first();
}

/** canonical: cardTitleText */
export function cardTitleText(card: Locator): Locator {
  return cardHeaderRegion(card).getByRole('heading').first();
}

/** canonical: cardOwnerText */
export function cardOwnerText(card: Locator): Locator {
  return cardHeaderRegion(card).getByText(/^Owned by /);
}

/** canonical: cardDescriptionText — library object description in cardHeaderRegion (absent on workflowCard per FR-CARD-002) */
export function cardDescriptionText(card: Locator, description: string): Locator {
  return cardHeaderRegion(card).getByText(description, { exact: true });
}

/** Matches course_flow/e2e_seed/constants.py template workflow titles */
export const E2E_FIXTURE_TEMPLATE_ACTIVITY_TITLE = 'E2E Activity Template';
export const E2E_FIXTURE_TEMPLATE_COURSE_TITLE = 'E2E Course Template';
export const E2E_FIXTURE_TEMPLATE_PROGRAM_TITLE = 'E2E Program Template';

export const E2E_FIXTURE_TEMPLATE_WORKFLOW_TITLES = [
  E2E_FIXTURE_TEMPLATE_ACTIVITY_TITLE,
  E2E_FIXTURE_TEMPLATE_COURSE_TITLE,
  E2E_FIXTURE_TEMPLATE_PROGRAM_TITLE,
] as const;

/** FR-CARD-005 success snackbar copy */
export const CARD_FAVOURITE_SNACKBAR_ADDED = 'Added to your favourites';
export const CARD_FAVOURITE_SNACKBAR_REMOVED = 'Removed from your favourites';

/** canonical: cardFavouriteToggle */
export function cardFavouriteToggle(card: Locator): Locator {
  return cardFooterRegion(card).getByRole('button', { name: 'Favourite', exact: true });
}

/** MUI theme courseflow.favouriteActive — FR-CARD-005 yellow star when favourited. */
export const CARD_FAVOURITE_ACTIVE_COLOR = 'rgb(255, 180, 0)';

/** FR-CARD-005 — cardFavouriteToggle shows yellow star when object is favourited. */
export async function expectCardFavouriteToggleShowsFavourited(card: Locator): Promise<void> {
  await expect(cardFavouriteToggle(card)).toHaveCSS('color', CARD_FAVOURITE_ACTIVE_COLOR);
}

/**
 * FR-CARD-005 — add/remove round-trip restores initial favourite state.
 * Asserts route unchanged on each click and success snackbar copy for add and remove.
 */
export async function expectCardFavouriteToggleRoundTrip(page: Page, card: Locator): Promise<void> {
  const toggle = cardFavouriteToggle(card);
  await expect(toggle).toBeVisible();

  const urlBefore = page.url();

  await toggle.click();
  await expect(page).toHaveURL(urlBefore);
  await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
  await expect(globalMessageSnackbar(page)).toHaveText(
    new RegExp(`^(${CARD_FAVOURITE_SNACKBAR_ADDED}|${CARD_FAVOURITE_SNACKBAR_REMOVED})$`),
  );
  const firstMessage = await globalMessageSnackbar(page).textContent();

  await toggle.click();
  await expect(page).toHaveURL(urlBefore);
  await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
  if (firstMessage === CARD_FAVOURITE_SNACKBAR_ADDED) {
    await expect(globalMessageSnackbar(page)).toHaveText(CARD_FAVOURITE_SNACKBAR_REMOVED);
  } else {
    await expect(globalMessageSnackbar(page)).toHaveText(CARD_FAVOURITE_SNACKBAR_ADDED);
  }
}

/** canonical: cardTypeChip | cardTemplateChip — chip by visible label inside cardFooterTagsRegion */
export function cardChipWithLabel(card: Locator, label: string): Locator {
  return cardFooterTagsRegion(card).getByText(label, { exact: true });
}

/** canonical: cardWorkflowCountChip — projectCard only when workflow count > 0 */
export function cardWorkflowCountChip(card: Locator): Locator {
  return cardFooterTagsRegion(card).getByText(/^\d+ workflows?$/, { exact: true });
}

export function cardWorkflowCountChipLabel(count: number): string {
  return count === 1 ? '1 workflow' : `${count} workflows`;
}

/** cardTypeChip label for workflowCard from manifest/API workflow_type (activity, course, program, …). */
export function workflowTypeChipLabel(workflowType: string): string {
  const labels: Record<string, string> = {
    activity: 'Activity',
    course: 'Course',
    program: 'Program',
    task: 'Task',
  };
  const label = labels[workflowType.trim().toLowerCase()];
  if (!label) {
    throw new Error(`Unsupported workflow type for cardTypeChip label: ${workflowType}`);
  }
  return label;
}

/** Archived presentation chip on archived projectCard / workflowCard (FR-CARD-006). */
export function cardArchivedChip(card: Locator): Locator {
  return cardFooterTagsRegion(card).getByText('Archived', { exact: true });
}

/** Card tile scoped by visible title (listing cards and dialog cards without data-test-id). */
export function cardByTitle(scope: Locator, title: string): Locator {
  return scope
    .locator('div')
    .filter({ has: scope.getByRole('heading', { name: title, exact: true }) });
}
export async function expectFollowsInDocumentOrder(earlier: Locator, later: Locator): Promise<void> {
  await expect
    .poll(async () => {
      const earlierHandle = await earlier.elementHandle();
      const laterHandle = await later.elementHandle();
      if (!earlierHandle || !laterHandle) {
        return false;
      }
      return earlierHandle.evaluate(
        (earlierEl, laterEl) =>
          Boolean(earlierEl.compareDocumentPosition(laterEl) & Node.DOCUMENT_POSITION_FOLLOWING),
        laterHandle,
      );
    })
    .toBe(true);
}

/** canonical: resultsRegion on library listing pages */
export function libraryResultsRegion(page: Page): Locator {
  return page.locator('[data-test-id="library-results"]');
}

export function libraryProjectCardByTitle(page: Page, title: string): Locator {
  return libraryResultsRegion(page)
    .locator('[data-test-id="project-card"]')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
}

export function libraryWorkflowCardByTitle(page: Page, title: string): Locator {
  return libraryResultsRegion(page)
    .locator('[data-test-id="workflow-card"]')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
}
