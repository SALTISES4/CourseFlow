import fs from 'node:fs';
import path from 'node:path';

/** Written by `just django-seed-e2e-tests`; stable IDs are defined in assets.json. */
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

export type ActorAssetId =
  | 'actor.teacher'
  | 'actor.editor'
  | 'actor.commenter'
  | 'actor.viewer';

export type ProjectAssetId =
  | 'project.primary'
  | 'project.restricted'
  | 'project.templates'
  | 'project.recent_collection'
  | 'project.favourite_collection'
  | 'project.archived_home';

export type WorkflowAssetId =
  | 'workflow.standard_activity'
  | 'workflow.navigation_course'
  | 'workflow.navigation_program'
  | 'workflow.restricted_activity'
  | 'workflow.template_activity'
  | 'workflow.template_course'
  | 'workflow.template_program';

export type SeedAssetId = ActorAssetId | ProjectAssetId | WorkflowAssetId;

export type ProjectEntry = {
  asset_id?: ProjectAssetId;
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
  asset_id: WorkflowAssetId;
  graph_uuid: string;
  workflow_uuid: string;
  workflow_title: string;
  workflow_type: string;
  workflow_path: string;
  project_uuid?: string | null;
  sections: SectionEntry[];
  outcomes?: OutcomeEntry[];
  node_count?: number;
  edge_count?: number;
  channel_count?: number;
  outcome_count?: number;
};

export type WorkflowFixtureType = 'activity' | 'course' | 'program';

export type TemplateWorkflowEntry = {
  asset_id: WorkflowAssetId;
  workflow_uuid: string;
  workflow_title: string;
  workflow_type: string;
  workflow_path?: string;
  project_uuid?: string;
};

export type ActorAssetEntry = PrimaryUserEntry & {
  asset_id: ActorAssetId;
  kind: 'actor';
  role?: string;
};

export type ProjectAssetEntry = ProjectEntry & {
  asset_id: ProjectAssetId;
  kind: 'project';
};

export type ProjectCollectionAssetEntry = {
  asset_id: 'project.recent_collection' | 'project.favourite_collection';
  kind: 'project-collection';
  items: ProjectEntry[];
};

export type WorkflowAssetEntry = WorkflowEntry & {
  kind: 'workflow';
};

export type RuntimeSeedAsset =
  | ActorAssetEntry
  | ProjectAssetEntry
  | ProjectCollectionAssetEntry
  | WorkflowAssetEntry;

export type WorkflowManifest = {
  fixture_version: number;
  asset_catalog_version: number;
  assets: Record<SeedAssetId, RuntimeSeedAsset>;
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
  restricted_workflow?: WorkflowEntry & {
    project_uuid: string;
    project_title: string;
  };
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
  'Run from repo root: just e2e-prepare.';

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
  const assets = record.assets as Record<string, unknown> | undefined;
  const primaryUser = record.primary_user as Record<string, unknown> | undefined;
  const recentProjects = record.recent_projects;
  const archivedHomeProject = record.archived_home_project as Record<string, unknown> | undefined;
  const restrictedWorkflow = record.restricted_workflow as Record<string, unknown> | undefined;

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

  if (
    !restrictedWorkflow ||
    typeof restrictedWorkflow.project_uuid !== 'string' ||
    typeof restrictedWorkflow.project_title !== 'string' ||
    typeof restrictedWorkflow.workflow_path !== 'string' ||
    !restrictedWorkflow.workflow_path.startsWith('/workflow/')
  ) {
    throw new Error(
      `E2E workflow manifest at ${manifestPath} must include restricted_workflow for access-denied coverage.`,
    );
  }

  if (!assets || typeof assets !== 'object') {
    throw new Error(`E2E workflow manifest at ${manifestPath} must include stable assets.`);
  }

  for (const assetId of [
    'actor.teacher',
    'project.primary',
    'workflow.standard_activity',
  ]) {
    if (!assets[assetId]) {
      throw new Error(
        `E2E workflow manifest at ${manifestPath} is missing required asset ${assetId}.`,
      );
    }
  }

  const workflow = assets['workflow.standard_activity'] as Record<string, unknown>;
  if (typeof workflow.workflow_path !== 'string' || !workflow.workflow_path.startsWith('/workflow/')) {
    throw new Error(
      `E2E workflow manifest at ${manifestPath} has an invalid workflow.standard_activity workflow_path.`,
    );
  }

  if (!Array.isArray(workflow.sections) || workflow.sections.length === 0) {
    throw new Error(
      `E2E workflow manifest at ${manifestPath} must include workflow.standard_activity sections.`,
    );
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
  return getWorkflowAsset(manifest, 'workflow.standard_activity');
}

export function getSeedAsset<T extends RuntimeSeedAsset = RuntimeSeedAsset>(
  manifest: WorkflowManifest,
  assetId: SeedAssetId,
): T {
  const asset = manifest.assets[assetId];
  if (!asset) {
    throw new Error(`E2E workflow manifest has no asset ${JSON.stringify(assetId)}.`);
  }
  return asset as T;
}

export function getWorkflowAsset(
  manifest: WorkflowManifest,
  assetId: WorkflowAssetId,
): WorkflowAssetEntry {
  const asset = getSeedAsset(manifest, assetId);
  if (asset.kind !== 'workflow') {
    throw new Error(`E2E asset ${assetId} is ${asset.kind}, not a workflow.`);
  }
  return asset;
}

export function getActorAsset(
  manifest: WorkflowManifest,
  assetId: ActorAssetId,
): ActorAssetEntry {
  const asset = getSeedAsset(manifest, assetId);
  if (asset.kind !== 'actor') {
    throw new Error(`E2E asset ${assetId} is ${asset.kind}, not an actor.`);
  }
  return asset;
}

export function getWorkflowByType(
  manifest: WorkflowManifest,
  workflowType: WorkflowFixtureType,
): WorkflowEntry {
  const assetIdByType: Record<WorkflowFixtureType, WorkflowAssetId> = {
    activity: 'workflow.standard_activity',
    course: 'workflow.navigation_course',
    program: 'workflow.navigation_program',
  };
  return getWorkflowAsset(manifest, assetIdByType[workflowType]);
}

export function getRestrictedWorkflow(
  manifest: WorkflowManifest,
): NonNullable<WorkflowManifest['restricted_workflow']> {
  if (!manifest.restricted_workflow) {
    throw new Error(
      `E2E workflow manifest must include restricted_workflow. ${MANIFEST_MISSING_HINT}`,
    );
  }
  return manifest.restricted_workflow;
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
    asset_id: entry.asset_id,
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
