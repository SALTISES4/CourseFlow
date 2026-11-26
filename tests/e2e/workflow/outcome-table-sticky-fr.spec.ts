import { expect, test, type Locator, type Page } from "../../fixtures";
import { ensurePageWorkspaceEditLock } from "../../helpers/edit-lock";
import { mainNavigation } from "../../shared/locators/navigation";
import {
  workflowRightSidebarTabStrip,
  workflowChannelsHeaderRow,
  workflowScrollableContentRegion,
  workflowViewTabSelector,
} from "../../shared/locators/workflow";
import { createOutcomeViaApi } from "./outcome-drag.helpers";
import {
  createWorkflowNodeViaApi,
  createWorkflowChannelViaApi,
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
  scrollRegion: Locator,
  grid: Locator,
  rowHeader: Locator,
): Promise<StickyMeasurement> {
  const header = grid.locator(":scope > div").first();
  const [scroll, headerBox, rowHeaderBox] = await Promise.all([
    scrollRegion.evaluate((element) => ({
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
  scrollRegion: Locator,
  grid: Locator,
  rowHeader: Locator,
): Promise<void> {
  await scrollRegion.evaluate((element) => {
    element.scrollLeft = 0;
    element.scrollTop = 0;
  });
  const before = await measureStickyRegions(scrollRegion, grid, rowHeader);
  await scrollRegion.evaluate((element) => {
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
    .poll(() => scrollRegion.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await expect
    .poll(() => scrollRegion.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  const after = await measureStickyRegions(scrollRegion, grid, rowHeader);
  expect(after.scrollLeft).toBeGreaterThan(before.scrollLeft);
  expect(after.scrollTop).toBeGreaterThan(before.scrollTop);
  expect(Math.abs(after.headerTop - before.headerTop)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(after.rowHeaderLeft - before.rowHeaderLeft),
  ).toBeLessThanOrEqual(1);
  await page.waitForTimeout(50);
}

async function assertWorkspaceHorizontalScrollBoundary(
  page: Page,
  movingContent: Locator,
  includeWorkflowSidebar: boolean,
): Promise<void> {
  const scrollRegion = workflowScrollableContentRegion(page);
  const fixedRegions = [mainNavigation(page), workflowViewTabSelector(page)];
  if (includeWorkflowSidebar) {
    fixedRegions.push(workflowRightSidebarTabStrip(page));
  }

  await expect(scrollRegion).toBeVisible();
  await expect
    .poll(() =>
      scrollRegion.evaluate((element) => element.scrollWidth > element.clientWidth),
    )
    .toBe(true);

  const beforeFixed = await Promise.all(fixedRegions.map((region) => region.boundingBox()));
  const beforeScrollRegion = await scrollRegion.boundingBox();
  const beforeMovingContent = await movingContent.boundingBox();
  const navigationBox = beforeFixed[0];
  expect(beforeFixed.every(Boolean)).toBe(true);
  expect(beforeScrollRegion).toBeTruthy();
  expect(beforeMovingContent).toBeTruthy();
  expect(navigationBox).toBeTruthy();
  expect(beforeScrollRegion!.x).toBeGreaterThanOrEqual(
    navigationBox!.x + navigationBox!.width - 1,
  );

  await scrollRegion.evaluate((element) => {
    element.scrollLeft = Math.min(500, element.scrollWidth - element.clientWidth);
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect
    .poll(() => scrollRegion.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);

  const afterFixed = await Promise.all(fixedRegions.map((region) => region.boundingBox()));
  const afterScrollRegion = await scrollRegion.boundingBox();
  const afterMovingContent = await movingContent.boundingBox();
  for (let index = 0; index < beforeFixed.length; index += 1) {
    expect(Math.abs(afterFixed[index]!.x - beforeFixed[index]!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(afterFixed[index]!.y - beforeFixed[index]!.y)).toBeLessThanOrEqual(1);
  }
  expect(Math.abs(afterScrollRegion!.x - beforeScrollRegion!.x)).toBeLessThanOrEqual(1);
  expect(afterMovingContent!.x).toBeLessThan(beforeMovingContent!.x);
}

async function assertGraphNodeCategoryHeaderSticky(page: Page): Promise<void> {
  const scrollRegion = workflowScrollableContentRegion(page);
  const channelHeader = workflowChannelsHeaderRow(page);
  const sections = page.locator('[data-test-id="sections-block"]');
  const tabs = workflowViewTabSelector(page);

  await scrollRegion.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect
    .poll(() =>
      scrollRegion.evaluate((element) => element.scrollHeight > element.clientHeight),
    )
    .toBe(true);

  const [beforeHeader, beforeSections, tabsBox] = await Promise.all([
    channelHeader.boundingBox(),
    sections.boundingBox(),
    tabs.boundingBox(),
  ]);
  expect(beforeHeader && beforeSections && tabsBox).toBeTruthy();

  await scrollRegion.evaluate((element) => {
    element.scrollTop = Math.min(500, element.scrollHeight - element.clientHeight);
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect
    .poll(() => scrollRegion.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);

  const [afterHeader, afterSections] = await Promise.all([
    channelHeader.boundingBox(),
    sections.boundingBox(),
  ]);
  expect(afterHeader && afterSections).toBeTruthy();
  expect(Math.abs(afterHeader!.y - beforeHeader!.y)).toBeLessThanOrEqual(1);
  expect(afterHeader!.y).toBeGreaterThanOrEqual(tabsBox!.y + tabsBox!.height - 1);
  expect(afterSections!.y).toBeLessThan(beforeSections!.y);
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
  await createWorkflowChannelViaApi(page, workflow, "Sticky category 02");
  await createWorkflowChannelViaApi(page, workflow, "Sticky category 03");
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
  const scrollRegion = workflowScrollableContentRegion(page);
  await assertWorkspaceHorizontalScrollBoundary(page, grid, false);
  await expect
    .poll(() =>
      scrollRegion.evaluate(
        (element) =>
          element.scrollWidth > element.clientWidth &&
          element.scrollHeight > element.clientHeight,
      ),
    )
    .toBe(true);
  await assertStickyOnBothAxes(
    page,
    scrollRegion,
    grid,
    grid.getByRole("rowheader", { name: /Sticky outcome 01/ }),
  );

  await selectOutcomeTableStyle(page, "Competency matrix");
  await expect
    .poll(() =>
      scrollRegion.evaluate(
        (element) =>
          element.scrollWidth > element.clientWidth &&
          element.scrollHeight > element.clientHeight,
      ),
    )
    .toBe(true);
  await assertStickyOnBothAxes(
    page,
    scrollRegion,
    grid,
    grid.getByRole("rowheader", { name: "Sticky node 01", exact: true }),
  );

  await page.goto(workflow.path);
  const workflowView = page.locator('[data-test-id="workflow-view"]');
  await expect(workflowView).toBeVisible();
  await assertWorkspaceHorizontalScrollBoundary(page, workflowView, true);
  await assertGraphNodeCategoryHeaderSticky(page);
});
