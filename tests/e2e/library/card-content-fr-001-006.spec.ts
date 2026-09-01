import { test, expect, type Locator, type Page } from '../../fixtures';
import { authenticatedApiRequest } from '../../helpers/api';
import {
  cleanupLibraryLifecycleFixture,
  createArchivedWorkflowFixture,
} from '../../helpers/library-lifecycle';
import {
  getPrimaryWorkflow,
  getProjectWorkflowsPath,
  getWorkflowByType,
  loadWorkflowManifest,
} from '../../helpers/manifest';
import { gotoExplore, gotoLibrary } from '../../helpers/navigation';
import {
  archiveToggle,
  cardArchivedChip,
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
  libraryCardByTitle,
  libraryProjectCardByTitle,
  libraryWorkflowCardByTitle,
  projectCardDeletePermanentlyButton,
  projectCardRestoreButton,
  selectFilterOption,
  templatesToggle,
  triggerLibrarySearchAndWait,
  typeFilter,
  waitForLibraryResultsLoaded,
  workflowCardDeletePermanentlyButton,
  workflowCardRestoreButton,
  workflowTypeChipLabel,
} from './library.locators';

test.use({
  seedDependencies: [
    'actor.teacher',
    'project.primary',
    'project.recent_collection',
    'project.archived_home',
    'workflow.standard_activity',
    'workflow.navigation_course',
  ],
});

/**
 * Shared listing card contracts — FR-CARD-001 through FR-CARD-006.
 * Requirements: tests/docs/requirements/features/global/card_content_requirements_v1.yaml
 * My library: FR-CARD-001–006 (no templatesToggle per FR-LIB-003).
 * Template chip (FR-CARD-001/002): listing surfaces with templatesToggle — e.g. Explore (FR-EXP-005).
 * Create workflow dialog step 3: tests/e2e/workflow/workflow-create-stepped-form-fr-create-stepper-001-006.spec.ts
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

/**
 * My library first-lands on typeFilter 'Projects' (FR-LIB-001).
 * Commit Workflows and optionally keyword-narrow so a workflowCard is visible.
 */
async function showLibraryWorkflowCards(
  page: Page,
  workflowTitle: string = E2E_FIXTURE_WORKFLOW_TITLE,
) {
  await triggerLibrarySearchAndWait(
    page,
    () => selectFilterOption(page, typeFilter(page), 'Workflows'),
    { filters: { contentType: 'workflow' } },
  );
  await expect(typeFilter(page)).toHaveText('Workflows');
  return triggerLibrarySearchAndWait(
    page,
    async () => {
      await keywordSearchField(page).fill(workflowTitle);
      await keywordSearchField(page).press('Enter');
    },
    { filters: { contentType: 'workflow', keyword: workflowTitle } },
  );
}

async function showLibraryProjectCard(page: Page, projectTitle: string) {
  const searchBody = await triggerLibrarySearchAndWait(
    page,
    async () => {
      await keywordSearchField(page).fill(projectTitle);
      await keywordSearchField(page).press('Enter');
    },
    { filters: { contentType: 'project', keyword: projectTitle } },
  );
  const card = libraryProjectCardByTitle(page, projectTitle);
  await expect(card).toBeVisible();
  return { card, searchBody };
}

type FavouriteLibraryItem = {
  uuid: string;
  title: string;
  contentType: 'project' | 'workflow';
};

async function readLibraryItemFavouriteState(
  page: Page,
  item: FavouriteLibraryItem,
): Promise<boolean> {
  const response = await authenticatedApiRequest(page, 'POST', '/api/library/search', {
    data: {
      pagination: { page: 0, resultsPerPage: 10 },
      filters: {
        keyword: item.title,
        contentType: item.contentType,
        isArchived: false,
      },
    },
  });
  expect(
    response.ok(),
    `Could not read favourite state for ${item.contentType} ${item.uuid}`,
  ).toBeTruthy();

  const body = (await response.json()) as {
    items: Array<{ uuid: string; contentType: string; isFavorite: boolean }>;
  };
  const match = body.items.find(
    (candidate) =>
      candidate.uuid === item.uuid && candidate.contentType === item.contentType,
  );
  expect(
    match,
    `Library search did not return ${item.contentType} ${item.uuid}`,
  ).toBeDefined();
  return match!.isFavorite;
}

async function restoreLibraryItemFavouriteState(
  page: Page,
  item: FavouriteLibraryItem,
  expectedState: boolean,
): Promise<void> {
  if ((await readLibraryItemFavouriteState(page, item)) === expectedState) {
    return;
  }

  const response = await authenticatedApiRequest(page, 'POST', '/api/library/favorite', {
    data: { uuid: item.uuid },
  });
  expect(
    response.ok(),
    `Could not restore favourite state for ${item.contentType} ${item.uuid}`,
  ).toBeTruthy();
  expect(await readLibraryItemFavouriteState(page, item)).toBe(expectedState);
}

