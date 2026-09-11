import { expect, type Page } from '@playwright/test';

import { getProjectPath } from './manifest';
import { gotoOutcomesView } from '../e2e/workflow/comments-tab.helpers';
import {
  createProjectOverviewTag,
  openFirstNodeEditForm,
  selectEditNodeTag,
} from '../e2e/workflow/edit-node.helpers';
import {
  openEditOutcomeFormForTitle,
  selectEditOutcomeTag,
} from '../e2e/workflow/edit-outcome.helpers';
import { sectionContainers } from '../e2e/workflow/edit-section.locators';
import { projectTagItemByLabel } from '../e2e/project/project.locators';
import { workflowOverviewPath } from './workflow-navigation';
import {
  workflowGraphTab,
  workflowOutcomeView,
  workflowOverviewTab,
  workflowView,
} from '../e2e/workflow/workflow.locators';
import {
  WORKFLOW_VIEW_SETTINGS_MENU_ITEM_LABELS,
  workflowViewSettingsMenu,
  workflowViewSettingsMenuItem,
  workflowViewSettingsMenuTagToggle,
  workflowViewSettingsMenuTagsSection,
  workflowViewSettingsTrigger,
} from '../e2e/workflow/view-settings.locators';
import {
  workflowOutcomeExpandToggle,
  workflowOutcomeHeader,
} from '../e2e/workflow/workflow-outcome.locators';
import { workflowNode } from '../e2e/workflow/workflow-graph.locators';

const MENU = WORKFLOW_VIEW_SETTINGS_MENU_ITEM_LABELS;

export async function openWorkflowViewSettingsMenu(page: Page): Promise<void> {
  await expect(workflowViewSettingsTrigger(page)).toBeVisible();
  await workflowViewSettingsTrigger(page).click();
  await expect(workflowViewSettingsMenu(page)).toBeVisible();
}

export async function closeWorkflowViewSettingsMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(workflowViewSettingsMenu(page)).toBeHidden();
}

/** FR-CAB-006 — trigger hidden on Overview sub-view. */
export async function expectWorkflowViewSettingsTriggerHiddenPerFrCab006(page: Page): Promise<void> {
  await expect(workflowViewSettingsTrigger(page)).toHaveCount(0);
}

/** FR-CAB-006 — trigger visible and opens menu on Workflow or Outcomes sub-view. */
export async function expectWorkflowViewSettingsTriggerOpensMenuPerFrCab006(
  page: Page,
): Promise<void> {
  await openWorkflowViewSettingsMenu(page);
  await closeWorkflowViewSettingsMenu(page);
}

/** FR-CAB-006 — Workflow sub-view menu composition. */
export async function expectWorkflowViewSettingsMenuCompositionOnWorkflowSubViewPerFrCab006(
  page: Page,
  options: { tagsVisible: boolean },
): Promise<void> {
  await openWorkflowViewSettingsMenu(page);

  await expect(
    workflowViewSettingsMenuItem(page, MENU.expandAllSections),
  ).toBeVisible();
  await expect(
    workflowViewSettingsMenuItem(page, MENU.collapseAllSections),
  ).toBeVisible();
  await expect(workflowViewSettingsMenuItem(page, MENU.expandAllOutcomes)).toHaveCount(0);
  await expect(workflowViewSettingsMenuItem(page, MENU.collapseAllOutcomes)).toHaveCount(0);
  await expect(workflowViewSettingsMenuItem(page, 'Expand all nodes')).toHaveCount(0);

  if (options.tagsVisible) {
    await expect(workflowViewSettingsMenuTagsSection(page)).toBeVisible();
  } else {
    await expect(workflowViewSettingsMenuTagsSection(page)).toHaveCount(0);
  }

  await closeWorkflowViewSettingsMenu(page);
}

/** FR-CAB-006 — Outcomes sub-view menu composition. */
export async function expectWorkflowViewSettingsMenuCompositionOnOutcomesSubViewPerFrCab006(
  page: Page,
  options: { tagsVisible: boolean },
): Promise<void> {
  await openWorkflowViewSettingsMenu(page);

  await expect(
    workflowViewSettingsMenuItem(page, MENU.expandAllOutcomes),
  ).toBeVisible();
  await expect(
    workflowViewSettingsMenuItem(page, MENU.collapseAllOutcomes),
  ).toBeVisible();
  await expect(workflowViewSettingsMenuItem(page, MENU.expandAllSections)).toHaveCount(0);
  await expect(workflowViewSettingsMenuItem(page, MENU.collapseAllSections)).toHaveCount(0);
  await expect(workflowViewSettingsMenuItem(page, 'Expand all nodes')).toHaveCount(0);

  if (options.tagsVisible) {
    await expect(workflowViewSettingsMenuTagsSection(page)).toBeVisible();
  } else {
    await expect(workflowViewSettingsMenuTagsSection(page)).toHaveCount(0);
  }

  await closeWorkflowViewSettingsMenu(page);
}

export async function clickWorkflowViewSettingsMenuItem(page: Page, label: string): Promise<void> {
  await openWorkflowViewSettingsMenu(page);
  await workflowViewSettingsMenuItem(page, label).click();
  await closeWorkflowViewSettingsMenu(page);
}

