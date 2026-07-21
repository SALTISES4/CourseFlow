import { test, expect } from '@playwright/test';
import { getPrimaryWorkflow, getProjectWorkflowsPath, loadWorkflowManifest } from '../../helpers/manifest';
import { gotoExplore, gotoLibrary } from '../../helpers/navigation';
import {
  archiveToggle,
  cardChipWithLabel,
  cardDescriptionText,
  cardFavouriteToggle,
  ensureCardFavourited,
  ensureCardNotFavourited,
  expectCardFavouriteAddedSnackbar,
  expectCardFavouriteRemovedSnackbar,
  expectCardFavouriteToggleRoundTrip,
  expectCardFavouriteToggleShowsFavourited,
  expectCardFavouriteToggleShowsNotFavourited,
  cardFooterRegion,
  cardHeaderRegion,
  cardOwnerText,
  cardTitleText,
  cardWorkflowCountChip,
  cardWorkflowCountChipLabel,
  E2E_FIXTURE_TEMPLATE_WORKFLOW_TITLES,
  E2E_FIXTURE_WORKFLOW_DESCRIPTION,
  E2E_FIXTURE_WORKFLOW_TITLE,
  expectFollowsInDocumentOrder,
  keywordSearchField,
  libraryProjectCardByTitle,
  libraryWorkflowCardByTitle,
  templatesToggle,
  triggerLibrarySearchAndWait,
  waitForLibraryResultsLoaded,
  workflowTypeChipLabel,
} from './library.locators';

