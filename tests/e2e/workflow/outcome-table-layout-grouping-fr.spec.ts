import { expect, test } from "../../fixtures";
import { ensurePageWorkspaceEditLock } from "../../helpers/edit-lock";
import { createOutcomeViaApi } from "./outcome-drag.helpers";
import {
  createWorkflowChannelViaApi,
  createWorkflowNodeViaApi,
  openOutcomeTable,
  openOutcomeTableViewSettings,
  outcomeTableCell,
  outcomeTableGrid,
  outcomeTableTab,
  patchOutcomeTableNodeViaApi,
  selectOutcomeTableSort,
  selectOutcomeTableStyle,
} from "./outcome-table.helpers";
import { createProjectTagViaApi } from "./workflow-assign-outcome.helpers";
import { fetchGraphView } from "./workflow-graph.helpers";

test.use({
  seedAsset: "workflow.navigation_course",
  actorAsset: "actor.teacher",
  seedAccess: "disposable-project-copy",
});

test.describe("FR-WF-OT-001/002: table layout and accessible semantics", () => {
  test("Normal exposes the outcome hierarchy, section and node axes, colour band, and assignment semantics", async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
    const graph = await fetchGraphView(page, workflow.workflowUuid);
    const node = graph.nodes[0];
    expect(node).toBeTruthy();

    const nodeTitle =
      "A deliberately long Outcome Table node title used to exercise truncation";
    const rootTitle =
      "A deliberately long Outcome Table root outcome used to exercise truncation";
    const childTitle = "Nested Outcome Table child";
    await patchOutcomeTableNodeViaApi(page, node!.uuid, { title: nodeTitle });
    const rootUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: rootTitle,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: childTitle,
      parentUuid: rootUuid,
    });

    await openOutcomeTable(page, workflow);
    const grid = outcomeTableGrid(page);
    await expect(grid).toHaveAttribute("data-layout", "normal");
    await expect(
      grid.getByRole("rowgroup", { name: "Outcomes" }),
    ).toBeVisible();
    await expect(grid.getByText("Untagged", { exact: true })).toHaveCount(0);

    const sectionGroups = grid.getByRole("group");
    await expect(sectionGroups).toHaveCount(1);
    await expect(sectionGroups.first()).toHaveAccessibleName(/.+/);

    const nodeHeader = grid.getByRole("columnheader", {
      name: nodeTitle,
      exact: true,
    });
    await expect(nodeHeader).toBeVisible();
    await expect(nodeHeader.locator("span").first()).not.toHaveCSS(
      "border-left-color",
      "rgba(0, 0, 0, 0)",
    );

    const rootRow = grid.getByRole("rowheader", {
      name: new RegExp(rootTitle),
    });
    await expect(rootRow).toBeVisible();
    await expect(
      grid.getByRole("rowheader", { name: new RegExp(childTitle) }),
    ).toHaveCount(0);

    const assignment = outcomeTableCell(page, rootTitle, nodeTitle);
    await expect(assignment).toHaveAttribute("aria-checked", "false");
    await expect(assignment).toBeEnabled();

    await nodeHeader.locator("span").first().hover();
    await expect(page.getByRole("tooltip", { name: nodeTitle })).toBeVisible();
    await assignment.hover();
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await page.keyboard.press("Tab");
    await nodeHeader.focus();
    await expect(page.getByRole("tooltip", { name: nodeTitle })).toBeVisible();

    await rootRow.getByRole("button").click();
    await expect(
      grid.getByRole("rowheader", { name: new RegExp(childTitle) }),
    ).toBeVisible();
  });

  test("Competency matrix swaps the axes and exposes only the course summary column", async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
    const graph = await fetchGraphView(page, workflow.workflowUuid);
    const node = graph.nodes[0];
    expect(node).toBeTruthy();
    await patchOutcomeTableNodeViaApi(page, node!.uuid, {
      title: "Course summary node",
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: "Course summary outcome",
    });

    await openOutcomeTable(page, workflow);
    await selectOutcomeTableStyle(page, "Competency matrix");
    const grid = outcomeTableGrid(page);
    await expect(grid).toHaveAttribute("data-layout", "competency-matrix");
    await expect(
      grid.getByRole("rowheader", { name: "Course summary node" }),
    ).toBeVisible();
    await expect(
      grid.getByRole("columnheader", { name: /Course summary outcome/ }),
    ).toBeVisible();
    await expect(
      grid.getByRole("columnheader", { name: "Total hours" }),
    ).toBeVisible();
    await expect(
      grid.getByRole("group", { name: "Classification" }),
    ).toHaveCount(0);
    await expect(grid.getByRole("group", { name: "Ponderation" })).toHaveCount(
      0,
    );
    await expect(
      grid.getByRole("columnheader", { name: "Credits" }),
    ).toHaveCount(0);
  });
});

