export function requireTestCredentials(): { username: string; password: string } {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  if (!username?.trim() || !password) {
    throw new Error('Missing TEST_USERNAME or TEST_PASSWORD (required for auth setup).');
  }
  return { username, password };
}

export function getWorkflowPathFromEnv(): string {
  return process.env.PLAYWRIGHT_WORKFLOW_PATH ?? '';
}
