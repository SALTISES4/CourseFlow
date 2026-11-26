import { test, expect } from '../../fixtures';
import { loginAsTestUser } from '../../helpers/auth';
import { firstWorkflowNodeUuid, secondWorkflowNodeUuid } from './comments-tab.helpers';
import { loginAsWorkflowContributor, expectReadOnlyWorkflowEditEdgeForm } from './role.helpers';
import {
  clickWorkflowEdge,
  dragWorkflowEdgeFromHandleToHandle,
  dragWorkflowEdgeReconnectSource,
  dragWorkflowEdgeReconnectTarget,
  firstClickableWorkflowEdgeId,
} from './edge.helpers';
import {
  workflowEdge,
  workflowEdgeTitleLabel,
  workflowEditEdgeFormDeleteButton,
  workflowEditEdgeFormHeading,
  workflowEditEdgeFormTitleField,
  workflowEditEdgeFormDashedLineToggle,
  workflowNodeEdgeHandles,
  workflowEdgeSourceReconnectHandle,
  workflowEdgeTargetReconnectHandle,
} from './edge.locators';
import {
  edgeIdString,
  fetchGraphView,
  findEdgeBetween,
  type GraphViewEdge,
  type GraphViewPayload,
  nodePairWithoutEdge,
  workflowUuidFromPath,
} from './workflow-graph.helpers';
import { workflowNode } from './workflow-graph.locators';
import {
  workflowRightSidebar,
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
  workflowRightSidebarTabStrip,
} from '../../shared/locators/workflow';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Workflow edge — FR-WF-EDGE-001 through FR-WF-EDGE-004.
 * Requirements: workflow_edge_requirements_v1.yaml
 */

async function gotoWorkflowGraph(page: import('@playwright/test').Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(workflowNode(page, await firstWorkflowNodeUuid(page))).toBeVisible({
    timeout: 15_000,
  });
}

async function firstClickableSeedEdge(
  page: import('@playwright/test').Page,
  graph: GraphViewPayload,
): Promise<GraphViewEdge> {
  const edgeId = await firstClickableWorkflowEdgeId(page, graph.edges.map(edgeIdString));
  const edge = graph.edges.find((candidate) => edgeIdString(candidate) === edgeId);
  if (!edge) {
    throw new Error(`Clickable workflowEdge ${edgeId} is missing from graph payload`);
  }
  return edge;
}

const CANONICAL_EDGE_PORT = {
  top: '0',
  right: '1',
  bottom: '2',
  left: '3',
} as const;

