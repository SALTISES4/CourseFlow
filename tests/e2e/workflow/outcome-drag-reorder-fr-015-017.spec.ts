import { test, expect } from '../../fixtures';
import { gotoOutcomesView } from './comments-tab.helpers';
import {
  DRAG_TITLE_PREFIX,
  createOutcomeViaApi,
  dragOutcomeOntoHeader,
  ensureExpandedShowingChild,
  expectOutcomeHeaderAtOrdinal,
  outcomeUuidByTitle,
  reloadOutcomesView,
} from './outcome-drag.helpers';
import { workflowOutcomeHeader } from './workflow-outcome.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Outcome tree drag reorder / reparent / nest — FR-WF-EO-015 through FR-WF-EO-017,
 * with post-move ordinal recompute per FR-WF-EO-007.
 *
 * Requirements:
 * - workflow_outcome_tree_drag_reorder_requirements_v1.yaml
 * - workflow_edit_outcome_requirements_v1.yaml (FR-WF-EO-007)
 *
 * Role: Owner/Editor (chromium storage state)
 *
 * Setup uses the graph outcome API so tree shape is independent of hover-menu tooltip
 * copy gaps (FR vs product labels on Insert sibling/child).
 */

const ROOT_B = `${DRAG_TITLE_PREFIX} Root B`;
const ROOT_C = `${DRAG_TITLE_PREFIX} Root C`;
const CHILD_A = `${DRAG_TITLE_PREFIX} Child A`;
const CHILD_B = `${DRAG_TITLE_PREFIX} Child B`;
const CHILD_FROM_B = `${DRAG_TITLE_PREFIX} Child From B`;
const GRANDCHILD = `${DRAG_TITLE_PREFIX} Grandchild`;

test.describe('outcome tree drag reorder ordinals (FR-WF-EO-015/016/017 + EO-007)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, workflow.firstOutcome().title)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-EO-016/007: level-1 sibling reorder updates ordinals', async ({
    page,
    workflow,
  }) => {
    // FR: FR-WF-EO-016 AC — drag B insert-before A → (B, A); ordinals per FR-WF-EO-007
    const seedTitle = workflow.firstOutcome().title;
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    await reloadOutcomesView(page, workflow.path);

    await expectOutcomeHeaderAtOrdinal(page, '1', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);

    await dragOutcomeOntoHeader(page, ROOT_B, seedTitle, 'before');

    await expectOutcomeHeaderAtOrdinal(page, '1', ROOT_B);
    await expectOutcomeHeaderAtOrdinal(page, '2', seedTitle);
  });

  test('FR-WF-EO-016/007: level-2 sibling reorder updates ordinals', async ({
    page,
    workflow,
  }) => {
    // FR: FR-WF-EO-016 AC — reorder among children under same parent; ordinals recompute
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_B,
      parentUuid: seedUuid,
    });
    await reloadOutcomesView(page, workflow.path);

    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, seedTitle, CHILD_B);

    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '1.2', CHILD_B);

    await dragOutcomeOntoHeader(page, CHILD_B, CHILD_A, 'before');

    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.2', CHILD_A);
  });

  test('FR-WF-EO-016/007: reparent into another parent updates ordinals', async ({
    page,
    workflow,
  }) => {
    // FR: FR-WF-EO-016 AC — same-level reparent insert-before Ck; ordinals shift under destination
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    const rootBUuid = await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_FROM_B,
      parentUuid: rootBUuid,
    });
    await reloadOutcomesView(page, workflow.path);

    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, ROOT_B, CHILD_FROM_B);

    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '2.1', CHILD_FROM_B);

    await dragOutcomeOntoHeader(page, CHILD_FROM_B, CHILD_A, 'before');

    await ensureExpandedShowingChild(page, seedTitle, CHILD_FROM_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_FROM_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.2', CHILD_A);
    await expect(workflowOutcomeHeader(page, CHILD_FROM_B)).toHaveCount(1);
  });

  test('FR-WF-EO-016/007: moving level-1 with subtree updates descendant ordinals', async ({
    page,
    workflow,
  }) => {
    // FR: FR-WF-EO-016 AC — subtree travels; FR-WF-EO-007 recomputes descendant prefixes
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await reloadOutcomesView(page, workflow.path);

    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '1', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);

    await dragOutcomeOntoHeader(page, seedTitle, ROOT_B, 'after');

    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '1', ROOT_B);
    await expectOutcomeHeaderAtOrdinal(page, '2', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '2.1', CHILD_A);
  });

  test('FR-WF-EO-017/007: combine nest as last child updates ordinals', async ({
    page,
    workflow,
  }) => {
    // FR: FR-WF-EO-017 AC — level-2 onto level-1 combine → last child; ordinals per FR-WF-EO-007
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_B,
      parentUuid: seedUuid,
    });
    await reloadOutcomesView(page, workflow.path);

    await ensureExpandedShowingChild(page, seedTitle, CHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '1.2', CHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);

    await dragOutcomeOntoHeader(page, CHILD_B, ROOT_B, 'combine');

    await ensureExpandedShowingChild(page, ROOT_B, CHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '2.1', CHILD_B);
  });

  test('FR-WF-EO-016/007: subtree children keep relative order under new parent ordinal', async ({
    page,
    workflow,
  }) => {
    // FR: FR-WF-EO-016 AC — descendants stay under source; relative order preserved after L1 move
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_C });
    const childUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD,
      parentUuid: childUuid,
    });
    await reloadOutcomesView(page, workflow.path);

    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD);

    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '1.1.1', GRANDCHILD);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);
    await expectOutcomeHeaderAtOrdinal(page, '3', ROOT_C);

    await dragOutcomeOntoHeader(page, seedTitle, ROOT_C, 'after');

    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD);
    await expectOutcomeHeaderAtOrdinal(page, '1', ROOT_B);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_C);
    await expectOutcomeHeaderAtOrdinal(page, '3', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '3.1', CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '3.1.1', GRANDCHILD);
  });
});
