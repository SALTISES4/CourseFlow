import { test, expect } from '../../fixtures';
import {
  gotoOutcomesView,
  hoverWorkflowOutcomeHeader,
  firstWorkflowNodeUuid,
  secondWorkflowNodeUuid,
} from './comments-tab.helpers';
import {
  createSidebarDuplicate,
  E2E_OUTCOME_CHILD_A_TITLE,
  E2E_OUTCOME_CHILD_B_TITLE,
  E2E_OUTCOME_CHILD_TITLE,
  E2E_OUTCOME_DUPLICATE,
  E2E_OUTCOME_GRANDCHILD_TITLE,
  E2E_OUTCOME_TITLE,
  linkOutcomeToNodeViaApi,
  seedThreeLevelSubtreeViaApi,
  seedTwoChildOutcomesViaApi,
} from './outcome-duplicate-delete.helpers';
import { ensureExpandedShowingChild, fetchGraphOutcomes } from './outcome-drag.helpers';
import {
  assignTabOutcomeRowHasHighlightBorder,
  clickAssignTabOutcomeRow,
  collectAllAssignTabLevel1HeaderGroups,
  assignTabGroupsContainingOutcomeTitle,
  collectAssignTabGroupTitles,
  collectAssignTabNestedHeadersUnderParent,
  countWorkflowNodesWithOutcomeDropTargetBorder,
  createProjectTagViaApi,
  dragAssignTabOutcomeOntoNode,
  dragAssignTabOutcomeOverNode,
  E2E_SEED_OUTCOME_HEADER,
  expectAssignTabMatchesOutcomesViewTree,
  expectLevel1HeaderOrder,
  expectNestedHeaderOrder,
  expectNavigatedToOutcomesView,
  expectNodeOutcomeUuids,
  expandAssignTabOutcomeRow,
  level1OutcomeHeaderPattern,
  linkOutcomesToNodeViaApi,
  moveOutcomeViaApi,
  nestedOutcomeHeaderPattern,
  openLinkedOutcomesPopover,
  openLinkedOutcomesPopoverForNode,
  openWorkflowOutcomesTab,
  patchOutcomeViaApi,
  revealLinkedPopoverOutcomeRows,
  unlinkLinkedOutcomeFromPopover,
  workflowNodeHasOutcomeDropTargetBorder,
  workflowNodeHasOutcomeHighlightBorder,
} from './workflow-assign-outcome.helpers';
import {
  createOutcomeViaApi,
  resetOutcomeTreeToSeedOnly,
} from './outcome-drag.helpers';
import {
  workflowNodeLinkedOutcomeRow,
  workflowNodeLinkedOutcomesBadge,
  workflowNodeLinkedOutcomesPopover,
  workflowOutcomesAssignTabAddOutcomesButton,
  workflowOutcomesAssignTabEditOutcomesButton,
  workflowOutcomesAssignTabEmptyStateAlert,
  workflowOutcomesAssignTabOutcomeRow,
  workflowOutcomesAssignTabUntaggedGroupTitle,
} from './workflow-assign-outcome.locators';
import { fetchGraphView, nodeByUuid } from './workflow-graph.helpers';
import {
  workflowOutcomeHoverDeleteItem,
  workflowOutcomeHeader,
  workflowOutcomeHeaderTitleText,
  revealOutcomeByOrdinalPath,
} from './workflow-outcome.locators';
import {
  workflowRightSidebarOutcomesTab,
  workflowRightSidebarOutcomesTabContent,
} from '../../shared/locators/workflow';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Assign outcomes to nodes — FR-WF-AO-001 through FR-WF-AO-010.
 * Requirements:
 *   workflow_assign_outcome_to_node_requirements_v1.yaml (incl. FR-WF-AO-006 cascade rules)
 *   workflow_node_linked_outcomes_badge_requirements_v1.yaml
 *   workflow_delete_outcome_requirements_v1.yaml (FR-WF-EO-014 assignment cleanup)
 *   workflow_duplicate_outcome_requirements_v1.yaml (FR-WF-EO-011 assignment parity)
 */

async function gotoWorkflowGraph(page: import('@playwright/test').Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator('[data-test-id="workflow-node"]').first()).toBeVisible({
    timeout: 15_000,
  });
}

/** Graph API helpers need an app origin; reload after mutations so assign-tab state is fresh. */
async function prepareAssignTabAfterApiSetup(
  page: import('@playwright/test').Page,
  workflowPath: string,
  setup: () => Promise<void>,
): Promise<void> {
  await gotoWorkflowGraph(page, workflowPath);
  await setup();
  await gotoWorkflowGraph(page, workflowPath);
  await openWorkflowOutcomesTab(page);
}

async function prepareGraphAfterApiSetup(
  page: import('@playwright/test').Page,
  workflowPath: string,
  setup: () => Promise<void>,
): Promise<void> {
  await gotoWorkflowGraph(page, workflowPath);
  await setup();
  await gotoWorkflowGraph(page, workflowPath);
}

async function openAssignTabOnWorkflowGraph(
  page: import('@playwright/test').Page,
  workflowPath: string,
): Promise<void> {
  await gotoWorkflowGraph(page, workflowPath);
  await openWorkflowOutcomesTab(page);
}

