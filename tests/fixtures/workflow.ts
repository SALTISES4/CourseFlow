import { test as baseTest } from '@playwright/test';
import {
  contributorByRole,
  getPrimaryWorkflow,
  getWorkflowByType,
  loadWorkflowManifest,
  orderedSections,
  type ContributorEntry,
  type OutcomeEntry,
  type SectionEntry,
  type WorkflowManifest,
  type WorkflowEntry,
  type WorkflowFixtureType,
} from '../helpers/manifest';

export type { OutcomeEntry };

export type WorkflowHandle = {
  manifest: WorkflowManifest;
  path: string;
  graphUuid: string;
  sections: SectionEntry[];
  outcomes: OutcomeEntry[];
  sectionByPosition: (position: number) => SectionEntry;
  sectionByTitle: (title: string) => SectionEntry;
  outcomeByTitle: (title: string) => OutcomeEntry;
  firstOutcome: () => OutcomeEntry;
  blankSection: () => SectionEntry;
  firstSection: () => SectionEntry;
  contributorByRole: (role: string) => ContributorEntry;
  workflowByType: (workflowType: WorkflowFixtureType) => WorkflowEntry;
};

function buildWorkflowHandle(manifest: WorkflowManifest): WorkflowHandle {
  const entry = getPrimaryWorkflow(manifest);
  const sections = orderedSections(entry);
  const outcomes = entry.outcomes ?? [];

  return {
    manifest,
    path: entry.workflow_path,
    graphUuid: entry.graph_uuid,
    sections,
    outcomes,
    sectionByPosition(position: number) {
      const section = sections.find((item) => item.position === position);
      if (!section) {
        throw new Error(
          `No section at position ${position}. Manifest positions: ${sections.map((s) => s.position).join(', ')}`,
        );
      }
      return section;
    },
    sectionByTitle(title: string) {
      const section = sections.find((item) => item.title === title);
      if (!section) {
        throw new Error(
          `No section with title ${JSON.stringify(title)}. Manifest titles: ${sections.map((s) => JSON.stringify(s.title)).join(', ')}`,
        );
      }
      return section;
    },
    outcomeByTitle(title: string) {
      const outcome = outcomes.find((item) => item.title === title);
      if (!outcome) {
        throw new Error(
          `No outcome with title ${JSON.stringify(title)}. Manifest titles: ${outcomes.map((o) => JSON.stringify(o.title)).join(', ')}`,
        );
      }
      return outcome;
    },
    firstOutcome() {
      const outcome = outcomes[0];
      if (!outcome) {
        throw new Error('E2E workflow manifest has no outcomes.');
      }
      return outcome;
    },
    blankSection() {
      const section = sections.find((item) => item.title === '');
      if (!section) {
        throw new Error('No blank-title section in E2E workflow manifest.');
      }
      return section;
    },
    firstSection() {
      const section = sections[0];
      if (!section) {
        throw new Error('E2E workflow manifest has no sections.');
      }
      return section;
    },
    contributorByRole(role: string) {
      return contributorByRole(manifest, role);
    },
    workflowByType(workflowType: WorkflowFixtureType) {
      return getWorkflowByType(manifest, workflowType);
    },
  };
}

type WorkflowFixtures = {
  workflow: WorkflowHandle;
};

export const test = baseTest.extend<WorkflowFixtures>({
  workflow: async ({}, use) => {
    const handle = buildWorkflowHandle(loadWorkflowManifest());
    await use(handle);
  },
});
