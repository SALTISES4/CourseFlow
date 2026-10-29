import { expect, type Locator, type Page } from "@playwright/test";

import type { WorkflowHandle } from "../../fixtures";
import { authenticatedApiRequest } from "../../helpers/api";
import { ensurePageWorkspaceEditLock } from "../../helpers/edit-lock";
import { fetchGraphView } from "./workflow-graph.helpers";

type CreatedNodeEnvelope = {
  changes: { nodes: { created: Array<{ uuid: string }> } };
};

export const outcomeTablePath = (graphPath: string): string =>
  graphPath.replace(/\/graph$/, "/outcome-table");

export const outcomeTableTab = (page: Page): Locator =>
  page.getByRole("tab", { name: "Outcome table", exact: true });

export const outcomeTableGrid = (page: Page): Locator =>
  page.getByRole("grid", { name: "Outcome table assignments" });

export const outcomeTableControls = (page: Page): Locator =>
  page.getByRole("group", { name: "Outcome table display options" });

export const outcomeTableCell = (
  page: Page,
  outcomeTitle: string | RegExp,
  nodeTitle: string | RegExp,
): Locator => {
  const outcome =
    typeof outcomeTitle === "string"
      ? escapeRegex(outcomeTitle)
      : outcomeTitle.source;
  const node =
    typeof nodeTitle === "string" ? escapeRegex(nodeTitle) : nodeTitle.source;
  return outcomeTableGrid(page).getByRole("checkbox", {
    name: new RegExp(`${outcome}.*—.*${node}`),
  });
};

export async function openOutcomeTable(
  page: Page,
  workflow: WorkflowHandle,
): Promise<void> {
  await page.goto(workflow.path);
  await expect(outcomeTableTab(page)).toBeEnabled();
  await outcomeTableTab(page).click();
  await expect(page).toHaveURL(outcomeTablePath(workflow.path));
  await expect(outcomeTableGrid(page)).toBeVisible();
}

export async function selectOutcomeTableStyle(
  page: Page,
  style: "Normal" | "Competency matrix",
): Promise<void> {
  const controls = outcomeTableControls(page);
  await controls
    .getByRole("button", { name: /^(Normal|Competency matrix)$/ })
    .click();
  const option = page.getByRole("menuitem", { name: style, exact: true });
  if (await option.isEnabled()) {
    await option.click();
  } else {
    await page.keyboard.press("Escape");
  }
}

export async function selectOutcomeTableSort(
  page: Page,
  sort: "Chronological" | "Node category" | "Context",
): Promise<void> {
  await outcomeTableControls(page)
    .getByRole("button", { name: "Sort", exact: true })
    .click();
  const option = page.getByRole("menuitem", { name: sort, exact: true });
  if (await option.isEnabled()) {
    await option.click();
  } else {
    await page.keyboard.press("Escape");
  }
}

export async function openOutcomeTableViewSettings(page: Page): Promise<void> {
  await outcomeTableControls(page)
    .getByRole("button", { name: "View settings", exact: true })
    .click();
}

export async function createWorkflowNodeViaApi(
  page: Page,
  workflow: WorkflowHandle,
  options: {
    sectionUuid?: string;
    channelUuid?: string;
    sectionRow?: number;
  } = {},
): Promise<string> {
  await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
  const graph = await fetchGraphView(page, workflow.workflowUuid);
  const section = options.sectionUuid
    ? graph.sections.find((candidate) => candidate.uuid === options.sectionUuid)
    : graph.sections[0];
  const channel = options.channelUuid
    ? graph.channels.find((candidate) => candidate.uuid === options.channelUuid)
    : graph.channels[0];
  if (!section || !channel) {
    throw new Error(
      "Outcome Table test setup requires one section and one node category.",
    );
  }
  const sectionNodes = graph.nodes.filter(
    (node) => node.sectionUuid === section.uuid,
  );
  const sectionRow =
    options.sectionRow ??
    Math.max(-1, ...sectionNodes.map((node) => node.sectionRow ?? -1)) + 1;
  const response = await authenticatedApiRequest(
    page,
    "POST",
    `/api/graph/${workflow.graphUuid}/nodes`,
    {
      data: {
        sectionUuid: section.uuid,
        channelUuid: channel.uuid,
        sectionRow,
      },
    },
  );
  expect(response.ok(), await response.text()).toBe(true);
  const body = (await response.json()) as CreatedNodeEnvelope;
  const created = body.changes.nodes.created[0];
  if (!created) {
    throw new Error("Create workflow node returned no node.");
  }
  return created.uuid;
}

export async function patchOutcomeTableNodeViaApi(
  page: Page,
  nodeUuid: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const response = await authenticatedApiRequest(
    page,
    "PATCH",
    `/api/node/${nodeUuid}/meta`,
    {
      data: patch,
    },
  );
  expect(response.ok(), await response.text()).toBe(true);
}

export async function createWorkflowChannelViaApi(
  page: Page,
  workflow: WorkflowHandle,
  title: string,
): Promise<string> {
  await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
  const graph = await fetchGraphView(page, workflow.workflowUuid);
  const response = await authenticatedApiRequest(page, "POST", "/api/channel", {
    data: {
      graphUuid: workflow.graphUuid,
      title,
      position: graph.channels.length,
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
  const body = (await response.json()) as { uuid: string };
  return body.uuid;
}

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
