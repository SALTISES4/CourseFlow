import { test, expect } from '../../fixtures';
import { loginAsTestUser } from '../../helpers/auth';
import { gotoOutcomesView, hoverWorkflowOutcomeHeader, firstWorkflowNodeUuid, secondWorkflowNodeUuid } from './comments-tab.helpers';
import { loginAsWorkflowContributor } from './role.helpers';
import {
  assignTabOutcomeRowHasHighlightBorder,
  clickAssignTabOutcomeRow,
  dragAssignTabOutcomeOntoNode,
  E2E_SEED_OUTCOME_HEADER,
  expectNavigatedToOutcomesView,
  openLinkedOutcomesPopover,
  openWorkflowOutcomesTab,
  workflowNodeHasOutcomeHighlightBorder,
} from './workflow-assign-outcome.helpers';
import {
  workflowNodeLinkedOutcomeRow,
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
 */

const E2E_OUTCOME_TITLE = 'E2E Outcome 1';

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

    await dragAssignTabOutcomeOntoNode(page, E2E_SEED_OUTCOME_HEADER, targetUuid);

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
});
