import { expect, type Page } from '@playwright/test';
import type { GraphViewEdge } from './workflow-graph.helpers';
import { workflowNode } from './workflow-graph.locators';
import {
  type EdgeHandle,
  workflowEdge,
  workflowEdgeClickTarget,
  workflowEdgeSourceReconnectHandle,
  workflowEdgeTargetReconnectHandle,
  workflowEdgeVisiblePath,
  workflowNodeEdgeHandle,
} from './edge.locators';

/** Assert that an edge's rendered path terminates on its current node bounds. */
export async function expectWorkflowEdgeEndpointsAttached(
  page: Page,
  edge: GraphViewEdge,
): Promise<void> {
  const path = workflowEdgeVisiblePath(page, String(edge.id));

  await expect
    .poll(async () => {
      if ((await path.count()) === 0) return Number.POSITIVE_INFINITY;

      return path.evaluate((element, currentEdge) => {
        const svgPath = element as SVGPathElement;
        const ctm = svgPath.getScreenCTM();
        const source = document.getElementById(
          `node-${currentEdge.sourceNodeUuid}`,
        );
        const target = document.getElementById(
          `node-${currentEdge.targetNodeUuid}`,
        );
        if (!ctm || !source || !target || !svgPath.ownerSVGElement) {
          return Number.POSITIVE_INFINITY;
        }

        const screenPoint = (point: DOMPoint) => {
          const svgPoint = svgPath.ownerSVGElement!.createSVGPoint();
          svgPoint.x = point.x;
          svgPoint.y = point.y;
          return svgPoint.matrixTransform(ctm);
        };
        const distanceToBoundary = (point: DOMPoint, rect: DOMRect) => {
          const withinX =
            point.x >= rect.left - 1 && point.x <= rect.right + 1;
          const withinY =
            point.y >= rect.top - 1 && point.y <= rect.bottom + 1;
          return Math.min(
            withinX ? Math.abs(point.y - rect.top) : Number.POSITIVE_INFINITY,
            withinX ? Math.abs(point.y - rect.bottom) : Number.POSITIVE_INFINITY,
            withinY ? Math.abs(point.x - rect.left) : Number.POSITIVE_INFINITY,
            withinY ? Math.abs(point.x - rect.right) : Number.POSITIVE_INFINITY,
          );
        };

        const totalLength = svgPath.getTotalLength();
        return Math.max(
          distanceToBoundary(
            screenPoint(svgPath.getPointAtLength(0)),
            source.getBoundingClientRect(),
          ),
          distanceToBoundary(
            screenPoint(svgPath.getPointAtLength(totalLength)),
            target.getBoundingClientRect(),
          ),
        );
      }, edge);
    }, {
      message: `workflowEdge ${edge.id} endpoints should follow their nodes`,
      timeout: 5_000,
    })
    .toBeLessThan(1);
}

/**
 * Find a point where this transparent hit-stroke is the topmost clickable edge.
 * Edge paths can overlap, so clicking an arbitrary midpoint can select a different edge.
 */
async function edgeClickPointOnScreen(
  target: ReturnType<typeof workflowEdgeClickTarget>,
): Promise<{ x: number; y: number }> {
  return target.evaluate((path) => {
    const svgPath = path as SVGPathElement;
    const ctm = svgPath.getScreenCTM();
    if (!ctm) {
      throw new Error('workflowEdge click target has no screen CTM');
    }

    const totalLength = svgPath.getTotalLength();
    const fractions = [
      0.5,
      0.25,
      0.75,
      ...Array.from({ length: 97 }, (_, index) => (index + 2) / 100),
    ];

    for (const fraction of fractions) {
      const pathPoint = svgPath.getPointAtLength(totalLength * fraction);
      const screenPoint = svgPath.ownerSVGElement!.createSVGPoint();
      screenPoint.x = pathPoint.x;
      screenPoint.y = pathPoint.y;
      const { x, y } = screenPoint.matrixTransform(ctm);
      if (document.elementFromPoint(x, y) === svgPath) {
        return { x, y };
      }
    }

    throw new Error('workflowEdge has no unobscured clickable point');
  });
}

