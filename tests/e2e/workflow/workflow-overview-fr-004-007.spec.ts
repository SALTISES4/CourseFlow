import { test, expect } from '../../fixtures';
import { workflowOverviewPath } from '../../helpers/workflow-navigation';
import {
  workflowMetadataFieldCredits,
  workflowMetadataFieldGeneralTime,
  workflowMetadataFieldIndividualTime,
  workflowMetadataFieldPracticalTime,
  workflowMetadataFieldSpecificTime,
  workflowMetadataFieldTheoryTime,
  workflowMetadataPermissionsPanel,
  workflowMetadataSwitchCalculateClassificationAutomatically,
  workflowMetadataSwitchCalculateCreditsAutomatically,
  workflowMetadataSwitchCalculatePonderationAutomatically,
  workflowOverviewView,
} from './workflow-overview.locators';
import { setWorkflowOverviewSwitch } from './workflow-overview.helpers';

/**
 * Workflow Overview course/program metadata — FR-WF-OV-004 through FR-WF-OV-007.
 * Requirements: workflow_overview_requirements_v1.yaml
 */

test.describe('Workflow overview — course/program metadata (FR-WF-OV-004-007)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    const program = workflow.workflowByType('program');
    await page.goto(workflowOverviewPath(program.workflow_path));
    await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
  });

  test('FR-WF-OV-004: program ponderation switch controls all three duration fields', async ({
    page,
  }) => {
    const automaticSwitch = workflowMetadataSwitchCalculatePonderationAutomatically(page);
    try {
      await setWorkflowOverviewSwitch(page, automaticSwitch, false);
      await expect(workflowMetadataFieldTheoryTime(page)).toBeEnabled();
      await expect(workflowMetadataFieldPracticalTime(page)).toBeEnabled();
      await expect(workflowMetadataFieldIndividualTime(page)).toBeEnabled();

      await setWorkflowOverviewSwitch(page, automaticSwitch, true);
      await expect(workflowMetadataFieldTheoryTime(page)).toBeDisabled();
      await expect(workflowMetadataFieldPracticalTime(page)).toBeDisabled();
      await expect(workflowMetadataFieldIndividualTime(page)).toBeDisabled();
    } finally {
      await setWorkflowOverviewSwitch(page, automaticSwitch, false);
    }
  });

  test('FR-WF-OV-005: program credits switch controls the whole-number field', async ({ page }) => {
    const automaticSwitch = workflowMetadataSwitchCalculateCreditsAutomatically(page);
    const credits = workflowMetadataFieldCredits(page);
    try {
      await setWorkflowOverviewSwitch(page, automaticSwitch, false);
      await expect(credits).toBeEnabled();
      await expect(credits).toHaveAttribute('step', '1');

      await setWorkflowOverviewSwitch(page, automaticSwitch, true);
      await expect(credits).toBeDisabled();
    } finally {
      await setWorkflowOverviewSwitch(page, automaticSwitch, false);
    }
  });

  test('FR-WF-OV-006: program classification switch controls General and Specific time', async ({
    page,
  }) => {
    const automaticSwitch = workflowMetadataSwitchCalculateClassificationAutomatically(page);
    try {
      await setWorkflowOverviewSwitch(page, automaticSwitch, false);
      await expect(workflowMetadataFieldGeneralTime(page)).toBeEnabled();
      await expect(workflowMetadataFieldSpecificTime(page)).toBeEnabled();

      await setWorkflowOverviewSwitch(page, automaticSwitch, true);
      await expect(workflowMetadataFieldGeneralTime(page)).toBeDisabled();
      await expect(workflowMetadataFieldSpecificTime(page)).toBeDisabled();
    } finally {
      await setWorkflowOverviewSwitch(page, automaticSwitch, false);
    }
  });

  test('FR-WF-OV-007: permissions panel is visible and read-only', async ({ page }) => {
    const panel = workflowMetadataPermissionsPanel(page);
    await expect(panel).toBeVisible();
    await expect(panel.getByText('Permissions', { exact: true })).toBeVisible();
    await expect(panel.getByText('Add CourseFlow user', { exact: true })).toHaveCount(0);
    await expect(panel.getByRole('button', { name: /remove contributor/i })).toHaveCount(0);
    await expect(
      panel.getByRole('button', { name: /editor|commenter|viewer/i }).first(),
    ).toBeDisabled();
  });
});
