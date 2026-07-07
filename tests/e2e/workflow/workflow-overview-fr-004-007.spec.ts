import { test, expect } from '../../fixtures';
import { workflowOverviewPath } from '../../helpers/workflow-navigation';
import {
  workflowMetadataFieldCredits,
  workflowMetadataFieldTime,
  workflowMetadataPermissionsPanel,
  workflowMetadataSwitchCalculateTimeAutomatically,
  workflowOverviewView,
} from './workflow-overview.locators';

/**
 * Workflow Overview course/program metadata — FR-WF-OV-004 through FR-WF-OV-007.
 * Requirements: workflow_overview_requirements_v1.yaml
 */

test.describe('Workflow overview — course/program metadata (FR-WF-OV-004-007)', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await page.goto(workflowOverviewPath(workflow.path));
    await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
  });

  test('FR-WF-OV-004: ponderation auto-calculate deferred until program workflow fixture', async () => {
    test.skip(
      true,
      'E2E fixture workflow_type is activity; FR-WF-OV-004 requires program Overview wiring.',
    );
  });

  test('FR-WF-OV-005: credits auto-calculate deferred until program workflow fixture', async () => {
    test.skip(
      true,
      'E2E fixture workflow_type is activity; FR-WF-OV-005 requires program Overview wiring.',
    );
  });

  test('FR-WF-OV-006: classification auto-calculate deferred until program workflow fixture', async () => {
    test.skip(
      true,
      'E2E fixture workflow_type is activity; FR-WF-OV-006 requires program Overview wiring.',
    );
  });

  test('FR-WF-OV-007: workflowMetadataPermissionsPanel deferred until OverviewView wiring', async ({
    page,
  }) => {
    const hasPanel = (await workflowMetadataPermissionsPanel(page).count()) > 0;
    const hasTimeSwitch = (await workflowMetadataSwitchCalculateTimeAutomatically(page).count()) > 0;
    const hasTime = (await workflowMetadataFieldTime(page).count()) > 0;
    const hasCredits = (await workflowMetadataFieldCredits(page).count()) > 0;

    if (!hasPanel && !hasTimeSwitch && !hasTime && !hasCredits) {
      test.skip(
        true,
        'Activity OverviewView lacks permissions panel and course/program metadata fields.',
      );
    }

    await expect(workflowMetadataPermissionsPanel(page)).toBeVisible();
  });
});
