import { expect, test } from '../../fixtures';
import { loginAs } from '../../helpers/auth';
import { getNavigationLinkedWorkflows } from '../../helpers/main-navigation-workflow-context';
import { getProjectPath } from '../../helpers/manifest';
import { workflowOverviewPath } from '../../helpers/workflow-navigation';
import {
  expectActivityOverviewMetadataCompositionPerFrWfOv001,
  expectClassificationEditableWhenAutoCalculateOffPerFrWfOv006,
  expectClassificationReadOnlyWhenAutoCalculateOnPerFrWfOv006,
  expectCourseCreditsEditablePerFrWfOv005,
  expectCourseOverviewMetadataCompositionPerFrWfOv001,
  expectCoursePonderationFieldsEditablePerFrWfOv004,
  expectCreditsEditableWhenAutoCalculateOffPerFrWfOv005,
  expectCreditsReadOnlyWhenAutoCalculateOnPerFrWfOv005,
  expectPonderationEditableWhenAutoCalculateOffPerFrWfOv004,
  expectPonderationReadOnlyWhenAutoCalculateOnPerFrWfOv004,
  expectProgramOverviewMetadataCompositionPerFrWfOv001,
  expectTimeEditableWhenAutoCalculateOffPerFrWfOv003,
  expectTimeReadOnlyWhenAutoCalculateOnPerFrWfOv003,
  expectWorkflowPermissionsMatchParentProjectPerFrWfOv007,
  expectWorkflowPermissionsPanelReadOnlyPerFrWfOv007,
} from '../../helpers/workflow-overview';
import { firstWorkflowNodeUuid } from './comments-tab.helpers';
import {
  workflowEditNodeFormTimeAmountField,
  workflowEditNodeFormTimeUnitField,
  workflowNodeContent,
  workflowNodes,
} from './workflow-graph.locators';
import {
  workflowGraphTab,
  workflowOverviewTab,
  workflowRightSidebar,
  workflowTitle,
} from './workflow.locators';
import {
  workflowMetadataFieldCredits,
  workflowMetadataFieldGeneralTime,
  workflowMetadataFieldIndividualTime,
  workflowMetadataFieldPracticalTime,
  workflowMetadataFieldSpecificTime,
  workflowMetadataFieldTheoryTime,
  workflowMetadataFieldTime,
  workflowMetadataSwitchCalculateClassificationAutomatically,
  workflowMetadataSwitchCalculateCreditsAutomatically,
  workflowMetadataSwitchCalculatePonderationAutomatically,
  workflowMetadataSwitchCalculateTimeAutomatically,
  workflowOverviewView,
} from './workflow-overview.locators';

/**
 * FR calibration — workflow Overview composition (FR-WF-OV-001 … 007).
 *
 * Expects: activity via `workflow` fixture; course/program via
 * `getNavigationLinkedWorkflows()` (`just e2e-prepare` → navigation_linked_workflows).
 * Expect failures until Overview matches the FR set (app may still show leftover fields).
 */