test.describe("FR-WF-OT-008 and FR-CAB-008/FR-WF-OT-011: tag grouping and filtering", () => {
  test("tag bands are ordered, multi-tag outcomes share state, node-only tags are excluded, and filter state resets on reload", async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
    const projectUuid = workflow.manifest.project_uuid;
    const graph = await fetchGraphView(page, workflow.workflowUuid);
    const node = graph.nodes[0];
    expect(node).toBeTruthy();

    const suffix = `${Date.now()}`;
    const alphaLabel = `A OT Alpha ${suffix}`;
    const betaLabel = `B OT Beta ${suffix}`;
    const nodeOnlyLabel = `Z OT Node only ${suffix}`;
    const alpha = await createProjectTagViaApi(page, projectUuid, alphaLabel);
    const beta = await createProjectTagViaApi(page, projectUuid, betaLabel);
    const nodeOnly = await createProjectTagViaApi(
      page,
      projectUuid,
      nodeOnlyLabel,
    );
    await patchOutcomeTableNodeViaApi(page, node!.uuid, {
      tagIds: [nodeOnly.id],
    });

    const multiTitle = `Multi-tag root ${suffix}`;
    const childTitle = `Multi-tag child ${suffix}`;
    const betaTitle = `Beta root ${suffix}`;
    const untaggedTitle = `Untagged root ${suffix}`;
    const multiUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
      title: multiTitle,
      tagIds: [alpha.id, beta.id],
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: childTitle,
      parentUuid: multiUuid,
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: betaTitle,
      tagIds: [beta.id],
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: untaggedTitle,
    });

    await openOutcomeTable(page, workflow);
    const grid = outcomeTableGrid(page);
    const tagBands = grid.locator(
      '[data-test-id="workflow-outcome-table-tag-group"]',
    );
    await expect
      .poll(() =>
        tagBands.evaluateAll((elements) =>
          elements.map((element) => element.getAttribute("aria-label")),
        ),
      )
      .toEqual([alphaLabel, betaLabel, "Untagged"]);
    await expect(
      grid.getByRole("rowheader", { name: new RegExp(multiTitle) }),
    ).toHaveCount(2);
    await expect(
      grid.getByRole("rowheader", { name: new RegExp(untaggedTitle) }),
    ).toBeVisible();

    await openOutcomeTableViewSettings(page);
    await expect(
      page.getByRole("checkbox", { name: alphaLabel }),
    ).toBeChecked();
    await expect(page.getByRole("checkbox", { name: betaLabel })).toBeChecked();
    await expect(
      page.getByRole("checkbox", { name: nodeOnlyLabel }),
    ).toHaveCount(0);
    await page.getByRole("checkbox", { name: alphaLabel }).uncheck();
    await page.keyboard.press("Escape");

    await expect(
      grid.getByRole("rowheader", { name: new RegExp(multiTitle) }),
    ).toHaveCount(0);
    await expect(
      grid.getByRole("rowheader", { name: new RegExp(betaTitle) }),
    ).toBeVisible();
    await expect(
      grid.getByRole("rowheader", { name: new RegExp(untaggedTitle) }),
    ).toBeVisible();

    await selectOutcomeTableStyle(page, "Competency matrix");
    await expect(
      grid.getByRole("columnheader", { name: new RegExp(multiTitle) }),
    ).toHaveCount(0);
    await expect(
      grid.getByRole("columnheader", { name: new RegExp(betaTitle) }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Overview", exact: true }).click();
    await outcomeTableTab(page).click();
    await expect(grid).toHaveAttribute("data-layout", "competency-matrix");
    await expect(
      grid.getByRole("columnheader", { name: new RegExp(multiTitle) }),
    ).toHaveCount(0);

    await page.reload();
    await expect(grid).toHaveAttribute("data-layout", "normal");
    await expect(
      grid.getByRole("rowheader", { name: new RegExp(multiTitle) }),
    ).toHaveCount(2);
  });
});

