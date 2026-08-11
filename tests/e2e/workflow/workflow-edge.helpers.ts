import { expect, type Page } from '@playwright/test';
import { workflowNode } from './workflow-graph.locators';
import {
  type EdgeHandle,
  workflowEdge,
  workflowEdgeClickTarget,
  workflowEdgeSourceReconnectHandle,
  workflowEdgeTargetReconnectHandle,
  workflowNodeEdgeHandle,
} from './workflow-edge.locators';

export async function clickWorkflowEdge(page: Page, edgeId: string): Promise<void> {
  const target = workflowEdgeClickTarget(page, edgeId);
  await expect(target).toBeVisible({ timeout: 10_000 });
  await target.click({ force: true });
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
