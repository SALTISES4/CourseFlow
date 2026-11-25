import { expect, test, type Page } from "../../fixtures";
import { loginAs } from "../../helpers/auth";
import { gotoAuthenticatedShell } from "../../helpers/navigation";
import {
  getActorAsset,
  getProjectPath,
  loadWorkflowManifest,
  type ActorAssetId,
} from "../../helpers/manifest";
import {
  PROJECT_COPY_SNACKBAR_MESSAGES,
  PROJECT_FORM_VALIDATION_MESSAGES,
  copyProjectCancelButton,
  copyProjectDialog,
  copyProjectIncludeArchivedCheckbox,
  copyProjectIncludeArchivedHelp,
  copyProjectMenuItem,
  copyProjectSubmitButton,
  copyProjectTitleField,
  globalMessageSnackbar,
  projectOverflowButton,
  projectTitle,
  waitForProjectOverviewLoaded,
} from "./project.locators";

test.use({
  seedDependencies: [
    "actor.teacher",
    "actor.editor",
    "actor.commenter",
    "actor.viewer",
    "project.primary",
    "project.templates",
  ],
});

/**
 * Whole-project copy — FR-PROJ-COPY-001 through FR-PROJ-COPY-009.
 * Requirements: tests/docs/requirements/features/project/project_copy_requirements_v1.yaml
 */

const manifest = loadWorkflowManifest();
const sourceProjectPath = getProjectPath(manifest);
const copiedProjectUuid = "11111111-2222-4333-8444-555555555555";
const publishedNonTemplateUuid = "66666666-7777-4888-8999-000000000000";

type MockProjectOptions = {
  uuid: string;
  title: string;
  resourceRole: "owner" | "editor" | "commenter" | "viewer" | "public";
  actions: string[];
  isPublished?: boolean;
  isTemplate?: boolean;
};

function projectDetail(options: MockProjectOptions) {
  return {
    uuid: options.uuid,
    title: options.title,
    description: "Copy Project browser-test source.",
    isPublished: options.isPublished ?? false,
    isArchived: false,
    isTemplate: options.isTemplate ?? false,
    isFavorite: false,
    owner: {
      id: 1,
      uuid: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      email: "teacher@courseflow.com",
      firstName: "CourseFlow",
      lastName: "Teacher",
      languagePreference: "en-CA",
      accountRole: "teacher",
      meta: null,
    },
    dateCreated: "2026-11-25T12:00:00Z",
    modifiedOn: "2026-11-25T12:00:00Z",
    disciplines: [],
    tags: [],
    workflows: [],
    permissions: {
      accountRole: "teacher",
      resourceRole: options.resourceRole,
      state: options.isPublished ? "public" : "private",
      actions: options.actions,
      adminOverride: false,
    },
  };
}

async function mockProjectPage(
  page: Page,
  options: MockProjectOptions,
): Promise<void> {
  const detail = projectDetail(options);
  await page.route(`**/api/project/${options.uuid}`, async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ item: detail }),
    });
  });
  await page.route(`**/api/project/${options.uuid}/team`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], meta: { total: 0 } }),
    });
  });
  await page.route(
    `**/api/workspace-lock/project/${options.uuid}**`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          resourceType: "project",
          resourceUuid: options.uuid,
          state: "held",
          holder: {
            uuid: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
            displayName: "CourseFlow Teacher",
          },
          version: "mock-lock-version",
          expiresAt: "2099-01-01T00:00:00Z",
        }),
      });
    },
  );
  await page.route("**/api/workflow/*/related", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ contains: [], appearsIn: [] }),
    });
  });
}

async function openCopyProjectDialog(page: Page): Promise<void> {
  await projectOverflowButton(page).click();
  await expect(copyProjectMenuItem(page)).toBeVisible();
  await copyProjectMenuItem(page).click();
  await expect(copyProjectDialog(page)).toBeVisible();
}

