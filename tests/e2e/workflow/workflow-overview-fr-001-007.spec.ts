import { expect, test } from '../../fixtures';
import { loginAs } from '../../helpers/auth';
import { getNavigationLinkedWorkflows } from '../../helpers/main-navigation-workflow-context';
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
  expectOverviewDurationFieldDisplaysHours,
  expectPonderationEditableWhenAutoCalculateOffPerFrWfOv004,
  expectPonderationReadOnlyWhenAutoCalculateOnPerFrWfOv004,
  expectProgramOverviewMetadataCompositionPerFrWfOv001,
  expectTimeEditableWhenAutoCalculateOffPerFrWfOv003,
  expectTimeReadOnlyWhenAutoCalculateOnPerFrWfOv003,
  expectWorkflowPermissionsMatchParentProjectPerFrWfOv007,
  expectWorkflowPermissionsPanelReadOnlyPerFrWfOv007,
} from '../../helpers/workflow-overview';
import { getProjectPath } from '../../helpers/manifest';
import { workflowRightSidebar } from '../../shared/locators/workflow';
import { firstWorkflowNodeUuid } from './comments-tab.helpers';
import { expectWorkflowEditNodeFormTimeField } from './edit-node.helpers';
import {
  workflowEditNodeFormTimeField,
  workflowNodeTitle,
  workflowNodes,
} from './workflow-graph.locators';
import {
  workflowGraphTab,
  workflowOverviewTab,
  workflowTitle,
} from './workflow.locators';
import { openWorkflowOverview, setWorkflowOverviewSwitch } from './workflow-overview.helpers';
import {
  workflowMetadataDisciplinesBlock,
  workflowMetadataFieldCode,
  workflowMetadataFieldCreatedOn,
  workflowMetadataFieldCredits,
  workflowMetadataFieldDescription,
  workflowMetadataFieldGeneralTime,
  workflowMetadataFieldIndividualTime,
  workflowMetadataFieldPracticalTime,
  workflowMetadataFieldSpecificTime,
  workflowMetadataFieldTheoryTime,
  workflowMetadataFieldTime,
  workflowMetadataPermissionsPanel,
  workflowMetadataSection,
  workflowMetadataSwitchCalculateClassificationAutomatically,
  workflowMetadataSwitchCalculateCreditsAutomatically,
  workflowMetadataSwitchCalculatePonderationAutomatically,
  workflowMetadataSwitchCalculateTimeAutomatically,
  workflowOverviewView,
} from './workflow-overview.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedAssets: ['workflow.navigation_course', 'workflow.navigation_program'],
  seedDependencies: ['project.primary', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Workflow Overview — FR-WF-OV-001 through FR-WF-OV-007.
 * Requirements: workflow_overview_requirements_v1.yaml
 *
 * Activity, course, and program routes come from the isolated workflow manifest.
 *
 * Overview and permissions assertions use the disposable workflow and its real
 * parent-project team; no API routes are mocked in this suite.
 */
test.describe('workflow-overview-fr-001-007', () => {
  test.describe('view shell (FR-WF-OV-001)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await openWorkflowOverview(page, workflow.path);
    });

    test('FR-WF-OV-001: Overview route renders workflowOverviewView with metadata blocks', async ({
      page,
    }) => {
      await expect(workflowTitle(page)).toBeVisible();
      await expect(workflowOverviewTab(page)).toHaveAttribute('aria-selected', 'true');
      await expect(workflowMetadataDisciplinesBlock(page)).toBeVisible();
      await expect(workflowMetadataFieldCreatedOn(page)).toBeVisible();
    });

    test('FR-WF-OV-001: activity workflow renders its required fields only', async ({ page }) => {
      await expect(workflowMetadataSection(page)).toBeVisible();
      await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeVisible();
      await expect(workflowMetadataFieldTime(page)).toBeVisible();
      await expect(workflowMetadataPermissionsPanel(page)).toBeVisible();
      await expect(workflowMetadataFieldCode(page)).toHaveCount(0);
      await expect(workflowMetadataSwitchCalculatePonderationAutomatically(page)).toHaveCount(0);
      await expect(workflowMetadataFieldTheoryTime(page)).toHaveCount(0);
      await expect(workflowMetadataFieldPracticalTime(page)).toHaveCount(0);
      await expect(workflowMetadataFieldIndividualTime(page)).toHaveCount(0);
      await expect(workflowMetadataFieldCredits(page)).toHaveCount(0);
      await expect(workflowMetadataSwitchCalculateCreditsAutomatically(page)).toHaveCount(0);
      await expect(workflowMetadataSwitchCalculateClassificationAutomatically(page)).toHaveCount(0);
      await expect(workflowMetadataFieldGeneralTime(page)).toHaveCount(0);
      await expect(workflowMetadataFieldSpecificTime(page)).toHaveCount(0);
    });

    test('FR-WF-OV-001: Overview route does not render workflowRightSidebar', async ({ page }) => {
      await expect(workflowRightSidebar(page)).toHaveCount(0);
    });

    test('FR-WF-OV-001: navigate to Workflow and back preserves overview metadata blocks', async ({
      page,
      workflow,
    }) => {
      await workflowGraphTab(page).click();
      await expect(page).toHaveURL(new RegExp(`${workflow.path}/?$`));

      await workflowOverviewTab(page).click();
      await expect(page).toHaveURL(new RegExp(`${workflowOverviewPath(workflow.path)}/?$`));
      await expect(workflowMetadataDisciplinesBlock(page)).toBeVisible();
      await expect(workflowMetadataFieldCreatedOn(page)).toBeVisible();
    });

    test('FR-WF-OV-001: course workflow renders course fields without program-only switches', async ({
      page,
      workflow,
    }) => {
      const course = workflow.workflowByType('course');
      await openWorkflowOverview(page, course.workflow_path);

      await expect(workflowMetadataFieldCode(page)).toBeVisible();
      await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeVisible();
      await expect(workflowMetadataFieldTheoryTime(page)).toBeVisible();
      await expect(workflowMetadataFieldPracticalTime(page)).toBeVisible();
      await expect(workflowMetadataFieldIndividualTime(page)).toBeVisible();
      await expect(workflowMetadataFieldCredits(page)).toBeVisible();
      await expect(workflowMetadataSwitchCalculatePonderationAutomatically(page)).toHaveCount(0);
      await expect(workflowMetadataSwitchCalculateCreditsAutomatically(page)).toHaveCount(0);
      await expect(workflowMetadataSwitchCalculateClassificationAutomatically(page)).toHaveCount(0);
    });
  });

  test.describe('description metadata (FR-WF-OV-002)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await openWorkflowOverview(page, workflow.path);
    });

    test('FR-WF-OV-002: disciplines block shows label and value or empty copy', async ({ page }) => {
      const block = workflowMetadataDisciplinesBlock(page);
      await expect(block).toBeVisible();
      const text = await block.innerText();
      expect(text).toMatch(/Disciplines/);
      expect(text.length).toBeGreaterThan('Disciplines'.length);
    });

    test('FR-WF-OV-002: workflowMetadataFieldDescription is read-only when rendered', async ({
      page,
    }) => {
      await expect(workflowMetadataFieldDescription(page)).toBeVisible();
      await expect(workflowMetadataFieldDescription(page)).not.toHaveText(/^Description$/);
      const descriptionInput = workflowOverviewView(page).getByRole('textbox', {
        name: 'Description',
      });
      await expect(descriptionInput).toHaveCount(0);
    });
  });

  test.describe('time auto-calculation (FR-WF-OV-003)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      await openWorkflowOverview(page, workflow.path);
    });

    test('FR-WF-OV-003: activity workflow exposes an editable Time field when auto-calculate is OFF', async ({
      page,
    }) => {
      const automaticSwitch = workflowMetadataSwitchCalculateTimeAutomatically(page);
      await setWorkflowOverviewSwitch(page, automaticSwitch, false);

      await expect(automaticSwitch).toBeEnabled();
      await expect(workflowMetadataFieldTime(page)).toBeEnabled();
      // FR-WF-OV-003 — duration-type display (e.g. '0 hours'), not a bare number.
      await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldTime(page));
    });

    test('FR-WF-OV-003: auto-calculate ON makes Time read-only and the switch persists', async ({
      page,
      workflow,
    }) => {
      const automaticSwitch = workflowMetadataSwitchCalculateTimeAutomatically(page);
      try {
        await setWorkflowOverviewSwitch(page, automaticSwitch, true);
        await expect(workflowMetadataFieldTime(page)).toBeDisabled();
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldTime(page));

        await workflowGraphTab(page).click();
        await expect(page).toHaveURL(new RegExp(`${workflow.path}/?$`));
        await workflowOverviewTab(page).click();
        await expect(workflowOverviewView(page)).toBeVisible();
        await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeChecked();
        await expect(workflowMetadataFieldTime(page)).toBeDisabled();
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldTime(page));
      } finally {
        const restoredSwitch = workflowMetadataSwitchCalculateTimeAutomatically(page);
        await setWorkflowOverviewSwitch(page, restoredSwitch, false);
      }
    });
  });

  test.describe('course/program metadata (FR-WF-OV-004-007)', () => {
    test.beforeEach(async ({ page, workflow }) => {
      const program = workflow.workflowByType('program');
      await openWorkflowOverview(page, program.workflow_path);
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
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldTheoryTime(page));
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldPracticalTime(page));
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldIndividualTime(page));

        await setWorkflowOverviewSwitch(page, automaticSwitch, true);
        await expect(workflowMetadataFieldTheoryTime(page)).toBeDisabled();
        await expect(workflowMetadataFieldPracticalTime(page)).toBeDisabled();
        await expect(workflowMetadataFieldIndividualTime(page)).toBeDisabled();
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldTheoryTime(page));
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldPracticalTime(page));
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldIndividualTime(page));
      } finally {
        await setWorkflowOverviewSwitch(page, automaticSwitch, false);
      }
    });

    test('FR-WF-OV-005: program credits switch controls the whole-number field', async ({
      page,
    }) => {
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
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldGeneralTime(page));
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldSpecificTime(page));

        await setWorkflowOverviewSwitch(page, automaticSwitch, true);
        await expect(workflowMetadataFieldGeneralTime(page)).toBeDisabled();
        await expect(workflowMetadataFieldSpecificTime(page)).toBeDisabled();
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldGeneralTime(page));
        await expectOverviewDurationFieldDisplaysHours(workflowMetadataFieldSpecificTime(page));
      } finally {
        await setWorkflowOverviewSwitch(page, automaticSwitch, false);
      }
    });

    test('FR-WF-OV-007: permissions panel is visible and read-only', async ({
      page,
      workflow,
    }) => {
      const viewer = workflow.contributorByRole('viewer');
      const panel = workflowMetadataPermissionsPanel(page);
      await expect(panel).toBeVisible();
      await expect(panel.getByText('Permissions', { exact: true })).toBeVisible();
      await expectWorkflowPermissionsPanelReadOnlyPerFrWfOv007(page, [viewer.email]);
    });
  });

  test.describe('calibration', () => {
    test.describe('FR-WF-OV-001 / FR-WF-OV-002: overview field composition by workflow type', () => {
      test('activity overview renders required metadata', async ({ page, workflow }) => {
        await openWorkflowOverview(page, workflow.path);
        await expect(workflowTitle(page)).toBeVisible();
        await expect(workflowOverviewTab(page)).toHaveAttribute('aria-selected', 'true');
        await expectActivityOverviewMetadataCompositionPerFrWfOv001(page);
      });

      test('course overview renders required metadata', async ({ page, workflow }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.course.workflow_path);
        await expectCourseOverviewMetadataCompositionPerFrWfOv001(page);
      });

      test('program overview renders required metadata', async ({ page, workflow }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.program.workflow_path);
        await expectProgramOverviewMetadataCompositionPerFrWfOv001(page);
      });

      test('Overview route does not render workflowRightSidebar', async ({ page, workflow }) => {
        await openWorkflowOverview(page, workflow.path);
        await expect(workflowRightSidebar(page)).toHaveCount(0);
      });

      test('navigate to Workflow and back preserves activity metadata composition', async ({
        page,
        workflow,
      }) => {
        await openWorkflowOverview(page, workflow.path);

        await workflowGraphTab(page).click();
        await expect(page).toHaveURL(new RegExp(`${workflow.path}/?$`));

        await workflowOverviewTab(page).click();
        await expect(page).toHaveURL(new RegExp(`${workflowOverviewPath(workflow.path)}/?$`));
        await expectActivityOverviewMetadataCompositionPerFrWfOv001(page);
      });
    });

    test.describe('FR-WF-OV-003: time auto-calculate controls', () => {
      test('when Time Auto-calculate is OFF, Time is editable', async ({ page, workflow }) => {
        await openWorkflowOverview(page, workflow.path);
        await expectTimeEditableWhenAutoCalculateOffPerFrWfOv003(page);
      });

      test('when Time Auto-calculate is ON, Time is read-only', async ({ page, workflow }) => {
        await openWorkflowOverview(page, workflow.path);
        await expectTimeReadOnlyWhenAutoCalculateOnPerFrWfOv003(page);
      });

      test('toggling Time Auto-calculate updates Time editability immediately', async ({
        page,
        workflow,
      }) => {
        await openWorkflowOverview(page, workflow.path);

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

        // FR-WF-OV-003 / FR-WF-EN-002 — node effective time is workflowEditNodeFormTimeField
        // (single duration labeled Time), not legacy Amount + Unit type.
        const firstNodeUuid = await firstWorkflowNodeUuid(page);
        await workflowNodeTitle(page, firstNodeUuid).click();
        await expectWorkflowEditNodeFormTimeField(page);

        const nodeMetaSaved = page.waitForResponse(
          (response) =>
            response.request().method() === 'PATCH' &&
            /\/api\/node\/[^/]+\/meta\/?$/.test(new URL(response.url()).pathname),
          { timeout: 15_000 },
        );
        await workflowEditNodeFormTimeField(page).fill('2 hours');
        await nodeMetaSaved;

        const nodeCount = await workflowNodes(page).count();
        let expectedHours = 2;
        if (nodeCount >= 2) {
          const secondId = await workflowNodes(page).nth(1).getAttribute('id');
          if (!secondId?.startsWith('node-')) {
            throw new Error(`Expected second node id prefix node-; got ${JSON.stringify(secondId)}`);
          }
          const secondUuid = secondId.slice('node-'.length);
          await workflowNodeTitle(page, secondUuid).click();
          await expectWorkflowEditNodeFormTimeField(page);
          const secondSaved = page.waitForResponse(
            (response) =>
              response.request().method() === 'PATCH' &&
              /\/api\/node\/[^/]+\/meta\/?$/.test(new URL(response.url()).pathname),
            { timeout: 15_000 },
          );
          await workflowEditNodeFormTimeField(page).fill('3 hours');
          await secondSaved;
          expectedHours = 5;
        }

        await openWorkflowOverview(page, workflow.path);
        await expectTimeReadOnlyWhenAutoCalculateOnPerFrWfOv003(page);

        // FR-WF-OV-003 AC — with N1=2h and N2=3h (when present), Time displays '5 hours'.
        // Requires FR duration-type node Time fields; legacy Amount/Unit must not be used.
        await expectOverviewDurationFieldDisplaysHours(
          workflowMetadataFieldTime(page),
          expectedHours,
        );
      });

      test.describe('viewer role', () => {
        test.use({ storageState: { cookies: [], origins: [] } });

        test('viewer cannot edit Time Auto-calculate or Time', async ({ page, workflow }) => {
          const viewer = workflow.contributorByRole('viewer');
          await loginAs(page, { email: viewer.email, password: viewer.password });
          await openWorkflowOverview(page, workflow.path);

          await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeVisible();
          await expect(workflowMetadataFieldTime(page)).toBeVisible();
          await expect(workflowMetadataSwitchCalculateTimeAutomatically(page)).toBeDisabled();
          await expect(workflowMetadataFieldTime(page)).toBeDisabled();
        });
      });
    });

    test.describe('FR-WF-OV-004: ponderation section', () => {
      test('course: Theory, Practical, and Individual are editable', async ({ page, workflow }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.course.workflow_path);
        await expectCoursePonderationFieldsEditablePerFrWfOv004(page);
      });

      test('program: when Ponderation Auto-calculate is OFF, ponderation fields are editable', async ({
        page,
        workflow,
      }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.program.workflow_path);
        await expectPonderationEditableWhenAutoCalculateOffPerFrWfOv004(page);
      });

      test('program: when Ponderation Auto-calculate is ON, ponderation fields are read-only', async ({
        page,
        workflow,
      }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.program.workflow_path);
        await expectPonderationReadOnlyWhenAutoCalculateOnPerFrWfOv004(page);
      });

      test('program: toggling Ponderation Auto-calculate updates field editability immediately', async ({
        page,
        workflow,
      }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.program.workflow_path);

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

          const linked = getNavigationLinkedWorkflows(workflow.manifest);
          await openWorkflowOverview(page, linked.program.workflow_path);

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
      test('course: Credits is editable', async ({ page, workflow }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.course.workflow_path);
        await expectCourseCreditsEditablePerFrWfOv005(page);
      });

      test('program: when Credits Auto-calculate is OFF, Credits is editable', async ({ page, workflow }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.program.workflow_path);
        await expectCreditsEditableWhenAutoCalculateOffPerFrWfOv005(page);
      });

      test('program: when Credits Auto-calculate is ON, Credits is read-only', async ({ page, workflow }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.program.workflow_path);
        await expectCreditsReadOnlyWhenAutoCalculateOnPerFrWfOv005(page);
      });

      test('program: toggling Credits Auto-calculate updates Credits editability immediately', async ({
        page,
        workflow,
      }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.program.workflow_path);

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

          const linked = getNavigationLinkedWorkflows(workflow.manifest);
          await openWorkflowOverview(page, linked.program.workflow_path);

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
        workflow,
      }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.program.workflow_path);
        await expectClassificationEditableWhenAutoCalculateOffPerFrWfOv006(page);
      });

      test('program: when Classification Auto-calculate is ON, General and Specific are read-only', async ({
        page,
        workflow,
      }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.program.workflow_path);
        await expectClassificationReadOnlyWhenAutoCalculateOnPerFrWfOv006(page);
      });

      test('program: toggling Classification Auto-calculate updates field editability immediately', async ({
        page,
        workflow,
      }) => {
        const linked = getNavigationLinkedWorkflows(workflow.manifest);
        await openWorkflowOverview(page, linked.program.workflow_path);

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

          const linked = getNavigationLinkedWorkflows(workflow.manifest);
          await openWorkflowOverview(page, linked.program.workflow_path);

          await expect(
            workflowMetadataSwitchCalculateClassificationAutomatically(page),
          ).toBeVisible();
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
      test('permissions panel is visible and read-only', async ({
        page,
        workflow,
      }) => {
        await openWorkflowOverview(page, workflow.path);
        const viewer = workflow.contributorByRole('viewer');
        await expectWorkflowPermissionsPanelReadOnlyPerFrWfOv007(page, [viewer.email]);
      });

      test('permissions panel listed users and roles match the parent project', async ({
        page,
        workflow,
      }) => {
        const viewer = workflow.contributorByRole('viewer');
        await expectWorkflowPermissionsMatchParentProjectPerFrWfOv007(page, {
          projectPath: getProjectPath(workflow.manifest),
          workflowOverviewUrl: workflowOverviewPath(workflow.path),
          contributorEmails: [viewer.email],
        });
      });
    });
  });
});
