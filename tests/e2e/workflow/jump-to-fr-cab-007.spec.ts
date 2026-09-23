import { expect, test } from '../../fixtures';
import {
  expectWorkflowJumpToMenuSectionLabelsPerFrCab007,
  expectWorkflowJumpToScrollsToSectionPerFrCab007,
  navigateToWorkflowGraphSubView,
  workflowJumpToMenuSectionItemLabel,
} from '../../helpers/jump-to';
import { sectionHeader, sectionTitleHeading } from './edit-section.locators';
import { workflowJumpToTrigger } from './jump-to.locators';
import { workflowOverviewTab } from './workflow.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary'],
  actorAsset: 'actor.teacher',
  seedAccess: 'read-only',
});

/**
 * Context action bar — FR-CAB-007 (Workflow Jump to menu).
 * Requirements: tests/docs/requirements/features/global/context_action_bar_requirements_v1.yaml
 */
test.describe('jump-to-fr-cab-007', () => {
  test.beforeEach(async ({ page, workflow }) => {
    await navigateToWorkflowGraphSubView(page, workflow.path);
  });

  test('FR-CAB-007: Jump to trigger is visible on Workflow sub-view only', async ({ page }) => {
    await expect(workflowJumpToTrigger(page)).toBeVisible();
  });

  test('FR-CAB-007: Jump to is not shown on Overview sub-view', async ({ page, workflow }) => {
    await page.goto(workflow.path);
    await workflowOverviewTab(page).click();
    await expect(workflowJumpToTrigger(page)).toHaveCount(0);
  });

  test('FR-CAB-007: menu lists sections as index plus title or Untitled section', async ({
    page,
    workflow,
  }) => {
    await expectWorkflowJumpToMenuSectionLabelsPerFrCab007(page, [
      { index: 1, title: 'E2E Section 1' },
      { index: 2, title: '' },
      { index: 3, title: 'E2E Section 3' },
    ]);

    const blank = workflow.blankSection();
    await expect(sectionHeader(page, blank.uuid)).not.toContainText('Untitled section');
    await expect(sectionTitleHeading(page, blank.uuid)).toHaveCount(0);
  });

  test('FR-CAB-007: selecting a row scrolls to the matching section', async ({ page, workflow }) => {
    const first = workflow.sectionByTitle('E2E Section 1');
    const label = workflowJumpToMenuSectionItemLabel(1, 'E2E Section 1');
    await expectWorkflowJumpToScrollsToSectionPerFrCab007(page, first.uuid, label);
  });
});