test.describe("project copy dialog and submission", () => {
  test.beforeEach(async ({ page }) => {
    await mockProjectPage(page, {
      uuid: manifest.project_uuid,
      title: manifest.project_title,
      resourceRole: "owner",
      actions: [
        "view",
        "copy_project",
        "edit_project",
        "manage_members",
        "create_workflow",
        "archive_project",
        "publish_project",
      ],
    });
    await gotoAuthenticatedShell(page, sourceProjectPath);
    await waitForProjectOverviewLoaded(page);
  });

  test("FR-PROJ-COPY-009: dialog defaults, validation, cancel, and reset", async ({
    page,
  }) => {
    const routeBefore = new URL(page.url()).pathname;
    let copyRequestCount = 0;
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().endsWith(`/api/project/${manifest.project_uuid}/copy`)
      ) {
        copyRequestCount += 1;
      }
    });

    await openCopyProjectDialog(page);
    await expect(
      copyProjectDialog(page).getByRole("heading", {
        name: "Copy project",
        exact: true,
      }),
    ).toBeVisible();
    await expect(copyProjectTitleField(page)).toHaveValue(
      `${manifest.project_title} (copy)`,
    );
    await expect(copyProjectIncludeArchivedCheckbox(page)).not.toBeChecked();
    await expect(copyProjectIncludeArchivedHelp(page)).toHaveText(
      "Archived workflows included in the copy will remain archived.",
    );
    await expect(copyProjectSubmitButton(page)).toBeEnabled();

    await copyProjectTitleField(page).fill("   ");
    await expect(
      copyProjectDialog(page).getByText(
        PROJECT_FORM_VALIDATION_MESSAGES.titleRequired,
        {
          exact: true,
        },
      ),
    ).toBeVisible();
    await expect(copyProjectSubmitButton(page)).toBeDisabled();

    await copyProjectTitleField(page).fill("x".repeat(201));
    await expect(
      copyProjectDialog(page).getByText(
        PROJECT_FORM_VALIDATION_MESSAGES.titleMaxLength,
        {
          exact: true,
        },
      ),
    ).toBeVisible();
    await expect(copyProjectSubmitButton(page)).toBeDisabled();

    await copyProjectTitleField(page).fill("Changed copy title");
    await copyProjectIncludeArchivedCheckbox(page).check();
    await copyProjectCancelButton(page).click();
    await expect(copyProjectDialog(page)).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe(routeBefore);
    expect(copyRequestCount).toBe(0);

    await openCopyProjectDialog(page);
    await expect(copyProjectTitleField(page)).toHaveValue(
      `${manifest.project_title} (copy)`,
    );
    await expect(copyProjectIncludeArchivedCheckbox(page)).not.toBeChecked();
  });

  test("FR-PROJ-COPY-009: submits once, disables pending actions, and navigates to the copy", async ({
    page,
  }) => {
    const copiedTitle = `E2E project copy ${Date.now()}`;
    let releaseRequest: (() => void) | undefined;
    const requestGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    await mockProjectPage(page, {
      uuid: copiedProjectUuid,
      title: copiedTitle,
      resourceRole: "owner",
      actions: [
        "view",
        "copy_project",
        "edit_project",
        "manage_members",
        "create_workflow",
        "archive_project",
        "publish_project",
      ],
    });
    const copiedProject = projectDetail({
      uuid: copiedProjectUuid,
      title: copiedTitle,
      resourceRole: "owner",
      actions: [
        "view",
        "copy_project",
        "edit_project",
        "manage_members",
        "create_workflow",
        "archive_project",
        "publish_project",
      ],
    });

    await page.route(
      `**/api/project/${manifest.project_uuid}/copy`,
      async (route) => {
        await requestGate;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(copiedProject),
        });
      },
    );

    await openCopyProjectDialog(page);
    await copyProjectTitleField(page).fill(`  ${copiedTitle}  `);
    await copyProjectIncludeArchivedCheckbox(page).check();

    const requestPromise = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().endsWith(`/api/project/${manifest.project_uuid}/copy`),
    );
    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith(`/api/project/${manifest.project_uuid}/copy`),
    );

    await copyProjectSubmitButton(page).click();
    const request = await requestPromise;
    expect(request.postDataJSON()).toEqual({
      title: copiedTitle,
      includeArchivedWorkflows: true,
    });
    await expect(copyProjectCancelButton(page)).toBeDisabled();
    await expect(copyProjectSubmitButton(page)).toBeDisabled();

    releaseRequest?.();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    const copiedProjectResponse = (await response.json()) as {
      uuid: string;
      title: string;
    };

    expect(copiedProjectResponse.uuid).not.toBe(manifest.project_uuid);
    expect(copiedProjectResponse.title).toBe(copiedTitle);
    await expect(page).toHaveURL(
      new RegExp(`/project/${copiedProjectResponse.uuid}/?$`),
    );
    await expect(projectTitle(page)).toHaveText(copiedTitle);
    await expect(
      globalMessageSnackbar(page).filter({
        hasText: PROJECT_COPY_SNACKBAR_MESSAGES.success,
      }),
    ).toBeVisible();
    await expect(copyProjectDialog(page)).toHaveCount(0);
  });

  test("FR-PROJ-COPY-009: failure keeps the dialog open and re-enables actions", async ({
    page,
  }) => {
    const routeBefore = new URL(page.url()).pathname;
    await page.route(
      `**/api/project/${manifest.project_uuid}/copy`,
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Injected copy failure" }),
        });
      },
    );

    await openCopyProjectDialog(page);
    await copyProjectSubmitButton(page).click();

    await expect(
      globalMessageSnackbar(page).filter({
        hasText: PROJECT_COPY_SNACKBAR_MESSAGES.failure,
      }),
    ).toBeVisible();
    await expect(copyProjectDialog(page)).toBeVisible();
    await expect(copyProjectCancelButton(page)).toBeEnabled();
    await expect(copyProjectSubmitButton(page)).toBeEnabled();
    expect(new URL(page.url()).pathname).toBe(routeBefore);
  });
});

