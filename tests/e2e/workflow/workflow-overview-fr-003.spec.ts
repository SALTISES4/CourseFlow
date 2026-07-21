import { test, expect } from '../../fixtures';
import { workflowOverviewPath } from '../../helpers/workflow-navigation';
import {
  workflowMetadataFieldTime,
  workflowMetadataSwitchCalculateTimeAutomatically,
  workflowOverviewView,
} from './workflow-overview.locators';
import { setWorkflowOverviewSwitch } from './workflow-overview.helpers';
import { workflowGraphTab, workflowOverviewTab } from './workflow.locators';

/**
 * Workflow Overview time auto-calculation — FR-WF-OV-003.
 * Requirements: workflow_overview_requirements_v1.yaml
 */

test.describe('Workflow overview — time auto-calculation (FR-WF-OV-003)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflowOverviewPath(workflow.path));
    await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
  });

  test('FR-WF-OV-003: activity workflow exposes an editable Time field when auto-calculate is OFF', async ({
    page,
  }) => {
    const automaticSwitch = workflowMetadataSwitchCalculateTimeAutomatically(page);
    await setWorkflowOverviewSwitch(page, automaticSwitch, false);

    await expect(automaticSwitch).toBeEnabled();
    await expect(workflowMetadataFieldTime(page)).toBeEnabled();
  });

  test('FR-WF-OV-003: auto-calculate ON makes Time read-only and the switch persists', async ({
    page,
    workflow,
  }) => {
    const automaticSwitch = workflowMetadataSwitchCalculateTimeAutomatically(page);
    try {
      await setWorkflowOverviewSwitch(page, automaticSwitch, true);
      await expect(workflowMetadataFieldTime(page)).toBeDisabled();

      await workflowGraphTab(page).click();
      await expect(page).toHaveURL(new RegExp(`${workflow.path}/?$`));
      await workflowOverviewTab(page).click();
      await expect(workflowOverviewView(page)).toBeVisible();
      await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeChecked();
      await expect(workflowMetadataFieldTime(page)).toBeDisabled();
    } finally {
      const restoredSwitch = workflowMetadataSwitchCalculateTimeAutomatically(page);
      await setWorkflowOverviewSwitch(page, restoredSwitch, false);
    }
  });
});
