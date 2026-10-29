import { expect, test, type Page, type WorkflowHandle } from "../../fixtures";
import { authenticatedApiRequest } from "../../helpers/api";
import { ensurePageWorkspaceEditLock } from "../../helpers/edit-lock";
import { ensureFirstWorkflowNodeViaApi } from "./node-visual.helpers";
import { createOutcomeViaApi } from "./outcome-drag.helpers";
import { loginAsWorkflowContributor } from "./role.helpers";
import { fetchGraphView } from "./workflow-graph.helpers";

test.use({
  seedAsset: "workflow.navigation_course",
  actorAsset: "actor.teacher",
  seedAccess: "disposable-project-copy",
});

const outcomeTablePath = (graphPath: string): string =>
  graphPath.replace(/\/graph$/, "/outcome-table");

const overviewPath = (graphPath: string): string =>
  graphPath.replace(/\/graph$/, "");

const outcomeTableTab = (page: Page) =>
  page.getByRole("tab", { name: "Outcome table", exact: true });

const outcomeTableGrid = (page: Page) =>
  page.getByRole("grid", { name: "Outcome table assignments" });

const presentationControls = (page: Page) =>
  page.getByRole("group", { name: "Outcome table display options" });

async function createEligibleOutcomeTable(
  page: Page,
  workflow: WorkflowHandle,
  title: string,
): Promise<string> {
  await page.goto(workflow.path);
  await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
  return createOutcomeViaApi(page, workflow.graphUuid, { title });
}

async function openEligibleOutcomeTable(
  page: Page,
  workflow: WorkflowHandle,
): Promise<void> {
  await page.goto(workflow.path);
  await expect(outcomeTableTab(page)).toBeEnabled();
  await outcomeTableTab(page).click();
  await expect(page).toHaveURL(outcomeTablePath(workflow.path));
  await expect(outcomeTableGrid(page)).toBeVisible();
}

async function selectTableStyle(
  page: Page,
  style: "Normal" | "Competency matrix",
): Promise<void> {
  const controls = presentationControls(page);
  const trigger = controls.getByRole("button", {
    name: /^(Normal|Competency matrix)$/,
  });
  await trigger.click();
  const option = page.getByRole("menuitem", { name: style, exact: true });
  if (await option.isEnabled()) {
    await option.click();
  } else {
    await page.keyboard.press("Escape");
  }
}

async function selectSort(
  page: Page,
  sort: "Chronological" | "Node category" | "Context",
): Promise<void> {
  await presentationControls(page)
    .getByRole("button", { name: "Sort", exact: true })
    .click();
  const option = page.getByRole("menuitem", { name: sort, exact: true });
  if (await option.isEnabled()) {
    await option.click();
  } else {
    await page.keyboard.press("Escape");
  }
}