export async function firstClickableWorkflowEdgeId(
  page: Page,
  edgeIds: string[],
): Promise<string> {
  for (const edgeId of edgeIds) {
    const target = workflowEdgeClickTarget(page, edgeId);
    if ((await target.count()) === 0) {
      continue;
    }
    await target.scrollIntoViewIfNeeded();
    try {
      await edgeClickPointOnScreen(target);
      return edgeId;
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('no unobscured clickable point')) {
        throw error;
      }
    }
  }
  throw new Error('No seeded workflowEdge has an unobscured clickable point');
}

export async function clickWorkflowEdge(page: Page, edgeId: string): Promise<void> {
  const target = workflowEdgeClickTarget(page, edgeId);
  await expect(target).toBeVisible({ timeout: 10_000 });
  await target.scrollIntoViewIfNeeded();
  const { x, y } = await edgeClickPointOnScreen(target);
  await page.mouse.click(x, y);
}

export async function dragWorkflowEdgeFromHandleToHandle(
  page: Page,
  sourceNodeUuid: string,
  targetNodeUuid: string,
  sourceHandle: EdgeHandle = 'bottom',
  targetHandle: EdgeHandle = 'top',
): Promise<void> {
  await workflowNode(page, sourceNodeUuid).hover();
  const sourceHandleLoc = workflowNodeEdgeHandle(page, sourceNodeUuid, sourceHandle);
  await expect(sourceHandleLoc).toBeVisible({ timeout: 10_000 });

  const sourceBox = await sourceHandleLoc.boundingBox();
  if (!sourceBox) {
    throw new Error(`Source edge handle not visible on node ${sourceNodeUuid}`);
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();

  await workflowNode(page, targetNodeUuid).hover();
  const targetHandleLoc = workflowNodeEdgeHandle(page, targetNodeUuid, targetHandle);
  await expect(targetHandleLoc).toBeVisible({ timeout: 10_000 });

  const targetBox = await targetHandleLoc.boundingBox();
  if (!targetBox) {
    throw new Error(`Target edge handle not visible on node ${targetNodeUuid}`);
  }

  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 20 },
  );
  await page.mouse.up();
}

export async function dragWorkflowEdgeReconnectTarget(
  page: Page,
  edgeId: string,
  targetNodeUuid: string,
  targetHandle: EdgeHandle = 'top',
): Promise<void> {
  await clickWorkflowEdge(page, edgeId);
  await expect(workflowEdge(page, edgeId).locator('circle')).toHaveCount(2, { timeout: 5_000 });

  const reconnectHandle = workflowEdgeTargetReconnectHandle(page, edgeId);
  const handleBox = await reconnectHandle.boundingBox();
  if (!handleBox) {
    throw new Error(`Target reconnect handle not visible on edge ${edgeId}`);
  }

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();

  await workflowNode(page, targetNodeUuid).hover();
  const targetHandleLoc = workflowNodeEdgeHandle(page, targetNodeUuid, targetHandle);
  await expect(targetHandleLoc).toBeVisible({ timeout: 10_000 });

  const targetBox = await targetHandleLoc.boundingBox();
  if (!targetBox) {
    throw new Error(`Target node handle not visible on node ${targetNodeUuid}`);
  }

  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 20 },
  );
  await page.mouse.up();
}

export async function dragWorkflowEdgeReconnectSource(
  page: Page,
  edgeId: string,
  sourceNodeUuid: string,
  sourceHandle: EdgeHandle = 'bottom',
): Promise<void> {
  await clickWorkflowEdge(page, edgeId);
  await expect(workflowEdge(page, edgeId).locator('circle')).toHaveCount(2, { timeout: 5_000 });

  const reconnectHandle = workflowEdgeSourceReconnectHandle(page, edgeId);
  const handleBox = await reconnectHandle.boundingBox();
  if (!handleBox) {
    throw new Error(`Source reconnect handle not visible on edge ${edgeId}`);
  }

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();

  await workflowNode(page, sourceNodeUuid).hover();
  const sourceHandleLoc = workflowNodeEdgeHandle(page, sourceNodeUuid, sourceHandle);
  await expect(sourceHandleLoc).toBeVisible({ timeout: 10_000 });

  const sourceBox = await sourceHandleLoc.boundingBox();
  if (!sourceBox) {
    throw new Error(`Source node handle not visible on node ${sourceNodeUuid}`);
  }

  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
    { steps: 20 },
  );
  await page.mouse.up();
}
