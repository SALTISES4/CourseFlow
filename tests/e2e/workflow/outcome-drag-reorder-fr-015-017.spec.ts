import { test, expect } from '../../fixtures';
import { loginAsTestUser } from '../../helpers/auth';
import { gotoOutcomesView } from './comments-tab.helpers';
import {
  attemptDragOutcomeOntoHeader,
  createOutcomeViaApi,
  DRAG_TITLE_PREFIX,
  dragOutcomeOntoHeader,
  ensureCollapsedHidingChild,
  ensureExpandedShowingChild,
  expectNoOutcomeReorderDropZoneOnHeader,
  expectOutcomeHeaderAtOrdinal,
  expectOutcomeHeaderFrDepth,
  outcomeUuidByTitle,
  reloadOutcomesView,
  rootOutcomeTitlesInOrder,
  whileDraggingOutcomeOntoHeader,
} from './outcome-drag.helpers';
import { loginAsWorkflowContributor } from './role.helpers';
import { workflowOutcomeHeader } from './workflow-outcome.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer', 'actor.editor'],
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
 * Role: Owner (main describes via actor.teacher); owner and editor (editor smoke tests); commenter/viewer (FR-WF-EO-015).
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
const GRANDCHILD_A = `${DRAG_TITLE_PREFIX} Grandchild A`;
const GRANDCHILD_B = `${DRAG_TITLE_PREFIX} Grandchild B`;
const CHILD_UNDER_B = `${DRAG_TITLE_PREFIX} Child Under B`;

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

  test('FR-WF-EO-016/007: level-1 insert-after sibling reorder updates ordinals', async ({
    page,
    workflow,
  }) => {
    const seedTitle = workflow.firstOutcome().title;
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_C });
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    await reloadOutcomesView(page, workflow.path);

    await expectOutcomeHeaderAtOrdinal(page, '1', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_C);
    await expectOutcomeHeaderAtOrdinal(page, '3', ROOT_B);

    await dragOutcomeOntoHeader(page, ROOT_B, seedTitle, 'after');

    await expectOutcomeHeaderAtOrdinal(page, '1', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);
    await expectOutcomeHeaderAtOrdinal(page, '3', ROOT_C);
  });

  test('FR-WF-EO-016: bottom-half O1 and top-half O2 resolve to the same insert slot', async ({
    page,
    workflow,
  }) => {
    const seedTitle = workflow.firstOutcome().title;
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_C });
    await reloadOutcomesView(page, workflow.path);

    await expectOutcomeHeaderAtOrdinal(page, '1', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);
    await expectOutcomeHeaderAtOrdinal(page, '3', ROOT_C);

    await dragOutcomeOntoHeader(page, ROOT_C, seedTitle, 'after');

    await expectOutcomeHeaderAtOrdinal(page, '1', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_C);
    await expectOutcomeHeaderAtOrdinal(page, '3', ROOT_B);
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

  test('FR-WF-EO-016/007: level-3 sibling reorder updates ordinals', async ({
    page,
    workflow,
  }) => {
    // FR: FR-WF-EO-016 AC — same-level reorder at max depth; ordinals per FR-WF-EO-007
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    const childUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD_A,
      parentUuid: childUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD_B,
      parentUuid: childUuid,
    });
    await reloadOutcomesView(page, workflow.path);

    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD_B);

    await expectOutcomeHeaderAtOrdinal(page, '1.1.1', GRANDCHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '1.1.2', GRANDCHILD_B);

    await dragOutcomeOntoHeader(page, GRANDCHILD_B, GRANDCHILD_A, 'before');

    await expectOutcomeHeaderAtOrdinal(page, '1.1.1', GRANDCHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.1.2', GRANDCHILD_A);
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

  test('FR-WF-EO-017/007: L2 combine onto L1 preserves level-3 subtree', async ({
    page,
    workflow,
  }) => {
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    const rootBUuid = await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    const childAUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD,
      parentUuid: childAUuid,
    });
    await reloadOutcomesView(page, workflow.path);

    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD);
    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '1.1.1', GRANDCHILD);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);

    await dragOutcomeOntoHeader(page, CHILD_A, ROOT_B, 'combine');

    await ensureExpandedShowingChild(page, ROOT_B, CHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD);
    await expectOutcomeHeaderFrDepth(page, CHILD_A, 2);
    await expectOutcomeHeaderFrDepth(page, GRANDCHILD, 3);
    await expectOutcomeHeaderAtOrdinal(page, '2.1', CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '2.1.1', GRANDCHILD);
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