test.describe('Workflow edge — select and edit (FR-WF-EDGE-004)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await gotoWorkflowGraph(page, workflow.path);
  });

  test('FR-WF-EDGE-004: owner clicks workflowEdge and workflowEditEdgeForm opens with heading', async ({
    page,
    workflow,
  }) => {
    const workflowUuid = workflowUuidFromPath(workflow.path);
    const graph = await fetchGraphView(page, workflowUuid);
    const edge = await firstClickableSeedEdge(page, graph);
    expect(edge, 'seeded workflow should include at least one workflowEdge').toBeTruthy();

    await clickWorkflowEdge(page, edgeIdString(edge));

    await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(workflowEditEdgeFormHeading(page)).toBeVisible();
    await expect(workflowEditEdgeFormTitleField(page)).toBeEditable();
    await expect(workflowEditEdgeFormDashedLineToggle(page)).toBeEnabled();
    await expect(workflowEditEdgeFormDeleteButton(page)).toBeEnabled();
  });

  test('FR-WF-EDGE-004: owner edits title and dashed style without explicit save control', async ({
    page,
    workflow,
  }) => {
    const workflowUuid = workflowUuidFromPath(workflow.path);
    const graph = await fetchGraphView(page, workflowUuid);
    const edge = await firstClickableSeedEdge(page, graph);

    await clickWorkflowEdge(page, edgeIdString(edge));
    await workflowEditEdgeFormTitleField(page).fill('E2E edge title');
    await workflowEditEdgeFormDashedLineToggle(page).check();

    await expect
      .poll(async () => {
        const refreshed = await fetchGraphView(page, workflowUuid);
        const updated = refreshed.edges.find((item) => item.id === edge.id);
        return updated?.title ?? '';
      })
      .toBe('E2E edge title');

    await expect
      .poll(async () => {
        const refreshed = await fetchGraphView(page, workflowUuid);
        const updated = refreshed.edges.find((item) => item.id === edge.id);
        return updated?.lineType ?? '';
      })
      .not.toBe(edge.lineType);

    const edgeTitle = workflowEdgeTitleLabel(
      page,
      edgeIdString(edge),
      'E2E edge title',
    );
    await expect(edgeTitle).toBeVisible();
    await expect(edgeTitle).toHaveAttribute('text-anchor', 'middle');
    await expect(edgeTitle).toHaveAttribute('dominant-baseline', 'middle');
    await expect(edgeTitle).toHaveAttribute('font-size', '12');
    await expect(edgeTitle).toHaveAttribute('fill', '#000');

    const titleBackground = edgeTitle.locator('..').locator('rect').first();
    await expect(titleBackground).toHaveAttribute('fill', 'white');
    await expect(titleBackground).toHaveAttribute('rx', '5');
    await expect(titleBackground).toHaveAttribute('ry', '5');
    await expect
      .poll(async () => {
        const [textBox, backgroundBox] = await Promise.all([
          edgeTitle.boundingBox(),
          titleBackground.boundingBox(),
        ]);
        if (!textBox || !backgroundBox) return null;
        return (
          backgroundBox.width >= textBox.width &&
          backgroundBox.height >= textBox.height &&
          Math.abs(
            backgroundBox.x + backgroundBox.width / 2 -
              (textBox.x + textBox.width / 2),
          ) <= 1 &&
          Math.abs(
            backgroundBox.y + backgroundBox.height / 2 -
              (textBox.y + textBox.height / 2),
          ) <= 1
        );
      })
      .toBe(true);
  });
});

test.describe('Workflow edge — delete (FR-WF-EDGE-002)', () => {
  test('FR-WF-EDGE-002: owner deletes workflowEdge via workflowEditEdgeFormDeleteButton', async ({
    page,
    workflow,
  }) => {
    await gotoWorkflowGraph(page, workflow.path);

    const workflowUuid = workflowUuidFromPath(workflow.path);
    const graph = await fetchGraphView(page, workflowUuid);
    const edge = await firstClickableSeedEdge(page, graph);
    const edgeId = edgeIdString(edge);

    await clickWorkflowEdge(page, edgeId);
    await workflowEditEdgeFormDeleteButton(page).click();

    await expect(workflowEdge(page, edgeId)).toHaveCount(0, { timeout: 15_000 });
    await expect(workflowRightSidebarContentPanel(page)).toBeHidden();
    await expect(workflowRightSidebar(page)).toHaveCount(1);
    await expect(workflowRightSidebarTabStrip(page)).toBeVisible();

    const after = await fetchGraphView(page, workflowUuid);
    expect(after.edges.some((item) => item.id === edge.id)).toBe(false);
    expect(after.nodes.length).toBe(graph.nodes.length);
  });
});

