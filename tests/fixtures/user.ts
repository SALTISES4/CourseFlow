import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import { getTestApiBaseUrl } from '../helpers/env';
import { test as projectTest } from './project';

const execFileAsync = promisify(execFile);

export type DisposableUser = {
  uuid: string;
  email: string;
  password: string;
};

type RegisterResponse = {
  user: {
    uuid: string;
    email: string;
  };
};

type UserFixtures = {
  disposableUser: DisposableUser;
};

async function deleteDisposableUser(email: string): Promise<void> {
  const repositoryRoot = path.resolve(__dirname, '../..');
  await execFileAsync(
    'uv',
    ['run', 'python', 'manage.py', 'cf_delete_e2e_user', '--email', email],
    { cwd: repositoryRoot },
  );
}

export const test = projectTest.extend<UserFixtures>({
  disposableUser: async ({ request }, use) => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `e2e-disposable-${suffix}@courseflow.test`;
    const password = `E2E-Original-${suffix}!`;
    const response = await request.post(`${getTestApiBaseUrl()}/api/auth/register`, {
      data: {
        email,
        password,
        firstName: 'Disposable',
        lastName: 'User',
        label: 'Playwright disposable user',
      },
    });
    if (!response.ok()) {
      throw new Error(
        `Register disposable user failed with HTTP ${response.status()}: ${await response.text()}`,
      );
    }
    const body = (await response.json()) as RegisterResponse;

    try {
      await use({
        uuid: body.user.uuid,
        email: body.user.email,
        password,
      });
    } finally {
      await deleteDisposableUser(email);
    }
  },
});