test.describe('Combine nest — level-3 onto level-2 (FR-WF-EO-017)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, workflow.firstOutcome().title)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-EO-017/007: L3 combine onto L2 nests as last child', async ({ page, workflow }) => {
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    const rootBUuid = await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    const childAUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    const childBUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_B,
      parentUuid: rootBUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD,
      parentUuid: childBUuid,
    });
    await reloadOutcomesView(page, workflow.path);

    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, ROOT_B, CHILD_B);
    await ensureExpandedShowingChild(page, CHILD_B, GRANDCHILD);

    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '2.1', CHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '2.1.1', GRANDCHILD);

    await dragOutcomeOntoHeader(page, GRANDCHILD, CHILD_A, 'combine');

    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD);
    await expectOutcomeHeaderFrDepth(page, GRANDCHILD, 3);
    await expectOutcomeHeaderAtOrdinal(page, '1.1.1', GRANDCHILD);
    await expect(workflowOutcomeHeader(page, GRANDCHILD)).toHaveCount(1);
  });

  test('FR-WF-EO-017/007: L3 combine onto L2 with existing children appends last', async ({
    page,
    workflow,
  }) => {
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    const rootBUuid = await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    const childAUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    const childBUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_B,
      parentUuid: rootBUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD_A,
      parentUuid: childAUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD_B,
      parentUuid: childBUuid,
    });
    await reloadOutcomesView(page, workflow.path);

    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD_A);
    await ensureExpandedShowingChild(page, ROOT_B, CHILD_B);
    await ensureExpandedShowingChild(page, CHILD_B, GRANDCHILD_B);

    await dragOutcomeOntoHeader(page, GRANDCHILD_B, CHILD_A, 'combine');

    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.1.1', GRANDCHILD_A);
    await expectOutcomeHeaderAtOrdinal(page, '1.1.2', GRANDCHILD_B);
    await expectOutcomeHeaderFrDepth(page, GRANDCHILD_B, 3);
  });

  test('FR-WF-EO-017: collapsed L1 expands after combine drop', async ({ page, workflow }) => {
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    const rootBUuid = await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_UNDER_B,
      parentUuid: rootBUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_B,
      parentUuid: seedUuid,
    });
    await reloadOutcomesView(page, workflow.path);

    await ensureExpandedShowingChild(page, ROOT_B, CHILD_UNDER_B);
    await ensureCollapsedHidingChild(page, ROOT_B, CHILD_UNDER_B);
    await ensureExpandedShowingChild(page, seedTitle, CHILD_B);

    await dragOutcomeOntoHeader(page, CHILD_B, ROOT_B, 'combine');

    await ensureExpandedShowingChild(page, ROOT_B, CHILD_B);
    await ensureExpandedShowingChild(page, ROOT_B, CHILD_UNDER_B);
    await expectOutcomeHeaderAtOrdinal(page, '2.1', CHILD_UNDER_B);
    await expectOutcomeHeaderAtOrdinal(page, '2.2', CHILD_B);
  });
});