test.describe('Workflow edge — create (FR-WF-EDGE-001)', () => {
  test('FR-WF-EDGE-001: owner creates workflowEdge by dragging node handles', async ({
    page,
    workflow,
  }) => {
    await gotoWorkflowGraph(page, workflow.path);

    const workflowUuid = workflowUuidFromPath(workflow.path);
    const before = await fetchGraphView(page, workflowUuid);
    const pair = nodePairWithoutEdge(before);
    expect(pair, 'need two nodes without an existing source→target edge').toBeTruthy();
    const [sourceUuid, targetUuid] = pair!;

    await dragWorkflowEdgeFromHandleToHandle(page, sourceUuid, targetUuid);

    await expect
      .poll(async () => {
        const after = await fetchGraphView(page, workflowUuid);
        return findEdgeBetween(after, sourceUuid, targetUuid);
      })
      .toBeTruthy();

    const after = await fetchGraphView(page, workflowUuid);
    const created = findEdgeBetween(after, sourceUuid, targetUuid)!;
    await expect(workflowEdge(page, edgeIdString(created))).toBeVisible({ timeout: 10_000 });
  });

  test('FR-WF-EDGE-001: release on same workflowNode does not create workflowEdge', async ({
    page,
    workflow,
  }) => {
    await gotoWorkflowGraph(page, workflow.path);

    const workflowUuid = workflowUuidFromPath(workflow.path);
    const before = await fetchGraphView(page, workflowUuid);
    const nodeUuid = before.nodes[0]?.uuid;
    expect(nodeUuid).toBeTruthy();

    const edgeCountBefore = before.edges.length;

    await workflowNode(page, nodeUuid!).hover();
    await expect(workflowNodeEdgeHandles(page, nodeUuid!)).toHaveCount(4);

    const handle = workflowNodeEdgeHandles(page, nodeUuid!).first();
    const handleBox = await handle.boundingBox();
    expect(handleBox).toBeTruthy();

    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2 + 4, handleBox!.y + handleBox!.height / 2 + 4, {
      steps: 3,
    });
    await page.mouse.up();

    const after = await fetchGraphView(page, workflowUuid);
    expect(after.edges.length).toBe(edgeCountBefore);
  });
});

test.describe('Workflow edge — reconnect (FR-WF-EDGE-003)', () => {
  test('FR-WF-EDGE-003: owner changes the departure handle on the same source workflowNode', async ({
    page,
    workflow,
  }) => {
    await gotoWorkflowGraph(page, workflow.path);

    const workflowUuid = workflowUuidFromPath(workflow.path);
    const graph = await fetchGraphView(page, workflowUuid);
    const edge = await firstClickableSeedEdge(page, graph);
    const replacementHandle = (['top', 'right', 'bottom', 'left'] as const).find(
      (handle) => CANONICAL_EDGE_PORT[handle] !== edge.sourcePort,
    );
    expect(replacementHandle).toBeTruthy();

    await dragWorkflowEdgeReconnectSource(
      page,
      edgeIdString(edge),
      edge.sourceNodeUuid,
      replacementHandle!,
    );

    await expect
      .poll(async () => {
        const after = await fetchGraphView(page, workflowUuid);
        return after.edges.find((item) => item.id === edge.id);
      })
      .toMatchObject({
        sourceNodeUuid: edge.sourceNodeUuid,
        sourcePort: CANONICAL_EDGE_PORT[replacementHandle!],
        targetNodeUuid: edge.targetNodeUuid,
        targetPort: edge.targetPort,
      });
  });

  test('FR-WF-EDGE-003: owner reconnects workflowEdge source to a different workflowNode', async ({
    page,
    workflow,
  }) => {
    await gotoWorkflowGraph(page, workflow.path);

    const workflowUuid = workflowUuidFromPath(workflow.path);
    const graph = await fetchGraphView(page, workflowUuid);
    const edge = await firstClickableSeedEdge(page, graph);
    const replacementSource = graph.nodes.find(
      (node) =>
        node.uuid !== edge.sourceNodeUuid &&
        node.uuid !== edge.targetNodeUuid &&
        !graph.edges.some(
          (candidate) =>
            candidate.id !== edge.id &&
            candidate.sourceNodeUuid === node.uuid &&
            candidate.targetNodeUuid === edge.targetNodeUuid,
        ),
    )?.uuid;
    expect(replacementSource).toBeTruthy();

    await dragWorkflowEdgeReconnectSource(
      page,
      edgeIdString(edge),
      replacementSource!,
      'bottom',
    );

    await expect
      .poll(async () => {
        const after = await fetchGraphView(page, workflowUuid);
        return after.edges.find((item) => item.id === edge.id);
      })
      .toMatchObject({
        sourceNodeUuid: replacementSource,
        sourcePort: CANONICAL_EDGE_PORT.bottom,
        targetNodeUuid: edge.targetNodeUuid,
        targetPort: edge.targetPort,
      });
  });

  test('FR-WF-EDGE-003: owner reconnects workflowEdge target to a different workflowNode', async ({
    page,
    workflow,
  }) => {
    await gotoWorkflowGraph(page, workflow.path);

    const workflowUuid = workflowUuidFromPath(workflow.path);
    const graph = await fetchGraphView(page, workflowUuid);
    const edge = await firstClickableSeedEdge(page, graph);
    const originalTarget = edge.targetNodeUuid;

    const replacementTarget = graph.nodes.find(
      (node) => node.uuid !== edge.sourceNodeUuid && node.uuid !== originalTarget,
    )?.uuid;
    expect(replacementTarget).toBeTruthy();

    await dragWorkflowEdgeReconnectTarget(page, edgeIdString(edge), replacementTarget!);

    await expect
      .poll(async () => {
        const after = await fetchGraphView(page, workflowUuid);
        const updated = after.edges.find((item) => item.id === edge.id);
        return updated?.targetNodeUuid ?? '';
      })
      .toBe(replacementTarget);
  });
});