async function withRestoredFavouriteState(
  page: Page,
  item: FavouriteLibraryItem,
  assertion: () => Promise<void>,
): Promise<void> {
  const initialState = await readLibraryItemFavouriteState(page, item);
  try {
    await assertion();
  } finally {
    await restoreLibraryItemFavouriteState(page, item, initialState);
  }
}

async function showArchivedProjects(page: Page): Promise<void> {
  await triggerLibrarySearchAndWait(page, () => archiveToggle(page).click(), {
    filters: { contentType: 'project', isArchived: true },
  });
}

async function showArchivedWorkflows(page: Page): Promise<void> {
  await triggerLibrarySearchAndWait(
    page,
    () => selectFilterOption(page, typeFilter(page), 'Workflows'),
    { filters: { contentType: 'workflow' } },
  );
  await triggerLibrarySearchAndWait(page, () => archiveToggle(page).click(), {
    filters: { contentType: 'workflow', isArchived: true },
  });
}

/** FR-CARD-006 / FR-LIB-006 — Owner lifecycle actions are opacity-hidden until card hover. */
async function expectOwnerLifecycleActionsRevealedOnHover(
  card: Locator,
  restoreButton: Locator,
  deleteButton: Locator,
): Promise<void> {
  const actions = card.locator('.library-lifecycle-actions');
  await expect(actions).toHaveCSS('opacity', '0');
  await card.hover();
  await expect(actions).toHaveCSS('opacity', '1');
  await expect(restoreButton).toBeVisible();
  await expect(deleteButton).toBeVisible();
}