test.describe("FR-CAB-009: deterministic node ordering", () => {
  test("chronological, Context, and Node category order are stable and identical across styles", async ({
    page,
    workflow,
  }) => {
    await page.goto(workflow.path);
    await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
    const graph = await fetchGraphView(page, workflow.workflowUuid);
    const section = graph.sections[0];
    const firstChannel = graph.channels[0];
    const firstNode = graph.nodes[0];
    expect(section && firstChannel && firstNode).toBeTruthy();

    const secondChannelUuid = await createWorkflowChannelViaApi(
      page,
      workflow,
      "Second outcome-table category",
    );
    const summativeUuid = await createWorkflowNodeViaApi(page, workflow, {
      sectionUuid: section!.uuid,
      channelUuid: firstChannel!.uuid,
      sectionRow: 1,
    });
    const comprehensiveUuid = await createWorkflowNodeViaApi(page, workflow, {
      sectionUuid: section!.uuid,
      channelUuid: secondChannelUuid,
      sectionRow: 0,
    });
    const formativeUuid = await createWorkflowNodeViaApi(page, workflow, {
      sectionUuid: section!.uuid,
      channelUuid: secondChannelUuid,
      sectionRow: 1,
    });

    const titles = {
      none: "OT order 1 None",
      comprehensive: "OT order 2 Comprehensive",
      summative: "OT order 3 Summative",
      formative: "OT order 4 Formative",
    };
    await patchOutcomeTableNodeViaApi(page, firstNode!.uuid, {
      title: titles.none,
      contextClassification: "none",
    });
    await patchOutcomeTableNodeViaApi(page, comprehensiveUuid, {
      title: titles.comprehensive,
      contextClassification: "comprehensive",
    });
    await patchOutcomeTableNodeViaApi(page, summativeUuid, {
      title: titles.summative,
      contextClassification: "summative",
    });
    await patchOutcomeTableNodeViaApi(page, formativeUuid, {
      title: titles.formative,
      contextClassification: "formative",
    });
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: "Ordering outcome",
    });

    await openOutcomeTable(page, workflow);
    const relevantTitles = Object.values(titles);
    const normalOrder = async () =>
      outcomeTableGrid(page)
        .getByRole("columnheader")
        .evaluateAll(
          (elements, expected) =>
            elements
              .map((element) => element.getAttribute("aria-label") ?? "")
              .filter((label) => (expected as string[]).includes(label)),
          relevantTitles,
        );
    const matrixOrder = async () =>
      outcomeTableGrid(page)
        .getByRole("rowheader")
        .evaluateAll(
          (elements, expected) =>
            elements
              .map(
                (element) =>
                  element.getAttribute("aria-label") ??
                  element.textContent ??
                  "",
              )
              .filter((label) => (expected as string[]).includes(label)),
          relevantTitles,
        );

    await expect
      .poll(normalOrder)
      .toEqual([
        titles.none,
        titles.comprehensive,
        titles.summative,
        titles.formative,
      ]);

    await selectOutcomeTableSort(page, "Context");
    const contextOrder = [
      titles.none,
      titles.formative,
      titles.summative,
      titles.comprehensive,
    ];
    await expect.poll(normalOrder).toEqual(contextOrder);
    await selectOutcomeTableStyle(page, "Competency matrix");
    await expect.poll(matrixOrder).toEqual(contextOrder);

    await selectOutcomeTableSort(page, "Node category");
    await expect
      .poll(matrixOrder)
      .toEqual([
        titles.none,
        titles.summative,
        titles.comprehensive,
        titles.formative,
      ]);
  });
});
