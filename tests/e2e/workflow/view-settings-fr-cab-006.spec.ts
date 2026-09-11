import { expect, test } from '../../fixtures';
import { loginAs } from '../../helpers/auth';
import { getProjectPath } from '../../helpers/manifest';
import {
  assignProjectTagToFirstWorkflowNode,
  assignProjectTagToOutcome,
  clickWorkflowViewSettingsMenuItem,
  deleteProjectTagFromOverview,
  expectExpandAllOutcomesMenuItemExpandsTreePerFrCab006,
  expectWorkflowTagFilterHidesTaggedNodeOnlyPerFrCab006,
  expectWorkflowViewSettingsMenuCompositionOnOutcomesSubViewPerFrCab006,
  expectWorkflowViewSettingsMenuCompositionOnWorkflowSubViewPerFrCab006,
  expectWorkflowViewSettingsTagToggleResetsOnReloadPerFrCab006,
  expectWorkflowViewSettingsTriggerHiddenPerFrCab006,
  expectWorkflowViewSettingsTriggerOpensMenuPerFrCab006,
  navigateToWorkflowGraphSubView,
  navigateToWorkflowOverviewSubView,
  openWorkflowViewSettingsMenu,
} from '../../helpers/view-settings';
import { gotoOutcomesView, secondWorkflowNodeUuid } from './comments-tab.helpers';
import { createChildOutcomeUnderParent } from './edit-outcome.helpers';
import { sectionContainers } from './edit-section.locators';
import {
  WORKFLOW_VIEW_SETTINGS_MENU_ITEM_LABELS,
  workflowViewSettingsMenuItem,
  workflowViewSettingsMenuTagToggle,
  workflowViewSettingsMenuTagsSection,
  workflowViewSettingsTrigger,
} from './view-settings.locators';
import { workflowOutcomeView } from './workflow.locators';
import {
  workflowOutcomeExpandToggle,
  workflowOutcomeHeader,
} from './workflow-outcome.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Context action bar — FR-CAB-006 (workflow View settings menu).
 * Requirements: tests/docs/requirements/features/global/context_action_bar_requirements_v1.yaml
 */
