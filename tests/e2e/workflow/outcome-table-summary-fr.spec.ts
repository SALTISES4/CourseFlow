import { expect, test, type Page } from "../../fixtures";
import { ensurePageWorkspaceEditLock } from "../../helpers/edit-lock";
import { createOutcomeViaApi } from "./outcome-drag.helpers";
import {
  createWorkflowNodeViaApi,
  openOutcomeTable,
  outcomeTableGrid,
  patchOutcomeTableNodeViaApi,
  selectOutcomeTableStyle,
} from "./outcome-table.helpers";
import { fetchGraphView } from "./workflow-graph.helpers";

const nodeRow = (page: Page, title: string) =>
  outcomeTableGrid(page)
    .getByRole("rowheader", { name: title, exact: true })
    .locator("xpath=../..");

const firstSectionSummaryRow = (page: Page) =>
  outcomeTableGrid(page).getByRole("rowgroup").first().getByRole("row").first();

test.use({
  seedAsset: "workflow.navigation_course",
  actorAsset: "actor.teacher",
  seedAccess: "disposable-project-copy",
});

test("FR-WF-OT-009: course duration cells distinguish unset and zero and normalize section sums", async ({
  page,
  workflow,
}) => {
  await page.goto(workflow.path);
  await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
  const graph = await fetchGraphView(page, workflow.workflowUuid);
  const firstNode = graph.nodes[0];
  expect(firstNode).toBeTruthy();
  const firstTitle = "Course duration A";
  await patchOutcomeTableNodeViaApi(page, firstNode!.uuid, {
    title: firstTitle,
    timeRequired: null,
    timeUnits: null,
  });
  await createOutcomeViaApi(page, workflow.graphUuid, {
    title: "Course duration outcome",
  });

  await openOutcomeTable(page, workflow);
  await selectOutcomeTableStyle(page, "Competency matrix");
  const firstValue = nodeRow(page, firstTitle).locator(
    '[data-test-id="workflow-outcome-table-total-hours-cell"]',
  );
  const sectionTotal = firstSectionSummaryRow(page).locator(
    '[data-test-id="workflow-outcome-table-section-total-hours-total"]',
  );
  await expect(firstValue).toHaveText("—");
  await expect(sectionTotal).toHaveText("—");

  await patchOutcomeTableNodeViaApi(page, firstNode!.uuid, {
    timeRequired: 0,
    timeUnits: "hours",
  });
  await page.reload();
  await selectOutcomeTableStyle(page, "Competency matrix");
  await expect(firstValue).toHaveText("0 hours");
  await expect(sectionTotal).toHaveText("0 hours");

  await patchOutcomeTableNodeViaApi(page, firstNode!.uuid, {
    timeRequired: 44,
    timeUnits: "hours",
  });
  const secondNodeUuid = await createWorkflowNodeViaApi(page, workflow);
  const secondTitle = "Course duration B";
  await patchOutcomeTableNodeViaApi(page, secondNodeUuid, {
    title: secondTitle,
    timeRequired: 10,
    timeUnits: "hours",
  });
  await page.reload();
  await selectOutcomeTableStyle(page, "Competency matrix");

  await expect(firstValue).toHaveText("1 day 20 hours");
  await expect(
    nodeRow(page, secondTitle).locator(
      '[data-test-id="workflow-outcome-table-total-hours-cell"]',
    ),
  ).toHaveText("10 hours");
  await expect(sectionTotal).toHaveText("2 days 6 hours");
});

