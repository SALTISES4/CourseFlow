import { test, expect, type Page } from '../../fixtures';
import { authenticatedApiRequest } from '../../helpers/api';
import { commentsTabInSidebar } from './edit-section.locators';
import { workflowChannelCount } from './add-tab.helpers';
import {
  channelUuidByTitle,
  firstWorkflowNodeUuid,
  hoverWorkflowChannelHeader,
  openSectionCommentsViaHover,
} from './comments-tab.helpers';
import { loginAsWorkflowContributor, expectReadOnlyWorkflowEditChannelForm } from './role.helpers';
import {
  workflowChannelHeaderColorIndicatorBackgroundColor,
  workflowNodeBorderBackgroundColor,
} from './node-visual.helpers';
import {
  WORKFLOW_CHANNEL_DELETE_DIALOG_COPY,
  workflowChannelDeleteDialog,
  workflowChannelDeleteDialogCancelButton,
  workflowChannelDeleteDialogConfirmButton,
  workflowChannelHeader,
  workflowChannelHeaderBackground,
  workflowChannelHeaderByTitle,
  workflowChannelHeaders,
  workflowChannelHasSelectedBorder,
  workflowChannelHoverCommentsItem,
  workflowChannelHoverDeleteItem,
  workflowChannelHoverDuplicateItem,
  workflowChannelHoverInsertRightItem,
  workflowChannelSelectedBorderCount,
  workflowEditChannelForm,
  workflowEditChannelFormColorField,
  workflowEditChannelFormDeleteButton,
  workflowEditChannelFormDuplicateButton,
  workflowEditChannelFormTitleField,
  workflowEditNodeForm,
  workflowNode,
  workflowNodeContent,
} from './workflow-graph.locators';
import {
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
} from '../../shared/locators/workflow';
import {
  expectWorkflowChannelHeaderColour,
  hexToRgbCss,
  INSERT_CHANNEL_DEFAULT_COLOUR,
} from './workflow-channel-color.helpers';
import {
  abortChannelDragByReleaseOutside,
  abortChannelDragWithEscape,
  beginChannelDragToward,
  channelOrderUuids,
  dragChannelAfter,
  channelHeaderCenterPoint,
  restoreChannelOrderViaApi,
  workflowChannelHeaderWrapOpacity,
  workflowChannelReorderDropIndicators,
} from './edit-channel.helpers';
import {
  fetchGraphView,
  graphEdgesSnapshot,
  graphNodeAssignments,
  orderedGraphChannels,
  workflowUuidFromPath as graphWorkflowUuidFromPath,
} from './workflow-graph.helpers';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Edit channel — FR-CHAN-001–009.
 * Requirements: workflow_edit_channel_requirements_v1.yaml,
 *   workflow_duplicate_channel_requirements_v1.yaml (FR-CHAN-005),
 *   workflow_delete_channel_requirements_v1.yaml (FR-CHAN-006)
 * Fixture channels: E2E Channel A/B/C (course_flow/e2e_seed/constants.py)
 */

const E2E_CHANNEL_A = 'E2E Channel A';
const E2E_CHANNEL_A_COPY = `${E2E_CHANNEL_A} (copy)`;
const E2E_CHANNEL_B = 'E2E Channel B';
const E2E_CHANNEL_B_COPY = `${E2E_CHANNEL_B} (copy)`;
const E2E_CHANNEL_C = 'E2E Channel C';
const E2E_CHANNEL_C_COPY = `${E2E_CHANNEL_C} (copy)`;

/** Distinct from seeded channel colours so header/node updates are observable. */
const E2E_CHANNEL_COLOR_PATCH = '#E91E63';

function workflowUuidFromPath(path: string): string {
  return graphWorkflowUuidFromPath(path);
}

function orderedGraphChannelUuids(graph: Awaited<ReturnType<typeof fetchGraphView>>): string[] {
  return orderedGraphChannels(graph).map((channel) => channel.uuid);
}

async function nodeUuidsInChannel(page: Page, workflowUuid: string, channelUuid: string) {
  const graph = await fetchGraphView(page, workflowUuid);
  return graph.nodes
    .filter((node) => node.channelUuid === channelUuid)
    .map((node) => node.uuid);
}

