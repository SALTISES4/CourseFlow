import fs from 'node:fs';
import path from 'node:path';

/** Written by `just django-seed-e2e-tests` (see workflow.json.example). */
export const WORKFLOW_MANIFEST_RELATIVE = '.playwright-fixtures/workflow.json';

export type SectionEntry = {
  uuid: string;
  title: string;
  position: number;
};

export type ContributorEntry = {
  email: string;
  role: string;
  password: string;
};

export type PrimaryUserEntry = {
  email: string;
  password: string;
  account_role: string;
};

export type ProjectEntry = {
  uuid: string;
  title: string;
  modified_on: string;
  is_archived: boolean;
};

export type OutcomeEntry = {
  uuid: string;
  title: string;
};

export type WorkflowEntry = {
  graph_uuid: string;
  workflow_type: string;
  workflow_path: string;
  sections: SectionEntry[];
  outcomes?: OutcomeEntry[];
  node_count?: number;
  edge_count?: number;
  channel_count?: number;
  outcome_count?: number;
};

export type TemplateWorkflowEntry = {
  workflow_uuid: string;
  workflow_title: string;
  workflow_type: string;
};

export type WorkflowManifest = {
  fixture_version: number;
  primary_user: PrimaryUserEntry;
  owner_email: string;
  project_uuid: string;
  project_title: string;
  recent_projects: ProjectEntry[];
  archived_home_project: ProjectEntry;
  template_project_uuid?: string;
  template_project_title?: string;
  template_workflows?: TemplateWorkflowEntry[];
  contributors?: ContributorEntry[];
  workflows: WorkflowEntry[];
  navigation_linked_workflows?: {
    activity: NavigationLinkedWorkflowEntry;
    course: NavigationLinkedWorkflowEntry;
    program: NavigationLinkedWorkflowEntry;
  };
};

export type NavigationLinkedWorkflowEntry = {
  workflow_uuid: string;
  workflow_title: string;
  workflow_type: string;
  workflow_path: string;
  linked_child_workflow_uuid?: string;
};

export function resolveManifestPath(): string {
  return path.resolve(process.cwd(), WORKFLOW_MANIFEST_RELATIVE);
}

const MANIFEST_MISSING_HINT =
  'Run from repo root: just e2e-prepare (or just rebuild-e2e-db for a full E2E database reset).';

