import { test, expect } from '../../fixtures';
import { loginAs } from '../../helpers/auth';
import {
  firstWorkflowNodeUuid,
  hoverWorkflowNode,
  secondWorkflowNodeUuid,
} from './comments-tab.helpers';
import { linkNodeWorkflowViaApi, seededLinkedActivityUuid } from './edit-node.helpers';
import {
  ensureFirstWorkflowNodeViaApi,
  fetchNodeViaApi,
  patchNodeMetaViaApi,
  workflowChannelHeaderColorIndicatorBackgroundColor,
  workflowNodeBorderBackgroundColor,
} from './node-visual.helpers';
import {
  clickAssignTabOutcomeRow,
  E2E_SEED_OUTCOME_HEADER,
  openWorkflowOutcomesTab,
  workflowNodeHasOutcomeHighlightBorder,
} from './workflow-assign-outcome.helpers';
import {
  workflowEditNodeForm,
  workflowEditNodeFormTitleField,
  workflowNode,
  workflowNodeBorder,
  workflowNodeContent,
  workflowNodeHasSelectedBorder,
  workflowNodeHoverCommentsItem,
  workflowNodeHoverDeleteItem,
  workflowNodeHoverDuplicateItem,
  workflowNodeHoverInsertBelowItem,
  workflowNodeLinkedWorkflowIndicator,
  workflowNodeMeta,
  workflowNodeMetaContextTag,
  workflowNodeMetaIconTags,
  workflowNodeMetaTaskTag,
  workflowNodeMetaTimeTag,
  workflowNodeTitle,
} from './workflow-graph.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Workflow node visual — FR-WF-NODE-001 through FR-WF-NODE-005 (partial).
 * Requirements: workflow_node_visual_requirements_v1.yaml
 * Design evidence: FIGMA-WF-NODE-WORKFLOW-VIEW, FIGMA-WF-NODE-LINKED-WORKFLOW-LINK
 */