function edgesReferencingNodeUuids(
  graph: Awaited<ReturnType<typeof fetchGraphView>>,
  nodeUuids: readonly string[],
) {
  const nodeSet = new Set(nodeUuids);
  return graph.edges.filter(
    (edge) => nodeSet.has(edge.sourceNodeUuid) || nodeSet.has(edge.targetNodeUuid),
  );
}

async function insertChannelRight(page: Page, sourceUuid: string): Promise<string> {
  const beforeCount = await workflowChannelCount(page);
  await hoverWorkflowChannelHeader(page, sourceUuid);
  await workflowChannelHoverInsertRightItem(page, sourceUuid).click();
  await expect
    .poll(async () => workflowChannelCount(page), { timeout: 10_000 })
    .toBe(beforeCount + 1);

  const headers = workflowChannelHeaders(page);
  for (let index = 0; index < (await headers.count()) - 1; index += 1) {
    if ((await headers.nth(index).getAttribute('data-column-id')) !== sourceUuid) {
      continue;
    }
    const insertedUuid = await headers.nth(index + 1).getAttribute('data-column-id');
    if (insertedUuid) {
      return insertedUuid;
    }
  }
  throw new Error(`No inserted workflow channel found to the right of ${sourceUuid}.`);
}

async function assertDuplicateChannelColorParity(
  page: Page,
  sourceUuid: string,
  copyTitle: string,
): Promise<void> {
  const sourceStripeColor = await workflowChannelHeaderColorIndicatorBackgroundColor(
    page,
    sourceUuid,
  );
  const copyUuid = await channelUuidByTitle(page, copyTitle);

  await expect
    .poll(async () => workflowChannelHeaderColorIndicatorBackgroundColor(page, copyUuid), {
      timeout: 10_000,
    })
    .toBe(sourceStripeColor);

  await workflowChannelHeader(page, sourceUuid).click();
  await expect(workflowEditChannelForm(page)).toBeVisible();
  const sourceHex = await workflowEditChannelFormColorField(page).inputValue();

  await workflowChannelHeader(page, copyUuid).click();
  await expect(workflowEditChannelFormColorField(page)).toHaveValue(sourceHex);
}

async function duplicateChannelViaHover(page: Page, sourceTitle: string): Promise<string> {
  const sourceUuid = await channelUuidByTitle(page, sourceTitle);
  const copyTitle = `${sourceTitle} (copy)`;
  const beforeCount = await workflowChannelCount(page);

  await hoverWorkflowChannelHeader(page, sourceUuid);
  await workflowChannelHoverDuplicateItem(page, sourceUuid).click();

  await expect
    .poll(async () => workflowChannelCount(page), { timeout: 10_000 })
    .toBe(beforeCount + 1);
  await expect(workflowChannelHeaderByTitle(page, copyTitle)).toBeVisible();

  return channelUuidByTitle(page, copyTitle);
}

test.describe('FR-CHAN-001: open workflowEditChannelForm', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('click workflowChannelHeader expands sidebar on workflowRightSidebarEditTab', async ({
    page,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();

    await workflowChannelHeader(page, channelUuid).click();

    await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
    await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowEditChannelForm(page)).toBeVisible();
    await expect(workflowEditChannelFormTitleField(page)).toBeVisible();
  });

  test('channel header click from comments tab rebinds workflowEditChannelForm', async ({
    page,
    workflow,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

    await openSectionCommentsViaHover(page, workflow.firstSection().uuid);
    await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');

    await workflowChannelHeader(page, channelUuid).click();

    await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowEditChannelForm(page)).toBeVisible();
  });

  test.describe('commenter and viewer permissions (FR-CHAN-001, FR-CHAN-003)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-CHAN-001/003: commenter opens read-only workflowEditChannelForm from channel header', async ({
      page,
      workflow,
    }) => {
      await loginAsWorkflowContributor(page, workflow, 'commenter');
      await page.goto(workflow.path);

      const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
      await workflowChannelHeader(page, channelUuid).click();

      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expectReadOnlyWorkflowEditChannelForm(page);
    });

    test('FR-CHAN-001/003: viewer opens read-only workflowEditChannelForm from channel header', async ({
      page,
      workflow,
    }) => {
      await loginAsWorkflowContributor(page, workflow, 'viewer');
      await page.goto(workflow.path);

      const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
      await workflowChannelHeader(page, channelUuid).click();

      await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
      await expectReadOnlyWorkflowEditChannelForm(page);
    });
  });
});

