import type { Locator, Page } from '@playwright/test';

/**
 * Workflow shell uiObjects — canonical_locators.yaml (workflowHeader*, workflowViewTabSelector).
 * Graph/section uiObjects live in edit-section.locators.ts (re-export workflow.ts).
 */
export {
  workflowAddTab,
  workflowEditTab,
  workflowGraphTab,
  workflowHeaderFavouriteToggle,
  workflowOutcomesTab,
  workflowOverviewTab,
  workflowSidebarToggleButton,
  workflowTitle,
  workflowViewTabSelector,
} from '../../shared/locators/workflow';

/** canonical: workflowOutcomeView */
export function workflowOutcomeView(page: Page): Locator {
  return page.locator('[data-test-id="workflow-outcomes-view"]');
}

/** canonical: workflowView */
export function workflowView(page: Page): Locator {
  return page.locator('[data-test-id="workflow-view"]');
}

export {
  workflowRightSidebar,
  workflowRightSidebarAddTab,
  workflowRightSidebarAddTabContent,
  workflowRightSidebarCommentsTab,
  workflowRightSidebarContentPanel,
  workflowRightSidebarEditTab,
  workflowRightSidebarOutcomesTab,
  workflowRightSidebarOutcomesTabContent,
  workflowRightSidebarTabStrip,
  workflowRightSidebarToggleButton,
} from '../../shared/locators/workflow';