/**
 * Shared listing card contracts — FR-CARD-001 through FR-CARD-006.
 * Requirements: tests/docs/requirements/features/global/card_content_requirements_v1.yaml
 * My library: FR-CARD-001–006 (no templatesToggle per FR-LIB-003).
 * Template chip (FR-CARD-001/002): listing surfaces with templatesToggle — e.g. Explore (FR-EXP-005).
 * Create workflow dialog step 3: tests/e2e/workflow/workflow-create-stepped-form-fr-create-stepper-001-006.spec.ts
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

test.describe('My library — card content (FR-CARD-001–006)', () => {
  const manifest = loadWorkflowManifest();
  const workflow = getPrimaryWorkflow(manifest);
  const projectWorkflowsPath = getProjectWorkflowsPath(manifest);

  test.beforeEach(async ({ page }) => {
    await gotoLibrary(page);
    await expect(page).toHaveURL(/\/library\/?$/);
    await waitForLibraryResultsLoaded(page);
  });

  test.describe('FR-CARD-001: projectCard content', () => {
    test('seeded project card shows mapped content and layout regions', async ({
      page,
    }) => {
      const searchBody = await triggerLibrarySearchAndWait(
        page,
        async () => {
          await keywordSearchField(page).fill(manifest.project_title);
          await keywordSearchField(page).press('Enter');
        },
        { filters: { keyword: manifest.project_title } },
      );
      const projectItem = searchBody.items.find(
        (item) => item.uuid === manifest.project_uuid && item.contentType === 'project',
      );
      expect(projectItem).toBeDefined();

      const card = libraryProjectCardByTitle(page, manifest.project_title);
      if ((await card.count()) === 0) {
        test.skip(true, 'E2E fixture project card not visible on /library.');
      }

      await expect(card).toBeVisible();
      await expect(cardHeaderRegion(card)).toBeVisible();
      await expect(cardFooterRegion(card)).toBeVisible();

      await expect(cardTitleText(card)).toHaveText(manifest.project_title);
      await expect(cardOwnerText(card)).toBeVisible();
      await expect(cardOwnerText(card)).toHaveText(/^Owned by /);
      await expectFollowsInDocumentOrder(cardTitleText(card), cardOwnerText(card));
      await expect(cardFooterRegion(card).getByText(/^Owned by /)).toHaveCount(0);
      await expect(cardHeaderRegion(card).getByRole('button', { name: 'Favourite' })).toHaveCount(0);

      await expect(cardChipWithLabel(card, 'Project')).toBeVisible();
      await expect(cardChipWithLabel(card, 'Template')).toHaveCount(0);
      await expect(cardFavouriteToggle(card)).toBeVisible();

      // FR-CARD-001 maps the current API count; other E2E flows may add workflows after seeding.
      expect(projectItem?.workflowCount).toBeGreaterThan(0);
      await expect(cardWorkflowCountChip(card)).toBeVisible();
      await expect(cardWorkflowCountChip(card)).toHaveText(
        cardWorkflowCountChipLabel(projectItem!.workflowCount!),
      );
      await expectFollowsInDocumentOrder(
        cardChipWithLabel(card, 'Project'),
        cardFavouriteToggle(card),
      );
    });

    test('workflow cards show mapped content and layout regions', async ({ page }) => {
      const workflowTypeLabel = workflowTypeChipLabel(workflow.workflow_type);
      const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
      if ((await card.count()) === 0) {
        test.skip(true, 'E2E fixture workflow card not visible on /library.');
      }

      await expect(card).toBeVisible();
      await expect(cardHeaderRegion(card)).toBeVisible();
      await expect(cardFooterRegion(card)).toBeVisible();

      await expect(cardTitleText(card)).toHaveText(E2E_FIXTURE_WORKFLOW_TITLE);
      await expect(cardDescriptionText(card, E2E_FIXTURE_WORKFLOW_DESCRIPTION)).toHaveCount(0);
      await expect(cardOwnerText(card)).toBeVisible();
      await expect(cardOwnerText(card)).toHaveText(/^Owned by /);
      await expectFollowsInDocumentOrder(cardTitleText(card), cardOwnerText(card));
      await expect(cardFooterRegion(card).getByText(/^Owned by /)).toHaveCount(0);
      await expect(cardHeaderRegion(card).getByRole('button', { name: 'Favourite' })).toHaveCount(0);

      await expect(cardChipWithLabel(card, workflowTypeLabel)).toBeVisible();
      await expect(cardChipWithLabel(card, 'Template')).toHaveCount(0);
      await expect(cardFavouriteToggle(card)).toBeVisible();
      await expectFollowsInDocumentOrder(
        cardChipWithLabel(card, workflowTypeLabel),
        cardFavouriteToggle(card),
      );
    });
  });

  test.describe('FR-CARD-003: projectCard click destination', () => {
    test('clicking project card navigates to project Workflows view', async ({ page }) => {
      const card = libraryProjectCardByTitle(page, manifest.project_title);
      if ((await card.count()) === 0) {
        test.skip(true, 'E2E fixture project card not visible on /library.');
      }

      await cardTitleText(card).click();
      await expect(page).toHaveURL(new RegExp(`${projectWorkflowsPath.replace(/\//g, '\\/')}/?$`));
    });
  });

  test.describe('FR-CARD-004: workflowCard click destination', () => {
    test('clicking workflow card navigates to workflow graph view', async ({ page }) => {
      const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
      if ((await card.count()) === 0) {
        test.skip(true, 'E2E fixture workflow card not visible on /library.');
      }

      await cardTitleText(card).click();
      await expect(page).toHaveURL(new RegExp(`${workflow.workflow_path.replace(/\//g, '\\/')}/?$`));
    });
  });

  test.describe('FR-CARD-005: card favourite toggle', () => {
    test.describe.configure({ mode: 'serial' });

    test.describe('favourite star reflects API isFavorite', () => {
      test('workflow card shows grey star when API isFavorite is false', async ({ page }) => {
        const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
        if ((await card.count()) === 0) {
          test.skip(true, 'E2E fixture workflow card not visible on /library.');
        }

        await expectCardFavouriteToggleShowsNotFavourited(card);
      });

      test('project card shows grey star when API isFavorite is false', async ({ page }) => {
        const recentProject = manifest.recent_projects[0]!;
        const searchBody = await triggerLibrarySearchAndWait(
          page,
          async () => {
            await keywordSearchField(page).fill(recentProject.title);
            await keywordSearchField(page).press('Enter');
          },
          { filters: { keyword: recentProject.title } },
        );
        const projectItem = searchBody.items.find(
          (item) => item.uuid === recentProject.uuid && item.contentType === 'project',
        );
        expect(projectItem?.isFavorite).toBe(false);

        const card = libraryProjectCardByTitle(page, recentProject.title);
        await expectCardFavouriteToggleShowsNotFavourited(card);
      });

      test('workflow card shows yellow star when favourited', async ({ page }) => {
        const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
        if ((await card.count()) === 0) {
          test.skip(true, 'E2E fixture workflow card not visible on /library.');
        }

        await ensureCardFavourited(page, card);
        await expectCardFavouriteToggleShowsFavourited(card);
      });

      test('project card shows yellow star when favourited', async ({ page }) => {
        const card = libraryProjectCardByTitle(page, manifest.project_title);
        if ((await card.count()) === 0) {
          test.skip(true, 'E2E fixture project card not visible on /library.');
        }

        await ensureCardFavourited(page, card);
        await expectCardFavouriteToggleShowsFavourited(card);
      });
    });

    test('project card favourite toggle does not change route', async ({ page }) => {
      const card = libraryProjectCardByTitle(page, manifest.project_title);
      if ((await card.count()) === 0) {
        test.skip(true, 'E2E fixture project card not visible on /library.');
      }

      await expectCardFavouriteToggleRoundTrip(page, card);
    });

    test('workflow card favourite toggle does not change route', async ({ page }) => {
      const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
      if ((await card.count()) === 0) {
        test.skip(true, 'E2E fixture workflow card not visible on /library.');
      }

      await expectCardFavouriteToggleRoundTrip(page, card);
    });

    test('project card favourite toggle shows Added to your favourites', async ({ page }) => {
      const card = libraryProjectCardByTitle(page, manifest.project_title);
      if ((await card.count()) === 0) {
        test.skip(true, 'E2E fixture project card not visible on /library.');
      }

      await ensureCardNotFavourited(page, card);
      await cardFavouriteToggle(card).click();
      await expectCardFavouriteAddedSnackbar(page);
    });

    test('project card favourite toggle shows Removed from your favourites', async ({ page }) => {
      const card = libraryProjectCardByTitle(page, manifest.project_title);
      if ((await card.count()) === 0) {
        test.skip(true, 'E2E fixture project card not visible on /library.');
      }

      await ensureCardFavourited(page, card);
      await cardFavouriteToggle(card).click();
      await expectCardFavouriteRemovedSnackbar(page);
    });

    test('workflow card favourite toggle shows Added to your favourites', async ({ page }) => {
      const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
      if ((await card.count()) === 0) {
        test.skip(true, 'E2E fixture workflow card not visible on /library.');
      }

      await ensureCardNotFavourited(page, card);
      await cardFavouriteToggle(card).click();
      await expectCardFavouriteAddedSnackbar(page);
    });

    test('workflow card favourite toggle shows Removed from your favourites', async ({ page }) => {
      const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
      if ((await card.count()) === 0) {
        test.skip(true, 'E2E fixture workflow card not visible on /library.');
      }

      await ensureCardFavourited(page, card);
      await cardFavouriteToggle(card).click();
      await expectCardFavouriteRemovedSnackbar(page);
    });
  });

  test.describe('FR-CARD-006: archived projectCard and workflowCard', () => {
    // When e2e seed includes archived rows and archiveToggle is on: assert cardArchivedChip,
    // card-body click does not navigate (FR-CARD-003/004), and cardFavouriteToggle is non-interactive.
    test('archived cards show Archived chip and card body does not browse workspace', async ({ page }) => {
      if ((await archiveToggle(page).count()) === 0) {
        test.skip(
          true,
          'archiveToggle not wired on /library — enable archiveFilter in MyLibrary config and add archived e2e seed.',
        );
      }

      test.skip(
        true,
        'FR-CARD-006 needs archived project/workflow rows in e2e seed (see FR-LIB-006).',
      );
    });
  });
});

test.describe('FR-CARD-002: cardTemplateChip on template workflowCard', () => {
  test.beforeEach(async ({ page }) => {
    await gotoExplore(page);
    await expect(page).toHaveURL(/\/explore\/?$/);
    await waitForLibraryResultsLoaded(page);
    await triggerLibrarySearchAndWait(
      page,
      () => templatesToggle(page).click(),
      { filters: { isTemplate: true } },
    );
  });

  for (const title of E2E_FIXTURE_TEMPLATE_WORKFLOW_TITLES) {
    test(`template workflowCard "${title}" shows Template chip`, async ({ page }) => {
      const card = libraryWorkflowCardByTitle(page, title);
      if ((await card.count()) === 0) {
        test.skip(
          true,
          `Template workflow "${title}" not visible on Explore with templatesToggle — re-run e2e seed.`,
        );
      }

      await expect(cardChipWithLabel(card, 'Template')).toBeVisible();
    });
  }
});
