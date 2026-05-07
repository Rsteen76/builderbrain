import { expect, test } from '@playwright/test';
import { installSmokeTestGuards, selectMuiOption } from './test-utils';

const seededProject = {
  id: 'proj-hillside',
  name: 'Hillside Custom Home',
};

test.beforeEach(async ({ page }) => {
  await installSmokeTestGuards(page);
});

test('projects page loads seeded projects with dev auth bypass', async ({ page }) => {
  await page.goto('/projects');

  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  await expect(page.getByText(seededProject.name)).toBeVisible();
  await expect(page.getByRole('button', { name: /New Project/i })).toBeVisible();
});

test('project detail deep link loads and renders overview data', async ({ page }) => {
  await page.goto(`/projects/${seededProject.id}`);

  await expect(page.getByRole('heading', { name: seededProject.name })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Overview/i })).toBeVisible();
  await expect(page.getByText(/Financial Overview/i)).toBeVisible();
});

test('create project wizard reaches submit path', async ({ page }) => {
  await page.goto('/projects/wizard');

  await page.getByLabel('Project Name').fill('Playwright Smoke Project');
  await selectMuiOption(page, 'Project Type', 'Residential Construction');
  await selectMuiOption(page, 'Project Size', 'Medium ($50,000 - $250,000)');
  await page.getByLabel('Location').fill('Denver, CO');
  await page
    .getByLabel('Project Description')
    .fill('Smoke test project created through the browser wizard.');
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByLabel('Milestone Title').fill('Foundation complete');
  await page.getByRole('button', { name: 'Add Milestone' }).click();
  await expect(page.getByText('Foundation complete')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByLabel('Item Description').fill('Concrete package');
  await selectMuiOption(page, 'Category', 'Materials');
  await page.getByLabel('Estimated Cost').fill('12000');
  await page.getByRole('button', { name: 'Add Item' }).click();
  await expect(page.getByText('Concrete package')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByLabel('Name').fill('Alex Builder');
  await selectMuiOption(page, 'Role', 'Project Manager');
  await page.getByRole('button', { name: 'Add Team Member' }).click();
  await expect(page.getByText('Alex Builder')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: 'Project Review' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit Project' })).toBeVisible();
});

test('project expenses tab renders basic expense UI', async ({ page }) => {
  await page.goto(`/projects/${seededProject.id}`);

  await page.getByRole('tab', { name: /Expenses/i }).click({ force: true });

  await expect(page.getByText('Expense Categories')).toBeVisible();
  await expect(page.getByText('Phase Budget vs Actual')).toBeVisible();
  await expect(page.getByRole('button', { name: /Add Expense/i })).toBeVisible();
});

test('dev auth bypass can create an expense in local dev storage', async ({ page }) => {
  const description = `Playwright lumber package ${Date.now()}`;

  await page.goto('/expenses');
  await expect(page.getByRole('heading', { name: 'Expenses & Payments' })).toBeVisible();

  const initialExpenseCount = await page.evaluate(() => {
    const rawState = window.localStorage.getItem('builderbrain:dev-data:v1');
    return rawState ? (JSON.parse(rawState).expenses || []).length : 0;
  });

  await page.getByRole('button', { name: /Add Expense/i }).click();
  await expect(page.getByRole('heading', { name: 'New Expense', exact: true })).toBeVisible();

  await selectMuiOption(page, 'Project', seededProject.name);
  await selectMuiOption(page, 'General Category', 'Materials');
  await page.getByLabel('Description').fill(description);
  await page.getByLabel('Amount').fill('4321');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('heading', { name: 'New Expense', exact: true })).toBeHidden();
  await page.waitForFunction(
    ({ expectedDescription, expectedCount }) => {
      const rawState = window.localStorage.getItem('builderbrain:dev-data:v1');
      if (!rawState) return false;
      const expenses = JSON.parse(rawState).expenses || [];
      return (
        expenses.length === expectedCount + 1 &&
        expenses.some((expense: { description?: string; amount?: number }) =>
          expense.description === expectedDescription && expense.amount === 4321
        )
      );
    },
    { expectedDescription: description, expectedCount: initialExpenseCount }
  );
});