async function removeSeededOutcomeFromOutcomesView(
  page: import('@playwright/test').Page,
  workflowPath: string,
  outcomeTitle: string,
): Promise<void> {
  await gotoOutcomesView(page, workflowPath);
  const header = workflowOutcomeHeader(page, outcomeTitle);
  await expect(header).toBeVisible();
  await hoverWorkflowOutcomeHeader(page, outcomeTitle);
  await workflowOutcomeHoverDeleteItem(page, outcomeTitle).click();
  await expect(header).toHaveCount(0, { timeout: 15_000 });
}

test.describe('Assign outcomes tab — populated state (FR-WF-AO-002, FR-WF-AO-003)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoWorkflowGraph(page, workflow.path);
    await openWorkflowOutcomesTab(page);
  });

  test('FR-WF-AO-002: populated workflowRightSidebarOutcomesTabContent shows heading, row, and Edit outcomes', async ({
    page,
  }) => {
    await expect(workflowRightSidebarOutcomesTabContent(page)).toBeVisible();
    await expect(workflowOutcomesAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER)).toBeVisible();
    await expect(workflowOutcomesAssignTabEditOutcomesButton(page)).toBeVisible();
    await expect(workflowOutcomesAssignTabEditOutcomesButton(page)).toBeEnabled();
  });

  test('FR-WF-AO-003: workflowOutcomesAssignTabOutcomeRow displays workflowOutcomeHeaderTitle with ordinal prefix', async ({
    page,
  }) => {
    await expect(page.getByText(E2E_SEED_OUTCOME_HEADER)).toBeVisible();
  });

  test('FR-WF-AO-002: Edit outcomes navigates to Outcomes view without mutating data', async ({
    page,
    workflow,
  }) => {
    await workflowOutcomesAssignTabEditOutcomesButton(page).click();
    await expectNavigatedToOutcomesView(page, workflow.path);
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toBeVisible();
  });
});

const E2E_AO_TAG_ALPHA = 'E2E AO Tag Aaa';
const E2E_AO_TAG_BETA = 'E2E AO Tag Zzz';
const E2E_AO_ROOT_B = 'E2E AO Root B';
const E2E_AO_ROOT_C = 'E2E AO Root C';
const E2E_AO_ROOT_D = 'E2E AO Root D';

