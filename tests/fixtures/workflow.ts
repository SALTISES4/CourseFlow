import { test as baseTest } from '@playwright/test';
import {
  contributorByRole,
  getPrimaryWorkflow,
  loadWorkflowManifest,
  orderedSections,
  type ContributorEntry,
  type SectionEntry,
  type WorkflowManifest,
} from '../helpers/manifest';

export type WorkflowHandle = {
  manifest: WorkflowManifest;
  path: string;
  graphUuid: string;
  sections: SectionEntry[];
  sectionByPosition: (position: number) => SectionEntry;
  sectionByTitle: (title: string) => SectionEntry;
  blankSection: () => SectionEntry;
  firstSection: () => SectionEntry;
  contributorByRole: (role: string) => ContributorEntry;
};

function buildWorkflowHandle(manifest: WorkflowManifest): WorkflowHandle {
  const entry = getPrimaryWorkflow(manifest);
  const sections = orderedSections(entry);

  return {
    manifest,
    path: entry.workflow_path,
    graphUuid: entry.graph_uuid,
    sections,
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
