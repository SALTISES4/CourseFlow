import { expect, test, type Page } from '../../fixtures';

import { loginAs } from '../../helpers/auth';
import {
  getNavigationLinkedWorkflows,
  type NavigationLinkedWorkflowEntry,
} from '../../helpers/main-navigation-workflow-context';
import { loadWorkflowManifest } from '../../helpers/manifest';
import {
  expectWorkflowOverflowMenuActionabilityForNonOwnerPerFrCab005,
  expectWorkflowOverflowMenuActionabilityForOwnerPerFrCab005,
  expectWorkflowOverflowMenuCompositionPerFrCab005,
} from '../../helpers/workflow-overflow';
import {
  navigateToWorkflowGraphSubView,
  navigateToWorkflowOverviewSubView,
} from '../../helpers/view-settings';
import { gotoOutcomesView } from './comments-tab.helpers';
import { workflowOverflowTrigger } from './workflow-overflow.locators';
import { workflowOutcomeView } from './workflow.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.editor', 'actor.commenter', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Context action bar — FR-CAB-005 (workflow overflow menu).
 * Requirements: tests/docs/requirements/features/global/context_action_bar_requirements_v1.yaml
 */

const manifest = loadWorkflowManifest();
const navigationLinkedWorkflows = getNavigationLinkedWorkflows(manifest);

const OVERFLOW_WORKFLOW_TYPE_KEYS = ['activity', 'course', 'program'] as const;
type OverflowWorkflowTypeKey = (typeof OVERFLOW_WORKFLOW_TYPE_KEYS)[number];

function overflowWorkflowSource(key: OverflowWorkflowTypeKey): NavigationLinkedWorkflowEntry {
  return navigationLinkedWorkflows[key];
}

async function gotoWorkflowRoute(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(workflowOverflowTrigger(page)).toBeVisible({ timeout: 15_000 });
}

test.describe('workflow-overflow-fr-cab-005', () => {
  test.describe('menu composition', () => {
    for (const typeKey of OVERFLOW_WORKFLOW_TYPE_KEYS) {
      test(`FR-CAB-005 (${typeKey}): overflow shows Copy then Archive in top-to-bottom order`, async ({
        page,
      }) => {
        const source = overflowWorkflowSource(typeKey);
        await gotoWorkflowRoute(page, source.workflow_path);
        await expectWorkflowOverflowMenuCompositionPerFrCab005(page, source.workflow_type);
      });
    }

    test('FR-CAB-005: overflow menu is available on Overview sub-view', async ({
      page,
      workflow,
    }) => {
      await navigateToWorkflowOverviewSubView(page, workflow.path);
      await expectWorkflowOverflowMenuCompositionPerFrCab005(page, workflow.workflowType);
    });

    test('FR-CAB-005: overflow menu is available on Workflow sub-view', async ({
      page,
      workflow,
    }) => {
      await navigateToWorkflowGraphSubView(page, workflow.path);
      await expectWorkflowOverflowMenuCompositionPerFrCab005(page, workflow.workflowType);
    });

    test('FR-CAB-005: overflow menu is available on Outcomes sub-view', async ({
      page,
      workflow,
    }) => {
      await gotoOutcomesView(page, workflow.path);
      await expect(workflowOutcomeView(page)).toBeVisible();
      await expectWorkflowOverflowMenuCompositionPerFrCab005(page, workflow.workflowType);
    });
  });

  test.describe('owner role', () => {
    test('FR-CAB-005: owner can use Copy and Archive overflow rows', async ({ page, workflow }) => {
      await navigateToWorkflowGraphSubView(page, workflow.path);
      await expectWorkflowOverflowMenuActionabilityForOwnerPerFrCab005(page, workflow.workflowType);
    });
  });

  test.describe('non-owner roles', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    for (const role of ['editor', 'viewer', 'commenter'] as const) {
      test(`FR-CAB-005 (${role}): Copy is available and Archive is read-only`, async ({
        page,
        workflow,
      }) => {
        const account = workflow.contributorByRole(role);
        await loginAs(page, { email: account.email, password: account.password });
        await navigateToWorkflowGraphSubView(page, workflow.path);
        await expectWorkflowOverflowMenuActionabilityForNonOwnerPerFrCab005(
          page,
          workflow.workflowType,
        );
      });
    }
  });
});