test.describe("program Competency matrix summaries", () => {
  test.use({ seedAsset: "workflow.navigation_program" });

  test("FR-WF-OT-002/010: program classification, ponderation, credits, and section totals match node metadata", async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
    const firstNodeUuid = await createWorkflowNodeViaApi(page, workflow);
    const secondNodeUuid = await createWorkflowNodeViaApi(page, workflow);
    const firstTitle = "Program summary general";
    const secondTitle = "Program summary specific";
    await patchOutcomeTableNodeViaApi(page, firstNodeUuid, {
      title: firstTitle,
      timeRequired: 44,
      timeUnits: "hours",
      specificEducation: false,
      ponderationTheory: 44,
      ponderationPractice: 10,
      ponderationIndividual: null,
      credits: 0,
    });
    await patchOutcomeTableNodeViaApi(page, secondNodeUuid, {
      title: secondTitle,
      timeRequired: 10,
      timeUnits: "hours",
      specificEducation: true,
      ponderationTheory: null,
      ponderationPractice: null,
      ponderationIndividual: null,
      credits: null,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: "Program summary outcome",
    });

    await openOutcomeTable(page, workflow);
    await selectOutcomeTableStyle(page, "Competency matrix");
    const grid = outcomeTableGrid(page);
    const classification = grid.getByRole("group", { name: "Classification" });
    const ponderation = grid.getByRole("group", { name: "Ponderation" });
    await expect(classification.getByRole("columnheader")).toHaveText([
      "General education",
      "Specific education",
    ]);
    await expect(ponderation.getByRole("columnheader")).toHaveText([
      "Theory",
      "Practical",
      "Individual work",
      "Total hours",
    ]);
    await expect(
      grid.getByRole("columnheader", { name: "Credits" }),
    ).toBeVisible();
    await expect(
      grid.locator(
        '[data-test-id="workflow-outcome-table-total-hours-column"]',
      ),
    ).toHaveCount(0);

    const firstRow = nodeRow(page, firstTitle);
    await expect(
      firstRow.locator(
        '[data-test-id="workflow-outcome-table-general-education-cell"]',
      ),
    ).toHaveText("1 day 20 hours");
    await expect(
      firstRow.locator(
        '[data-test-id="workflow-outcome-table-specific-education-cell"]',
      ),
    ).toHaveText("");
    await expect(
      firstRow.locator('[data-test-id="workflow-outcome-table-theory-cell"]'),
    ).toHaveText("1 day 20 hours");
    await expect(
      firstRow.locator(
        '[data-test-id="workflow-outcome-table-practical-cell"]',
      ),
    ).toHaveText("10 hours");
    await expect(
      firstRow.locator(
        '[data-test-id="workflow-outcome-table-individual-cell"]',
      ),
    ).toHaveText("—");
    await expect(
      firstRow.locator(
        '[data-test-id="workflow-outcome-table-ponderation-total-cell"]',
      ),
    ).toHaveText("2 days 6 hours");
    await expect(
      firstRow.locator('[data-test-id="workflow-outcome-table-credits-cell"]'),
    ).toHaveText("0");

    const secondRow = nodeRow(page, secondTitle);
    await expect(
      secondRow.locator(
        '[data-test-id="workflow-outcome-table-general-education-cell"]',
      ),
    ).toHaveText("");
    await expect(
      secondRow.locator(
        '[data-test-id="workflow-outcome-table-specific-education-cell"]',
      ),
    ).toHaveText("10 hours");
    await expect(
      secondRow.locator(
        '[data-test-id="workflow-outcome-table-ponderation-total-cell"]',
      ),
    ).toHaveText("—");
    await expect(
      secondRow.locator('[data-test-id="workflow-outcome-table-credits-cell"]'),
    ).toHaveText("—");

    const sectionRow = firstSectionSummaryRow(page);
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-general-education-total"]',
      ),
    ).toHaveText("1 day 20 hours");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-specific-education-total"]',
      ),
    ).toHaveText("10 hours");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-theory-total"]',
      ),
    ).toHaveText("1 day 20 hours");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-practical-total"]',
      ),
    ).toHaveText("10 hours");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-individual-total"]',
      ),
    ).toHaveText("—");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-ponderation-total-total"]',
      ),
    ).toHaveText("2 days 6 hours");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-credits-total"]',
      ),
    ).toHaveText("0");
  });
});