test.describe('Assign outcomes tab — tree parity and grouping (FR-WF-AO-002)', () => {
  test('FR-WF-AO-002: assign-tab outcome rows match workflowOutcomeTree entity set', async ({
    page,
    workflow,
  }) => {
    await prepareAssignTabAfterApiSetup(page, workflow.path, async () => {
      await resetOutcomeTreeToSeedOnly(
        page,
        workflow.path,
        E2E_OUTCOME_TITLE,
        workflow.firstOutcome().uuid,
      );
      await seedThreeLevelSubtreeViaApi(page, workflow);
    });
    await expectAssignTabMatchesOutcomesViewTree(page, workflow.path);
  });

  test('FR-WF-AO-002: untagged-only workflow lists seed outcome in a single group', async ({
    page,
    workflow,
  }) => {
    await gotoWorkflowGraph(page, workflow.path);
    await openWorkflowOutcomesTab(page);

    await expect(workflowOutcomesAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER)).toBeVisible();

    const headerGroups = await collectAllAssignTabLevel1HeaderGroups(page);
    expect(headerGroups).toHaveLength(1);
    expectLevel1HeaderOrder(headerGroups[0] ?? [], E2E_OUTCOME_TITLE);
  });

  test('FR-WF-AO-002: untagged-only workflow renders unlabeled group without Untagged title', async ({
    page,
    workflow,
  }) => {
    await gotoWorkflowGraph(page, workflow.path);
    await openWorkflowOutcomesTab(page);

    await expect(workflowOutcomesAssignTabUntaggedGroupTitle(page)).toHaveCount(0);
  });

  test('FR-WF-AO-002: tagged and untagged outcomes appear in separate assign-tab groups', async ({
    page,
    workflow,
  }) => {
    await prepareAssignTabAfterApiSetup(page, workflow.path, async () => {
      await resetOutcomeTreeToSeedOnly(
        page,
        workflow.path,
        E2E_OUTCOME_TITLE,
        workflow.firstOutcome().uuid,
      );

      const alphaTag = await createProjectTagViaApi(
        page,
        workflow.manifest.project_uuid,
        E2E_AO_TAG_ALPHA,
      );
      const betaTag = await createProjectTagViaApi(
        page,
        workflow.manifest.project_uuid,
        E2E_AO_TAG_BETA,
      );

      await patchOutcomeViaApi(page, workflow.firstOutcome().uuid, { tagIds: [alphaTag.id] });
      await createOutcomeViaApi(page, workflow.graphUuid, {
        title: E2E_AO_ROOT_B,
        tagIds: [betaTag.id],
      });
      await createOutcomeViaApi(page, workflow.graphUuid, { title: E2E_AO_ROOT_C });
    });

    const headerGroups = await collectAllAssignTabLevel1HeaderGroups(page);
    expect(headerGroups).toHaveLength(3);
    expectLevel1HeaderOrder(
      assignTabGroupsContainingOutcomeTitle(headerGroups, E2E_OUTCOME_TITLE)[0] ?? [],
      E2E_OUTCOME_TITLE,
    );
    expectLevel1HeaderOrder(
      assignTabGroupsContainingOutcomeTitle(headerGroups, E2E_AO_ROOT_B)[0] ?? [],
      E2E_AO_ROOT_B,
    );
    expectLevel1HeaderOrder(
      assignTabGroupsContainingOutcomeTitle(headerGroups, E2E_AO_ROOT_C)[0] ?? [],
      E2E_AO_ROOT_C,
    );
  });

  test('FR-WF-AO-002: tag groups use catalog labels in alphabetical order with Untagged last', async ({
    page,
    workflow,
  }) => {
    await prepareAssignTabAfterApiSetup(page, workflow.path, async () => {
      await resetOutcomeTreeToSeedOnly(
        page,
        workflow.path,
        E2E_OUTCOME_TITLE,
        workflow.firstOutcome().uuid,
      );

      const alphaTag = await createProjectTagViaApi(
        page,
        workflow.manifest.project_uuid,
        E2E_AO_TAG_ALPHA,
      );
      const betaTag = await createProjectTagViaApi(
        page,
        workflow.manifest.project_uuid,
        E2E_AO_TAG_BETA,
      );

      await patchOutcomeViaApi(page, workflow.firstOutcome().uuid, { tagIds: [alphaTag.id] });
      await createOutcomeViaApi(page, workflow.graphUuid, {
        title: E2E_AO_ROOT_B,
        tagIds: [betaTag.id],
      });
      await createOutcomeViaApi(page, workflow.graphUuid, { title: E2E_AO_ROOT_C });
    });

    expect(await collectAssignTabGroupTitles(page)).toEqual([
      E2E_AO_TAG_ALPHA,
      E2E_AO_TAG_BETA,
      'Untagged',
    ]);
  });

  test('FR-WF-AO-002: level-1 row order within a tag group matches workflowOutcomeTree sibling order', async ({
    page,
    workflow,
  }) => {
    await prepareAssignTabAfterApiSetup(page, workflow.path, async () => {
      await resetOutcomeTreeToSeedOnly(
        page,
        workflow.path,
        E2E_OUTCOME_TITLE,
        workflow.firstOutcome().uuid,
      );

      const alphaTag = await createProjectTagViaApi(
        page,
        workflow.manifest.project_uuid,
        E2E_AO_TAG_ALPHA,
      );
      await patchOutcomeViaApi(page, workflow.firstOutcome().uuid, { tagIds: [alphaTag.id] });

      const rootBUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
        title: E2E_AO_ROOT_B,
        tagIds: [alphaTag.id],
      });
      const rootDUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
        title: E2E_AO_ROOT_D,
        tagIds: [alphaTag.id],
      });

      await moveOutcomeViaApi(page, rootDUuid, { beforeUuid: rootBUuid });
    });

    const taggedGroup =
      assignTabGroupsContainingOutcomeTitle(
        await collectAllAssignTabLevel1HeaderGroups(page),
        E2E_OUTCOME_TITLE,
      ).find((headers) => headers.length === 3) ?? [];

    expectLevel1HeaderOrder(taggedGroup, E2E_OUTCOME_TITLE, E2E_AO_ROOT_D, E2E_AO_ROOT_B);
  });

  test('FR-WF-AO-002: level-1 outcome with two tags appears once in each tag group', async ({
    page,
    workflow,
  }) => {
    await prepareAssignTabAfterApiSetup(page, workflow.path, async () => {
      await resetOutcomeTreeToSeedOnly(
        page,
        workflow.path,
        E2E_OUTCOME_TITLE,
        workflow.firstOutcome().uuid,
      );

      const alphaTag = await createProjectTagViaApi(
        page,
        workflow.manifest.project_uuid,
        E2E_AO_TAG_ALPHA,
      );
      const betaTag = await createProjectTagViaApi(
        page,
        workflow.manifest.project_uuid,
        E2E_AO_TAG_BETA,
      );
      await patchOutcomeViaApi(page, workflow.firstOutcome().uuid, {
        tagIds: [alphaTag.id, betaTag.id],
      });
    });

    const seedGroups = assignTabGroupsContainingOutcomeTitle(
      await collectAllAssignTabLevel1HeaderGroups(page),
      E2E_OUTCOME_TITLE,
    );
    expect(seedGroups).toHaveLength(2);
    seedGroups.forEach((groupHeaders) => {
      expectLevel1HeaderOrder(groupHeaders, E2E_OUTCOME_TITLE);
    });
  });
});