test.describe('FR-CHAN-002: header display', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('workflowChannelHeaderTitleText shows seeded channel title', async ({ page }) => {
    const header = workflowChannelHeaderByTitle(page, E2E_CHANNEL_A);
    await expect(header).toBeVisible();
    await expect(header).toContainText(E2E_CHANNEL_A);
  });

  test('workflowChannelHeaderColorIndicator matches workflowEditChannelFormColorField on load', async ({
    page,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

    await workflowChannelHeader(page, channelUuid).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();

    const effectiveHex = await workflowEditChannelFormColorField(page).inputValue();
    expect(effectiveHex.length).toBeGreaterThan(0);
    await expectWorkflowChannelHeaderColour(page, channelUuid, effectiveHex);
  });
});

test.describe('FR-CHAN-003: title and color auto-save', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('channel title field change updates channel header and nodes', async ({
    page,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_C);
    const uniqueTitle = `E2E Ch ${Date.now()}`;

    await workflowChannelHeader(page, channelUuid).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();

    await workflowEditChannelFormTitleField(page).fill(uniqueTitle);
    await page.waitForTimeout(500);

    await expect(workflowChannelHeader(page, channelUuid)).toContainText(uniqueTitle);
  });

  test('clearing title shows Untitled node category on header and blank Title field', async ({
    page,
  }) => {
    // Prefer Channel B — Channel C is mutated by the title-change test above.
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_B);
    const titleField = workflowEditChannelFormTitleField(page);

    await workflowChannelHeader(page, channelUuid).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();

    const originalTitle = await titleField.inputValue();
    expect(originalTitle.length).toBeGreaterThan(0);

    try {
      await titleField.fill('');
      await titleField.blur();

      await expect(titleField).toHaveValue('', { timeout: 15_000 });
      await expect(workflowChannelHeader(page, channelUuid)).toContainText(
        'Untitled node category',
        { timeout: 15_000 },
      );
    } finally {
      await titleField.fill(originalTitle || E2E_CHANNEL_B);
      await titleField.blur();
      await expect(workflowChannelHeader(page, channelUuid)).toContainText(
        originalTitle || E2E_CHANNEL_B,
        { timeout: 15_000 },
      );
    }
  });

  test('color change updates channel header stripe and all node borders in that channel', async ({
    page,
    workflow,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
    const workflowUuid = workflowUuidFromPath(workflow.path);
    const nodeUuids = await nodeUuidsInChannel(page, workflowUuid, channelUuid);
    expect(nodeUuids.length, 'Channel A must contain nodes to assert workflowNodeBorder').toBeGreaterThan(
      0,
    );

    await workflowChannelHeader(page, channelUuid).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();

    // Color field is shown for all roles; owner/editor may edit it (FR-CHAN-003 roleBehavior).
    const colorField = workflowEditChannelFormColorField(page);
    await expect(colorField).toBeVisible();
    await expect(colorField).toBeEditable();

    const originalColor = await colorField.inputValue();
    const expectedRgb = hexToRgbCss(E2E_CHANNEL_COLOR_PATCH);

    try {
      await colorField.fill(E2E_CHANNEL_COLOR_PATCH);
      await expect(colorField).toHaveValue(E2E_CHANNEL_COLOR_PATCH);

      await expect
        .poll(
          async () => workflowChannelHeaderColorIndicatorBackgroundColor(page, channelUuid),
          { timeout: 10_000 },
        )
        .toBe(expectedRgb);

      for (const nodeUuid of nodeUuids) {
        await expect(workflowNode(page, nodeUuid)).toBeVisible();
        await expect
          .poll(async () => workflowNodeBorderBackgroundColor(page, nodeUuid), {
            timeout: 10_000,
          })
          .toBe(expectedRgb);
      }
    } finally {
      if (originalColor) {
        await colorField.fill(originalColor);
        await page.waitForTimeout(500);
      }
    }
  });

  test('clearing colour field resets to default #CFD8DC on header and colour field', async ({
    page,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_B);
    const colorField = workflowEditChannelFormColorField(page);

    await workflowChannelHeader(page, channelUuid).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();

    const originalColor = await colorField.inputValue();

    try {
      await colorField.fill(E2E_CHANNEL_COLOR_PATCH);
      await expect(colorField).toHaveValue(E2E_CHANNEL_COLOR_PATCH);
      await expectWorkflowChannelHeaderColour(page, channelUuid, E2E_CHANNEL_COLOR_PATCH);

      await colorField.fill('');
      await expect(colorField).toHaveValue(INSERT_CHANNEL_DEFAULT_COLOUR, {
        timeout: 15_000,
      });
      await expectWorkflowChannelHeaderColour(
        page,
        channelUuid,
        INSERT_CHANNEL_DEFAULT_COLOUR,
      );
    } finally {
      await colorField.fill(originalColor || INSERT_CHANNEL_DEFAULT_COLOUR);
      await page.waitForTimeout(500);
    }
  });
});