/** Create a project tag and assign it to the first workflowNode in the current workflow. */
export async function assignProjectTagToFirstWorkflowNode(
  page: Page,
  options: {
    projectPath: string;
    workflowGraphPath: string;
    tagLabel: string;
  },
): Promise<string> {
  await page.goto(options.projectPath);
  await createProjectOverviewTag(page, options.tagLabel);

  await page.goto(options.workflowGraphPath);
  await expect(sectionContainers(page).first()).toBeVisible({ timeout: 15_000 });
  const nodeUuid = await openFirstNodeEditForm(page);
  await selectEditNodeTag(page, options.tagLabel);
  await page.keyboard.press('Escape');
  return nodeUuid;
}

/** Create a project tag and assign it to a level-1 workflowOutcome. */
export async function assignProjectTagToOutcome(
  page: Page,
  options: {
    projectPath: string;
    workflowGraphPath: string;
    outcomeTitle: string;
    tagLabel: string;
  },
): Promise<void> {
  await page.goto(options.projectPath);
  await createProjectOverviewTag(page, options.tagLabel);

  await gotoOutcomesView(page, options.workflowGraphPath);
  await openEditOutcomeFormForTitle(page, options.outcomeTitle);
  await selectEditOutcomeTag(page, options.tagLabel);
  await page.keyboard.press('Escape');
}

export async function deleteProjectTagFromOverview(
  page: Page,
  options: { projectPath: string; tagLabel: string },
): Promise<void> {
  await page.goto(options.projectPath);
  const tagRow = projectTagItemByLabel(page, options.tagLabel);
  await expect(tagRow).toBeVisible({ timeout: 15_000 });
  await tagRow.locator('button').last().click();
  await expect(tagRow).toHaveCount(0);
}

/** FR-CAB-006 — toggling a tag off hides tagged nodes; untagged nodes stay visible. */
export async function expectWorkflowTagFilterHidesTaggedNodeOnlyPerFrCab006(
  page: Page,
  options: {
    taggedNodeUuid: string;
    untaggedNodeUuid: string;
    tagLabel: string;
  },
): Promise<void> {
  await expect(workflowNode(page, options.taggedNodeUuid)).toBeVisible();
  await expect(workflowNode(page, options.untaggedNodeUuid)).toBeVisible();

  await openWorkflowViewSettingsMenu(page);
  await workflowViewSettingsMenuTagToggle(page, options.tagLabel).uncheck();
  await closeWorkflowViewSettingsMenu(page);

  await expect(workflowNode(page, options.taggedNodeUuid)).toHaveCount(0);
  await expect(workflowNode(page, options.untaggedNodeUuid)).toBeVisible();

  await openWorkflowViewSettingsMenu(page);
  await workflowViewSettingsMenuTagToggle(page, options.tagLabel).check();
  await closeWorkflowViewSettingsMenu(page);

  await expect(workflowNode(page, options.taggedNodeUuid)).toBeVisible();
}

/** FR-CAB-006 — tag toggle state resets to on after reload. */
export async function expectWorkflowViewSettingsTagToggleResetsOnReloadPerFrCab006(
  page: Page,
  options: { taggedNodeUuid: string; tagLabel: string },
): Promise<void> {
  await openWorkflowViewSettingsMenu(page);
  await workflowViewSettingsMenuTagToggle(page, options.tagLabel).uncheck();
  await closeWorkflowViewSettingsMenu(page);
  await expect(workflowNode(page, options.taggedNodeUuid)).toHaveCount(0);

  await page.reload();
  await expect(workflowView(page)).toBeVisible({ timeout: 15_000 });
  await expect(workflowNode(page, options.taggedNodeUuid)).toBeVisible();

  await openWorkflowViewSettingsMenu(page);
  await expect(workflowViewSettingsMenuTagToggle(page, options.tagLabel)).toBeChecked();
  await closeWorkflowViewSettingsMenu(page);
}

/** FR-CAB-006 — Expand all outcomes expands collapsed outcome tree rows. */
export async function expectExpandAllOutcomesMenuItemExpandsTreePerFrCab006(
  page: Page,
  parentOutcomeTitle: string,
  childOutcomeTitle: string,
): Promise<void> {
  await expect(workflowOutcomeHeader(page, childOutcomeTitle)).toBeVisible();

  await workflowOutcomeExpandToggle(page, parentOutcomeTitle).click();
  await expect(workflowOutcomeHeader(page, childOutcomeTitle)).toHaveCount(0);

  await clickWorkflowViewSettingsMenuItem(
    page,
    WORKFLOW_VIEW_SETTINGS_MENU_ITEM_LABELS.expandAllOutcomes,
  );
  await expect(workflowOutcomeHeader(page, childOutcomeTitle)).toBeVisible();
}

export async function navigateToWorkflowOverviewSubView(
  page: Page,
  workflowGraphPath: string,
): Promise<void> {
  await page.goto(workflowOverviewPath(workflowGraphPath));
  await expect(workflowOverviewTab(page)).toHaveAttribute('aria-selected', 'true');
}

export async function navigateToWorkflowGraphSubView(
  page: Page,
  workflowGraphPath: string,
): Promise<void> {
  await page.goto(workflowGraphPath);
  await expect(workflowView(page)).toBeVisible({ timeout: 15_000 });
  await expect(workflowGraphTab(page)).toHaveAttribute('aria-selected', 'true');
}