test.describe('Assign outcomes tab — nested row order (FR-WF-AO-003)', () => {
  test('FR-WF-AO-003: expanded assign-tab rows show nested children in workflowOutcomeTree sibling order', async ({
    page,
    workflow,
  }) => {
    await prepareAssignTabAfterApiSetup(page, workflow.path, async () => {
      await resetOutcomeTreeToSeedOnly(
        page,
        workflow.path,
        E2E_OUTCOME_TITLE,
        workflow.firstOutcome().uuid,
      );
      await seedTwoChildOutcomesViaApi(page, workflow);
    });

    const nestedHeaders = await collectAssignTabNestedHeadersUnderParent(page, E2E_SEED_OUTCOME_HEADER);
    expectNestedHeaderOrder(
      nestedHeaders,
      nestedOutcomeHeaderPattern('1.1', E2E_OUTCOME_CHILD_A_TITLE),
      nestedOutcomeHeaderPattern('1.2', E2E_OUTCOME_CHILD_B_TITLE),
    );
  });

  test('FR-WF-AO-003: three-level subtree nested rows follow workflowOutcomeTree ordinals when expanded', async ({
    page,
    workflow,
  }) => {
    await prepareAssignTabAfterApiSetup(page, workflow.path, async () => {
      await resetOutcomeTreeToSeedOnly(
        page,
        workflow.path,
        E2E_OUTCOME_TITLE,
        workflow.firstOutcome().uuid,
      );
      await seedThreeLevelSubtreeViaApi(page, workflow);
    });

    await expandAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER);
    const childHeaders = await collectAssignTabNestedHeadersUnderParent(page, E2E_SEED_OUTCOME_HEADER);
    expectNestedHeaderOrder(
      childHeaders,
      nestedOutcomeHeaderPattern('1.1', E2E_OUTCOME_CHILD_TITLE),
    );

    const grandchildHeaders = await collectAssignTabNestedHeadersUnderParent(
      page,
      nestedOutcomeHeaderPattern('1.1', E2E_OUTCOME_CHILD_TITLE),
    );
    expectNestedHeaderOrder(
      grandchildHeaders,
      nestedOutcomeHeaderPattern('1.1.1', E2E_OUTCOME_GRANDCHILD_TITLE),
    );
  });
});

test.describe('Assign outcomes tab — empty state (FR-WF-AO-001)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await removeSeededOutcomeFromOutcomesView(page, workflow.path, E2E_OUTCOME_TITLE);
    await page.goto(workflow.path);
    await openWorkflowOutcomesTab(page);
  });

  test('FR-WF-AO-001: empty state shows Outcomes heading, alert, and Add outcomes button', async ({
    page,
  }) => {
    await expect(workflowRightSidebarOutcomesTabContent(page)).toBeVisible();
    await expect(workflowOutcomesAssignTabEmptyStateAlert(page)).toBeVisible();
    await expect(
      page.getByText(
        /There are currently no outcomes in this activity, navigate to the outcomes view to add outcomes\./,
      ),
    ).toBeVisible();
    await expect(workflowOutcomesAssignTabAddOutcomesButton(page)).toBeVisible();
    await expect(workflowOutcomesAssignTabAddOutcomesButton(page)).toBeEnabled();
    await expect(workflowOutcomesAssignTabEditOutcomesButton(page)).toHaveCount(0);
  });

  test('FR-WF-AO-001: Add outcomes navigates to Outcomes view', async ({ page, workflow }) => {
    await workflowOutcomesAssignTabAddOutcomesButton(page).click();
    await expectNavigatedToOutcomesView(page, workflow.path);
  });
});

test.describe('Assign outcomes — drag assign (FR-WF-AO-004)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoWorkflowGraph(page, workflow.path);
    await openWorkflowOutcomesTab(page);
  });

  test('FR-WF-AO-004: owner drags workflowOutcomesAssignTabOutcomeRow onto workflowNode to assign outcome', async ({
    page,
    workflow,
  }) => {
    const targetUuid = await secondWorkflowNodeUuid(page);
    const outcomeUuid = workflow.firstOutcome().uuid;
    const before = nodeByUuid(await fetchGraphView(page, workflow.workflowUuid), targetUuid);
    expect(before?.outcomeUuids.includes(outcomeUuid)).toBe(false);

    await dragAssignTabOutcomeOntoNode(page, E2E_SEED_OUTCOME_HEADER, targetUuid);

    await expect
      .poll(async () => {
        const after = nodeByUuid(await fetchGraphView(page, workflow.workflowUuid), targetUuid);
        return after?.outcomeUuids.includes(outcomeUuid) ?? false;
      })
      .toBe(true);
  });

  test('FR-WF-AO-004: after drag assign, workflowNodeLinkedOutcomesBadge count 1 appears on target node', async ({
    page,
  }) => {
    const targetUuid = await secondWorkflowNodeUuid(page);
    const badge = workflowNodeLinkedOutcomesBadge(page, targetUuid, 1);
    await expect(badge).toHaveCount(0);

    await dragAssignTabOutcomeOntoNode(page, E2E_SEED_OUTCOME_HEADER, targetUuid);

    await expect(badge).toBeVisible({ timeout: 10_000 });
  });

  test('FR-WF-AO-004: workflowNode shows workflowNodeOutcomeDropTargetBorder while outcome drag is over the node', async ({
    page,
  }) => {
    const targetUuid = await secondWorkflowNodeUuid(page);

    await dragAssignTabOutcomeOverNode(page, E2E_SEED_OUTCOME_HEADER, targetUuid, {
      release: false,
    });

    await expect
      .poll(async () => workflowNodeHasOutcomeDropTargetBorder(page, targetUuid))
      .toBe(true);
    expect(await countWorkflowNodesWithOutcomeDropTargetBorder(page)).toBe(1);

    await page.mouse.up();
  });

  test('FR-WF-AO-004: after drag assign with outcome highlighted, target node shows workflowNodeOutcomeHighlightBorder', async ({
    page,
  }) => {
    const targetUuid = await secondWorkflowNodeUuid(page);

    await clickAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER);
    expect(await assignTabOutcomeRowHasHighlightBorder(page, E2E_SEED_OUTCOME_HEADER)).toBe(true);

    await dragAssignTabOutcomeOntoNode(page, E2E_SEED_OUTCOME_HEADER, targetUuid);

    await expect
      .poll(async () => workflowNodeHasOutcomeHighlightBorder(page, targetUuid))
      .toBe(true);
  });
});