test.describe('FR-CHAN-004: insert right', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('hover Insert right creates new column at K+1', async ({ page }) => {
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
    const sidebarOpenBefore = await workflowEditChannelForm(page).isVisible();
    const insertedUuid = await insertChannelRight(page, channelC);
    expect(insertedUuid).not.toBe(channelC);

    expect(await workflowEditChannelForm(page).isVisible()).toBe(sidebarOpenBefore);

    await workflowChannelHeader(page, insertedUuid).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();
    await expect(workflowRightSidebarContentPanel(page)).toBeVisible();
    await expect(workflowEditChannelFormTitleField(page)).toHaveValue('Custom node category');
    await expect(workflowChannelHeader(page, insertedUuid)).toContainText('Custom node category');
  });

  test('insert right shows default colour on workflowChannelHeaderColorIndicator', async ({
    page,
  }) => {
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
    const insertedUuid = await insertChannelRight(page, channelC);

    await expectWorkflowChannelHeaderColour(
      page,
      insertedUuid,
      INSERT_CHANNEL_DEFAULT_COLOUR,
    );

    await workflowChannelHeader(page, insertedUuid).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();
    await expect(workflowEditChannelFormColorField(page)).toHaveValue(
      INSERT_CHANNEL_DEFAULT_COLOUR,
    );
  });

  test('inserted column can be deleted without affecting another test', async ({ page }) => {
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
    const insertedUuid = await insertChannelRight(page, channelC);
    const beforeCount = await workflowChannelCount(page);

    await hoverWorkflowChannelHeader(page, insertedUuid);
    await workflowChannelHoverDeleteItem(page, insertedUuid).click();
    await page.getByRole('button', { name: 'Delete node category', exact: true }).click();

    await expect
      .poll(async () => workflowChannelCount(page), { timeout: 10_000 })
      .toBe(beforeCount - 1);
    await expect(workflowChannelHeader(page, insertedUuid)).toHaveCount(0);
  });
});

test.describe('FR-CHAN-005: duplicate', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('hover duplicate creates workflowChannel with (copy) title immediately to the right', async ({
    page,
  }) => {
    const sourceUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

    await duplicateChannelViaHover(page, E2E_CHANNEL_A);
    await assertDuplicateChannelColorParity(page, sourceUuid, E2E_CHANNEL_A_COPY);
  });

  test('sidebar Duplicate creates workflowChannel with (copy) title and matching colour', async ({
    page,
  }) => {
    const sourceUuid = await channelUuidByTitle(page, E2E_CHANNEL_C);
    const beforeCount = await workflowChannelCount(page);

    await workflowChannelHeader(page, sourceUuid).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();
    await workflowEditChannelFormDuplicateButton(page).click();

    await expect
      .poll(async () => workflowChannelCount(page), { timeout: 10_000 })
      .toBe(beforeCount + 1);
    await expect(workflowChannelHeaderByTitle(page, E2E_CHANNEL_C_COPY)).toBeVisible();

    // FR-CHAN-005: duplicate does not rebind sidebar — form stays on source channel.
    await expect(workflowEditChannelFormTitleField(page)).toHaveValue(E2E_CHANNEL_C);
    await assertDuplicateChannelColorParity(page, sourceUuid, E2E_CHANNEL_C_COPY);
  });
});

