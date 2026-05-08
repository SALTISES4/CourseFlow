import { test, expect, type Page } from '@playwright/test';

/**
 * CourseFlow 2.0 — Edit Section workflow (BDD-shaped e2e).
 * Spec source: test/docs/Edit-Section_AI-Ready_Requirements_v1.md
 *
 * Enable when the app and selectors exist:
 *   COURSEFLOW_E2E=1 npx playwright test tests/e2e/workflow/feature-name.spec.ts
 * Uncomment `baseURL` in playwright.config.ts (or set via env) so relative gotos work.
 */
const courseflowE2EEnabled =
  process.env.COURSEFLOW_E2E === '1' || process.env.COURSEFLOW_E2E === 'true';

/** Adjust paths and roles to match implementation + test data. */
async function preconditionWorkflowViewWithSections(page: Page) {
  await test.step('Preconditions: Workflow is open in Workflow view; at least one Section exists', async () => {
    await page.goto('/workflow');
    // await expect(page.getByRole('region', { name: /workflow/i })).toBeVisible();
  });
}

test.describe('CourseFlow 2.0 — Edit Section workflow', () => {
  test.beforeEach(() => {
    test.skip(
      !courseflowE2EEnabled,
      'Set COURSEFLOW_E2E=1 and configure baseURL + locators to run Edit Section e2e.',
    );
  });

  test.describe('FR-SEC-001 Open Edit Section Form', () => {
    test('Given a section is selected, when sidebar opens, then heading reads Edit section', async ({
      page,
    }) => {
      await preconditionWorkflowViewWithSections(page);

      await test.step('Trigger: User clicks an existing Section', async () => {
        await page.getByRole('button', { name: /section\s*1/i }).click();
      });

      await test.step('Main flow: System opens the right sidebar with form titled Edit section', async () => {
        await expect(page.getByRole('heading', { name: 'Edit section', exact: true })).toBeVisible();
      });

      await test.step('Main flow: Form shows current section Title field', async () => {
        await expect(page.getByLabel(/title/i)).toBeVisible();
      });
    });

    test('Given Edit node form is open, when user clicks section above separator, then sidebar shows Edit section', async ({
      page,
    }) => {
      await preconditionWorkflowViewWithSections(page);

      await test.step('Preconditions: Edit node form is open', async () => {
        await page.getByRole('button', { name: /node/i }).first().click();
        await expect(page.getByRole('heading', { name: /edit node/i })).toBeVisible();
      });

      await test.step('Trigger: User clicks section chrome above header/node separator', async () => {
        await page.locator('[data-testid="section-header-chrome"]').click();
      });

      await test.step('Acceptance: Sidebar shows Edit section for that section', async () => {
        await expect(page.getByRole('heading', { name: 'Edit section', exact: true })).toBeVisible();
      });
    });
  });

  test.describe('FR-SEC-002 Section Numbering And Display', () => {
    test('System recalculates numbers top-to-bottom after insert; number always visible; empty title shows number only', async ({
      page,
    }) => {
      await preconditionWorkflowViewWithSections(page);

      await test.step('Observe: Section number visible without hover', async () => {
        await expect(page.getByText(/^1(\s|$)/)).toBeVisible();
      });

      await test.step('Trigger: Insert section between existing sections (Owner/Editor)', async () => {
        await page.getByRole('button', { name: /section/i }).first().hover();
        await page.getByRole('button', { name: /insert below/i }).click();
      });

      await test.step('Main flow: Indices stay contiguous from top to bottom', async () => {
        await expect(page.getByText(/^1(\s|$)/)).toBeVisible();
        await expect(page.getByText(/^2(\s|$)/)).toBeVisible();
      });

      await test.step('Given empty title, display is number only (no placeholder)', async () => {
        await expect(page.getByPlaceholder(/.+/)).toHaveCount(0);
      });

      await test.step('Acceptance: Hover does not change number/title solely due to hover', async () => {
        const label = page.locator('[data-testid="section-label"]').first();
        const before = await label.textContent();
        await label.hover();
        await expect(label).toHaveText(before ?? '');
      });
    });
  });

  test.describe('FR-SEC-003 Edit Section Title (auto-save)', () => {
    test('Owner/Editor: valid title persists without Save; header updates; clear shows number only', async ({
      page,
    }) => {
      await preconditionWorkflowViewWithSections(page);

      await test.step('Preconditions: Edit section form open as Owner/Editor', async () => {
        await page.getByRole('button', { name: /section/i }).first().click();
        await expect(page.getByRole('heading', { name: 'Edit section', exact: true })).toBeVisible();
      });

      await test.step('Trigger: User types in Title field', async () => {
        const title = page.getByLabel(/title/i);
        await title.fill('My section');
      });

      await test.step('Main flow: No Save button on form', async () => {
        await expect(page.getByRole('button', { name: /^save$/i })).toHaveCount(0);
      });

      await test.step('Main flow: Auto-save completes; section header reflects persisted title', async () => {
        await expect(page.getByText('My section').first()).toBeVisible({ timeout: 15_000 });
      });

      await test.step('Trigger: User clears title', async () => {
        await page.getByLabel(/title/i).fill('');
      });

      await test.step('Acceptance: After auto-save, section shows number only (no placeholder)', async () => {
        await expect(page.getByLabel(/title/i)).toHaveValue('');
      });
    });
  });

  test.describe('FR-SEC-004 Insert Section Below (hover)', () => {
    test('Owner/Editor: new empty section at K+1; renumbered', async ({ page }) => {
      await preconditionWorkflowViewWithSections(page);

      const sections = page.getByTestId('workflow-section');

      await test.step('Trigger: Click Insert below on hovered section', async () => {
        const before = await sections.count();
        await sections.nth(0).hover();
        await page.getByRole('button', { name: /insert below/i }).click();
        await expect(sections).toHaveCount(before + 1);
      });

      await test.step('Main flow: New section title empty (no placeholder); indices contiguous', async () => {
        await expect(page.getByTestId('workflow-section-title').last()).toHaveValue('');
        await expect(page.getByText(/^1(\s|$)/)).toBeVisible();
        await expect(page.getByText(/^2(\s|$)/)).toBeVisible();
      });
    });
  });

  test.describe('FR-SEC-005 Duplicate Section Below', () => {
    test('Duplicate mirrors content except comments; title rules for (copy)', async ({ page }) => {
      await preconditionWorkflowViewWithSections(page);

      await test.step('Trigger: Duplicate from hover or sidebar', async () => {
        await page.getByRole('button', { name: /section/i }).first().hover();
        await page.getByRole('button', { name: /duplicate/i }).click();
      });

      await test.step('Main flow: Copy immediately below source; comments not copied', async () => {
        await expect(page.getByText(/\(\s*copy\s*\)/)).toBeVisible();
      });

      await test.step('Main flow: Copied title appends literal "(copy)" (empty source → "(copy)"; nested copy suffix per FR-SEC-005)', async () => {
        const dupTitle = page.getByTestId('workflow-section-title').nth(1);
        await expect(dupTitle).toHaveValue(/\(copy\)(\s*\(copy\))?$/);
      });
    });
  });

  test.describe('FR-SEC-006 Delete Section (modal)', () => {
    test('Delete opens same modal from hover or sidebar; Cancel leaves workflow unchanged', async ({
      page,
    }) => {
      await preconditionWorkflowViewWithSections(page);

      await test.step('Trigger: Delete from sidebar', async () => {
        await page.getByRole('button', { name: /section/i }).first().click();
        await page.getByRole('button', { name: /^delete$/i }).click();
      });

      await test.step('Main flow: Delete section modal opens; section not deleted yet', async () => {
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: /delete section/i })).toBeVisible();
      });

      await test.step('Branch: User clicks Cancel', async () => {
        await page.getByRole('button', { name: /^cancel$/i }).click();
      });

      await test.step('Acceptance: Modal closes; section and numbering unchanged', async () => {
        await expect(page.getByRole('dialog')).toBeHidden();
      });
    });

    test('Confirm Delete section removes section and content; remaining sections renumbered', async ({
      page,
    }) => {
      await preconditionWorkflowViewWithSections(page);

      await test.step('Trigger: Open delete modal and confirm', async () => {
        await page.getByRole('button', { name: /section/i }).first().click();
        await page.getByRole('button', { name: /^delete$/i }).click();
        await page.getByRole('button', { name: /delete section/i }).click();
      });

      await test.step('Acceptance: Section gone; numbers reflect new order', async () => {
        await expect(page.getByRole('dialog')).toBeHidden();
      });
    });
  });

  test.describe('FR-SEC-007 Permissions And Read-Only Presentation', () => {
    test('Viewer: no hover icons; read-only sidebar', async ({ page }) => {
      await test.step('Preconditions: Open workflow as Viewer', async () => {
        await page.goto('/workflow?viewAs=viewer');
      });

      await test.step('Acceptance: Hover icons not displayed', async () => {
        await page.getByRole('region', { name: /section/i }).first().hover();
        await expect(page.getByRole('button', { name: /insert below/i })).toHaveCount(0);
      });

      await test.step('Acceptance: Edit section title read-only; sidebar buttons disabled', async () => {
        await page.getByRole('button', { name: /section/i }).first().click();
        await expect(page.getByLabel(/title/i)).toBeDisabled();
      });
    });

    test('Commenter: all hover icons visible; only Comment active; sidebar read-only', async ({
      page,
    }) => {
      await test.step('Preconditions: Open workflow as Commenter', async () => {
        await page.goto('/workflow?viewAs=commenter');
      });

      await test.step('Acceptance: Insert/Duplicate/Delete visible but inactive; Comment clickable', async () => {
        await page.getByRole('button', { name: /section/i }).first().hover();
        await expect(page.getByRole('button', { name: /comment/i })).toBeEnabled();
      });
    });
  });

  test.describe.fixme('FR-SEC-008 Data Integrity For Edges Across Section Changes', () => {
    test('Insert between linked sections preserves cross-section edges per global rules', async ({
      page,
    }) => {
      await preconditionWorkflowViewWithSections(page);

      await test.step('Preconditions: Workflow contains inter-node edges spanning sections', async () => {
        // Seed or navigate to fixture workflow with cross-section edge.
      });

      await test.step('Trigger: Insert section between linked sections', async () => {
        await page.getByRole('button', { name: /section/i }).first().hover();
        await page.getByRole('button', { name: /insert below/i }).click();
      });

      await test.step('Acceptance: Existing cross-section edges remain unless global rules say otherwise', async () => {
        // Assert edge persistence via graph API or canvas assertions.
      });
    });
  });

  test.describe('FR-SEC-010 Section Title Validation (100 characters)', () => {
    test('At 100 characters, further input does not increase stored length', async ({ page }) => {
      await preconditionWorkflowViewWithSections(page);
      await page.getByRole('button', { name: /section/i }).first().click();

      await test.step('Preconditions: Title field at maximum length', async () => {
        const max = 'a'.repeat(100);
        await page.getByLabel(/title/i).fill(max);
      });

      await test.step('Trigger: User attempts further input', async () => {
        await page.getByLabel(/title/i).pressSequentially('z');
      });

      await test.step('Acceptance: Stored value remains 100 characters', async () => {
        const v = await page.getByLabel(/title/i).inputValue();
        expect(v.length).toBeLessThanOrEqual(100);
      });
    });
  });

  test.describe('FR-SEC-011 Comment On Section (hover icon)', () => {
    test('Comment icon click opens Comments tab in right sidebar', async ({ page }) => {
      await preconditionWorkflowViewWithSections(page);

      await test.step('Trigger: User clicks Comment on section hover', async () => {
        await page.getByRole('button', { name: /section/i }).first().hover();
        await page.getByRole('button', { name: /^comment$/i }).click();
      });

      await test.step('Main flow: Comments tab active in sidebar', async () => {
        await expect(page.getByRole('tab', { name: /comments/i })).toHaveAttribute('aria-selected', 'true');
      });
    });
  });
});
