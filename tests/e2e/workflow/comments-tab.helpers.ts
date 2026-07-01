import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  commentsButtonInSectionHeader,
  commentsTabInSidebar,
  sectionHeader,
  sectionHoverMenu,
} from './edit-section.locators';
import {
  workflowChannelHeader,
  workflowChannelHeaderByTitle,
  workflowChannelHoverCommentsItem,
  workflowNode,
  workflowNodeHoverCommentsItem,
  workflowNodes,
} from './workflow-graph.locators';
import {
  workflowOutcomeHeader,
  workflowOutcomeHoverCommentsItem,
  workflowOutcomeRowForHeader,
} from './workflow-outcome.locators';
import {
  workflowCommentsComposerField,
  workflowCommentsTabComposerSubmitButton,
  workflowCommentsTabListItemBody,
  workflowCommentsTabListItemDeleteLink,
  workflowRightSidebarCommentsTabContent,
} from '../../shared/locators/workflow';
import { workflowOutcomesPath } from '../../helpers/workflow-navigation';
import { workflowOutcomesTab } from './workflow.locators';

export async function firstWorkflowNodeUuid(page: Page): Promise<string> {
  const node = workflowNodes(page).first();
  await expect(node).toBeVisible({ timeout: 15_000 });
  const id = await node.getAttribute('id');
  if (!id?.startsWith('node-')) {
    throw new Error(`Expected node id prefix node-; got ${JSON.stringify(id)}`);
  }
  return id.slice('node-'.length);
}

export async function secondWorkflowNodeUuid(page: Page): Promise<string> {
  const node = workflowNodes(page).nth(1);
  await expect(node).toBeVisible({ timeout: 15_000 });
  const id = await node.getAttribute('id');
  if (!id?.startsWith('node-')) {
    throw new Error(`Expected node id prefix node-; got ${JSON.stringify(id)}`);
  }
  return id.slice('node-'.length);
}

export async function channelUuidByTitle(page: Page, title: string): Promise<string> {
  const header = workflowChannelHeaderByTitle(page, title).first();
  await expect(header).toBeVisible({ timeout: 15_000 });
  const uuid = await header.getAttribute('data-column-id');
  if (!uuid) {
    throw new Error(`Channel header missing data-column-id for title ${JSON.stringify(title)}`);
  }
  return uuid;
}

export async function hoverWorkflowNode(page: Page, nodeUuid: string) {
  await workflowNode(page, nodeUuid).hover();
  await expect(workflowNodeHoverCommentsItem(page, nodeUuid)).toBeVisible();
}

export async function hoverWorkflowChannelHeader(page: Page, channelUuid: string) {
  await workflowChannelHeader(page, channelUuid).hover();
  await expect(workflowChannelHoverCommentsItem(page, channelUuid)).toBeVisible();
}

export async function openNodeCommentsViaHover(page: Page, nodeUuid: string) {
  await hoverWorkflowNode(page, nodeUuid);
  await workflowNodeHoverCommentsItem(page, nodeUuid).click();
  await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(workflowRightSidebarCommentsTabContent(page)).toBeVisible();
  await expect(
    page.getByText('Select an item to view or add comments.', { exact: true }),
  ).toHaveCount(0);
}

export async function openChannelCommentsViaHover(page: Page, channelUuid: string) {
  await hoverWorkflowChannelHeader(page, channelUuid);
  await workflowChannelHoverCommentsItem(page, channelUuid).click();
  await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(workflowRightSidebarCommentsTabContent(page)).toBeVisible();
  await expect(
    page.getByText('Select an item to view or add comments.', { exact: true }),
  ).toHaveCount(0);
}

/** Skip when graph bootstrap lacks threadUuid for the selected host. */
export async function requireCommentsComposer(page: Page) {
  const unavailable = page.getByText('Comments are not available for this item yet.', {
    exact: true,
  });
  if ((await unavailable.count()) > 0) {
    test.skip(true, 'Host threadUuid missing from graph bootstrap; composer unavailable.');
  }
  await expect(workflowCommentsComposerField(page)).toBeVisible();
}

/** @deprecated Use requireCommentsComposer */
export async function requireSectionCommentsComposer(page: Page) {
  await requireCommentsComposer(page);
}

export async function hoverSectionHeader(page: Page, sectionUuid: string) {
  await sectionHeader(page, sectionUuid).hover();
  await expect(sectionHoverMenu(page, sectionUuid)).toBeVisible();
}

export async function openSectionCommentsViaHover(page: Page, sectionUuid: string) {
  await hoverSectionHeader(page, sectionUuid);
  await commentsButtonInSectionHeader(page, sectionUuid).click();
  await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(workflowRightSidebarCommentsTabContent(page)).toBeVisible();
  await expect(
    page.getByText('Select an item to view or add comments.', { exact: true }),
  ).toHaveCount(0);
}

export async function hoverWorkflowOutcomeHeader(page: Page, title: string) {
  await workflowOutcomeHeader(page, title).hover();
  await expect(workflowOutcomeHoverCommentsItem(page, title)).toBeVisible();
}

export async function hoverWorkflowOutcomeHeaderLocator(page: Page, header: Locator) {
  await header.hover();
  await expect(
    workflowOutcomeRowForHeader(page, header)
      .getByRole('button', { name: 'Comments', exact: true })
      .first(),
  ).toBeVisible();
}

export async function openOutcomeCommentsViaHover(page: Page, title: string) {
  await hoverWorkflowOutcomeHeader(page, title);
  await workflowOutcomeHoverCommentsItem(page, title).click();
  await expect(commentsTabInSidebar(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(workflowRightSidebarCommentsTabContent(page)).toBeVisible();
}

export async function gotoOutcomesView(page: Page, graphPath: string) {
  await page.goto(graphPath);
  await workflowOutcomesTab(page).click();
  await expect(page).toHaveURL(new RegExp(`${workflowOutcomesPath(graphPath)}/?$`));
}

export async function composeComment(page: Page, body: string) {
  await workflowCommentsComposerField(page).fill(body);
  await expect(workflowCommentsTabComposerSubmitButton(page)).toBeEnabled();
  await workflowCommentsTabComposerSubmitButton(page).click();
  await expect(workflowCommentsTabListItemBody(page, body)).toBeVisible({ timeout: 15_000 });
}

export async function deleteOwnComment(page: Page, body: string) {
  await workflowCommentsTabListItemDeleteLink(page, body).click();
  await expect(workflowCommentsTabListItemBody(page, body)).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText('Success!').last()).toBeVisible({ timeout: 15_000 });
}