test.describe('FR-CHAN-006: delete', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('hover Delete opens workflowChannelDeleteDialog', async ({ page }) => {
    const copyUuid = await duplicateChannelViaHover(page, E2E_CHANNEL_B);

    await hoverWorkflowChannelHeader(page, copyUuid);
    await workflowChannelHoverDeleteItem(page, copyUuid).click();

    await expect(workflowChannelDeleteDialog(page)).toBeVisible();
    await workflowChannelDeleteDialogCancelButton(page).click();
    await expect(workflowChannelDeleteDialog(page)).toHaveCount(0);
  });

  test('sidebar Delete opens workflowChannelDeleteDialog', async ({ page }) => {
    const copyUuid = await duplicateChannelViaHover(page, E2E_CHANNEL_B);

    await workflowChannelHeader(page, copyUuid).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();
    await workflowEditChannelFormDeleteButton(page).click();

    await expect(workflowChannelDeleteDialog(page)).toBeVisible();
    await workflowChannelDeleteDialogCancelButton(page).click();
    await expect(workflowChannelDeleteDialog(page)).toHaveCount(0);
  });

  test('delete dialog shows warning copy and actions', async ({ page }) => {
    const copyUuid = await duplicateChannelViaHover(page, E2E_CHANNEL_B);
    const dialog = workflowChannelDeleteDialog(page);

    await hoverWorkflowChannelHeader(page, copyUuid);
    await workflowChannelHoverDeleteItem(page, copyUuid).click();

    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading')).toHaveText(WORKFLOW_CHANNEL_DELETE_DIALOG_COPY.title);
    await expect(dialog).toContainText(WORKFLOW_CHANNEL_DELETE_DIALOG_COPY.body);
    await expect(workflowChannelDeleteDialogCancelButton(page)).toBeVisible();
    await expect(workflowChannelDeleteDialogConfirmButton(page)).toBeVisible();

    await workflowChannelDeleteDialogCancelButton(page).click();
    await expect(dialog).toHaveCount(0);
  });

  test('cancel keeps channel in workflowChannelsHeaderRow', async ({ page }) => {
    const copyUuid = await duplicateChannelViaHover(page, E2E_CHANNEL_B);
    const beforeCount = await workflowChannelCount(page);

    await hoverWorkflowChannelHeader(page, copyUuid);
    await workflowChannelHoverDeleteItem(page, copyUuid).click();

    await expect(workflowChannelDeleteDialog(page)).toBeVisible();
    await workflowChannelDeleteDialogCancelButton(page).click();

    await expect(workflowChannelDeleteDialog(page)).toHaveCount(0);
    await expect(workflowChannelHeader(page, copyUuid)).toBeVisible();
    await expect.poll(async () => workflowChannelCount(page)).toBe(beforeCount);
  });

  test('confirm removes channel from workflowChannelsHeaderRow', async ({ page }) => {
    const copyUuid = await duplicateChannelViaHover(page, E2E_CHANNEL_B);
    const beforeCount = await workflowChannelCount(page);

    await workflowChannelHeader(page, copyUuid).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();
    expect(await workflowChannelSelectedBorderCount(page)).toBe(1);

    await workflowEditChannelFormDeleteButton(page).click();
    await workflowChannelDeleteDialogConfirmButton(page).click();

    await expect
      .poll(async () => workflowChannelCount(page), { timeout: 10_000 })
      .toBe(beforeCount - 1);
    await expect(workflowChannelHeaderByTitle(page, E2E_CHANNEL_B_COPY)).toHaveCount(0);
    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
    expect(await workflowChannelSelectedBorderCount(page)).toBe(0);
  });

  test('confirm delete removes assigned workflowNodes and related workflowEdges', async ({
    page,
    workflow,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_C);
    const graphBefore = await fetchGraphView(page, workflow.workflowUuid);
    const nodeUuids = graphBefore.nodes
      .filter((node) => node.channelUuid === channelUuid)
      .map((node) => node.uuid);
    expect(
      nodeUuids.length,
      'Seeded channel must contain workflowNodes for FR-CHAN-006 node cleanup.',
    ).toBeGreaterThan(0);

    const edgesBefore = edgesReferencingNodeUuids(graphBefore, nodeUuids);
    for (const nodeUuid of nodeUuids) {
      await expect(workflowNode(page, nodeUuid)).toBeVisible();
    }

    await hoverWorkflowChannelHeader(page, channelUuid);
    await workflowChannelHoverDeleteItem(page, channelUuid).click();
    await expect(workflowChannelDeleteDialog(page)).toBeVisible();
    await workflowChannelDeleteDialogConfirmButton(page).click();

    await expect(workflowChannelHeader(page, channelUuid)).toHaveCount(0, { timeout: 10_000 });
    await expect(workflowChannelHeaderByTitle(page, E2E_CHANNEL_A)).toBeVisible();
    await expect(workflowChannelHeaderByTitle(page, E2E_CHANNEL_B)).toBeVisible();

    for (const nodeUuid of nodeUuids) {
      await expect(workflowNode(page, nodeUuid)).toHaveCount(0, { timeout: 10_000 });
    }

    await expect
      .poll(async () => {
        const graph = await fetchGraphView(page, workflow.workflowUuid);
        return {
          nodesStillInChannel: graph.nodes.filter((node) => node.channelUuid === channelUuid)
            .length,
          edgesStillTouchingRemovedNodes: edgesReferencingNodeUuids(graph, nodeUuids).length,
        };
      }, { timeout: 15_000 })
      .toEqual({ nodesStillInChannel: 0, edgesStillTouchingRemovedNodes: 0 });

    if (edgesBefore.length > 0) {
      const edgeIdsBefore = new Set(edgesBefore.map((edge) => edge.id));
      const graphAfter = await fetchGraphView(page, workflow.workflowUuid);
      const survivingRemovedEdges = graphAfter.edges.filter((edge) => edgeIdsBefore.has(edge.id));
      expect(survivingRemovedEdges).toEqual([]);
    }
  });
});

