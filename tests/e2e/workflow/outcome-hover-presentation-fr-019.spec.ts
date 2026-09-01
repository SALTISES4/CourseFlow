import type { Locator } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { gotoOutcomesView } from './comments-tab.helpers';
import { loginAsWorkflowContributor } from './role.helpers';
import { workflowOutcomeHeader, workflowOutcomeHeaderDragHandle } from './workflow-outcome.locators';

test.use({
  seedAsset: 'workflow.standard_activity',
  seedDependencies: ['project.primary', 'actor.viewer'],
  actorAsset: 'actor.teacher',
  seedAccess: 'disposable-copy',
});

/**
 * Outcome header hover presentation permission gating — FR-WF-EO-019.
 * Requirements: workflow_edit_outcome_requirements_v1.yaml
 */

type OutcomeHeaderPresentation = {
  boxShadow: string;
  cursor: string;
};

async function outcomeHeaderPresentation(header: Locator): Promise<OutcomeHeaderPresentation> {
  return header.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      boxShadow: style.boxShadow,
      cursor: style.cursor,
    };
  });
}

test.describe('Outcome header hover presentation (FR-WF-EO-019)', () => {
  test('FR-WF-EO-019: owner retains outcome edit hover border and cursor', async ({ page, workflow }) => {
    await gotoOutcomesView(page, workflow.path);
    const header = workflowOutcomeHeaderDragHandle(page, workflow.firstOutcome().title);
    await expect(header).toBeVisible();

    await header.hover();
    const hoveredPresentation = await outcomeHeaderPresentation(header);

    expect(hoveredPresentation.boxShadow).not.toBe('none');
    expect(hoveredPresentation.cursor).toBe('grab');
  });

  test.describe('viewer', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('FR-WF-EO-019: viewer hover does not add a border or change the cursor', async ({ page, workflow }) => {
      await loginAsWorkflowContributor(page, workflow, 'viewer');
      await gotoOutcomesView(page, workflow.path);
      await expect(workflowOutcomeHeader(page, workflow.firstOutcome().title)).toBeVisible();

      const header = workflowOutcomeHeaderDragHandle(page, workflow.firstOutcome().title);
      await page.mouse.move(0, 0);
      const restingPresentation = await outcomeHeaderPresentation(header);

      await header.hover();

      expect(await outcomeHeaderPresentation(header)).toEqual(restingPresentation);
    });
  });
});