test.describe('Workflow overview — calibration (FR-WF-OV-001-007)', () => {
  test.describe('FR-WF-OV-001 / FR-WF-OV-002: overview field composition by workflow type', () => {
    test('activity overview renders required metadata', async ({
      page,
      workflow,
    }) => {
      await page.goto(workflowOverviewPath(workflow.path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expect(workflowTitle(page)).toBeVisible();
      await expect(workflowOverviewTab(page)).toHaveAttribute('aria-selected', 'true');
      await expectActivityOverviewMetadataCompositionPerFrWfOv001(page);
    });

    test('course overview renders required metadata', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.course.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectCourseOverviewMetadataCompositionPerFrWfOv001(page);
    });

    test('program overview renders required metadata', async ({ page }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.program.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectProgramOverviewMetadataCompositionPerFrWfOv001(page);
    });

    test('Overview route does not render workflowRightSidebar', async ({ page, workflow }) => {
      await page.goto(workflowOverviewPath(workflow.path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expect(workflowRightSidebar(page)).toHaveCount(0);
    });

    test('navigate to Workflow and back preserves activity metadata composition', async ({
      page,
      workflow,
    }) => {
      await page.goto(workflowOverviewPath(workflow.path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });

      await workflowGraphTab(page).click();
      await expect(page).toHaveURL(new RegExp(`${workflow.path}/?$`));

      await workflowOverviewTab(page).click();
      await expect(page).toHaveURL(new RegExp(`${workflowOverviewPath(workflow.path)}/?$`));
      await expectActivityOverviewMetadataCompositionPerFrWfOv001(page);
    });
  });

  test.describe('FR-WF-OV-003: time auto-calculate controls', () => {
    test('when Time Auto-calculate is OFF, Time is editable', async ({ page, workflow }) => {
      await page.goto(workflowOverviewPath(workflow.path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectTimeEditableWhenAutoCalculateOffPerFrWfOv003(page);
    });

    test('when Time Auto-calculate is ON, Time is read-only', async ({ page, workflow }) => {
      await page.goto(workflowOverviewPath(workflow.path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectTimeReadOnlyWhenAutoCalculateOnPerFrWfOv003(page);
    });

    test('toggling Time Auto-calculate updates Time editability immediately', async ({
      page,
      workflow,
    }) => {
      await page.goto(workflowOverviewPath(workflow.path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });

      await expectTimeEditableWhenAutoCalculateOffPerFrWfOv003(page);
      await expectTimeReadOnlyWhenAutoCalculateOnPerFrWfOv003(page);

      await workflowMetadataSwitchCalculateTimeAutomatically(page).uncheck();
      await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).not.toBeChecked();
      await expect(workflowMetadataFieldTime(page)).toBeEnabled();
    });

    test('when Time Auto-calculate is ON, Time equals the sum of node effective times', async ({
      page,
      workflow,
    }) => {
      await page.goto(workflow.path);
      await expect(workflowNodes(page).first()).toBeVisible({ timeout: 15_000 });

      const nodeCount = await workflowNodes(page).count();
      expect(nodeCount).toBeGreaterThanOrEqual(1);

      const firstNodeUuid = await firstWorkflowNodeUuid(page);
      await workflowNodeContent(page, firstNodeUuid).click();
      await expect(workflowEditNodeFormTimeAmountField(page)).toBeVisible();
      await workflowEditNodeFormTimeAmountField(page).fill('2');
      await workflowEditNodeFormTimeUnitField(page).click();
      await page.getByRole('option', { name: /^Hour/i }).click();
      await page.waitForTimeout(500);

      let expectedHours = 2;
      if (nodeCount >= 2) {
        const secondId = await workflowNodes(page).nth(1).getAttribute('id');
        if (!secondId?.startsWith('node-')) {
          throw new Error(`Expected second node id prefix node-; got ${JSON.stringify(secondId)}`);
        }
        const secondUuid = secondId.slice('node-'.length);
        await workflowNodeContent(page, secondUuid).click();
        await expect(workflowEditNodeFormTimeAmountField(page)).toBeVisible();
        await workflowEditNodeFormTimeAmountField(page).fill('3');
        await workflowEditNodeFormTimeUnitField(page).click();
        await page.getByRole('option', { name: /^Hour/i }).click();
        await page.waitForTimeout(500);
        expectedHours = 5;
      }

      await page.goto(workflowOverviewPath(workflow.path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectTimeReadOnlyWhenAutoCalculateOnPerFrWfOv003(page);

      // FR-WF-OV-003 — calculated display is the arithmetic sum (e.g. '5 hours').
      await expect(workflowMetadataFieldTime(page)).toHaveValue(new RegExp(String(expectedHours)));
    });

    test.describe('viewer role', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('viewer cannot edit Time Auto-calculate or Time', async ({ page, workflow }) => {
        const viewer = workflow.contributorByRole('viewer');
        await loginAs(page, { email: viewer.email, password: viewer.password });
        await page.goto(workflowOverviewPath(workflow.path));
        await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });

        await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeVisible();
        await expect(workflowMetadataFieldTime(page)).toBeVisible();
        await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeDisabled();
        await expect(workflowMetadataFieldTime(page)).toBeDisabled();
      });
    });
  });

  test.describe('FR-WF-OV-004: ponderation section', () => {
    test('course: Theory, Practical, and Individual are editable', async ({ page }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.course.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectCoursePonderationFieldsEditablePerFrWfOv004(page);
    });

    test('program: when Ponderation Auto-calculate is OFF, ponderation fields are editable', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.program.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectPonderationEditableWhenAutoCalculateOffPerFrWfOv004(page);
    });

    test('program: when Ponderation Auto-calculate is ON, ponderation fields are read-only', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.program.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectPonderationReadOnlyWhenAutoCalculateOnPerFrWfOv004(page);
    });

    test('program: toggling Ponderation Auto-calculate updates field editability immediately', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.program.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });

      await expectPonderationEditableWhenAutoCalculateOffPerFrWfOv004(page);
      await expectPonderationReadOnlyWhenAutoCalculateOnPerFrWfOv004(page);

      await workflowMetadataSwitchCalculatePonderationAutomatically(page).uncheck();
      await expect(workflowMetadataSwitchCalculatePonderationAutomatically(page)).not.toBeChecked();
      await expect(workflowMetadataFieldTheoryTime(page)).toBeEnabled();
      await expect(workflowMetadataFieldPracticalTime(page)).toBeEnabled();
      await expect(workflowMetadataFieldIndividualTime(page)).toBeEnabled();
    });

    test.describe('viewer role', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('viewer cannot edit Ponderation Auto-calculate or ponderation fields', async ({
        page,
        workflow,
      }) => {
        const viewer = workflow.contributorByRole('viewer');
        await loginAs(page, { email: viewer.email, password: viewer.password });

        const linked = getNavigationLinkedWorkflows();
        await page.goto(workflowOverviewPath(linked.program.workflow_path));
        await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });

        await expect(workflowMetadataSwitchCalculatePonderationAutomatically(page)).toBeVisible();
        await expect(workflowMetadataFieldTheoryTime(page)).toBeVisible();
        await expect(workflowMetadataFieldPracticalTime(page)).toBeVisible();
        await expect(workflowMetadataFieldIndividualTime(page)).toBeVisible();
        await expect(workflowMetadataSwitchCalculatePonderationAutomatically(page)).toBeDisabled();
        await expect(workflowMetadataFieldTheoryTime(page)).toBeDisabled();
        await expect(workflowMetadataFieldPracticalTime(page)).toBeDisabled();
        await expect(workflowMetadataFieldIndividualTime(page)).toBeDisabled();
      });
    });
  });

  test.describe('FR-WF-OV-005: credits', () => {
    test('course: Credits is editable', async ({ page }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.course.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectCourseCreditsEditablePerFrWfOv005(page);
    });

    test('program: when Credits Auto-calculate is OFF, Credits is editable', async ({ page }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.program.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectCreditsEditableWhenAutoCalculateOffPerFrWfOv005(page);
    });

    test('program: when Credits Auto-calculate is ON, Credits is read-only', async ({ page }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.program.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectCreditsReadOnlyWhenAutoCalculateOnPerFrWfOv005(page);
    });

    test('program: toggling Credits Auto-calculate updates Credits editability immediately', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.program.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });

      await expectCreditsEditableWhenAutoCalculateOffPerFrWfOv005(page);
      await expectCreditsReadOnlyWhenAutoCalculateOnPerFrWfOv005(page);

      await workflowMetadataSwitchCalculateCreditsAutomatically(page).uncheck();
      await expect(workflowMetadataSwitchCalculateCreditsAutomatically(page)).not.toBeChecked();
      await expect(workflowMetadataFieldCredits(page)).toBeEnabled();
    });

    test.describe('viewer role', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('viewer cannot edit Credits Auto-calculate or Credits', async ({ page, workflow }) => {
        const viewer = workflow.contributorByRole('viewer');
        await loginAs(page, { email: viewer.email, password: viewer.password });

        const linked = getNavigationLinkedWorkflows();
        await page.goto(workflowOverviewPath(linked.program.workflow_path));
        await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });

        await expect(workflowMetadataSwitchCalculateCreditsAutomatically(page)).toBeVisible();
        await expect(workflowMetadataFieldCredits(page)).toBeVisible();
        await expect(workflowMetadataSwitchCalculateCreditsAutomatically(page)).toBeDisabled();
        await expect(workflowMetadataFieldCredits(page)).toBeDisabled();
      });
    });
  });

  test.describe('FR-WF-OV-006: classification', () => {
    test('program: when Classification Auto-calculate is OFF, General and Specific are editable', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.program.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectClassificationEditableWhenAutoCalculateOffPerFrWfOv006(page);
    });

    test('program: when Classification Auto-calculate is ON, General and Specific are read-only', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.program.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectClassificationReadOnlyWhenAutoCalculateOnPerFrWfOv006(page);
    });

    test('program: toggling Classification Auto-calculate updates field editability immediately', async ({
      page,
    }) => {
      const linked = getNavigationLinkedWorkflows();
      await page.goto(workflowOverviewPath(linked.program.workflow_path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });

      await expectClassificationEditableWhenAutoCalculateOffPerFrWfOv006(page);
      await expectClassificationReadOnlyWhenAutoCalculateOnPerFrWfOv006(page);

      await workflowMetadataSwitchCalculateClassificationAutomatically(page).uncheck();
      await expect(
        workflowMetadataSwitchCalculateClassificationAutomatically(page),
      ).not.toBeChecked();
      await expect(workflowMetadataFieldGeneralTime(page)).toBeEnabled();
      await expect(workflowMetadataFieldSpecificTime(page)).toBeEnabled();
    });

    test.describe('viewer role', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('viewer cannot edit Classification Auto-calculate, General, or Specific', async ({
        page,
        workflow,
      }) => {
        const viewer = workflow.contributorByRole('viewer');
        await loginAs(page, { email: viewer.email, password: viewer.password });

        const linked = getNavigationLinkedWorkflows();
        await page.goto(workflowOverviewPath(linked.program.workflow_path));
        await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });

        await expect(workflowMetadataSwitchCalculateClassificationAutomatically(page)).toBeVisible();
        await expect(workflowMetadataFieldGeneralTime(page)).toBeVisible();
        await expect(workflowMetadataFieldSpecificTime(page)).toBeVisible();
        await expect(
          workflowMetadataSwitchCalculateClassificationAutomatically(page),
        ).toBeDisabled();
        await expect(workflowMetadataFieldGeneralTime(page)).toBeDisabled();
        await expect(workflowMetadataFieldSpecificTime(page)).toBeDisabled();
      });
    });
  });

  test.describe('FR-WF-OV-007: permissions panel', () => {
    test('permissions panel is read-only — cannot add, remove, or change roles', async ({
      page,
      workflow,
    }) => {
      const contributorEmails = (workflow.manifest.contributors ?? []).map((c) => c.email);
      await page.goto(workflowOverviewPath(workflow.path));
      await expect(workflowOverviewView(page)).toBeVisible({ timeout: 15_000 });
      await expectWorkflowPermissionsPanelReadOnlyPerFrWfOv007(page, contributorEmails);
    });

    test('permissions panel listed users and roles match the parent project', async ({
      page,
      workflow,
    }) => {
      const contributorEmails = (workflow.manifest.contributors ?? []).map((c) => c.email);
      await expectWorkflowPermissionsMatchParentProjectPerFrWfOv007(page, {
        projectPath: getProjectPath(workflow.manifest),
        workflowOverviewUrl: workflowOverviewPath(workflow.path),
        contributorEmails,
      });
    });
  });
});