test.describe('Assign outcomes — click highlight (FR-WF-AO-005)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoWorkflowGraph(page, workflow.path);
    await openWorkflowOutcomesTab(page);
  });

  test('FR-WF-AO-005: clicking outcome row highlights assigned workflowNode', async ({ page }) => {
    const assignedNodeUuid = await firstWorkflowNodeUuid(page);

    await clickAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER);

    expect(await assignTabOutcomeRowHasHighlightBorder(page, E2E_SEED_OUTCOME_HEADER)).toBe(true);
    expect(await workflowNodeHasOutcomeHighlightBorder(page, assignedNodeUuid)).toBe(true);
  });

  test('FR-WF-AO-005: clicking highlighted row again clears node highlight', async ({ page }) => {
    const assignedNodeUuid = await firstWorkflowNodeUuid(page);

    await clickAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER);
    await clickAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER);

    expect(await assignTabOutcomeRowHasHighlightBorder(page, E2E_SEED_OUTCOME_HEADER)).toBe(false);
    expect(await workflowNodeHasOutcomeHighlightBorder(page, assignedNodeUuid)).toBe(false);
  });
});

test.describe('Linked outcomes badge and popover (FR-WF-AO-007, FR-WF-AO-008, FR-WF-AO-009)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoWorkflowGraph(page, workflow.path);
  });

  test('FR-WF-AO-007: workflowNode with assigned outcome renders workflowNodeLinkedOutcomesBadge count 1', async ({
    page,
  }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);
    await expect(page.locator(`#node-${nodeUuid}`).getByText('1', { exact: true })).toBeVisible();
  });

  test('FR-WF-AO-008: clicking badge opens workflowNodeLinkedOutcomesPopover', async ({ page }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);
    await openLinkedOutcomesPopover(page, nodeUuid, 1);
    await expect(workflowNodeLinkedOutcomesPopover(page)).toBeVisible();
  });

  test('FR-WF-AO-009: popover lists assigned workflowOutcomeHeaderTitle', async ({ page }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);
    await openLinkedOutcomesPopover(page, nodeUuid, 1);
    await expect(workflowNodeLinkedOutcomeRow(page, E2E_SEED_OUTCOME_HEADER)).toBeVisible();
  });

  test('FR-WF-AO-008: clicking badge again closes popover', async ({ page }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);
    await openLinkedOutcomesPopover(page, nodeUuid, 1);
    await page.locator(`#node-${nodeUuid}`).getByText('1', { exact: true }).click({ force: true });
    await expect(workflowNodeLinkedOutcomesPopover(page)).toBeHidden({ timeout: 5_000 });
  });
});