test.describe('Level invariance — outcomes move only at their FR depth (FR-WF-EO-016)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, workflow.firstOutcome().title)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('FR-WF-EO-016: L2 sibling reorder stays at level 2', async ({ page, workflow }) => {
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

    await expectOutcomeHeaderFrDepth(page, CHILD_A, 2);
    await expectOutcomeHeaderFrDepth(page, CHILD_B, 2);

    await dragOutcomeOntoHeader(page, CHILD_B, CHILD_A, 'before');

    await expectOutcomeHeaderFrDepth(page, CHILD_B, 2);
    await expectOutcomeHeaderFrDepth(page, CHILD_A, 2);
    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.2', CHILD_A);
  });

  test('FR-WF-EO-016: L2 reparent under another L1 stays at level 2', async ({ page, workflow }) => {
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

    await expectOutcomeHeaderFrDepth(page, CHILD_FROM_B, 2);

    await dragOutcomeOntoHeader(page, CHILD_FROM_B, CHILD_A, 'before');

    await expectOutcomeHeaderFrDepth(page, CHILD_FROM_B, 2);
    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_FROM_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.2', CHILD_A);
  });

  test('FR-WF-EO-016: L3 sibling reorder stays at level 3', async ({ page, workflow }) => {
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    const childUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD_A,
      parentUuid: childUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD_B,
      parentUuid: childUuid,
    });
    await reloadOutcomesView(page, workflow.path);
    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD_B);

    await dragOutcomeOntoHeader(page, GRANDCHILD_B, GRANDCHILD_A, 'before');

    await expectOutcomeHeaderFrDepth(page, GRANDCHILD_B, 3);
    await expectOutcomeHeaderFrDepth(page, GRANDCHILD_A, 3);
    await expectOutcomeHeaderAtOrdinal(page, '1.1.1', GRANDCHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.1.2', GRANDCHILD_A);
  });

  test('FR-WF-EO-016: L3 reparent under another L2 stays at level 3', async ({ page, workflow }) => {
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    const rootBUuid = await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    const childAUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    const childBUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_B,
      parentUuid: rootBUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD_A,
      parentUuid: childAUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD_B,
      parentUuid: childBUuid,
    });
    await reloadOutcomesView(page, workflow.path);

    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD_A);
    await ensureExpandedShowingChild(page, ROOT_B, CHILD_B);
    await ensureExpandedShowingChild(page, CHILD_B, GRANDCHILD_B);

    await dragOutcomeOntoHeader(page, GRANDCHILD_B, GRANDCHILD_A, 'before');

    await expectOutcomeHeaderFrDepth(page, GRANDCHILD_B, 3);
    await expectOutcomeHeaderFrDepth(page, GRANDCHILD_A, 3);
    await expectOutcomeHeaderAtOrdinal(page, '1.1.1', GRANDCHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.1.2', GRANDCHILD_A);
  });

  test('FR-WF-EO-016: L2 drag over L1 header shows no same-level reorder drop zone', async ({
    page,
    workflow,
  }) => {
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await reloadOutcomesView(page, workflow.path);
    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);

    await whileDraggingOutcomeOntoHeader(page, CHILD_A, seedTitle, 'before', async () => {
      await expectNoOutcomeReorderDropZoneOnHeader(page, seedTitle);
    });
  });

  test('FR-WF-EO-016: L3 drag over L1 header shows no same-level reorder drop zone', async ({
    page,
    workflow,
  }) => {
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    const childUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD_A,
      parentUuid: childUuid,
    });
    await reloadOutcomesView(page, workflow.path);
    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD_A);

    await whileDraggingOutcomeOntoHeader(page, GRANDCHILD_A, seedTitle, 'before', async () => {
      await expectNoOutcomeReorderDropZoneOnHeader(page, seedTitle);
    });
  });

  test('FR-WF-EO-016: L3 drag over L2 header shows no same-level reorder drop zone', async ({
    page,
    workflow,
  }) => {
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    const childUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD_A,
      parentUuid: childUuid,
    });
    await reloadOutcomesView(page, workflow.path);
    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD_A);

    await whileDraggingOutcomeOntoHeader(page, GRANDCHILD_A, CHILD_A, 'before', async () => {
      await expectNoOutcomeReorderDropZoneOnHeader(page, CHILD_A);
    });
  });

  test('FR-WF-EO-016: L3 drag over L2 header bottom half shows no reorder drop zone', async ({
    page,
    workflow,
  }) => {
    const seedTitle = workflow.firstOutcome().title;
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    const childUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_A,
      parentUuid: seedUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: GRANDCHILD_A,
      parentUuid: childUuid,
    });
    await reloadOutcomesView(page, workflow.path);
    await ensureExpandedShowingChild(page, seedTitle, CHILD_A);
    await ensureExpandedShowingChild(page, CHILD_A, GRANDCHILD_A);

    await whileDraggingOutcomeOntoHeader(page, GRANDCHILD_A, CHILD_A, 'after', async () => {
      await expectNoOutcomeReorderDropZoneOnHeader(page, CHILD_A);
    });
  });
});

