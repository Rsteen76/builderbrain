import type { Page } from '@playwright/test';

export const DEV_DATA_STORAGE_KEY = 'builderbrain:dev-data:v1';

export async function installSmokeTestGuards(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('builderbrain:dev-data:v1');

    const hideWebpackOverlay = () => {
      if (document.head) {
        const styleId = 'e2e-hide-webpack-overlay';
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            iframe#webpack-dev-server-client-overlay {
              display: none !important;
              pointer-events: none !important;
            }
          `;
          document.head.appendChild(style);
        }
      }

      document
        .querySelectorAll<HTMLIFrameElement>('iframe#webpack-dev-server-client-overlay')
        .forEach((iframe) => {
          iframe.remove();
        });
    };

    hideWebpackOverlay();
    window.setInterval(hideWebpackOverlay, 100);

    if (document.documentElement) {
      new MutationObserver(hideWebpackOverlay).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  });
}

export async function selectMuiOption(page: Page, label: string, option: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const namedCombobox = page.getByRole('combobox', {
    name: new RegExp(`^${escapedLabel}`),
  });
  const combobox =
    (await namedCombobox.count()) > 0
      ? namedCombobox.first()
      : page
          .locator('.MuiFormControl-root')
          .filter({ hasText: new RegExp(`^${escapedLabel}`) })
          .getByRole('combobox')
          .first();

  await combobox.click();
  await page.getByRole('option', { name: option }).click({ force: true });
}

export async function getDevDataState(page: Page) {
  return page.evaluate((storageKey) => {
    const rawState = window.localStorage.getItem(storageKey);
    return rawState ? JSON.parse(rawState) : null;
  }, DEV_DATA_STORAGE_KEY);
}

export async function waitForDevDataState(
  page: Page,
  predicate: (state: any) => boolean
) {
  await page.waitForFunction(
    ({ storageKey, predicateSource }) => {
      const rawState = window.localStorage.getItem(storageKey);
      if (!rawState) return false;

      const state = JSON.parse(rawState);
      const predicate = new Function('state', `return (${predicateSource})(state);`);
      return Boolean(predicate(state));
    },
    {
      storageKey: DEV_DATA_STORAGE_KEY,
      predicateSource: predicate.toString(),
    }
  );
}