test.describe('Assign outcomes — cascade rules (FR-WF-AO-006)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoWorkflowGraph(page, workflow.path);
  });

  test('FR-WF-AO-006: assigning L1 adds all L2 and L3 descendants to node', async ({
    page,
    workflow,
  }) => {
    const nodeUuid = await secondWorkflowNodeUuid(page);
    const seedUuid = workflow.firstOutcome().uuid;
    let childUuid = '';
    let grandchildUuid = '';

    await prepareAssignTabAfterApiSetup(page, workflow.path, async () => {
      ({ childUuid, grandchildUuid } = await seedThreeLevelSubtreeViaApi(page, workflow));
    });

    await dragAssignTabOutcomeOntoNode(page, E2E_SEED_OUTCOME_HEADER, nodeUuid);

    await expectNodeOutcomeUuids(page, workflow.workflowUuid, nodeUuid, {
      includes: [seedUuid, childUuid, grandchildUuid],
    });
  });

  test('FR-WF-AO-006: unlinking L3 removes L2 and L1 from fully assigned node', async ({
    page,
    workflow,
  }) => {
    const nodeUuid = await secondWorkflowNodeUuid(page);
    const seedUuid = workflow.firstOutcome().uuid;
    let childUuid = '';
    let grandchildUuid = '';

    await prepareGraphAfterApiSetup(page, workflow.path, async () => {
      ({ childUuid, grandchildUuid } = await seedThreeLevelSubtreeViaApi(page, workflow));
      await linkOutcomesToNodeViaApi(page, nodeUuid, [seedUuid, childUuid, grandchildUuid]);
    });

    await openLinkedOutcomesPopoverForNode(page, nodeUuid);
    await revealLinkedPopoverOutcomeRows(
      page,
      E2E_SEED_OUTCOME_HEADER,
      nestedOutcomeHeaderPattern('1.1', E2E_OUTCOME_CHILD_TITLE),
    );
    await unlinkLinkedOutcomeFromPopover(
      page,
      nestedOutcomeHeaderPattern('1.1.1', E2E_OUTCOME_GRANDCHILD_TITLE),
    );

    await expect(workflowNodeLinkedOutcomesPopover(page)).toBeHidden({ timeout: 10_000 });
    await expectNodeOutcomeUuids(page, workflow.workflowUuid, nodeUuid, {
      exact: [],
    });
  });

  test('FR-WF-AO-006: unlinking one L2 removes L1 while sibling L2 remains on node', async ({
    page,
    workflow,
  }) => {
    const nodeUuid = await secondWorkflowNodeUuid(page);
    const seedUuid = workflow.firstOutcome().uuid;
    let childAUuid = '';
    let childBUuid = '';

    await prepareGraphAfterApiSetup(page, workflow.path, async () => {
      ({ childAUuid, childBUuid } = await seedTwoChildOutcomesViaApi(page, workflow));
      await linkOutcomesToNodeViaApi(page, nodeUuid, [seedUuid, childAUuid, childBUuid]);
    });

    await openLinkedOutcomesPopoverForNode(page, nodeUuid);
    await revealLinkedPopoverOutcomeRows(page, E2E_SEED_OUTCOME_HEADER);
    await unlinkLinkedOutcomeFromPopover(
      page,
      nestedOutcomeHeaderPattern('1.1', E2E_OUTCOME_CHILD_A_TITLE),
    );

    await expectNodeOutcomeUuids(page, workflow.workflowUuid, nodeUuid, {
      includes: [childBUuid],
      excludes: [seedUuid, childAUuid],
    });
  });

  test('FR-WF-AO-006: deleting assigned L3 removes L2 and L1 from node', async ({
    page,
    workflow,
  }) => {
    const nodeUuid = await secondWorkflowNodeUuid(page);
    const seedUuid = workflow.firstOutcome().uuid;
    let childUuid = '';
    let grandchildUuid = '';

    await prepareGraphAfterApiSetup(page, workflow.path, async () => {
      ({ childUuid, grandchildUuid } = await seedThreeLevelSubtreeViaApi(page, workflow));
      await linkOutcomesToNodeViaApi(page, nodeUuid, [seedUuid, childUuid, grandchildUuid]);
    });

    await gotoOutcomesView(page, workflow.path);
    await revealOutcomeByOrdinalPath(page, '1.1.1');
    await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_GRANDCHILD_TITLE);
    await workflowOutcomeHoverDeleteItem(page, E2E_OUTCOME_GRANDCHILD_TITLE).click();
    await expect(
      workflowOutcomeHeaderTitleText(page, '1.1.1', E2E_OUTCOME_GRANDCHILD_TITLE),
    ).toHaveCount(0, { timeout: 15_000 });

    await expectNodeOutcomeUuids(page, workflow.workflowUuid, nodeUuid, {
      exact: [],
    });
  });
});

test.describe('Linked outcomes — unlink (FR-WF-AO-010)', () => {
  test('FR-WF-AO-010: owner sees Unlink outcome control when hovering popover row', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    await openLinkedOutcomesPopover(page, nodeUuid, 1);

    await workflowNodeLinkedOutcomeRow(page, E2E_SEED_OUTCOME_HEADER).hover();
    await expect(page.getByRole('button', { name: 'Unlink outcome' })).toBeVisible();
  });

  test('FR-WF-AO-010: owner unlinks sole assigned outcome and workflowNodeLinkedOutcomesBadge is removed', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    const outcomeUuid = workflow.firstOutcome().uuid;
    const badge = workflowNodeLinkedOutcomesBadge(page, nodeUuid, 1);

    await openLinkedOutcomesPopover(page, nodeUuid, 1);
    await unlinkLinkedOutcomeFromPopover(page, E2E_SEED_OUTCOME_HEADER);

    await expect(workflowNodeLinkedOutcomesPopover(page)).toBeHidden({ timeout: 10_000 });
    await expect(badge).toHaveCount(0);

    await expect
      .poll(async () => {
        const node = nodeByUuid(await fetchGraphView(page, workflow.workflowUuid), nodeUuid);
        return node?.outcomeUuids.includes(outcomeUuid) ?? true;
      })
      .toBe(false);
  });
});

