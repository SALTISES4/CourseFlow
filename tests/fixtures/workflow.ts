import { test as baseTest, type APIRequestContext } from '@playwright/test';
import {
  contributorByRole,
  getActorAsset,
  getWorkflowAsset,
  getWorkflowByType,
  loadWorkflowManifest,
  orderedSections,
  type ActorAssetEntry,
  type ActorAssetId,
  type ContributorEntry,
  type OutcomeEntry,
  type SeedAssetId,
  type SectionEntry,
  type WorkflowManifest,
  type WorkflowEntry,
  type WorkflowAssetId,
  type WorkflowFixtureType,
} from '../helpers/manifest';
import { apiRequestWithAccessToken, readPrimaryActorAccessToken } from '../helpers/api';

export type { OutcomeEntry };

export type WorkflowHandle = {
  assetId: WorkflowAssetId;
  workflowUuid: string;
  workflowType: string;
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

export type SeedAccess = 'read-only' | 'disposable-copy' | 'disposable-project-copy';

type GraphViewPayload = {
  graph: {
    uuid: string;
    revisionId: number;
  };
  sections: Array<{
    uuid: string;
    title: string;
    position: number;
  }>;
  outcomes: Array<{
    uuid: string;
    title: string;
    order: number;
  }>;
  nodes: unknown[];
  edges: unknown[];
  channels: unknown[];
};

type WorkflowCopyResponse = {
  uuid: string;
  graphUuid: string;
  title: string;
  workflowType: string;
  projectUuid: string | null;
};

function buildWorkflowHandle(manifest: WorkflowManifest, entry: WorkflowEntry): WorkflowHandle {
  const sections = orderedSections(entry);
  const outcomes = entry.outcomes ?? [];

  return {
    assetId: entry.asset_id,
    workflowUuid: entry.workflow_uuid,
    workflowType: entry.workflow_type,
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
      if (entry.workflow_type === workflowType) {
        return entry;
      }
      return getWorkflowByType(manifest, workflowType);
    },
  };
}

async function expectApiSuccess(
  response: Awaited<ReturnType<typeof apiRequestWithAccessToken>>,
  operation: string,
): Promise<void> {
  if (!response.ok()) {
    throw new Error(`${operation} failed with HTTP ${response.status()}: ${await response.text()}`);
  }
}

async function loadGraphView(
  request: APIRequestContext,
  accessToken: string,
  workflowUuid: string,
): Promise<GraphViewPayload> {
  const response = await apiRequestWithAccessToken(request, accessToken, 'GET', `/api/graph/${workflowUuid}/view`);
  await expectApiSuccess(response, `Load graph view for workflow ${workflowUuid}`);
  return (await response.json()) as GraphViewPayload;
}

async function copyWorkflowAsset(
  request: APIRequestContext,
  accessToken: string,
  source: WorkflowEntry,
  destinationProjectUuid?: string,
): Promise<WorkflowEntry> {
  const projectUuid = destinationProjectUuid ?? source.project_uuid;
  if (!projectUuid) {
    throw new Error(`Workflow asset ${source.asset_id} has no destination project UUID.`);
  }
  const response = await apiRequestWithAccessToken(
    request,
    accessToken,
    'POST',
    `/api/workflow/${source.workflow_uuid}/copy`,
    {
      data: {
        projectUuid,
        title: source.workflow_title,
      },
    },
  );
  await expectApiSuccess(response, `Copy workflow asset ${source.asset_id}`);
  const copy = (await response.json()) as WorkflowCopyResponse;
  const graphView = await loadGraphView(request, accessToken, copy.uuid);

  return {
    asset_id: source.asset_id,
    workflow_uuid: copy.uuid,
    workflow_title: copy.title,
    workflow_type: copy.workflowType,
    workflow_path: `/workflow/${copy.uuid}/graph`,
    project_uuid: copy.projectUuid,
    graph_uuid: copy.graphUuid,
    sections: graphView.sections.map(({ uuid, title: sectionTitle, position }) => ({
      uuid,
      title: sectionTitle,
      position,
    })),
    outcomes: [...graphView.outcomes]
      .sort((left, right) => left.order - right.order)
      .map(({ uuid, title: outcomeTitle }) => ({ uuid, title: outcomeTitle })),
    node_count: graphView.nodes.length,
    edge_count: graphView.edges.length,
    channel_count: graphView.channels.length,
    outcome_count: graphView.outcomes.length,
  };
}

type ProjectCreateResponse = {
  uuid: string;
  title: string;
};

type UserListItem = {
  uuid: string;
  email: string;
};

async function createDisposableWorkflowProject(
  request: APIRequestContext,
  accessToken: string,
): Promise<ProjectCreateResponse> {
  const response = await apiRequestWithAccessToken(request, accessToken, 'POST', '/api/project', {
    data: {
      title: `E2E disposable workflow project ${Date.now()}-${Math.random().toString(16).slice(2)}`,
      description: 'Isolated project for disposable workflow copies.',
      isPublished: false,
      isTemplate: false,
      disciplines: [],
    },
  });
  await expectApiSuccess(response, 'Create disposable workflow project');
  return (await response.json()) as ProjectCreateResponse;
}

