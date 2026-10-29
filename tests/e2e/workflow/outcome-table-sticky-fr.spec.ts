import { expect, test, type Locator, type Page } from "../../fixtures";
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

test.use({
  seedAsset: "workflow.navigation_course",
  actorAsset: "actor.teacher",
  seedAccess: "disposable-project-copy",
  viewport: { width: 760, height: 560 },
});

type StickyMeasurement = {
  scrollLeft: number;
  scrollTop: number;
  headerTop: number;
  rowHeaderLeft: number;
};

async function measureStickyRegions(
  grid: Locator,
  rowHeader: Locator,
): Promise<StickyMeasurement> {
  const header = grid.locator(":scope > div").first();
  const [scroll, headerBox, rowHeaderBox] = await Promise.all([
    grid.evaluate((element) => ({
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
    })),
    header.boundingBox(),
    rowHeader.boundingBox(),
  ]);
  if (!headerBox || !rowHeaderBox) {
    throw new Error("Expected measurable Outcome Table sticky regions.");
  }
  return {
    ...scroll,
    headerTop: headerBox.y,
    rowHeaderLeft: rowHeaderBox.x,
  };
}

async function assertStickyOnBothAxes(
  page: Page,
  grid: Locator,
  rowHeader: Locator,
): Promise<void> {
  await grid.evaluate((element) => {
    element.scrollLeft = 0;
    element.scrollTop = 0;
  });
  const before = await measureStickyRegions(grid, rowHeader);
  await grid.evaluate((element) => {
    element.scrollLeft = Math.min(
      500,
      element.scrollWidth - element.clientWidth,
    );
    element.scrollTop = Math.min(
      500,
      element.scrollHeight - element.clientHeight,
    );
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect
    .poll(() => grid.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await expect
    .poll(() => grid.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  const after = await measureStickyRegions(grid, rowHeader);
  expect(after.scrollLeft).toBeGreaterThan(before.scrollLeft);
  expect(after.scrollTop).toBeGreaterThan(before.scrollTop);
  expect(Math.abs(after.headerTop - before.headerTop)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(after.rowHeaderLeft - before.rowHeaderLeft),
  ).toBeLessThanOrEqual(1);
  await page.waitForTimeout(50);
}

test("FR-WF-OT-004: sticky top and left regions remain visible after two-axis scroll in both styles", async ({
  page,
  workflow,
}) => {
  test.setTimeout(60_000);
  await page.goto(workflow.path);
  await ensurePageWorkspaceEditLock(page, "workflow", workflow.workflowUuid);
  const graph = await fetchGraphView(page, workflow.workflowUuid);
  const firstNode = graph.nodes[0];
  expect(firstNode).toBeTruthy();
  await patchOutcomeTableNodeViaApi(page, firstNode!.uuid, {
    title: "Sticky node 01",
  });
  for (let index = 2; index <= 10; index += 1) {
    const nodeUuid = await createWorkflowNodeViaApi(page, workflow);
    await patchOutcomeTableNodeViaApi(page, nodeUuid, {
      title: `Sticky node ${String(index).padStart(2, "0")}`,
    });
  }
  for (let index = 1; index <= 10; index += 1) {
    await createOutcomeViaApi(page, workflow.graphUuid, {
      title: `Sticky outcome ${String(index).padStart(2, "0")}`,
    });
  }

  await openOutcomeTable(page, workflow);
  const grid = outcomeTableGrid(page);
  await expect
    .poll(() =>
      grid.evaluate(
        (element) =>
          element.scrollWidth > element.clientWidth &&
          element.scrollHeight > element.clientHeight,
      ),
    )
    .toBe(true);
  await assertStickyOnBothAxes(
    page,
    grid,
    grid.getByRole("rowheader", { name: /Sticky outcome 01/ }),
  );

  await selectOutcomeTableStyle(page, "Competency matrix");
  await expect
    .poll(() =>
      grid.evaluate(
        (element) =>
          element.scrollWidth > element.clientWidth &&
          element.scrollHeight > element.clientHeight,
      ),
    )
    .toBe(true);
  await assertStickyOnBothAxes(
    page,
    grid,
    grid.getByRole("rowheader", { name: "Sticky node 01", exact: true }),
  );
});
