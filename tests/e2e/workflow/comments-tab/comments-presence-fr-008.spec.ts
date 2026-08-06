import { test, expect } from '../../../fixtures';
import { authenticatedApiRequest } from '../../../helpers/api';
import {
  commentsButtonInSectionHeader,
  sectionHeader,
} from '../edit-section.locators';
import {
  channelUuidByTitle,
  composeComment,
  deleteOwnComment,
  firstWorkflowNodeUuid,
  gotoOutcomesView,
  hoverSectionHeader,
  hoverWorkflowChannelHeader,
  hoverWorkflowNode,
  hoverWorkflowOutcomeHeader,
  openChannelCommentsViaHover,
  openNodeCommentsViaHover,
  openOutcomeCommentsViaHover,
  openSectionCommentsViaHover,
  requireCommentsComposer,
} from '../comments-tab.helpers';
import {
  workflowChannelHoverCommentsItem,
  workflowNode,
  workflowNodeHoverCommentsItem,
} from '../workflow-graph.locators';
import { workflowOutcomeHoverCommentsItem } from '../workflow-outcome.locators';
import { workflowCommentsPresenceIndicator } from '../../../shared/locators/workflow';

test.use({ seedAsset: 'workflow.standard_activity', actorAsset: 'actor.teacher', seedAccess: 'disposable-copy' });

/**
 * Comments presence indicator — FR-WF-COMMENTS-008.
 * Requirements: workflow_comments_tab_requirements_v1.yaml
 */

const E2E_CHANNEL_A = 'E2E Channel A';
const E2E_OUTCOME_TITLE = 'E2E Outcome 1';

async function clearOwnNodeComments(
  page: import('@playwright/test').Page,
  workflowPath: string,
  nodeUuid: string,
): Promise<void> {
  const workflowUuid = workflowPath.match(/^\/workflow\/([^/]+)\/graph$/)?.[1];
  if (!workflowUuid) {
    throw new Error(`Cannot extract workflow UUID from ${workflowPath}.`);
  }

  const graphResponse = await authenticatedApiRequest(
    page,
    'GET',
    `/api/graph/${workflowUuid}/view`,
  );
  expect(graphResponse.ok()).toBeTruthy();
  const graph = (await graphResponse.json()) as {
    nodes: Array<{ uuid: string; threadUuid?: string | null }>;
  };
  const threadUuid = graph.nodes.find((node) => node.uuid === nodeUuid)?.threadUuid;
  if (!threadUuid) {
    throw new Error(`Node ${nodeUuid} has no threadUuid in graph view.`);
  }

  const deleteResponse = await authenticatedApiRequest(
    page,
    'DELETE',
    `/api/thread/${threadUuid}/comments`,
  );
  expect(deleteResponse.ok()).toBeTruthy();
}

test.describe('Comments tab — presence indicator (FR-WF-COMMENTS-008)', () => {
  test('FR-WF-COMMENTS-008: node indicator follows stored count and remains after viewing', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const nodeUuid = await firstWorkflowNodeUuid(page);
    await clearOwnNodeComments(page, workflow.path, nodeUuid);
    await page.reload();
    await expect(workflowNode(page, nodeUuid)).toBeVisible({ timeout: 15_000 });

    await hoverWorkflowNode(page, nodeUuid);
    const commentsButton = workflowNodeHoverCommentsItem(page, nodeUuid);
    await expect(workflowCommentsPresenceIndicator(commentsButton)).toHaveCount(0);

    await openNodeCommentsViaHover(page, nodeUuid);
    await requireCommentsComposer(page);
    const body = `E2E node presence ${Date.now()}`;
    await composeComment(page, body);

    await hoverWorkflowNode(page, nodeUuid);
    await expect(workflowCommentsPresenceIndicator(commentsButton)).toBeVisible();

    await deleteOwnComment(page, body);
    await hoverWorkflowNode(page, nodeUuid);
    await expect(workflowCommentsPresenceIndicator(commentsButton)).toHaveCount(0);
  });

  test('FR-WF-COMMENTS-008: section indicator appears when comments exist', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const sectionUuid = workflow.blankSection().uuid;
    await expect(sectionHeader(page, sectionUuid)).toBeVisible({ timeout: 15_000 });
    await openSectionCommentsViaHover(page, sectionUuid);
    await requireCommentsComposer(page);
    const body = `E2E section presence ${Date.now()}`;
    await composeComment(page, body);

    await hoverSectionHeader(page, sectionUuid);
    await expect(
      workflowCommentsPresenceIndicator(
        commentsButtonInSectionHeader(page, sectionUuid),
      ),
    ).toBeVisible();
    await deleteOwnComment(page, body);
  });

  test('FR-WF-COMMENTS-008: channel indicator appears when comments exist', async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    const channelUuid = await channelUuidByTitle(page, E2E_CHANNEL_A);
    await openChannelCommentsViaHover(page, channelUuid);
    await requireCommentsComposer(page);
    const body = `E2E channel presence ${Date.now()}`;
    await composeComment(page, body);

    await hoverWorkflowChannelHeader(page, channelUuid);
    await expect(
      workflowCommentsPresenceIndicator(
        workflowChannelHoverCommentsItem(page, channelUuid),
      ),
    ).toBeVisible();
    await deleteOwnComment(page, body);
  });

  test('FR-WF-COMMENTS-008: outcome indicator appears when comments exist', async ({
    page,
    workflow,
  }) => {
    workflow.firstOutcome();
    await gotoOutcomesView(page, workflow.path);
    await openOutcomeCommentsViaHover(page, E2E_OUTCOME_TITLE);
    await requireCommentsComposer(page);
    const body = `E2E outcome presence ${Date.now()}`;
    await composeComment(page, body);

    await hoverWorkflowOutcomeHeader(page, E2E_OUTCOME_TITLE);
    await expect(
      workflowCommentsPresenceIndicator(
        workflowOutcomeHoverCommentsItem(page, E2E_OUTCOME_TITLE),
      ),
    ).toBeVisible();
    await deleteOwnComment(page, body);
  });
});