test.describe('Workflow node — static structure (FR-WF-NODE-001)', () => {
  test.use({ seedAssets: ['workflow.navigation_course', 'workflow.navigation_program'] });

  test('FR-WF-NODE-001: workflowNode shows title, content, and channel-colored border', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    const node = await fetchNodeViaApi(page, nodeUuid);
    if (!node.channelUuid) {
      throw new Error(`Expected channelUuid on node ${nodeUuid}`);
    }

    await expect(workflowNode(page, nodeUuid)).toBeVisible();
    await expect(workflowNodeContent(page, nodeUuid)).toBeVisible();
    await expect(workflowNodeTitle(page, nodeUuid)).toBeVisible();
    await expect(workflowNodeBorder(page, nodeUuid)).toBeVisible();

    const borderHeight = await workflowNodeBorder(page, nodeUuid).evaluate(
      (el) => el.getBoundingClientRect().height,
    );
    expect(borderHeight).toBeGreaterThan(0);

    // FR-CHAN-003 — border fill matches the node's channel colour stripe.
    const nodeColor = await workflowNodeBorderBackgroundColor(page, nodeUuid);
    const channelColor = await workflowChannelHeaderColorIndicatorBackgroundColor(
      page,
      node.channelUuid,
    );
    expect(nodeColor).toBe(channelColor);

    // Sidebar-only fields are not shown on the canvas node.
    await expect(workflowNodeContent(page, nodeUuid).getByText(/^Description$/i)).toHaveCount(0);
    await expect(workflowNodeContent(page, nodeUuid).getByText(/^Tags$/i)).toHaveCount(0);
    await expect(workflowNodeContent(page, nodeUuid).getByText(/^Credits$/i)).toHaveCount(0);
    await expect(workflowNodeContent(page, nodeUuid).getByText(/^Ponderation$/i)).toHaveCount(0);
    await expect(
      workflowNodeContent(page, nodeUuid).getByText(/^Specific education$/i),
    ).toHaveCount(0);

    // Debug uuid/row chrome is not part of FR-WF-NODE-001.
    await expect(workflowNode(page, nodeUuid).getByText(new RegExp(`#${nodeUuid}`))).toHaveCount(0);
  });

  test('FR-WF-NODE-001: workflowNodeTitle matches edit-form title including Untitled node fallback', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    const uniqueTitle = `E2E Node Title ${Date.now()}`;

    try {
      await patchNodeMetaViaApi(page, nodeUuid, { title: uniqueTitle });
      await page.reload();
      await expect(workflowNodeTitle(page, nodeUuid)).toHaveText(uniqueTitle);

      await workflowNodeContent(page, nodeUuid).click();
      await expect(workflowEditNodeForm(page)).toBeVisible();
      await expect(workflowEditNodeFormTitleField(page)).toHaveValue(uniqueTitle);

      await patchNodeMetaViaApi(page, nodeUuid, { title: '' });
      await page.reload();
      await expect(workflowNodeTitle(page, nodeUuid)).toHaveText('Untitled node');
    } finally {
      await patchNodeMetaViaApi(page, nodeUuid, { title: '' });
    }
  });

  test('FR-WF-NODE-001: activity meta shows context/task icons and duration time tag when set', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);

    try {
      // Solo (1) + Gather Information (1); duration 2 with unit index 1 (non-zero unit required).
      await patchNodeMetaViaApi(page, nodeUuid, {
        contextClassification: 1,
        taskClassification: 1,
        timeRequired: 2,
        timeUnits: 1,
      });
      await page.reload();

      await expect(workflowNodeMeta(page, nodeUuid)).toBeVisible();
      await expect(workflowNodeMetaIconTags(page, nodeUuid)).toHaveCount(2);
      await expect(workflowNodeMetaContextTag(page, nodeUuid)).toBeVisible();
      await expect(workflowNodeMetaTaskTag(page, nodeUuid)).toBeVisible();
      await expect(workflowNodeMetaTimeTag(page, nodeUuid)).toBeVisible();
      await expect(workflowNodeMetaTimeTag(page, nodeUuid)).toContainText(/\d/);

      // Context/task left-aligned; time right-aligned within workflowNodeMeta.
      const contextBox = await workflowNodeMetaContextTag(page, nodeUuid).boundingBox();
      const timeBox = await workflowNodeMetaTimeTag(page, nodeUuid).boundingBox();
      expect(contextBox).toBeTruthy();
      expect(timeBox).toBeTruthy();
      expect(contextBox!.x).toBeLessThan(timeBox!.x);
    } finally {
      await patchNodeMetaViaApi(page, nodeUuid, {
        contextClassification: 0,
        taskClassification: 0,
        timeRequired: 0,
        timeUnits: 0,
      });
    }
  });

  test('FR-WF-NODE-001: workflowNodeMeta is absent when context, task, and time are unset', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await patchNodeMetaViaApi(page, nodeUuid, {
      contextClassification: 0,
      taskClassification: 0,
      timeRequired: 0,
      timeUnits: 0,
    });
    await page.reload();

    await expect(workflowNodeMeta(page, nodeUuid)).toHaveCount(0);
    await expect(workflowNodeMetaTimeTag(page, nodeUuid)).toHaveCount(0);
    await expect(workflowNodeLinkedWorkflowIndicator(page, nodeUuid)).toHaveCount(0);
  });

  test('FR-WF-NODE-001: linked course node shows Linked activity indicator between title and meta', async ({
    page,
    workflow,
  }) => {
    const course = workflow.workflowByType('course');
    const activityUuid = seededLinkedActivityUuid(workflow);

    await page.goto(course.workflow_path);
    const nodeUuid = await firstWorkflowNodeUuid(page);

    try {
      await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
      await patchNodeMetaViaApi(page, nodeUuid, {
        contextClassification: 101,
        taskClassification: 0,
        timeRequired: 3,
        timeUnits: 1,
      });
      await page.reload();

      const link = workflowNodeLinkedWorkflowIndicator(page, nodeUuid);
      await expect(link).toBeVisible();
      await expect(link).toHaveText('Linked activity');

      const titleBox = await workflowNodeTitle(page, nodeUuid).boundingBox();
      const linkBox = await link.boundingBox();
      const metaBox = await workflowNodeMeta(page, nodeUuid).boundingBox();
      expect(titleBox).toBeTruthy();
      expect(linkBox).toBeTruthy();
      expect(metaBox).toBeTruthy();
      expect(titleBox!.y).toBeLessThan(linkBox!.y);
      expect(linkBox!.y).toBeLessThanOrEqual(metaBox!.y + 2);

      // Course parent: context icon may show; task tag does not apply.
      await expect(workflowNodeMetaIconTags(page, nodeUuid)).toHaveCount(1);
      await expect(workflowNodeMetaTimeTag(page, nodeUuid)).toBeVisible();
    } finally {
      await patchNodeMetaViaApi(page, nodeUuid, {
        contextClassification: 0,
        timeRequired: 0,
        timeUnits: 0,
      });
      await linkNodeWorkflowViaApi(page, nodeUuid, activityUuid);
    }
  });

  test('FR-WF-NODE-001: linked program node shows Linked course and no context/task tags', async ({
    page,
    workflow,
  }) => {
    const program = workflow.workflowByType('program');
    const courseUuid =
      workflow.manifest.navigation_linked_workflows?.course.workflow_uuid ??
      workflow.workflowByType('course').workflow_uuid;

    await page.goto(program.workflow_path);
    const nodeUuid = await ensureFirstWorkflowNodeViaApi(page, program.workflow_uuid);
    await page.reload();
    await expect(workflowNode(page, nodeUuid)).toBeVisible({ timeout: 15_000 });

    try {
      await linkNodeWorkflowViaApi(page, nodeUuid, courseUuid);
      await patchNodeMetaViaApi(page, nodeUuid, {
        timeRequired: 4,
        timeUnits: 1,
      });
      await page.reload();

      const link = workflowNodeLinkedWorkflowIndicator(page, nodeUuid);
      await expect(link).toBeVisible();
      await expect(link).toHaveText('Linked course');
      await expect(workflowNodeMetaIconTags(page, nodeUuid)).toHaveCount(0);
      await expect(workflowNodeMetaTimeTag(page, nodeUuid)).toBeVisible();
    } finally {
      await patchNodeMetaViaApi(page, nodeUuid, { timeRequired: 0, timeUnits: 0 });
      await linkNodeWorkflowViaApi(page, nodeUuid, null);
    }
  });
});

