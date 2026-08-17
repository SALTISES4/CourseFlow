import { test, expect } from '../../fixtures';
import { loginAsTestUser } from '../../helpers/auth';
import {
  gotoOutcomesView,
  hoverWorkflowOutcomeHeader,
  firstWorkflowNodeUuid,
  secondWorkflowNodeUuid,
} from './comments-tab.helpers';
import { loginAsWorkflowContributor } from './role.helpers';
import {
  createSidebarDuplicate,
  E2E_OUTCOME_CHILD_A_TITLE,
  E2E_OUTCOME_CHILD_B_TITLE,
  E2E_OUTCOME_CHILD_DUPLICATE_TITLE,
  E2E_OUTCOME_DUPLICATE,
  E2E_OUTCOME_GRANDCHILD_DUPLICATE_TITLE,
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
  countWorkflowNodesWithOutcomeDropTargetBorder,
  dragAssignTabOutcomeOntoNode,
  dragAssignTabOutcomeOverNode,
  E2E_SEED_OUTCOME_HEADER,
  expectNavigatedToOutcomesView,
  openLinkedOutcomesPopover,
  openWorkflowOutcomesTab,
  unlinkLinkedOutcomeFromPopover,
  workflowNodeHasOutcomeDropTargetBorder,
  workflowNodeHasOutcomeHighlightBorder,
} from './workflow-assign-outcome.helpers';
import {
  workflowNodeLinkedOutcomeRow,
  workflowNodeLinkedOutcomesBadge,
  workflowNodeLinkedOutcomesPopover,
  workflowOutcomesAssignTabAddOutcomesButton,
  workflowOutcomesAssignTabEditOutcomesButton,
  workflowOutcomesAssignTabEmptyStateAlert,
  workflowOutcomesAssignTabOutcomeRow,
} from './workflow-assign-outcome.locators';
import { fetchGraphView, nodeByUuid } from './workflow-graph.helpers';
import {
  workflowOutcomeHoverDeleteItem,
  workflowOutcomeHeader,
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
 *   workflow_assign_outcome_to_node_requirements_v1.yaml
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

test.describe('Assign outcomes — role behavior (FR-WF-AO-001, FR-WF-AO-002, FR-WF-AO-004)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('FR-WF-AO-002: commenter sees disabled Edit outcomes button in populated state', async ({
    page,
    workflow,
  }) => {
    await loginAsWorkflowContributor(page, workflow, 'commenter');
    await page.goto(workflow.path);
    await openWorkflowOutcomesTab(page);

    await expect(workflowOutcomesAssignTabEditOutcomesButton(page)).toBeDisabled();
    await workflowOutcomesAssignTabEditOutcomesButton(page).click({ force: true });
    await expect(page).toHaveURL(new RegExp(`${workflow.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/graph`));
  });

  test('FR-WF-AO-004: commenter drag from assign tab does not assign outcome', async ({
    page,
    workflow,
  }) => {
    await loginAsWorkflowContributor(page, workflow, 'commenter');
    await page.goto(workflow.path);
    await openWorkflowOutcomesTab(page);

    const targetUuid = await secondWorkflowNodeUuid(page);
    const outcomeUuid = workflow.firstOutcome().uuid;
    const before = nodeByUuid(await fetchGraphView(page, workflow.workflowUuid), targetUuid);

    await dragAssignTabOutcomeOverNode(page, E2E_SEED_OUTCOME_HEADER, targetUuid, {
      release: false,
    });
    expect(await workflowNodeHasOutcomeDropTargetBorder(page, targetUuid)).toBe(false);
    expect(await countWorkflowNodesWithOutcomeDropTargetBorder(page)).toBe(0);
    await page.mouse.up();

    const after = nodeByUuid(await fetchGraphView(page, workflow.workflowUuid), targetUuid);
    expect(after?.outcomeUuids).toEqual(before?.outcomeUuids ?? []);
    expect(after?.outcomeUuids.includes(outcomeUuid)).toBe(false);
  });
});

test.describe('Assign outcomes — empty state role behavior (FR-WF-AO-001)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page, workflow }) => {
    await loginAsTestUser(page);
    await removeSeededOutcomeFromOutcomesView(page, workflow.path, E2E_OUTCOME_TITLE);
  });

  test('FR-WF-AO-001: commenter sees disabled Add outcomes button', async ({ page, workflow }) => {
    await loginAsWorkflowContributor(page, workflow, 'commenter');
    await page.goto(workflow.path);
    await openWorkflowOutcomesTab(page);

    await expect(workflowOutcomesAssignTabAddOutcomesButton(page)).toBeDisabled();
    await workflowOutcomesAssignTabAddOutcomesButton(page).click({ force: true });
    await expect(workflowRightSidebarOutcomesTab(page)).toHaveAttribute('aria-pressed', 'true');
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
      .toEqual({ seed: true, childA: false, childB: true });
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
        outcome.title === E2E_OUTCOME_CHILD_DUPLICATE_TITLE && outcome.parentUuid === copyRoot?.uuid,
    );
    const copyGrandchild = outcomes.find(
      (outcome) =>
        outcome.title === E2E_OUTCOME_GRANDCHILD_DUPLICATE_TITLE &&
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