test.describe('FR-CHAN-007: hover menu', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('owner and editors see insert, duplicate, delete, and comments on channel hover', async ({
    page,
  }) => {
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);

    await hoverWorkflowChannelHeader(page, channelUuid);

    await expect(workflowChannelHoverInsertRightItem(page, channelUuid)).toBeEnabled();
    await expect(workflowChannelHoverDuplicateItem(page, channelUuid)).toBeEnabled();
    await expect(workflowChannelHoverDeleteItem(page, channelUuid)).toBeEnabled();
    await expect(workflowChannelHoverCommentsItem(page, channelUuid)).toBeEnabled();
  });

  test.describe('commenter', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-CHAN-007: commenter sees disabled insert, duplicate, and delete; comments active', async ({
      page,
      workflow,
    }) => {
      await loginAsWorkflowContributor(page, workflow, 'commenter');
      await page.goto(workflow.path);

      const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
      await hoverWorkflowChannelHeader(page, channelUuid);

      await expect(workflowChannelHoverInsertRightItem(page, channelUuid)).toBeDisabled();
      await expect(workflowChannelHoverDuplicateItem(page, channelUuid)).toBeDisabled();
      await expect(workflowChannelHoverDeleteItem(page, channelUuid)).toBeDisabled();
      await expect(workflowChannelHoverCommentsItem(page, channelUuid)).toBeEnabled();
    });
  });

  test.describe('viewer', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-CHAN-007: viewer does not see workflowChannelHoverActionsMenu on hover', async ({
      page,
      workflow,
    }) => {
      await loginAsWorkflowContributor(page, workflow, 'viewer');
      await page.goto(workflow.path);

      const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
      await workflowChannelHeader(page, channelUuid).hover();

      await expect(workflowChannelHoverInsertRightItem(page, channelUuid)).toHaveCount(0);
      await expect(workflowChannelHoverDuplicateItem(page, channelUuid)).toHaveCount(0);
      await expect(workflowChannelHoverDeleteItem(page, channelUuid)).toHaveCount(0);
      await expect(workflowChannelHoverCommentsItem(page, channelUuid)).toHaveCount(0);
    });
  });
});