test.describe("project copy permission projection", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const actorAsset of [
    "actor.editor",
    "actor.commenter",
    "actor.viewer",
  ] as const satisfies readonly ActorAssetId[]) {
    test(`${actorAsset} sees Copy project on an active contributed project`, async ({
      page,
    }) => {
      const actor = getActorAsset(manifest, actorAsset);
      await loginAs(page, { email: actor.email, password: actor.password });
      await mockProjectPage(page, {
        uuid: manifest.project_uuid,
        title: manifest.project_title,
        resourceRole: actorAsset.replace("actor.", "") as
          | "editor"
          | "commenter"
          | "viewer",
        actions: ["view", "copy_project"],
      });
      await gotoAuthenticatedShell(page, sourceProjectPath);
      await waitForProjectOverviewLoaded(page);

      await projectOverflowButton(page).click();
      await expect(copyProjectMenuItem(page)).toBeVisible();
    });
  }

  test("public user sees Copy project on a published template", async ({
    page,
  }) => {
    const templateProjectUuid = manifest.template_project_uuid;
    if (!templateProjectUuid) {
      throw new Error("E2E manifest is missing template_project_uuid.");
    }
    const actor = getActorAsset(manifest, "actor.viewer");
    await loginAs(page, { email: actor.email, password: actor.password });
    await mockProjectPage(page, {
      uuid: templateProjectUuid,
      title: manifest.template_project_title ?? "Published template",
      resourceRole: "public",
      actions: ["copy_project", "view"],
      isPublished: true,
      isTemplate: true,
    });
    await gotoAuthenticatedShell(page, `/project/${templateProjectUuid}`);
    await waitForProjectOverviewLoaded(page);

    await projectOverflowButton(page).click();
    await expect(copyProjectMenuItem(page)).toBeVisible();
  });
});

test.describe("published non-template project copy policy", () => {
  test.use({
    storageState: { cookies: [], origins: [] },
  });

  test("public user does not see Copy project on a published non-template project", async ({
    page,
  }) => {
    const actor = getActorAsset(manifest, "actor.viewer");
    await loginAs(page, { email: actor.email, password: actor.password });
    await mockProjectPage(page, {
      uuid: publishedNonTemplateUuid,
      title: "Published non-template project",
      resourceRole: "public",
      actions: ["view"],
      isPublished: true,
      isTemplate: false,
    });
    await gotoAuthenticatedShell(page, `/project/${publishedNonTemplateUuid}`);
    await waitForProjectOverviewLoaded(page);

    await expect(projectOverflowButton(page)).toHaveCount(0);
    await expect(copyProjectMenuItem(page)).toHaveCount(0);
  });
});
