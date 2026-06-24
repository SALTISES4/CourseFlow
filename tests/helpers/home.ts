import type { Page } from '@playwright/test';

import {
  HIDE_HOME_TEMPLATES_ALERT_COOKIE,
  HIDE_HOME_WELCOME_COOKIE,
} from '../e2e/home/home.locators';

/** Clears home dismiss cookies so welcome panel and templates alert can render. */
export async function clearHomeDismissCookies(page: Page): Promise<void> {
  await page.evaluate(
    ([welcomeCookie, templatesCookie]) => {
      for (const name of [welcomeCookie, templatesCookie]) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
      }
    },
    [HIDE_HOME_WELCOME_COOKIE, HIDE_HOME_TEMPLATES_ALERT_COOKIE] as const,
  );
}