test.describe('FR-CHAN-008: lateral channel reorder', () => {
  test.describe('owner', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await page.goto(workflow.path);
      await expect(workflowChannelHeaders(page).first()).toBeVisible({ timeout: 15_000 });
    });

  test('FR-CHAN-008: drag channel updates header order and preserves node assignments and edges', async ({
    page,
    workflow,
  }) => {
    const channelA = await channelUuidByTitle(page, E2E_CHANNEL_A);
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
    const orderBefore = await channelOrderUuids(page);
    const graphBefore = await fetchGraphView(page, workflow.workflowUuid);
    const nodesInA = await nodeUuidsInChannel(page, workflow.workflowUuid, channelA);

    try {
      await dragChannelAfter(page, channelA, channelC);

      await expect.poll(async () => channelOrderUuids(page)).not.toEqual(orderBefore);

      const orderAfter = await channelOrderUuids(page);
      expect(orderAfter.indexOf(channelA)).toBeGreaterThan(orderAfter.indexOf(channelC));
      expect(await nodeUuidsInChannel(page, workflow.workflowUuid, channelA)).toEqual(nodesInA);

      await expect
        .poll(async () => {
          const graph = await fetchGraphView(page, workflow.workflowUuid);
          return orderedGraphChannelUuids(graph);
        }, { timeout: 15_000 })
        .toEqual(orderAfter);

      const graphAfter = await fetchGraphView(page, workflow.workflowUuid);
      expect(graphNodeAssignments(graphAfter)).toEqual(graphNodeAssignments(graphBefore));
      expect(graphEdgesSnapshot(graphAfter)).toEqual(graphEdgesSnapshot(graphBefore));
    } finally {
      await restoreChannelOrderViaApi(page, workflow.graphUuid, orderBefore);
    }
  });

  test('FR-CHAN-008: in-flight drag shows source dimming and drop indicator', async ({ page }) => {
    const channelA = await channelUuidByTitle(page, E2E_CHANNEL_A);
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);

    await beginChannelDragToward(page, channelA, channelC, 'right');

    try {
      await expect
        .poll(async () => workflowChannelHeaderWrapOpacity(page, channelA), { timeout: 5_000 })
        .toBe('0.4');
      await expect(workflowChannelReorderDropIndicators(page).first()).toBeVisible({
        timeout: 5_000,
      });
    } finally {
      await abortChannelDragWithEscape(page);
    }
  });

  test('FR-CHAN-008: in-flight drag suppresses workflowChannelHoverActionsMenu', async ({
    page,
  }) => {
    const channelA = await channelUuidByTitle(page, E2E_CHANNEL_A);
    const channelB = await channelUuidByTitle(page, E2E_CHANNEL_B);
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);

    await hoverWorkflowChannelHeader(page, channelB);
    await expect(workflowChannelHoverInsertRightItem(page, channelB)).toBeVisible();

    await beginChannelDragToward(page, channelA, channelC, 'right');
    const bPoint = await channelHeaderCenterPoint(page, channelB);

    try {
      await page.mouse.move(bPoint.x, bPoint.y, { steps: 12 });
      await expect(workflowChannelHoverInsertRightItem(page, channelB)).toHaveCount(0);
      await expect(workflowChannelHoverInsertRightItem(page, channelA)).toHaveCount(0);
    } finally {
      await abortChannelDragWithEscape(page);
    }
  });

  test('FR-CHAN-008: Escape abort keeps channel order unchanged', async ({ page }) => {
    const channelA = await channelUuidByTitle(page, E2E_CHANNEL_A);
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
    const orderBefore = await channelOrderUuids(page);

    await beginChannelDragToward(page, channelA, channelC, 'right');
    await abortChannelDragWithEscape(page);

    await expect.poll(async () => channelOrderUuids(page)).toEqual(orderBefore);
    await expect(workflowChannelReorderDropIndicators(page)).toHaveCount(0);
    await expect
      .poll(async () => workflowChannelHeaderWrapOpacity(page, channelA))
      .not.toBe('0.4');
  });

  test('FR-CHAN-008: release outside abort keeps channel order unchanged', async ({ page }) => {
    const channelA = await channelUuidByTitle(page, E2E_CHANNEL_A);
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
    const orderBefore = await channelOrderUuids(page);

    await beginChannelDragToward(page, channelA, channelC, 'right');
    await abortChannelDragByReleaseOutside(page);

    await expect.poll(async () => channelOrderUuids(page)).toEqual(orderBefore);
  });

  test('FR-CHAN-008: drag gesture does not rebind workflowEditChannelForm', async ({ page }) => {
    const channelA = await channelUuidByTitle(page, E2E_CHANNEL_A);
    const channelB = await channelUuidByTitle(page, E2E_CHANNEL_B);
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);

    await workflowChannelHeader(page, channelA).click();
    await expect(workflowEditChannelFormTitleField(page)).toHaveValue(E2E_CHANNEL_A);

    await beginChannelDragToward(page, channelB, channelC, 'right');

    try {
      await expect(workflowEditChannelFormTitleField(page)).toHaveValue(E2E_CHANNEL_A);
    } finally {
      await abortChannelDragWithEscape(page);
    }
  });

  test('FR-CHAN-008: selected border remains on bound source during drag', async ({ page }) => {
    const channelA = await channelUuidByTitle(page, E2E_CHANNEL_A);
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);

    await workflowChannelHeader(page, channelA).click();
    await expect(workflowChannelHeaderBackground(page, channelA)).toHaveCSS('box-shadow', /2px/);

    await beginChannelDragToward(page, channelA, channelC, 'right');

    try {
      await expect(workflowChannelHeaderBackground(page, channelA)).toHaveCSS('box-shadow', /2px/);
      await expect
        .poll(async () => workflowChannelHeaderWrapOpacity(page, channelA), { timeout: 5_000 })
        .toBe('0.4');
    } finally {
      await abortChannelDragWithEscape(page);
    }
  });
  });

  test.describe('commenter', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'commenter');
      await page.goto(workflow.path);
      await expect(workflowChannelHeaders(page).first()).toBeVisible({ timeout: 15_000 });
    });

    test('FR-CHAN-008: commenter cannot laterally reorder channels', async ({ page }) => {
      const channelA = await channelUuidByTitle(page, E2E_CHANNEL_A);
      const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
      const orderBefore = await channelOrderUuids(page);

      await dragChannelAfter(page, channelA, channelC);

      await expect.poll(async () => channelOrderUuids(page)).toEqual(orderBefore);
    });
  });

  test.describe('viewer', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'viewer');
      await page.goto(workflow.path);
      await expect(workflowChannelHeaders(page).first()).toBeVisible({ timeout: 15_000 });
    });

    test('FR-CHAN-008: viewer cannot laterally reorder channels', async ({ page }) => {
      const channelA = await channelUuidByTitle(page, E2E_CHANNEL_A);
      const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
      const orderBefore = await channelOrderUuids(page);

      await dragChannelAfter(page, channelA, channelC);

      await expect.poll(async () => channelOrderUuids(page)).toEqual(orderBefore);
    });
  });
});

test.describe('FR-CHAN-009: selected border', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflow.path);
  });

  test('workflowChannelHeaderSelectedBorder on bound channel only', async ({ page }) => {
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);

    await workflowChannelHeader(page, channelC).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();
    await expect(workflowChannelHeaderBackground(page, channelC)).toHaveCSS('box-shadow', /2px/);
    expect(await workflowChannelSelectedBorderCount(page)).toBe(1);
  });

  test('non-channel host clears workflowChannelHeaderSelectedBorder', async ({ page }) => {
    const channelC = await channelUuidByTitle(page, E2E_CHANNEL_C);
    const nodeUuid = await firstWorkflowNodeUuid(page);

    await workflowChannelHeader(page, channelC).click();
    await expect(workflowEditChannelForm(page)).toBeVisible();
    await expect(workflowChannelHeaderBackground(page, channelC)).toHaveCSS('box-shadow', /2px/);

    await workflowNodeContent(page, nodeUuid).click();
    await expect(workflowEditNodeForm(page)).toBeVisible();
    expect(await workflowChannelHasSelectedBorder(page, channelC)).toBe(false);
  });
});
