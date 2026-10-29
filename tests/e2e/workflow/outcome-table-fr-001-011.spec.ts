import { expect, test } from "../../fixtures";
import {
  apiRequestWithAccessToken,
  readPrimaryActorAccessToken,
} from "../../helpers/api";
import {
  ensurePageWorkspaceEditLock,
  ensureWorkspaceEditLock,
} from "../../helpers/edit-lock";
import { createOutcomeViaApi } from "./outcome-drag.helpers";

test.use({
  seedAsset: "workflow.navigation_course",
  actorAsset: "actor.teacher",
  seedAccess: "disposable-project-copy",
});

const outcomeTablePath = (graphPath: string): string =>
  graphPath.replace(/\/graph$/, "/outcome-table");

const overviewPath = (graphPath: string): string =>
  graphPath.replace(/\/graph$/, "");

test("FR-WF-HEADER-003: course tab is disabled without outcomes and direct route returns to Overview", async ({
  page,
  workflow,
}) => {
  await page.goto(workflow.path);

  const tab = page.getByRole("tab", { name: "Outcome table" });
  await expect(tab).toBeVisible();
  await expect(tab).toBeDisabled();

  await page.goto(outcomeTablePath(workflow.path));
  await expect(page).toHaveURL(overviewPath(workflow.path));
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("FR-WF-OT-001/002/005/009 and FR-CAB-009/010: eligible course table renders, mutates, and changes presentation", async ({
  page,
  workflow,
}) => {
  await page.goto(workflow.path);
  await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
  await createOutcomeViaApi(page, workflow.graphUuid, {
    title: "E2E OT Outcome",
  });
  await page.reload();

  const tab = page.getByRole("tab", { name: "Outcome table" });
  await expect(tab).toBeEnabled();
  await tab.click();
  await expect(page).toHaveURL(outcomeTablePath(workflow.path));

  const grid = page.getByRole("grid", { name: "Outcome table assignments" });
  await expect(grid).toBeVisible();
  await expect(grid).toHaveAttribute("data-layout", "normal");

  const assignmentCell = grid.getByRole("checkbox", {
    name: "1. E2E OT Outcome — Untitled node",
  });
  await expect(assignmentCell).toHaveAttribute("aria-checked", "false");
  await expect(assignmentCell).toBeEnabled();

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/link-outcome"),
    ),
    assignmentCell.click(),
  ]);
  await expect(assignmentCell).toHaveAttribute("aria-checked", "true");

  await page.getByRole("button", { name: "Normal" }).click();
  await page.getByRole("menuitem", { name: "Competency matrix" }).click();
  await expect(grid).toHaveAttribute("data-layout", "competency-matrix");
  await expect(
    grid.getByRole("columnheader", { name: "Total hours" }),
  ).toBeVisible();
  await expect(
    grid.getByRole("checkbox", {
      name: "1. E2E OT Outcome — Untitled node",
    }),
  ).toHaveAttribute("aria-checked", "true");

  await page.getByRole("button", { name: "Sort" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Chronological" }),
  ).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "Node category" }),
  ).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Context" })).toBeVisible();
});

test.describe("FR-WF-PUBLIC-002: anonymous outcome table", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ request, workflow }) => {
    const accessToken = readPrimaryActorAccessToken();
    await ensureWorkspaceEditLock(
      request,
      accessToken,
      "workflow",
      workflow.workflowUuid,
    );

    const createOutcome = await apiRequestWithAccessToken(
      request,
      accessToken,
      "POST",
      `/api/graph/${workflow.graphUuid}/outcomes`,
      { data: { title: "Public OT Outcome" } },
    );
    expect(createOutcome.ok(), await createOutcome.text()).toBe(true);

    const enablePublicLink = await apiRequestWithAccessToken(
      request,
      accessToken,
      "PATCH",
      `/api/workflow/${workflow.workflowUuid}/public-link`,
      { data: { enabled: true } },
    );
    expect(enablePublicLink.ok(), await enablePublicLink.text()).toBe(true);
  });

  test("anonymous viewer can change presentation but cannot change assignments", async ({
    page,
    workflow,
  }) => {
    await page.goto(outcomeTablePath(workflow.path));

    const presentationControls = page.getByRole("group", {
      name: "Outcome table display options",
    });
    await expect(presentationControls).toBeVisible();

    const grid = page.getByRole("grid", { name: "Outcome table assignments" });
    const assignmentCell = grid.getByRole("checkbox", {
      name: "1. Public OT Outcome — Untitled node",
    });
    await expect(assignmentCell).toBeDisabled();
    await expect(assignmentCell).toHaveAttribute("aria-disabled", "true");

    await presentationControls.getByRole("button", { name: "Normal" }).click();
    await page.getByRole("menuitem", { name: "Competency matrix" }).click();
    await expect(grid).toHaveAttribute("data-layout", "competency-matrix");

    await presentationControls.getByRole("button", { name: "Sort" }).click();
    await page.getByRole("menuitem", { name: "Context" }).click();
    await expect(grid).toBeVisible();
    await expect(page.locator('[data-test-id="actions-bar"]')).toHaveCount(0);
  });
});

test.describe("FR-WF-HEADER-003/FR-WF-PUBLIC-002: anonymous ineligible routes", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ request, workflow }) => {
    const accessToken = readPrimaryActorAccessToken();
    await ensureWorkspaceEditLock(
      request,
      accessToken,
      "workflow",
      workflow.workflowUuid,
    );
    const enablePublicLink = await apiRequestWithAccessToken(
      request,
      accessToken,
      "PATCH",
      `/api/workflow/${workflow.workflowUuid}/public-link`,
      { data: { enabled: true } },
    );
    expect(enablePublicLink.ok(), await enablePublicLink.text()).toBe(true);
  });

  test("anonymous course with no outcomes sees a disabled tab and direct route replacement", async ({
    page,
    workflow,
  }) => {
    await page.goto(overviewPath(workflow.path));
    await expect(
      page.getByRole("tab", { name: "Overview", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Outcome table", exact: true }),
    ).toBeDisabled();

    await page.goto(outcomeTablePath(workflow.path));
    await expect(page).toHaveURL(overviewPath(workflow.path));
    await expect(
      page.getByRole("tab", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test.describe("activity workflow", () => {
    test.use({ seedAsset: "workflow.standard_activity" });

    test("anonymous activity never exposes the tab and replaces its direct route", async ({
      page,
      workflow,
    }) => {
      await page.goto(overviewPath(workflow.path));
      await expect(
        page.getByRole("tab", { name: "Overview", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Outcome table", exact: true }),
      ).toHaveCount(0);

      await page.goto(outcomeTablePath(workflow.path));
      await expect(page).toHaveURL(overviewPath(workflow.path));
      await expect(
        page.getByRole("tab", { name: "Overview", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
    });
  });
});
