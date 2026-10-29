import { expect, test } from "../../fixtures";
import { ensurePageWorkspaceEditLock } from "../../helpers/edit-lock";
import { globalMessageSnackbar } from "../../shared/locators/global";
import { createOutcomeViaApi } from "./outcome-drag.helpers";
import {
  openOutcomeTable,
  outcomeTableCell,
  outcomeTableGrid,
  outcomeTableTab,
  patchOutcomeTableNodeViaApi,
  selectOutcomeTableStyle,
} from "./outcome-table.helpers";
import {
  linkOutcomesToNodeViaApi,
  openLinkedOutcomesPopoverForNode,
  revealLinkedPopoverOutcomeRows,
  unlinkLinkedOutcomeFromPopover,
} from "./workflow-assign-outcome.helpers";
import { fetchGraphView } from "./workflow-graph.helpers";

test.use({
  seedAsset: "workflow.navigation_course",
  actorAsset: "actor.teacher",
  seedAccess: "disposable-project-copy",
});

test.describe("FR-WF-OT-005/006/007: assignment state and cross-view parity", () => {
  test("partial, complete, and empty states follow cascade rules and remain authoritative across both sub-views", async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
    const graph = await fetchGraphView(page, workflow.workflowUuid);
    const node = graph.nodes[0];
    expect(node).toBeTruthy();
    const nodeTitle = "Outcome Table assignment node";
    await patchOutcomeTableNodeViaApi(page, node!.uuid, { title: nodeTitle });

    const rootTitle = "Assignment root";
    const childATitle = "Assignment child A";
    const childBTitle = "Assignment child B";
    const rootUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: rootTitle,
    });
    const childAUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: childATitle,
      parentUuid: rootUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: childBTitle,
      parentUuid: rootUuid,
    });
    await linkOutcomesToNodeViaApi(page, node!.uuid, [childAUuid]);

    await openOutcomeTable(page, workflow);
    const grid = outcomeTableGrid(page);
    const rootCell = outcomeTableCell(page, rootTitle, nodeTitle);
    const rootSectionRollup = grid.getByRole("checkbox", {
      name: new RegExp(`${rootTitle}.*summary`),
    });
    await expect(rootCell).toHaveAttribute("aria-checked", "mixed");
    await expect(rootSectionRollup).toHaveAttribute("aria-checked", "mixed");
    await expect(rootSectionRollup).toBeDisabled();

    const rootRow = grid.getByRole("rowheader", {
      name: new RegExp(rootTitle),
    });
    await rootRow.getByRole("button").click();
    const childACell = outcomeTableCell(page, childATitle, nodeTitle);
    const childBCell = outcomeTableCell(page, childBTitle, nodeTitle);
    await expect(childACell).toHaveAttribute("aria-checked", "true");
    await expect(childBCell).toHaveAttribute("aria-checked", "false");

    await selectOutcomeTableStyle(page, "Competency matrix");
    await expect(rootCell).toHaveAttribute("aria-checked", "mixed");
    await expect(childACell).toHaveAttribute("aria-checked", "true");
    await expect(childBCell).toHaveAttribute("aria-checked", "false");
    await selectOutcomeTableStyle(page, "Normal");

    await page.keyboard.press("Tab");
    await rootCell.focus();
    await expect
      .poll(() =>
        rootCell.evaluate((element) => getComputedStyle(element).outlineStyle),
      )
      .not.toBe("none");
    const assignResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/link-outcome"),
    );
    await rootCell.press("Space");
    expect((await assignResponse).ok()).toBe(true);
    await expect(rootCell).toHaveAttribute("aria-checked", "true");
    await expect(childACell).toHaveAttribute("aria-checked", "true");
    await expect(childBCell).toHaveAttribute("aria-checked", "true");
    await expect(rootSectionRollup).toHaveAttribute("aria-checked", "true");

    await page.getByRole("tab", { name: "Workflow", exact: true }).click();
    await openLinkedOutcomesPopoverForNode(page, node!.uuid);
    await revealLinkedPopoverOutcomeRows(page, new RegExp(rootTitle));
    await expect(page.getByText(new RegExp(childATitle))).toBeVisible();
    await unlinkLinkedOutcomeFromPopover(page, new RegExp(childATitle));
    await page.keyboard.press("Escape");

    await outcomeTableTab(page).click();
    await expect(rootCell).toHaveAttribute("aria-checked", "mixed");
    await expect(childACell).toHaveAttribute("aria-checked", "false");
    await expect(childBCell).toHaveAttribute("aria-checked", "true");
    await page.reload();
    await expect(rootCell).toHaveAttribute("aria-checked", "mixed");
    await grid
      .getByRole("rowheader", { name: new RegExp(rootTitle) })
      .getByRole("button")
      .click();
    await expect(childACell).toHaveAttribute("aria-checked", "false");
    await expect(childBCell).toHaveAttribute("aria-checked", "true");
  });

  test("one pending cascade disables every affected cell and suppresses repeat activation", async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
    const graph = await fetchGraphView(page, workflow.workflowUuid);
    const node = graph.nodes[0];
    expect(node).toBeTruthy();
    const nodeTitle = "Pending assignment node";
    await patchOutcomeTableNodeViaApi(page, node!.uuid, { title: nodeTitle });
    const rootTitle = "Pending assignment root";
    const childTitle = "Pending assignment child";
    const rootUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: rootTitle,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: childTitle,
      parentUuid: rootUuid,
    });

    await openOutcomeTable(page, workflow);
    const grid = outcomeTableGrid(page);
    await grid
      .getByRole("rowheader", { name: new RegExp(rootTitle) })
      .getByRole("button")
      .click();
    const rootCell = outcomeTableCell(page, rootTitle, nodeTitle);
    const childCell = outcomeTableCell(page, childTitle, nodeTitle);

    let releaseRequest!: () => void;
    const requestGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });
    let linkRequests = 0;
    await page.route("**/api/node/*/link-outcome", async (route) => {
      linkRequests += 1;
      await requestGate;
      await route.continue();
    });

    const requestStarted = page.waitForRequest(
      (request) =>
        request.method() === "POST" && request.url().endsWith("/link-outcome"),
    );
    const activation = rootCell.click();
    await requestStarted;
    await expect(rootCell).toBeDisabled();
    await expect(childCell).toBeDisabled();
    await rootCell.click({ force: true });
    expect(linkRequests).toBe(1);

    releaseRequest();
    await activation;
    await expect(rootCell).toHaveAttribute("aria-checked", "true");
    await expect(childCell).toHaveAttribute("aria-checked", "true");
    expect(linkRequests).toBe(1);
  });

  test("a rejected assignment restores the authoritative cell and surfaces mutation feedback", async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
    const graph = await fetchGraphView(page, workflow.workflowUuid);
    const node = graph.nodes[0];
    expect(node).toBeTruthy();
    const nodeTitle = "Rejected assignment node";
    const outcomeTitle = "Rejected assignment outcome";
    await patchOutcomeTableNodeViaApi(page, node!.uuid, { title: nodeTitle });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: outcomeTitle,
    });
    await openOutcomeTable(page, workflow);
    const cell = outcomeTableCell(page, outcomeTitle, nodeTitle);
    await expect(cell).toHaveAttribute("aria-checked", "false");

    await page.route("**/api/node/*/link-outcome", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Rejected by E2E test" }),
      });
    });
    await cell.click();

    await expect(outcomeTableGrid(page)).toBeVisible();
    await expect(cell).toHaveAttribute("aria-checked", "false");
    await expect(cell).toBeEnabled();
    await expect(globalMessageSnackbar(page)).toBeVisible();
  });
});