test.describe('Workflow edge — role behavior (FR-WF-EDGE-001, FR-WF-EDGE-004)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('FR-WF-EDGE-001: commenter does not see workflowNodeEdgeHandles on hover', async ({
    page,
    workflow,
  }) => {
    await loginAsWorkflowContributor(page, workflow, 'commenter');
    await gotoWorkflowGraph(page, workflow.path);

    const nodeUuid = await firstWorkflowNodeUuid(page);
    await workflowNode(page, nodeUuid).hover();
    await expect(workflowNodeEdgeHandles(page, nodeUuid)).toHaveCount(0);
  });

  test('FR-WF-EDGE-004: commenter opens read-only workflowEditEdgeForm for workflowEdge', async ({
    page,
    workflow,
  }) => {
    await loginAsWorkflowContributor(page, workflow, 'commenter');
    await gotoWorkflowGraph(page, workflow.path);

    const graph = await fetchGraphView(page, workflow.workflowUuid);
    const edge = await firstClickableSeedEdge(page, graph);

    await clickWorkflowEdge(page, edgeIdString(edge));

    await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expectReadOnlyWorkflowEditEdgeForm(page);
    await expect(workflowEdgeSourceReconnectHandle(page, edgeIdString(edge))).toHaveCount(0);
    await expect(workflowEdgeTargetReconnectHandle(page, edgeIdString(edge))).toHaveCount(0);
  });

  test('FR-WF-EDGE-004: viewer opens read-only workflowEditEdgeForm for workflowEdge', async ({
    page,
    workflow,
  }) => {
    await loginAsWorkflowContributor(page, workflow, 'viewer');
    await gotoWorkflowGraph(page, workflow.path);

    const graph = await fetchGraphView(page, workflow.workflowUuid);
    const edge = await firstClickableSeedEdge(page, graph);

    await clickWorkflowEdge(page, edgeIdString(edge));

    await expect(workflowRightSidebarEditTab(page)).toHaveAttribute('aria-pressed', 'true');
    await expectReadOnlyWorkflowEditEdgeForm(page);
    await expect(workflowEdgeSourceReconnectHandle(page, edgeIdString(edge))).toHaveCount(0);
    await expect(workflowEdgeTargetReconnectHandle(page, edgeIdString(edge))).toHaveCount(0);
  });
});

test.describe('Workflow edge — viewer role (FR-WF-EDGE-001)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('FR-WF-EDGE-001: viewer does not see workflowNodeEdgeHandles on hover', async ({
    page,
    workflow,
  }) => {
    await loginAsWorkflowContributor(page, workflow, 'viewer');
    await gotoWorkflowGraph(page, workflow.path);

    const nodeUuid = await secondWorkflowNodeUuid(page);
    await workflowNode(page, nodeUuid).hover();
    await expect(workflowNodeEdgeHandles(page, nodeUuid)).toHaveCount(0);
  });
});
