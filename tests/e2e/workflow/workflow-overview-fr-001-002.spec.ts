import { test, expect } from '../../fixtures';
import { workflowOverviewPath } from '../../helpers/workflow-navigation';
import { workflowGraphTab, workflowOverviewTab, workflowTitle } from './workflow.locators';
import {
  workflowMetadataDisciplinesBlock,
  workflowMetadataFieldCode,
  workflowMetadataFieldCreatedOn,
  workflowMetadataFieldDescription,
  workflowMetadataFieldCredits,
  workflowMetadataFieldGeneralTime,
  workflowMetadataFieldIndividualTime,
  workflowMetadataFieldPracticalTime,
  workflowMetadataFieldSpecificTime,
  workflowMetadataFieldTheoryTime,
  workflowMetadataFieldTime,
  workflowMetadataPermissionsPanel,
  workflowMetadataSection,
  workflowMetadataSwitchCalculateClassificationAutomatically,
  workflowMetadataSwitchCalculateCreditsAutomatically,
  workflowMetadataSwitchCalculatePonderationAutomatically,
  workflowMetadataSwitchCalculateTimeAutomatically,
  workflowOverviewView,
} from './workflow-overview.locators';
import { workflowRightSidebar } from '../../shared/locators/workflow';

/**
 * Workflow Overview — FR-WF-OV-001, FR-WF-OV-002 (partial; activity fixture).
 * Requirements: workflow_overview_requirements_v1.yaml
 */

test.describe('Workflow overview — view shell (FR-WF-OV-001)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflowOverviewPath(workflow.path));
    await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
  });

  test('FR-WF-OV-001: Overview route renders workflowOverviewView with metadata blocks', async ({
    page,
  }) => {
    await expect(workflowTitle(page)).toBeVisible();
    await expect(workflowOverviewTab(page)).toHaveAttribute('aria-selected', 'true');
    await expect(workflowMetadataDisciplinesBlock(page)).toBeVisible();
    await expect(workflowMetadataFieldCreatedOn(page)).toBeVisible();
  });

  test('FR-WF-OV-001: activity workflow renders its required fields only', async ({ page }) => {
    await expect(workflowMetadataSection(page)).toBeVisible();
    await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeVisible();
    await expect(workflowMetadataFieldTime(page)).toBeVisible();
    await expect(workflowMetadataPermissionsPanel(page)).toBeVisible();
    await expect(workflowMetadataFieldCode(page)).toHaveCount(0);
    await expect(workflowMetadataSwitchCalculatePonderationAutomatically(page)).toHaveCount(0);
    await expect(workflowMetadataFieldTheoryTime(page)).toHaveCount(0);
    await expect(workflowMetadataFieldPracticalTime(page)).toHaveCount(0);
    await expect(workflowMetadataFieldIndividualTime(page)).toHaveCount(0);
    await expect(workflowMetadataFieldCredits(page)).toHaveCount(0);
    await expect(workflowMetadataSwitchCalculateCreditsAutomatically(page)).toHaveCount(0);
    await expect(workflowMetadataSwitchCalculateClassificationAutomatically(page)).toHaveCount(0);
    await expect(workflowMetadataFieldGeneralTime(page)).toHaveCount(0);
    await expect(workflowMetadataFieldSpecificTime(page)).toHaveCount(0);
  });

  test('FR-WF-OV-001: Overview route does not render workflowRightSidebar', async ({ page }) => {
    await expect(workflowRightSidebar(page)).toHaveCount(0);
  });

  test('FR-WF-OV-001: navigate to Workflow and back preserves overview metadata blocks', async ({
    page,
    workflow,
  }) => {
    await workflowGraphTab(page).click();
    await expect(page).toHaveURL(new RegExp(`${workflow.path}/?$`));

    await workflowOverviewTab(page).click();
    await expect(page).toHaveURL(new RegExp(`${workflowOverviewPath(workflow.path)}/?$`));
    await expect(workflowMetadataDisciplinesBlock(page)).toBeVisible();
    await expect(workflowMetadataFieldCreatedOn(page)).toBeVisible();
  });

  test('FR-WF-OV-001: course workflow renders course fields without program-only switches', async ({
    page,
    workflow,
  }) => {
    const course = workflow.workflowByType('course');
    await page.goto(workflowOverviewPath(course.workflow_path));

    await expect(workflowMetadataFieldCode(page)).toBeVisible();
    await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeVisible();
    await expect(workflowMetadataFieldTheoryTime(page)).toBeVisible();
    await expect(workflowMetadataFieldPracticalTime(page)).toBeVisible();
    await expect(workflowMetadataFieldIndividualTime(page)).toBeVisible();
    await expect(workflowMetadataFieldCredits(page)).toBeVisible();
    await expect(workflowMetadataSwitchCalculatePonderationAutomatically(page)).toHaveCount(0);
    await expect(workflowMetadataSwitchCalculateCreditsAutomatically(page)).toHaveCount(0);
    await expect(workflowMetadataSwitchCalculateClassificationAutomatically(page)).toHaveCount(0);
  });
});

test.describe('Workflow overview — description metadata (FR-WF-OV-002)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflowOverviewPath(workflow.path));
    await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
  });

  test('FR-WF-OV-002: disciplines block shows label and value or empty copy', async ({ page }) => {
    const block = workflowMetadataDisciplinesBlock(page);
    await expect(block).toBeVisible();
    const text = await block.innerText();
    expect(text).toMatch(/Disciplines/);
    expect(text.length).toBeGreaterThan('Disciplines'.length);
  });

  test('FR-WF-OV-002: workflowMetadataFieldDescription is read-only when rendered', async ({
    page,
  }) => {
    await expect(workflowMetadataFieldDescription(page)).toBeVisible();
    await expect(workflowMetadataFieldDescription(page)).not.toHaveText(/^Description$/);
    const descriptionInput = workflowOverviewView(page).getByRole('textbox', {
      name: 'Description',
    });
    await expect(descriptionInput).toHaveCount(0);
  });
});