async function addDisposableProjectContributor(
  request: APIRequestContext,
  accessToken: string,
  projectUuid: string,
  actor: ActorAssetEntry,
): Promise<void> {
  const usersResponse = await apiRequestWithAccessToken(
    request,
    accessToken,
    'GET',
    `/api/user?filter=${encodeURIComponent(actor.email)}`,
  );
  await expectApiSuccess(usersResponse, `Find E2E actor ${actor.email}`);
  const users = (await usersResponse.json()) as { items: UserListItem[] };
  const user = users.items.find((item) => item.email === actor.email);
  if (!user || !actor.role || !['editor', 'commenter', 'viewer'].includes(actor.role)) {
    throw new Error(`Cannot add E2E actor ${actor.email} to disposable project.`);
  }
  const response = await apiRequestWithAccessToken(request, accessToken, 'POST', `/api/project/${projectUuid}/team`, {
    data: { userUuids: [user.uuid], role: actor.role },
  });
  await expectApiSuccess(response, `Add ${actor.email} to disposable project`);
}

async function cleanupDisposableWorkflowProject(
  request: APIRequestContext,
  accessToken: string,
  projectUuid: string,
): Promise<void> {
  const tagsResponse = await apiRequestWithAccessToken(request, accessToken, 'GET', `/api/project/${projectUuid}/tags`);
  if (tagsResponse.ok()) {
    const tags = (await tagsResponse.json()) as Array<{ id: number }>;
    for (const tag of tags) {
      const removeTag = await apiRequestWithAccessToken(
        request,
        accessToken,
        'DELETE',
        `/api/project/${projectUuid}/tags/${tag.id}`,
      );
      await expectApiSuccess(removeTag, `Delete disposable project tag ${tag.id}`);
    }
  }

  const archive = await apiRequestWithAccessToken(request, accessToken, 'POST', `/api/project/${projectUuid}/archive`);
  if (![200, 404].includes(archive.status())) {
    throw new Error(`Archive disposable workflow project failed: ${await archive.text()}`);
  }
  const remove = await apiRequestWithAccessToken(request, accessToken, 'DELETE', `/api/project/${projectUuid}`);
  if (![200, 404].includes(remove.status())) {
    throw new Error(`Delete disposable workflow project failed: ${await remove.text()}`);
  }
}

async function linkFirstWorkflowNode(
  request: APIRequestContext,
  accessToken: string,
  parent: WorkflowEntry,
  child: WorkflowEntry,
): Promise<void> {
  const graph = await loadGraphView(request, accessToken, parent.workflow_uuid);
  const firstNode = graph.nodes[0] as { uuid?: string } | undefined;
  if (!firstNode?.uuid) {
    return;
  }
  const response = await apiRequestWithAccessToken(
    request,
    accessToken,
    'POST',
    `/api/node/${firstNode.uuid}/link-workflow`,
    { data: { workflowUuid: child.workflow_uuid } },
  );
  await expectApiSuccess(response, `Link copied ${child.workflow_type} workflow`);
}

async function cleanupWorkflowCopy(
  request: APIRequestContext,
  accessToken: string,
  workflowUuid: string,
): Promise<void> {
  const archive = await apiRequestWithAccessToken(
    request,
    accessToken,
    'POST',
    `/api/workflow/${workflowUuid}/archive`,
  );
  if (![200, 404].includes(archive.status())) {
    throw new Error(
      `Archive disposable workflow ${workflowUuid} failed with HTTP ${archive.status()}: ${await archive.text()}`,
    );
  }

  const remove = await apiRequestWithAccessToken(request, accessToken, 'DELETE', `/api/workflow/${workflowUuid}`);
  if (![200, 404].includes(remove.status())) {
    throw new Error(
      `Delete disposable workflow ${workflowUuid} failed with HTTP ${remove.status()}: ${await remove.text()}`,
    );
  }
}

type SeedOptions = {
  seedAsset: WorkflowAssetId | undefined;
  seedAssets: WorkflowAssetId[];
  seedDependencies: SeedAssetId[];
  actorAsset: ActorAssetId;
  seedAccess: SeedAccess | undefined;
};

type WorkflowFixtures = {
  workflow: WorkflowHandle;
  actor: ActorAssetEntry;
  workflowCleanup: (workflowUuid: string) => void;
};

