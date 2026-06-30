import { assertManifestReady, getWorkflowPath } from '../helpers/manifest';

/**
 * Runs once before all Playwright projects.
 * Ensures the E2E fixture manifest exists and logs the resolved workflow path.
 */
export default async function globalSetup(): Promise<void> {
  assertManifestReady();
  const workflowPath = getWorkflowPath();
  process.env.PLAYWRIGHT_WORKFLOW_PATH = workflowPath;
  console.log(`[globalSetup] E2E workflow path: ${workflowPath}`);
}
