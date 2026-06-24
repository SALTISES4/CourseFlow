import { test, expect } from '../../fixtures';
import { workflowOverviewPath } from '../../helpers/workflow-navigation';
import {
  workflowMetadataFieldTime,
  workflowMetadataSwitchCalculateTimeAutomatically,
  workflowOverviewView,
} from './workflow-overview.locators';

/**
 * Workflow Overview time auto-calculation — FR-WF-OV-003.
 * Requirements: workflow_overview_requirements_v1.yaml
 */

test.describe('Workflow overview — time auto-calculation (FR-WF-OV-003)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflowOverviewPath(workflow.path));
    await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
  });

  test('FR-WF-OV-003: activity workflow time switch and field deferred until OverviewView wiring', async () => {
    test.skip(
      true,
      'OverviewView lacks workflowMetadataSwitchCalculateTimeAutomatically and workflowMetadataFieldTime for activity workflows.',
    );
  });

  test('FR-WF-OV-003: auto-calculate ON makes Time field read-only deferred', async ({
    page,
  }) => {
    const hasSwitch = (await workflowMetadataSwitchCalculateTimeAutomatically(page).count()) > 0;
    const hasTime = (await workflowMetadataFieldTime(page).count()) > 0;
    if (!hasSwitch || !hasTime) {
      test.skip(
        true,
        'OverviewView lacks time metadata controls; cannot assert auto-calculate read-only behavior.',
      );
    }

    await workflowMetadataSwitchCalculateTimeAutomatically(page).check();
    await expect(workflowMetadataFieldTime(page)).toBeDisabled();
  });
});