test.describe('view-settings-fr-cab-006', () => {
  test.describe('trigger visibility by sub-view', () => {
    test('FR-CAB-006: View settings is hidden on Overview sub-view', async ({ page, workflow }) => {
      await navigateToWorkflowOverviewSubView(page, workflow.path);
      await expectWorkflowViewSettingsTriggerHiddenPerFrCab006(page);
    });

    test('FR-CAB-006: View settings opens menu on Workflow sub-view', async ({ page, workflow }) => {
      await navigateToWorkflowGraphSubView(page, workflow.path);
      await expectWorkflowViewSettingsTriggerOpensMenuPerFrCab006(page);
    });

    test('FR-CAB-006: View settings opens menu on Outcomes sub-view', async ({ page, workflow }) => {
      await gotoOutcomesView(page, workflow.path);
      await expect(workflowOutcomeView(page)).toBeVisible();
      await expectWorkflowViewSettingsTriggerOpensMenuPerFrCab006(page);
    });
  });

  test.describe('menu composition on Workflow sub-view', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await navigateToWorkflowGraphSubView(page, workflow.path);
    });

    test('FR-CAB-006: without tagged nodes, menu shows section expand/collapse only', async ({
      page,
    }) => {
      await expectWorkflowViewSettingsMenuCompositionOnWorkflowSubViewPerFrCab006(page, {
        tagsVisible: false,
      });
    });

    test('FR-CAB-006: with a tagged node, menu includes Tags section', async ({ page, workflow }) => {
      const tagLabel = 'E2E ViewSettings WF Tag';
      await assignProjectTagToFirstWorkflowNode(page, {
        projectPath: getProjectPath(workflow.manifest),
        workflowGraphPath: workflow.path,
        tagLabel,
      });

      await expectWorkflowViewSettingsMenuCompositionOnWorkflowSubViewPerFrCab006(page, {
        tagsVisible: true,
      });
      await openWorkflowViewSettingsMenu(page);
      await expect(workflowViewSettingsMenuTagToggle(page, tagLabel)).toBeVisible();
      await page.keyboard.press('Escape');
    });
  });

  test.describe('menu composition on Outcomes sub-view', () => {
    test('FR-CAB-006: without tagged outcomes, menu shows outcome expand/collapse only', async ({
      page,
      workflow,
    }) => {
      await gotoOutcomesView(page, workflow.path);
      await expect(workflowOutcomeView(page)).toBeVisible();
      await expectWorkflowViewSettingsMenuCompositionOnOutcomesSubViewPerFrCab006(page, {
        tagsVisible: false,
      });
    });

    test('FR-CAB-006: with a tagged outcome, menu includes Tags section', async ({
      page,
      workflow,
    }) => {
      const tagLabel = 'E2E ViewSettings OC Tag';
      const outcomeTitle = workflow.firstOutcome().title;

      await assignProjectTagToOutcome(page, {
        projectPath: getProjectPath(workflow.manifest),
        workflowGraphPath: workflow.path,
        outcomeTitle,
        tagLabel,
      });

      await expectWorkflowViewSettingsMenuCompositionOnOutcomesSubViewPerFrCab006(page, {
        tagsVisible: true,
      });
      await openWorkflowViewSettingsMenu(page);
      await expect(workflowViewSettingsMenuTagToggle(page, tagLabel)).toBeVisible();
      await page.keyboard.press('Escape');
    });
  });

  test.describe('tag filter on Outcomes sub-view', () => {
    test('FR-CAB-006: toggling a tag off hides tagged outcomes', async ({ page, workflow }) => {
      const tagLabel = 'E2E ViewSettings OC Filter Tag';
      const taggedTitle = workflow.firstOutcome().title;

      await assignProjectTagToOutcome(page, {
        projectPath: getProjectPath(workflow.manifest),
        workflowGraphPath: workflow.path,
        outcomeTitle: taggedTitle,
        tagLabel,
      });

      await expect(workflowOutcomeHeader(page, taggedTitle)).toBeVisible();
      await openWorkflowViewSettingsMenu(page);
      await workflowViewSettingsMenuTagToggle(page, tagLabel).uncheck();
      await page.keyboard.press('Escape');
      await expect(workflowOutcomeHeader(page, taggedTitle)).toHaveCount(0);

      await openWorkflowViewSettingsMenu(page);
      await workflowViewSettingsMenuTagToggle(page, tagLabel).check();
      await page.keyboard.press('Escape');
      await expect(workflowOutcomeHeader(page, taggedTitle)).toBeVisible();
    });
  });

  test.describe('tag filter on Workflow sub-view', () => {
    test('FR-CAB-006: toggling a tag off hides tagged nodes; untagged nodes remain visible', async ({
      page,
      workflow,
    }) => {
      const tagLabel = 'E2E ViewSettings Filter Tag';
      const taggedNodeUuid = await assignProjectTagToFirstWorkflowNode(page, {
        projectPath: getProjectPath(workflow.manifest),
        workflowGraphPath: workflow.path,
        tagLabel,
      });

      const untaggedNodeUuid = await secondWorkflowNodeUuid(page);
      await expectWorkflowTagFilterHidesTaggedNodeOnlyPerFrCab006(page, {
        taggedNodeUuid,
        untaggedNodeUuid,
        tagLabel,
      });
    });

    test('FR-CAB-006: tag toggle state resets to on after reload', async ({ page, workflow }) => {
      const tagLabel = 'E2E ViewSettings Session Tag';
      const taggedNodeUuid = await assignProjectTagToFirstWorkflowNode(page, {
        projectPath: getProjectPath(workflow.manifest),
        workflowGraphPath: workflow.path,
        tagLabel,
      });

      await expectWorkflowViewSettingsTagToggleResetsOnReloadPerFrCab006(page, {
        taggedNodeUuid,
        tagLabel,
      });
    });

    test('FR-CAB-006: deleted project tag is not listed in View settings', async ({
      page,
      workflow,
    }) => {
      const tagLabel = 'E2E ViewSettings Delete Tag';
      await assignProjectTagToFirstWorkflowNode(page, {
        projectPath: getProjectPath(workflow.manifest),
        workflowGraphPath: workflow.path,
        tagLabel,
      });

      await deleteProjectTagFromOverview(page, {
        projectPath: getProjectPath(workflow.manifest),
        tagLabel,
      });

      await navigateToWorkflowGraphSubView(page, workflow.path);
      await openWorkflowViewSettingsMenu(page);
      await expect(workflowViewSettingsMenuTagsSection(page)).toHaveCount(0);
      await expect(workflowViewSettingsMenuTagToggle(page, tagLabel)).toHaveCount(0);
      await page.keyboard.press('Escape');
    });
  });

  test.describe('bulk expand on Outcomes sub-view', () => {
    test('FR-CAB-006: Expand all outcomes expands collapsed outcome rows', async ({
      page,
      workflow,
    }) => {
      const parentTitle = workflow.firstOutcome().title;
      const childTitle = 'E2E ViewSettings Child Outcome';

      await gotoOutcomesView(page, workflow.path);
      await createChildOutcomeUnderParent(page, parentTitle, '1.1', childTitle);

      await expectExpandAllOutcomesMenuItemExpandsTreePerFrCab006(
        page,
        parentTitle,
        childTitle,
      );
    });

    test('FR-CAB-006: Collapse all outcomes collapses expanded outcome rows', async ({
      page,
      workflow,
    }) => {
      const parentTitle = workflow.firstOutcome().title;
      const childTitle = 'E2E ViewSettings Collapse Child';

      await gotoOutcomesView(page, workflow.path);
      await createChildOutcomeUnderParent(page, parentTitle, '1.1', childTitle);
      await expect(workflowOutcomeHeader(page, childTitle)).toBeVisible();

      await clickWorkflowViewSettingsMenuItem(
        page,
        WORKFLOW_VIEW_SETTINGS_MENU_ITEM_LABELS.collapseAllOutcomes,
      );
      await expect(workflowOutcomeHeader(page, childTitle)).toHaveCount(0);
      await expect(workflowOutcomeExpandToggle(page, parentTitle)).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });
  });

  test.describe('viewer role', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-CAB-006: viewer can open View settings on Workflow sub-view', async ({
      page,
      workflow,
    }) => {
      const viewer = workflow.contributorByRole('viewer');
      await loginAs(page, { email: viewer.email, password: viewer.password });
      await page.goto(workflow.path);
      await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });

      await expect(workflowViewSettingsTrigger(page)).toBeVisible();
      await openWorkflowViewSettingsMenu(page);
      await expect(
        workflowViewSettingsMenuItem(
          page,
          WORKFLOW_VIEW_SETTINGS_MENU_ITEM_LABELS.expandAllSections,
        ),
      ).toBeVisible();
      await page.keyboard.press('Escape');
    });
  });
});