function readManifestFile(): WorkflowManifest {
  const manifestPath = resolveManifestPath();
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`E2E workflow manifest not found at ${manifestPath}. ${MANIFEST_MISSING_HINT}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (error) {
    throw new Error(
      `E2E workflow manifest at ${manifestPath} is not valid JSON: ${String(error)}`,
    );
  }

  return validateWorkflowManifest(parsed, manifestPath);
}

function validateWorkflowManifest(parsed: unknown, manifestPath: string): WorkflowManifest {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`E2E workflow manifest at ${manifestPath} must be a JSON object.`);
  }

  const record = parsed as Record<string, unknown>;
  const workflows = record.workflows;
  const primaryUser = record.primary_user as Record<string, unknown> | undefined;
  const recentProjects = record.recent_projects;
  const archivedHomeProject = record.archived_home_project as Record<string, unknown> | undefined;

  if (
    !primaryUser ||
    typeof primaryUser.email !== 'string' ||
    typeof primaryUser.password !== 'string' ||
    primaryUser.account_role !== 'teacher'
  ) {
    throw new Error(
      `E2E workflow manifest at ${manifestPath} must include primary_user for the teacher actor.`,
    );
  }

  if (!Array.isArray(recentProjects) || recentProjects.length < 5) {
    throw new Error(
      `E2E workflow manifest at ${manifestPath} must include at least five recent_projects.`,
    );
  }

  if (!archivedHomeProject || archivedHomeProject.is_archived !== true) {
    throw new Error(
      `E2E workflow manifest at ${manifestPath} must include archived_home_project.`,
    );
  }

  if (!Array.isArray(workflows) || workflows.length === 0) {
    throw new Error(`E2E workflow manifest at ${manifestPath} must include workflows[0].`);
  }

  const workflow = workflows[0] as Record<string, unknown>;
  if (typeof workflow.workflow_path !== 'string' || !workflow.workflow_path.startsWith('/workflow/')) {
    throw new Error(
      `E2E workflow manifest at ${manifestPath} has an invalid workflows[0].workflow_path.`,
    );
  }

  if (!Array.isArray(workflow.sections) || workflow.sections.length === 0) {
    throw new Error(`E2E workflow manifest at ${manifestPath} must include workflows[0].sections.`);
  }

  for (const section of workflow.sections) {
    const s = section as Record<string, unknown>;
    if (typeof s.uuid !== 'string' || typeof s.title !== 'string' || typeof s.position !== 'number') {
      throw new Error(
        `E2E workflow manifest at ${manifestPath} has invalid section entries (uuid, title, position required).`,
      );
    }
  }

  return parsed as WorkflowManifest;
}

export function loadWorkflowManifest(): WorkflowManifest {
  return readManifestFile();
}

/** Called from Playwright globalSetup — surfaces manifest errors before any browser work. */
export function assertManifestReady(): void {
  loadWorkflowManifest();
}

export function getPrimaryWorkflow(manifest: WorkflowManifest): WorkflowEntry {
  return manifest.workflows[0]!;
}

export type TemplateWorkflowFixture = TemplateWorkflowEntry & {
  project_uuid: string;
  project_title: string;
};

export type TemplateWorkflowType = 'activity' | 'course' | 'program';

export function listTemplateWorkflowFixtures(manifest: WorkflowManifest): TemplateWorkflowFixture[] {
  const { template_project_uuid, template_project_title, template_workflows } = manifest;

  if (!template_project_uuid || !template_project_title || !template_workflows?.length) {
    throw new Error(
      `E2E workflow manifest is missing template_workflows fixture data. ${MANIFEST_MISSING_HINT}`,
    );
  }

  return template_workflows.map((entry) => ({
    project_uuid: template_project_uuid,
    project_title: template_project_title,
    workflow_uuid: entry.workflow_uuid,
    workflow_title: entry.workflow_title,
    workflow_type: entry.workflow_type,
  }));
}

export function getTemplateWorkflowFixture(
  manifest: WorkflowManifest,
  workflowType: TemplateWorkflowType,
): TemplateWorkflowFixture {
  const match = listTemplateWorkflowFixtures(manifest).find(
    (entry) => entry.workflow_type === workflowType,
  );
  if (!match) {
    throw new Error(
      `E2E workflow manifest has no template workflow for type ${JSON.stringify(workflowType)}.`,
    );
  }
  return match;
}

export function orderedSections(workflow: WorkflowEntry): SectionEntry[] {
  return [...workflow.sections].sort((a, b) => a.position - b.position);
}

export function getWorkflowPath(manifest?: WorkflowManifest): string {
  const fromEnv = process.env.PLAYWRIGHT_WORKFLOW_PATH?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return getPrimaryWorkflow(manifest ?? loadWorkflowManifest()).workflow_path;
}

export function getProjectPath(manifest?: WorkflowManifest): string {
  const fromEnv = process.env.PLAYWRIGHT_PROJECT_PATH?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  const m = manifest ?? loadWorkflowManifest();
  return `/project/${m.project_uuid}`;
}

export function getProjectWorkflowsPath(manifest?: WorkflowManifest): string {
  return `${getProjectPath(manifest)}/workflows`;
}

export function getRecentHomeProjects(manifest: WorkflowManifest): ProjectEntry[] {
  if (manifest.recent_projects.length < 5) {
    throw new Error(
      `E2E workflow manifest requires at least five recent_projects for FR-HOME-003. ` +
        `Found ${manifest.recent_projects.length}.`,
    );
  }
  return manifest.recent_projects;
}

export function contributorByRole(
  manifest: WorkflowManifest,
  role: string,
): ContributorEntry {
  const contributors = manifest.contributors ?? [];
  const match = contributors.find((entry) => entry.role === role);
  if (!match) {
    throw new Error(
      `No contributor with role ${JSON.stringify(role)} in manifest. ` +
        `Available: ${contributors.map((c) => c.role).join(', ') || '(none)'}`,
    );
  }
  return match;
}
