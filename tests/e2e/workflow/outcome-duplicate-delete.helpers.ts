import { expect, type Page } from '@playwright/test';

import { authenticatedApiRequest } from '../../helpers/api';
import {
  createOutcomeViaApi,
  reloadOutcomesView,
} from './outcome-drag.helpers';
import {
  workflowEditOutcomeForm,
  workflowEditOutcomeFormDuplicateButton,
  workflowOutcomeHeader,
} from './workflow-outcome.locators';

export const E2E_OUTCOME_TITLE = 'E2E Outcome 1';
/** Product/backend suffix today — FR-WF-EO-011 specifies `(copy)`; see graph_mutation_service.duplicate_outcome. */
export const E2E_OUTCOME_DUPLICATE = `${E2E_OUTCOME_TITLE} (duplicate)`;
export const E2E_OUTCOME_CHILD_TITLE = 'E2E Outcome Child';
export const E2E_OUTCOME_GRANDCHILD_TITLE = 'E2E Outcome Grandchild';
export const E2E_OUTCOME_CHILD_DUPLICATE_TITLE = `${E2E_OUTCOME_CHILD_TITLE} (duplicate)`;
export const E2E_OUTCOME_GRANDCHILD_DUPLICATE_TITLE = `${E2E_OUTCOME_GRANDCHILD_TITLE} (duplicate)`;
export const E2E_OUTCOME_CHILD_A_TITLE = 'E2E Outcome Child A';
export const E2E_OUTCOME_CHILD_B_TITLE = 'E2E Outcome Child B';

type WorkflowSeed = {
  graphUuid: string;
  path: string;
  firstOutcome: () => { uuid: string; title: string };
};

export async function createSidebarDuplicate(page: Page): Promise<void> {
  await workflowOutcomeHeader(page, E2E_OUTCOME_TITLE).click();
  await expect(workflowEditOutcomeForm(page)).toBeVisible();
  await workflowEditOutcomeFormDuplicateButton(page).click();
  await expect(workflowOutcomeHeader(page, E2E_OUTCOME_DUPLICATE)).toBeVisible();
}

export async function seedThreeLevelSubtreeViaApi(
  page: Page,
  workflow: WorkflowSeed,
): Promise<{ childUuid: string; grandchildUuid: string }> {
  const seedUuid = workflow.firstOutcome().uuid;
  const childUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
    title: E2E_OUTCOME_CHILD_TITLE,
    parentUuid: seedUuid,
  });
  const grandchildUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
    title: E2E_OUTCOME_GRANDCHILD_TITLE,
    parentUuid: childUuid,
  });
  await reloadOutcomesView(page, workflow.path);
  return { childUuid, grandchildUuid };
}

export async function seedTwoChildOutcomesViaApi(
  page: Page,
  workflow: WorkflowSeed,
): Promise<{ childAUuid: string; childBUuid: string }> {
  const seedUuid = workflow.firstOutcome().uuid;
  const childAUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
    title: E2E_OUTCOME_CHILD_A_TITLE,
    parentUuid: seedUuid,
  });
  const childBUuid = await createOutcomeViaApi(page, workflow.graphUuid, {
    title: E2E_OUTCOME_CHILD_B_TITLE,
    parentUuid: seedUuid,
  });
  await reloadOutcomesView(page, workflow.path);
  return { childAUuid, childBUuid };
}

export async function linkOutcomeToNodeViaApi(
  page: Page,
  nodeUuid: string,
  outcomeUuid: string,
): Promise<void> {
  const response = await authenticatedApiRequest(
    page,
    'POST',
    `/api/node/${nodeUuid}/link-outcome`,
    { data: { outcomeUuid } },
  );
  expect(response.ok(), await response.text()).toBeTruthy();
}