test.describe('Workflow node — selected border (FR-WF-NODE-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-NODE-002: bound workflowNode shows workflowNodeSelectedBorder exclusively', async ({
    page,
  }) => {
    const firstUuid = await firstWorkflowNodeUuid(page);
    const secondUuid = await secondWorkflowNodeUuid(page);

    await workflowNodeContent(page, firstUuid).click();
    await expect(workflowEditNodeForm(page)).toBeVisible();

    expect(await workflowNodeHasSelectedBorder(page, firstUuid)).toBe(true);
    expect(await workflowNodeHasSelectedBorder(page, secondUuid)).toBe(false);
  });
});

test.describe('Workflow node — outcome highlight (FR-WF-NODE-003)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-NODE-003: highlighted assigned workflowNode shows workflowNodeOutcomeHighlightBorder', async ({
    page,
  }) => {
    const assignedNodeUuid = await firstWorkflowNodeUuid(page);
    await openWorkflowOutcomesTab(page);
    await clickAssignTabOutcomeRow(page, E2E_SEED_OUTCOME_HEADER);

    expect(await workflowNodeHasOutcomeHighlightBorder(page, assignedNodeUuid)).toBe(true);
  });
});

test.describe('Workflow node — hover menu visibility (FR-WF-NODE-004)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-NODE-004: pointer hover shows workflowNodeHoverActionsMenu on one node only', async ({
    page,
  }) => {
    const firstUuid = await firstWorkflowNodeUuid(page);
    const secondUuid = await secondWorkflowNodeUuid(page);

    await hoverWorkflowNode(page, firstUuid);
    await expect(workflowNodeHoverCommentsItem(page, firstUuid)).toBeVisible();
    await expect(workflowNodeHoverCommentsItem(page, secondUuid)).toHaveCount(0);

    await page.mouse.move(0, 0);
    await expect(workflowNodeHoverCommentsItem(page, firstUuid)).toHaveCount(0);
  });
});

test.describe('Workflow node — hover menu composition (FR-WF-NODE-005)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('FR-WF-NODE-005: owner sees insert, duplicate, delete, and comments hover items', async ({
    page,
  }) => {
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await hoverWorkflowNode(page, nodeUuid);

    await expect(workflowNodeHoverInsertBelowItem(page, nodeUuid)).toBeEnabled();
    await expect(workflowNodeHoverDuplicateItem(page, nodeUuid)).toBeEnabled();
    await expect(workflowNodeHoverDeleteItem(page, nodeUuid)).toBeEnabled();
    await expect(workflowNodeHoverCommentsItem(page, nodeUuid)).toBeEnabled();
  });

  test('FR-WF-NODE-005: at most one node hover menu visible in workflowView', async ({ page }) => {
    const firstUuid = await firstWorkflowNodeUuid(page);
    const secondUuid = await secondWorkflowNodeUuid(page);

    await hoverWorkflowNode(page, firstUuid);

    await expect(workflowNodeHoverCommentsItem(page, firstUuid)).toBeVisible();
    await expect(workflowNodeHoverCommentsItem(page, secondUuid)).toHaveCount(0);
  });

  test.describe('Commenter hover menu (FR-WF-NODE-005)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-NODE-005: commenter sees disabled insert, duplicate, and delete hover items', async ({
      page,
      workflow,
    }) => {
      const commenter = workflow.contributorByRole('commenter');
      await loginAs(page, { email: commenter.email, password: commenter.password });
      await page.goto(workflow.path);

      const nodeUuid = await firstWorkflowNodeUuid(page);
      await hoverWorkflowNode(page, nodeUuid);

      await expect(workflowNodeHoverInsertBelowItem(page, nodeUuid)).toBeDisabled();
      await expect(workflowNodeHoverDuplicateItem(page, nodeUuid)).toBeDisabled();
      await expect(workflowNodeHoverDeleteItem(page, nodeUuid)).toBeDisabled();
      await expect(workflowNodeHoverCommentsItem(page, nodeUuid)).toBeEnabled();
    });
  });

  test.describe('Viewer hover menu (FR-WF-NODE-004/005)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-NODE-004: viewer does not see workflowNodeHoverActionsMenu on hover', async ({
      page,
      workflow,
    }) => {
      const viewer = workflow.contributorByRole('viewer');
      await loginAs(page, { email: viewer.email, password: viewer.password });
      await page.goto(workflow.path);

      const nodeUuid = await firstWorkflowNodeUuid(page);
      await hoverWorkflowNode(page, nodeUuid);

      await expect(workflowNodeHoverCommentsItem(page, nodeUuid)).toHaveCount(0);
      await expect(workflowNodeHoverInsertBelowItem(page, nodeUuid)).toHaveCount(0);
    });
  });
});
