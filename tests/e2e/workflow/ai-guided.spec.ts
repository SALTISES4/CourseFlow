import { test, expect } from "@playwright/test";

test("user can delete a section from the modal", async ({ page }) => {
  await page.goto("/course-flow/workflow/11/workflow");

  const section = page.locator('[data-week-id="62"]');
  const sectionHeader = page.locator('[data-week-id="62"] > header');

  // Hover header to reveal actions
  await sectionHeader.hover();

  // Click "Delete week" button within header
  await sectionHeader.getByRole("button", { name: "Delete week" }).click();

  // Confirm deletion in dialog
  await page.getByRole("button", { name: "Delete section" }).click();

  // Assert section is removed
  await expect(section).toHaveCount(0);
});

test("user can delete a section from the sidebar", async ({ page }) => {
  await page.goto("/course-flow/workflow/11/workflow");

  const section = page.locator('[data-week-id="62"]');
  const sectionHeader = page.locator('[data-week-id="62"] > header');
  const sidebar = page.locator('[data-test-id="sidebar"]');

  // Open sidebar by clicking section header
  await sectionHeader.click();

  // Assert sidebar is visible with correct context
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toContainText("Edit section");

  // Click delete button inside sidebar
  await sidebar.getByRole("button", { name: "Delete" }).click();

  // Confirm deletion in dialog
  await page.getByRole("button", { name: "Delete section" }).click();

  // Assert section is removed
  await expect(section).toHaveCount(0);
});

test("user can move a node", async ({ page }) => {
  // Variables
  const WORKFLOW_URL = "/course-flow/workflow/11/workflow";
  const SECTION_WRAP = page.locator('[data-week-id="62"]');
  const SECTION_FIRST_ROW = SECTION_WRAP.locator(
    '[data-drop-target-for-element]',
  ).first();
  const SECTION_NODE = SECTION_FIRST_ROW.locator('[draggable]');
  const SECTION_NODE_DROPZONES = SECTION_FIRST_ROW.locator(
    '[data-drop-target-for-element]',
  );

  // Visit page
  await page.goto(WORKFLOW_URL);

  // Verify initial state
  await SECTION_FIRST_ROW.locator('[draggable]').first().waitFor();

  await expect(SECTION_NODE).toHaveCount(1);
  await expect(SECTION_NODE_DROPZONES).toHaveCount(4);

  // Define draggable node and destination
  const node = SECTION_NODE.first();
  const destination = SECTION_NODE_DROPZONES.nth(1);

  // Drag and drop
  await node.dragTo(destination, { force: true });

  // Select the "Column" option
  await page.getByRole('menuitem', { name: 'Keep in same column' }).click();

  // Verify dropzone state changes
  const firstDropzone = SECTION_NODE_DROPZONES.nth(0);
  const secondDropzone = SECTION_NODE_DROPZONES.nth(1);

  await expect(firstDropzone).not.toHaveAttribute("draggable", "true");
  await expect(secondDropzone).toHaveAttribute("draggable", "true");
});