test.describe('My library — card content (FR-CARD-001–006)', () => {
  const manifest = loadWorkflowManifest();
  const workflow = getPrimaryWorkflow(manifest);
  const courseWorkflow = getWorkflowByType(manifest, 'course');
  const courseWorkflowTitle =
    manifest.navigation_linked_workflows?.course.workflow_title ?? 'E2E Course Workflow';
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
      const { card, searchBody } = await showLibraryProjectCard(page, manifest.project_title);
      const projectItem = searchBody.items.find(
        (item) => item.uuid === manifest.project_uuid && item.contentType === 'project',
      );
      expect(projectItem).toBeDefined();

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
      await showLibraryWorkflowCards(page);

      const workflowTypeLabel = workflowTypeChipLabel(workflow.workflow_type);
      const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
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
      const { card } = await showLibraryProjectCard(page, manifest.project_title);
      await cardTitleText(card).click();
      await expect(page).toHaveURL(new RegExp(`${projectWorkflowsPath.replace(/\//g, '\\/')}/?$`));
    });
  });

  test.describe('FR-CARD-004: workflowCard click destination', () => {
    test('clicking workflow card navigates to workflow graph view', async ({ page }) => {
      await showLibraryWorkflowCards(page);

      const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
      await expect(card).toBeVisible();
      await cardTitleText(card).click();
      await expect(page).toHaveURL(new RegExp(`${workflow.workflow_path.replace(/\//g, '\\/')}/?$`));
    });
  });

  test.describe('FR-CARD-005: card favourite toggle', () => {
    test.describe.configure({ mode: 'default' });

    const primaryProject: FavouriteLibraryItem = {
      uuid: manifest.project_uuid,
      title: manifest.project_title,
      contentType: 'project',
    };
    const primaryWorkflow: FavouriteLibraryItem = {
      uuid: workflow.workflow_uuid,
      title: E2E_FIXTURE_WORKFLOW_TITLE,
      contentType: 'workflow',
    };

    test.describe('favourite star reflects API isFavorite', () => {
      test('workflow card shows grey star when API isFavorite is false', async ({ page }) => {
        // Seed favourites the primary activity workflow; course is not favourited.
        const searchBody = await showLibraryWorkflowCards(page, courseWorkflowTitle);
        const workflowItem = searchBody.items.find(
          (item) =>
            item.uuid === courseWorkflow.workflow_uuid && item.contentType === 'workflow',
        );
        expect(workflowItem?.isFavorite).toBe(false);

        const card = libraryWorkflowCardByTitle(page, courseWorkflowTitle);
        await expect(card).toBeVisible();
        await expectCardFavouriteToggleShowsNotFavourited(card);
      });

      test('project card shows grey star when API isFavorite is false', async ({ page }) => {
        const recentProject = manifest.recent_projects[0]!;
        const { card, searchBody } = await showLibraryProjectCard(page, recentProject.title);
        const projectItem = searchBody.items.find(
          (item) => item.uuid === recentProject.uuid && item.contentType === 'project',
        );
        expect(projectItem?.isFavorite).toBe(false);

        await expectCardFavouriteToggleShowsNotFavourited(card);
      });

      test('workflow card shows yellow star when favourited', async ({ page }) => {
        await showLibraryWorkflowCards(page);

        const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
        await expect(card).toBeVisible();
        await withRestoredFavouriteState(page, primaryWorkflow, async () => {
          await ensureCardFavourited(page, card);
          await expectCardFavouriteToggleShowsFavourited(card);
        });
      });

      test('project card shows yellow star when favourited', async ({ page }) => {
        const { card } = await showLibraryProjectCard(page, manifest.project_title);
        await withRestoredFavouriteState(page, primaryProject, async () => {
          await ensureCardFavourited(page, card);
          await expectCardFavouriteToggleShowsFavourited(card);
        });
      });
    });

    test('project card favourite toggle does not change route', async ({ page }) => {
      const { card } = await showLibraryProjectCard(page, manifest.project_title);
      await withRestoredFavouriteState(page, primaryProject, async () => {
        await expectCardFavouriteToggleRoundTrip(page, card);
      });
    });

    test('workflow card favourite toggle does not change route', async ({ page }) => {
      await showLibraryWorkflowCards(page);

      const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
      await expect(card).toBeVisible();
      await withRestoredFavouriteState(page, primaryWorkflow, async () => {
        await expectCardFavouriteToggleRoundTrip(page, card);
      });
    });

    test('project card favourite toggle shows Added to your favourites', async ({ page }) => {
      const { card } = await showLibraryProjectCard(page, manifest.project_title);
      await withRestoredFavouriteState(page, primaryProject, async () => {
        await ensureCardNotFavourited(page, card);
        await cardFavouriteToggle(card).click();
        await expectCardFavouriteAddedSnackbar(page);
      });
    });

    test('project card favourite toggle shows Removed from your favourites', async ({ page }) => {
      const { card } = await showLibraryProjectCard(page, manifest.project_title);
      await withRestoredFavouriteState(page, primaryProject, async () => {
        await ensureCardFavourited(page, card);
        await cardFavouriteToggle(card).click();
        await expectCardFavouriteRemovedSnackbar(page);
      });
    });

    test('workflow card favourite toggle shows Added to your favourites', async ({ page }) => {
      await showLibraryWorkflowCards(page);

      const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
      await expect(card).toBeVisible();
      await withRestoredFavouriteState(page, primaryWorkflow, async () => {
        await ensureCardNotFavourited(page, card);
        await cardFavouriteToggle(card).click();
        await expectCardFavouriteAddedSnackbar(page);
      });
    });

    test('workflow card favourite toggle shows Removed from your favourites', async ({ page }) => {
      await showLibraryWorkflowCards(page);

      const card = libraryWorkflowCardByTitle(page, E2E_FIXTURE_WORKFLOW_TITLE);
      await expect(card).toBeVisible();
      await withRestoredFavouriteState(page, primaryWorkflow, async () => {
        await ensureCardFavourited(page, card);
        await cardFavouriteToggle(card).click();
        await expectCardFavouriteRemovedSnackbar(page);
      });
    });
  });

  test.describe('FR-CARD-006: archived projectCard and workflowCard', () => {
    test('archived projectCard shows Archived chip, no favourite, Owner hover restore/delete, and card body does not browse', async ({
      page,
    }) => {
      await showArchivedProjects(page);

      const card = libraryCardByTitle(page, manifest.archived_home_project.title);
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('data-test-id', 'project-card');
      await expect(cardArchivedChip(card)).toBeVisible();
      await expect(cardFavouriteToggle(card)).toHaveCount(0);
      await expectOwnerLifecycleActionsRevealedOnHover(
        card,
        projectCardRestoreButton(card),
        projectCardDeletePermanentlyButton(card),
      );

      await cardTitleText(card).click();
      await expect(page).toHaveURL(/\/library\/?$/);
    });

    test('archived workflowCard uses pointer cursor only for lifecycle actions', async ({
      page,
    }) => {
      const fixture = await createArchivedWorkflowFixture(page, 'fr-card-006');

      try {
        await showArchivedWorkflows(page);
        const card = libraryCardByTitle(page, fixture.workflowTitle!);
        await expect(card).toBeVisible();
        await expect(card).toHaveAttribute('data-test-id', 'workflow-card');
        await expect(cardArchivedChip(card)).toBeVisible();
        await expect(cardFavouriteToggle(card)).toHaveCount(0);
        const restoreButton = workflowCardRestoreButton(card);
        const deleteButton = workflowCardDeletePermanentlyButton(card);
        await expectOwnerLifecycleActionsRevealedOnHover(
          card,
          restoreButton,
          deleteButton,
        );

        await expect(card).toHaveCSS('cursor', 'default');
        await restoreButton.hover();
        await expect(restoreButton).toHaveCSS('cursor', 'pointer');
        await deleteButton.hover();
        await expect(deleteButton).toHaveCSS('cursor', 'pointer');

        await cardTitleText(card).click();
        await expect(page).toHaveURL(/\/library\/?$/);
      } finally {
        await cleanupLibraryLifecycleFixture(page, fixture);
      }
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
      await expect(card).toBeVisible();
      await expect(cardChipWithLabel(card, 'Template')).toBeVisible();
    });
  }
});