export const test = baseTest.extend<SeedOptions & WorkflowFixtures>({
  seedAsset: [undefined, { option: true }],
  seedAssets: [[], { option: true }],
  seedDependencies: [[], { option: true }],
  actorAsset: ['actor.teacher', { option: true }],
  seedAccess: [undefined, { option: true }],

  actor: async ({ actorAsset }, use) => {
    await use(getActorAsset(loadWorkflowManifest(), actorAsset));
  },

  workflowCleanup: async ({ request }, use) => {
    const accessToken = readPrimaryActorAccessToken();
    const workflowUuids: string[] = [];
    await use((workflowUuid) => {
      if (!workflowUuids.includes(workflowUuid)) {
        workflowUuids.push(workflowUuid);
      }
    });

    for (const workflowUuid of [...workflowUuids].reverse()) {
      await cleanupWorkflowCopy(request, accessToken, workflowUuid);
    }
  },

  workflow: async ({ request, seedAsset, seedAssets, seedAccess }, use, testInfo) => {
    if (!seedAsset) {
      throw new Error(`${testInfo.file} uses the workflow fixture without declaring test.use({ seedAsset: ... }).`);
    }
    if (!seedAccess) {
      throw new Error(`${testInfo.file} uses the workflow fixture without declaring test.use({ seedAccess: ... }).`);
    }

    const manifest = loadWorkflowManifest();
    const source = getWorkflowAsset(manifest, seedAsset);
    const accessToken = readPrimaryActorAccessToken();

    if (seedAccess === 'read-only') {
      const before = await loadGraphView(request, accessToken, source.workflow_uuid);
      await use(buildWorkflowHandle(manifest, source));
      const after = await loadGraphView(request, accessToken, source.workflow_uuid);
      if (after.graph.revisionId !== before.graph.revisionId) {
        throw new Error(
          `Read-only seed asset ${seedAsset} was mutated by ${testInfo.titlePath.join(' > ')} ` +
            `(revision ${before.graph.revisionId} -> ${after.graph.revisionId}).`,
        );
      }
      return;
    }

    const assetIds = [...new Set([seedAsset, ...seedAssets])];
    const copies = new Map<WorkflowAssetId, WorkflowEntry>();
    let disposableProject: ProjectCreateResponse | undefined;
    try {
      if (seedAccess === 'disposable-project-copy') {
        disposableProject = await createDisposableWorkflowProject(request, accessToken);
        await addDisposableProjectContributor(
          request,
          accessToken,
          disposableProject.uuid,
          getActorAsset(manifest, 'actor.commenter'),
        );
        await addDisposableProjectContributor(
          request,
          accessToken,
          disposableProject.uuid,
          getActorAsset(manifest, 'actor.viewer'),
        );
      }
      for (const assetId of assetIds) {
        const asset = getWorkflowAsset(manifest, assetId);
        copies.set(assetId, await copyWorkflowAsset(request, accessToken, asset, disposableProject?.uuid));
      }

      if (disposableProject) {
        const activityCopy = copies.get('workflow.standard_activity');
        const courseCopy = copies.get('workflow.navigation_course');
        if (activityCopy && courseCopy) {
          await linkFirstWorkflowNode(request, accessToken, courseCopy, activityCopy);
        }
      }

      const isolatedManifest: WorkflowManifest = {
        ...manifest,
        project_uuid: disposableProject?.uuid ?? manifest.project_uuid,
        project_title: disposableProject?.title ?? manifest.project_title,
        assets: {
          ...manifest.assets,
          ...Object.fromEntries([...copies].map(([assetId, copy]) => [assetId, { kind: 'workflow', ...copy }])),
        } as WorkflowManifest['assets'],
        workflows: manifest.workflows.map((entry) => copies.get(entry.asset_id) ?? entry),
        navigation_linked_workflows: manifest.navigation_linked_workflows
          ? {
              activity: {
                ...manifest.navigation_linked_workflows.activity,
                workflow_uuid:
                  copies.get('workflow.standard_activity')?.workflow_uuid ??
                  manifest.navigation_linked_workflows.activity.workflow_uuid,
                workflow_path:
                  copies.get('workflow.standard_activity')?.workflow_path ??
                  manifest.navigation_linked_workflows.activity.workflow_path,
              },
              course: {
                ...manifest.navigation_linked_workflows.course,
                workflow_uuid:
                  copies.get('workflow.navigation_course')?.workflow_uuid ??
                  manifest.navigation_linked_workflows.course.workflow_uuid,
                workflow_path:
                  copies.get('workflow.navigation_course')?.workflow_path ??
                  manifest.navigation_linked_workflows.course.workflow_path,
                linked_child_workflow_uuid:
                  copies.get('workflow.standard_activity')?.workflow_uuid ??
                  manifest.navigation_linked_workflows.course.linked_child_workflow_uuid,
              },
              program: {
                ...manifest.navigation_linked_workflows.program,
                workflow_uuid:
                  copies.get('workflow.navigation_program')?.workflow_uuid ??
                  manifest.navigation_linked_workflows.program.workflow_uuid,
                workflow_path:
                  copies.get('workflow.navigation_program')?.workflow_path ??
                  manifest.navigation_linked_workflows.program.workflow_path,
              },
            }
          : undefined,
      };
      const selectedCopy = copies.get(seedAsset);
      if (!selectedCopy) {
        throw new Error(`Disposable workflow copy was not created for ${seedAsset}.`);
      }
      await use(buildWorkflowHandle(isolatedManifest, selectedCopy));
    } finally {
      for (const copy of [...copies.values()].reverse()) {
        await cleanupWorkflowCopy(request, accessToken, copy.workflow_uuid);
      }
      if (disposableProject) {
        await cleanupDisposableWorkflowProject(request, accessToken, disposableProject.uuid);
      }
    }
  },
});
