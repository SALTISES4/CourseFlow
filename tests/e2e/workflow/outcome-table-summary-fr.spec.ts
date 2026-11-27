import { expect, test, type Page } from "../../fixtures";
import { ensurePageWorkspaceEditLock } from "../../helpers/edit-lock";
import { createOutcomeViaApi } from "./outcome-drag.helpers";
import {
  createWorkflowNodeViaApi,
  deleteWorkflowNodeViaApi,
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

const grandTotalRow = (page: Page) =>
  outcomeTableGrid(page).locator(
    '[data-test-id="workflow-outcome-table-grand-total-row"]',
  );

const grandTotalCell = (page: Page, suffix: string) =>
  grandTotalRow(page).locator(
    `[data-test-id="workflow-outcome-table-grand-total-${suffix}-cell"]`,
  );

test.use({
  seedAsset: "workflow.navigation_course",
  actorAsset: "actor.teacher",
  seedAccess: "disposable-project-copy",
});

test("FR-WF-OT-009/012: course duration cells, section sums, and Grand total normalize canonical minutes", async ({
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
    timeRequiredMinutes: null,
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
    timeRequiredMinutes: 0,
  });
  await page.reload();
  await selectOutcomeTableStyle(page, "Competency matrix");
  await expect(firstValue).toHaveText("0.0");
  await expect(sectionTotal).toHaveText("0.0");

  await patchOutcomeTableNodeViaApi(page, firstNode!.uuid, {
    timeRequiredMinutes: 2640,
  });
  const secondNodeUuid = await createWorkflowNodeViaApi(page, workflow);
  const secondTitle = "Course duration B";
  await patchOutcomeTableNodeViaApi(page, secondNodeUuid, {
    title: secondTitle,
    timeRequiredMinutes: 600,
  });
  await page.reload();
  await selectOutcomeTableStyle(page, "Competency matrix");

  await expect(firstValue).toHaveText("44.0");
  await expect(
    nodeRow(page, secondTitle).locator(
      '[data-test-id="workflow-outcome-table-total-hours-cell"]',
    ),
  ).toHaveText("10.0");
  await expect(sectionTotal).toHaveText("54.0");

  const grandTotal = grandTotalRow(page);
  await expect(grandTotal).toBeVisible();
  await expect(
    grandTotal.getByText("Grand total", { exact: true }),
  ).toBeVisible();
  await expect(grandTotalCell(page, "hours")).toHaveText("54.0");
  const outcomeCells = grandTotal.locator(
    '[data-test-id="workflow-outcome-table-grand-total-outcome-cell"]',
  );
  expect(await outcomeCells.count()).toBeGreaterThan(0);
  await expect(outcomeCells).toHaveText(
    Array.from({ length: await outcomeCells.count() }, () => ""),
  );
  expect(
    await grandTotal.evaluate(
      (row) => row === row.parentElement?.lastElementChild,
    ),
  ).toBe(true);
});

test.describe("program Competency matrix summaries", () => {
  test.use({ seedAsset: "workflow.navigation_program" });

  test("FR-WF-OT-002/010/012: program summaries, section totals, and Grand total match node metadata", async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
    const seedGraph = await fetchGraphView(page, workflow.workflowUuid);
    for (const node of seedGraph.nodes) {
      await deleteWorkflowNodeViaApi(page, node.uuid);
    }
    const firstNodeUuid = await createWorkflowNodeViaApi(page, workflow);
    const secondNodeUuid = await createWorkflowNodeViaApi(page, workflow);
    const firstTitle = "Program summary general";
    const secondTitle = "Program summary specific";
    await patchOutcomeTableNodeViaApi(page, firstNodeUuid, {
      title: firstTitle,
      timeRequiredMinutes: 2670,
      specificEducation: false,
      ponderationTheoryMinutes: 2640,
      ponderationPracticeMinutes: 600,
      ponderationIndividualMinutes: null,
      credits: 0,
    });
    await patchOutcomeTableNodeViaApi(page, secondNodeUuid, {
      title: secondTitle,
      timeRequiredMinutes: 570,
      specificEducation: true,
      ponderationTheoryMinutes: null,
      ponderationPracticeMinutes: null,
      ponderationIndividualMinutes: null,
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
    ).toHaveText("45");
    await expect(
      firstRow.locator(
        '[data-test-id="workflow-outcome-table-specific-education-cell"]',
      ),
    ).toHaveText("");
    await expect(
      firstRow.locator('[data-test-id="workflow-outcome-table-theory-cell"]'),
    ).toHaveText("44");
    await expect(
      firstRow.locator(
        '[data-test-id="workflow-outcome-table-practical-cell"]',
      ),
    ).toHaveText("10");
    await expect(
      firstRow.locator(
        '[data-test-id="workflow-outcome-table-individual-cell"]',
      ),
    ).toHaveText("—");
    await expect(
      firstRow.locator(
        '[data-test-id="workflow-outcome-table-ponderation-total-cell"]',
      ),
    ).toHaveText("54");
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
    ).toHaveText("10");
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
    ).toHaveText("45");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-specific-education-total"]',
      ),
    ).toHaveText("10");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-theory-total"]',
      ),
    ).toHaveText("44");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-practical-total"]',
      ),
    ).toHaveText("10");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-individual-total"]',
      ),
    ).toHaveText("—");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-ponderation-total-total"]',
      ),
    ).toHaveText("54");
    await expect(
      sectionRow.locator(
        '[data-test-id="workflow-outcome-table-section-credits-total"]',
      ),
    ).toHaveText("0");

    const grandTotal = grandTotalRow(page);
    await expect(grandTotal).toBeVisible();
    await expect(
      grandTotal.getByText("Grand total", { exact: true }),
    ).toBeVisible();
    await expect(grandTotalCell(page, "general-education")).toHaveText("45");
    await expect(grandTotalCell(page, "specific-education")).toHaveText("10");
    await expect(grandTotalCell(page, "theory")).toHaveText("44");
    await expect(grandTotalCell(page, "practical")).toHaveText("10");
    await expect(grandTotalCell(page, "individual")).toHaveText("—");
    await expect(grandTotalCell(page, "ponderation-hours")).toHaveText("54");
    await expect(grandTotalCell(page, "credits")).toHaveText("");
  });
});