test.describe('Outcome delete and duplicate — node assignments (FR-WF-EO-011, FR-WF-EO-014)', () => {
  test('FR-WF-EO-014: deleting assigned outcome removes it from workflowNode and assign tab', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    const outcomeUuid = workflow.firstOutcome().uuid;

    await removeSeededOutcomeFromOutcomesView(page, workflow.path, E2E_OUTCOME_TITLE);

    await page.goto(workflow.path);
    await openWorkflowOutcomesTab(page);
    await expect(workflowOutcomesAssignTabEmptyStateAlert(page)).toBeVisible({ timeout: 15_000 });
    await expect(workflowNodeLinkedOutcomesBadge(page, nodeUuid, 1)).toHaveCount(0);

    await expect
      .poll(async () => {
        const node = nodeByUuid(await fetchGraphView(page, workflow.workflowUuid), nodeUuid);
        return node?.outcomeUuids.includes(outcomeUuid) ?? false;
      })
      .toBe(false);
  });

  test('FR-WF-EO-014: deleting assigned level-2 outcome removes it from workflowNode', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    const seedUuid = workflow.firstOutcome().uuid;

    await gotoOutcomesView(page, workflow.path);
    const { childAUuid, childBUuid } = await seedTwoChildOutcomesViaApi(page, workflow);
    await linkOutcomeToNodeViaApi(page, nodeUuid, childAUuid);
    await linkOutcomeToNodeViaApi(page, nodeUuid, childBUuid);

    await ensureExpandedShowingChild(page, E2E_OUTCOME_TITLE, E2E_OUTCOME_CHILD_A_TITLE);
    await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_CHILD_A_TITLE);
    await workflowOutcomeHoverDeleteItem(page, E2E_OUTCOME_CHILD_A_TITLE).click();
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_CHILD_A_TITLE)).toHaveCount(0, {
      timeout: 15_000,
    });

    await expect
      .poll(async () => {
        const node = nodeByUuid(await fetchGraphView(page, workflow.workflowUuid), nodeUuid);
        if (!node) {
          return null;
        }
        return {
          seed: node.outcomeUuids.includes(seedUuid),
          childA: node.outcomeUuids.includes(childAUuid),
          childB: node.outcomeUuids.includes(childBUuid),
        };
      })
      .toEqual({ seed: false, childA: false, childB: true });
  });

  test('FR-WF-EO-014/FR-WF-AO-002: deleting assigned L2 removes assign tab row while siblings remain', async ({
    page,
    workflow,
  }) => {
    await gotoWorkflowGraph(page, workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    const seedUuid = workflow.firstOutcome().uuid;
    let childAUuid = '';
    let childBUuid = '';

    await gotoOutcomesView(page, workflow.path);
    ({ childAUuid, childBUuid } = await seedTwoChildOutcomesViaApi(page, workflow));
    await linkOutcomeToNodeViaApi(page, nodeUuid, childAUuid);

    await ensureExpandedShowingChild(page, E2E_OUTCOME_TITLE, E2E_OUTCOME_CHILD_A_TITLE);
    await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_CHILD_A_TITLE);
    await workflowOutcomeHoverDeleteItem(page, E2E_OUTCOME_CHILD_A_TITLE).click();
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_CHILD_A_TITLE)).toHaveCount(0, {
      timeout: 15_000,
    });

    await openAssignTabOnWorkflowGraph(page, workflow.path);
    await expect(workflowOutcomesAssignTabEmptyStateAlert(page)).toHaveCount(0);
    await expect(workflowOutcomesAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER)).toBeVisible();
    await expect(
      workflowOutcomesAssignTabOutcomeRow(page, new RegExp(E2E_OUTCOME_CHILD_A_TITLE)),
    ).toHaveCount(0);
    await expandAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER);
    await expect(
      workflowOutcomesAssignTabOutcomeRow(
        page,
        nestedOutcomeHeaderPattern('1.1', E2E_OUTCOME_CHILD_B_TITLE),
      ),
    ).toBeVisible();

    await expectNodeOutcomeUuids(page, workflow.workflowUuid, nodeUuid, {
      excludes: [childAUuid, seedUuid],
    });
  });

  test('FR-WF-EO-014: deleting assigned outcome removes it from every linked workflowNode', async ({
    page,
    workflow,
  }) => {
    await gotoWorkflowGraph(page, workflow.path);
    const firstNodeUuid = await firstWorkflowNodeUuid(page);
    const secondNodeUuid = await secondWorkflowNodeUuid(page);
    const outcomeUuid = workflow.firstOutcome().uuid;

    await linkOutcomeToNodeViaApi(page, secondNodeUuid, outcomeUuid);

    await removeSeededOutcomeFromOutcomesView(page, workflow.path, E2E_OUTCOME_TITLE);

    await expectNodeOutcomeUuids(page, workflow.workflowUuid, firstNodeUuid, {
      excludes: [outcomeUuid],
    });
    await expectNodeOutcomeUuids(page, workflow.workflowUuid, secondNodeUuid, {
      excludes: [outcomeUuid],
    });

    await openAssignTabOnWorkflowGraph(page, workflow.path);
    await expect(workflowOutcomesAssignTabEmptyStateAlert(page)).toBeVisible({ timeout: 15_000 });
    await expect(workflowNodeLinkedOutcomesBadge(page, firstNodeUuid, 1)).toHaveCount(0);
    await expect(workflowNodeLinkedOutcomesBadge(page, secondNodeUuid, 1)).toHaveCount(0);
  });

  test('FR-WF-EO-014/FR-WF-AO-002: deleting assigned L1 subtree clears assign tab rows and node links while other roots remain', async ({
    page,
    workflow,
  }) => {
    await gotoWorkflowGraph(page, workflow.path);
    const firstNodeUuid = await firstWorkflowNodeUuid(page);
    const secondNodeUuid = await secondWorkflowNodeUuid(page);
    const seedUuid = workflow.firstOutcome().uuid;
    let childAUuid = '';
    let childBUuid = '';

    await gotoOutcomesView(page, workflow.path);
    ({ childAUuid, childBUuid } = await seedTwoChildOutcomesViaApi(page, workflow));
    await createSidebarDuplicate(page);

    const outcomes = await fetchGraphOutcomes(page, workflow.workflowUuid);
    const copyRoot = outcomes.find(
      (outcome) => outcome.title === E2E_OUTCOME_DUPLICATE && outcome.parentUuid == null,
    );
    expect(copyRoot?.uuid).toBeTruthy();

    await linkOutcomesToNodeViaApi(page, firstNodeUuid, [seedUuid, childAUuid, childBUuid]);
    await linkOutcomeToNodeViaApi(page, secondNodeUuid, copyRoot!.uuid);

    await ensureExpandedShowingChild(page, E2E_OUTCOME_TITLE, E2E_OUTCOME_CHILD_A_TITLE);
    await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_TITLE);
    await workflowOutcomeHoverDeleteItem(page, E2E_OUTCOME_TITLE).click();
    await expect(workflowOutcomeHeader(page, E2E_OUTCOME_TITLE)).toHaveCount(0, {
      timeout: 15_000,
    });

    await openAssignTabOnWorkflowGraph(page, workflow.path);
    await expect(workflowOutcomesAssignTabEmptyStateAlert(page)).toHaveCount(0);
    await expect(workflowOutcomesAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER)).toHaveCount(0);
    await expect(
      workflowOutcomesAssignTabOutcomeRow(page, new RegExp(E2E_OUTCOME_CHILD_A_TITLE)),
    ).toHaveCount(0);
    await expect(
      workflowOutcomesAssignTabOutcomeRow(page, new RegExp(E2E_OUTCOME_CHILD_B_TITLE)),
    ).toHaveCount(0);
    await expect(
      workflowOutcomesAssignTabOutcomeRow(page, level1OutcomeHeaderPattern(E2E_OUTCOME_DUPLICATE)),
    ).toBeVisible();

    await expectNodeOutcomeUuids(page, workflow.workflowUuid, firstNodeUuid, {
      exact: [],
    });
    await expectNodeOutcomeUuids(page, workflow.workflowUuid, secondNodeUuid, {
      includes: [copyRoot!.uuid],
    });
    await expect(workflowNodeLinkedOutcomesBadge(page, firstNodeUuid, 1)).toHaveCount(0);
    await expect(workflowNodeLinkedOutcomesBadge(page, secondNodeUuid, 1)).toBeVisible();
  });

  test('FR-WF-EO-011: duplicate subtree does not inherit workflowNode assignments', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    const seedUuid = workflow.firstOutcome().uuid;

    await gotoOutcomesView(page, workflow.path);
    await seedThreeLevelSubtreeViaApi(page, workflow);
    await createSidebarDuplicate(page);

    const outcomes = await fetchGraphOutcomes(page, workflow.workflowUuid);
    const copyRoot = outcomes.find(
      (outcome) => outcome.title === E2E_OUTCOME_DUPLICATE && outcome.parentUuid == null,
    );
    expect(copyRoot?.uuid).toBeTruthy();
    const copyChild = outcomes.find(
      (outcome) =>
        outcome.title === E2E_OUTCOME_CHILD_TITLE && outcome.parentUuid === copyRoot?.uuid,
    );
    const copyGrandchild = outcomes.find(
      (outcome) =>
        outcome.title === E2E_OUTCOME_GRANDCHILD_TITLE &&
        outcome.parentUuid === copyChild?.uuid,
    );
    expect(copyChild?.uuid).toBeTruthy();
    expect(copyGrandchild?.uuid).toBeTruthy();

    await page.goto(workflow.path);
    await openWorkflowOutcomesTab(page);
    await expect(workflowOutcomesAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER)).toBeVisible();
    const duplicateAssignTabRow = new RegExp(
      `^2\\.\\s+${E2E_OUTCOME_DUPLICATE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
    );
    await expect(workflowOutcomesAssignTabOutcomeRow(page, duplicateAssignTabRow)).toBeVisible();

    const node = nodeByUuid(await fetchGraphView(page, workflow.workflowUuid), nodeUuid);
    expect(node?.outcomeUuids.includes(seedUuid)).toBe(true);
    expect(node?.outcomeUuids.includes(copyRoot!.uuid)).toBe(false);
    expect(node?.outcomeUuids.includes(copyChild!.uuid)).toBe(false);
    expect(node?.outcomeUuids.includes(copyGrandchild!.uuid)).toBe(false);
  });
});