async function expectSelectedSort(page: Page, sort: string): Promise<void> {
  await presentationControls(page)
    .getByRole("button", { name: "Sort", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", { name: sort, exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
}

test.describe("FR-WF-HEADER-003: Outcome table eligibility and routing", () => {
  test("course with outcomes but no nodes keeps the tab disabled and replaces a direct route with Overview", async ({
    page,
    workflow,
  }) => {
    await createEligibleOutcomeTable(page, workflow, "No-node outcome");

    const graph = await fetchGraphView(page, workflow.workflowUuid);
    expect(graph.nodes.length).toBeGreaterThan(0);
    for (const node of graph.nodes) {
      const response = await authenticatedApiRequest(
        page,
        "DELETE",
        `/api/node/${node.uuid}`,
      );
      expect(response.ok(), await response.text()).toBe(true);
    }

    await page.reload();
    await expect(outcomeTableTab(page)).toBeVisible();
    await expect(outcomeTableTab(page)).toBeDisabled();

    await page.goto(outcomeTablePath(workflow.path));
    await expect(page).toHaveURL(overviewPath(workflow.path));
    await expect(
      page.getByRole("tab", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test.describe("activity workflow", () => {
    test.use({ seedAsset: "workflow.standard_activity" });

    test("does not render the tab and replaces a direct Outcome Table route with Overview", async ({
      page,
      workflow,
    }) => {
      await page.goto(workflow.path);
      await expect(
        page.getByRole("tab", { name: "Overview", exact: true }),
      ).toBeVisible();
      await expect(outcomeTableTab(page)).toHaveCount(0);

      await page.goto(outcomeTablePath(workflow.path));
      await expect(page).toHaveURL(overviewPath(workflow.path));
      await expect(
        page.getByRole("tab", { name: "Overview", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(outcomeTableTab(page)).toHaveCount(0);
    });
  });

  test.describe("program workflow", () => {
    test.use({ seedAsset: "workflow.navigation_program" });

    test("shows an eligible enabled fourth tab and renders the program table", async ({
      page,
      workflow,
    }) => {
      await page.goto(workflow.path);
      await ensureFirstWorkflowNodeViaApi(page, workflow.workflowUuid);
      await createEligibleOutcomeTable(page, workflow, "Program outcome");
      await page.reload();

      await expect(page.getByRole("tab")).toHaveText([
        "Overview",
        "Workflow",
        "Outcomes",
        "Outcome table",
      ]);
      await expect(outcomeTableTab(page)).toBeEnabled();
      await outcomeTableTab(page).click();

      await expect(page).toHaveURL(outcomeTablePath(workflow.path));
      await expect(outcomeTableGrid(page)).toHaveAttribute(
        "data-layout",
        "normal",
      );
    });
  });
});

test.describe("FR-CAB-009/010 and FR-WF-OT-003/011: presentation lifecycle", () => {
  test("course defaults, state preservation, and reload reset follow the FR lifecycle", async ({
    page,
    workflow,
  }) => {
    const rootUuid = await createEligibleOutcomeTable(
      page,
      workflow,
      "Presentation root",
    );
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: "Presentation child",
      parentUuid: rootUuid,
    });

    await openEligibleOutcomeTable(page, workflow);
    const grid = outcomeTableGrid(page);
    await expect(grid).toHaveAttribute("data-layout", "normal");
    await expectSelectedSort(page, "Chronological");

    const childCell = grid.getByRole("checkbox", {
      name: /Presentation child — Untitled node/,
    });
    await expect(childCell).toHaveCount(0);

    const rootLabel = grid.getByRole("rowheader", {
      name: /Presentation root/,
    });
    await rootLabel.getByRole("button").click();
    await expect(childCell).toBeVisible();

    await selectTableStyle(page, "Competency matrix");
    await selectSort(page, "Node category");
    await expect(grid).toHaveAttribute("data-layout", "competency-matrix");
    await expect(childCell).toBeVisible();

    await page.getByRole("tab", { name: "Overview", exact: true }).click();
    await outcomeTableTab(page).click();
    await expect(grid).toHaveAttribute("data-layout", "competency-matrix");
    await expectSelectedSort(page, "Node category");
    await expect(childCell).toBeVisible();

    await page.reload();
    await expect(grid).toHaveAttribute("data-layout", "normal");
    await expectSelectedSort(page, "Chronological");
    await expect(childCell).toHaveCount(0);
  });

  test("course and program expose their exact required sort options", async ({
    page,
    workflow,
  }) => {
    await createEligibleOutcomeTable(page, workflow, "Course sort outcome");
    await openEligibleOutcomeTable(page, workflow);

    await presentationControls(page)
      .getByRole("button", { name: "Sort", exact: true })
      .click();
    await expect(page.getByRole("menuitem")).toHaveText([
      "Chronological",
      "Node category",
      "Context",
    ]);
  });

  test.describe("program sort options", () => {
    test.use({ seedAsset: "workflow.navigation_program" });

    test("omits Context while retaining Chronological and Node category", async ({
      page,
      workflow,
    }) => {
      await page.goto(workflow.path);
      await ensureFirstWorkflowNodeViaApi(page, workflow.workflowUuid);
      await createEligibleOutcomeTable(page, workflow, "Program sort outcome");
      await openEligibleOutcomeTable(page, workflow);

      await presentationControls(page)
        .getByRole("button", { name: "Sort", exact: true })
        .click();
      await expect(page.getByRole("menuitem")).toHaveText([
        "Chronological",
        "Node category",
      ]);
      await expect(
        page.getByRole("menuitem", { name: "Context", exact: true }),
      ).toHaveCount(0);
    });
  });

  test("commenter can use every non-mutating presentation control while assignment remains read-only", async ({
    page,
    workflow,
  }) => {
    const rootUuid = await createEligibleOutcomeTable(
      page,
      workflow,
      "Read-only root",
    );
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: "Read-only child",
      parentUuid: rootUuid,
    });

    await loginAsWorkflowContributor(page, workflow, "commenter");
    await page.goto(outcomeTablePath(workflow.path));

    const controls = presentationControls(page);
    await expect(controls).toBeVisible();
    const assignmentCell = outcomeTableGrid(page).getByRole("checkbox", {
      name: /Read-only root — Untitled node/,
    });
    await expect(assignmentCell).toBeDisabled();
    await expect(assignmentCell).toHaveAttribute("aria-disabled", "true");

    const workflowMutations: string[] = [];
    page.on("request", (request) => {
      if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) &&
        /\/api\/(?:graph|node|outcome|workflow)\//.test(request.url())
      ) {
        workflowMutations.push(`${request.method()} ${request.url()}`);
      }
    });

    await selectTableStyle(page, "Competency matrix");
    await selectSort(page, "Node category");
    await controls
      .getByRole("button", { name: "View settings", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Expand all outcomes", exact: true })
      .click();
    await page.keyboard.press("Escape");

    await expect(outcomeTableGrid(page)).toHaveAttribute(
      "data-layout",
      "competency-matrix",
    );
    await expect(
      outcomeTableGrid(page).getByRole("checkbox", {
        name: /Read-only child — Untitled node/,
      }),
    ).toBeVisible();
    expect(workflowMutations).toEqual([]);
    await expect(assignmentCell).toBeDisabled();
  });
});