test.describe('commenter and viewer permissions (FR-WF-EO-015)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  async function seedSecondRootOutcome(page: import('@playwright/test').Page, workflow: {
    graphUuid: string;
    path: string;
    firstOutcome: () => { title: string };
  }): Promise<string> {
    await loginAsTestUser(page);
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    await reloadOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, workflow.firstOutcome().title)).toBeVisible({
      timeout: 15_000,
    });
    await expect(workflowOutcomeHeader(page, ROOT_B)).toBeVisible({ timeout: 15_000 });
    return ROOT_B;
  }

  test('FR-WF-EO-015: commenter cannot drag reorder outcomes', async ({ page, workflow }) => {
    const seedTitle = workflow.firstOutcome().title;
    await seedSecondRootOutcome(page, workflow);

    await loginAsWorkflowContributor(page, workflow, 'commenter');
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, seedTitle)).toBeVisible({ timeout: 15_000 });
    await expect(workflowOutcomeHeader(page, ROOT_B)).toBeVisible({ timeout: 15_000 });

    const orderBefore = await rootOutcomeTitlesInOrder(page, workflow.path);
    await expectOutcomeHeaderAtOrdinal(page, '1', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);

    let moveRequested = false;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        /\/api\/outcome\/[^/]+\/move/.test(request.url())
      ) {
        moveRequested = true;
      }
    });

    await attemptDragOutcomeOntoHeader(page, ROOT_B, seedTitle, 'before');

    expect(moveRequested).toBe(false);
    await expect.poll(async () => rootOutcomeTitlesInOrder(page, workflow.path)).toEqual(
      orderBefore,
    );
    await expectOutcomeHeaderAtOrdinal(page, '1', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);
  });

  test('FR-WF-EO-015: viewer cannot drag reorder outcomes', async ({ page, workflow }) => {
    const seedTitle = workflow.firstOutcome().title;
    await seedSecondRootOutcome(page, workflow);

    await loginAsWorkflowContributor(page, workflow, 'viewer');
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, seedTitle)).toBeVisible({ timeout: 15_000 });
    await expect(workflowOutcomeHeader(page, ROOT_B)).toBeVisible({ timeout: 15_000 });

    const orderBefore = await rootOutcomeTitlesInOrder(page, workflow.path);
    await expectOutcomeHeaderAtOrdinal(page, '1', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);

    let moveRequested = false;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        /\/api\/outcome\/[^/]+\/move/.test(request.url())
      ) {
        moveRequested = true;
      }
    });

    await attemptDragOutcomeOntoHeader(page, ROOT_B, seedTitle, 'before');

    expect(moveRequested).toBe(false);
    await expect.poll(async () => rootOutcomeTitlesInOrder(page, workflow.path)).toEqual(
      orderBefore,
    );
    await expectOutcomeHeaderAtOrdinal(page, '1', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);
  });
});

test.describe('owner and editor (FR-WF-EO-016/017)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  async function seedReorderTargets(
    page: import('@playwright/test').Page,
    workflow: {
      graphUuid: string;
      path: string;
      firstOutcome: () => { title: string };
    },
  ): Promise<string> {
    await loginAsTestUser(page);
    const seedTitle = workflow.firstOutcome().title;
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    await reloadOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, seedTitle)).toBeVisible({ timeout: 15_000 });
    await expect(workflowOutcomeHeader(page, ROOT_B)).toBeVisible({ timeout: 15_000 });
    return seedTitle;
  }

  test('FR-WF-EO-016: editor can reorder level-1 siblings', async ({ page, workflow }) => {
    const seedTitle = await seedReorderTargets(page, workflow);

    await loginAsWorkflowContributor(page, workflow, 'editor');
    await gotoOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, seedTitle)).toBeVisible({ timeout: 15_000 });
    await expectOutcomeHeaderAtOrdinal(page, '1', seedTitle);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);

    await dragOutcomeOntoHeader(page, ROOT_B, seedTitle, 'before');

    await expectOutcomeHeaderAtOrdinal(page, '1', ROOT_B);
    await expectOutcomeHeaderAtOrdinal(page, '2', seedTitle);
  });

  test('FR-WF-EO-017: editor can combine L2 onto L1', async ({ page, workflow }) => {
    const seedTitle = workflow.firstOutcome().title;
    await loginAsTestUser(page);
    const seedUuid = await outcomeUuidByTitle(page, workflow.path, seedTitle);
    await createOutcomeViaApi(page, workflow.graphUuid, { title: ROOT_B });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: CHILD_B,
      parentUuid: seedUuid,
    });
    await reloadOutcomesView(page, workflow.path);
    await ensureExpandedShowingChild(page, seedTitle, CHILD_B);

    await loginAsWorkflowContributor(page, workflow, 'editor');
    await gotoOutcomesView(page, workflow.path);
    await ensureExpandedShowingChild(page, seedTitle, CHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '1.1', CHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '2', ROOT_B);

    await dragOutcomeOntoHeader(page, CHILD_B, ROOT_B, 'combine');

    await ensureExpandedShowingChild(page, ROOT_B, CHILD_B);
    await expectOutcomeHeaderAtOrdinal(page, '2.1', CHILD_B);
  });
});
