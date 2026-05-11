import { expect, test } from '@playwright/test';
import { installSmokeTestGuards, selectMuiOption } from './test-utils';

const seededProject = {
  id: 'proj-hillside',
  name: 'Hillside Custom Home',
};

const acceptedFoundationBid = {
  id: 'bid-hillside-foundation',
  title: 'Foundation and retaining wall package',
  subcontractor: 'Summit Foundations',
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

test('projects list can navigate to a seeded project detail view', async ({ page }) => {
  await page.goto('/projects');

  await page.getByText(seededProject.name).first().click();

  await expect(page).toHaveURL(new RegExp(`/projects/${seededProject.id}$`));
  await expect(page.getByRole('heading', { name: seededProject.name })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Overview/i })).toBeVisible();
  await expect(page.getByText(/Financial Overview/i)).toBeVisible();
});

test('project detail deep link loads and renders overview data', async ({ page }) => {
  await page.goto(`/projects/${seededProject.id}`);

  await expect(page.getByRole('heading', { name: seededProject.name })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Overview/i })).toBeVisible();
  await expect(page.getByText(/Financial Overview/i)).toBeVisible();
});

test('project detail exposes bids, accepted payment stages, and expense workflow surfaces', async ({ page }) => {
  await page.goto(`/projects/${seededProject.id}`);

  await page.getByRole('tab', { name: /Bids/i }).click();
  await expect(page.getByRole('heading', { name: 'Project Bids' })).toBeVisible();
  await expect(page.getByText(acceptedFoundationBid.title)).toBeVisible();
  await expect(page.getByText('Electrical rough-in and finish package')).toBeVisible();
  await expect(page.getByText('Structural framing package')).toBeVisible();

  await page.getByRole('tab', { name: /^Accepted$/i }).click();
  await expect(page.getByText(acceptedFoundationBid.title)).toBeVisible();
  await page.getByText(acceptedFoundationBid.title).first().click();
  await expect(page.getByText('Mobilization')).toBeVisible();
  await expect(page.getByText('Payment Progress').first()).toBeVisible();

  await page.getByRole('tab', { name: /^Expenses$/i }).click();
  await expect(page.getByRole('heading', { name: 'Expenses & Payments' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Needs Payment/i })).toBeVisible();
  await expect(page.getByText('Expense Categories')).toBeVisible();
  await expect(page.getByText('Phase Budget vs Actual')).toBeVisible();
  await expect(page.getByRole('button', { name: /Add Expense/i })).toBeVisible();
});

test('accepted bid detail shows payment management controls and schedule progress', async ({ page }) => {
  await page.goto(`/bids/${acceptedFoundationBid.id}`);

  await expect(page.getByRole('heading', { name: acceptedFoundationBid.title })).toBeVisible();
  await expect(page.getByText('Bid Details')).toBeVisible();
  await expect(page.getByText('Accepted')).toBeVisible();
  await expect(page.getByText(seededProject.name)).toBeVisible();
  await expect(page.getByText(acceptedFoundationBid.subcontractor)).toBeVisible();

  await expect(page.getByText('Payment Progress')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paid' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pending' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Remaining' })).toBeVisible();

  await expect(page.getByText('Payment Management')).toBeVisible();
  await page.getByText('Payment Schedule').last().click();
  await expect(page.getByRole('button', { name: /Add Extra Payment/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Add Payment Stage/i })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Mobilization', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Walls complete', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Inspection signoff', exact: true })).toBeVisible();
});

test('payments dashboard reflects seeded paid expenses and accepted bid commitments', async ({ page }) => {
  await page.goto('/payments');

  await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Record Payment/i })).toBeVisible();
  await expect(page.getByText('Total Paid')).toBeVisible();
  await expect(page.getByText('Commitments & Invoices')).toBeVisible();
  await expect(page.getByText('Committed')).toBeVisible();
  await expect(page.getByText('Commitment Balance')).toBeVisible();
  await expect(page.getByText('Recent Transactions')).toBeVisible();
  await expect(page.getByText('Electrical procurement deposit')).toBeVisible();
  await expect(page.getByText('Foundation mobilization and initial grading invoice')).toBeVisible();
});

test('documents and budget report surfaces are reachable from project detail', async ({ page }) => {
  await page.goto(`/projects/${seededProject.id}`);

  await page.getByRole('tab', { name: /Documents/i }).click();
  await expect(page.getByRole('heading', { name: 'Project Documents' })).toBeVisible();
  await expect(page.getByText('Builder Checklist')).toBeVisible();
  await expect(page.getByText('Document Categories')).toBeVisible();
  await expect(page.getByText('Site survey')).toBeVisible();
  await expect(page.getByText('Structural drawings')).toBeVisible();

  await page.getByRole('tab', { name: /^Budget$/i }).click();
  await expect(page.getByText('Budget Dashboard')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Budget Report' })).toBeVisible();

  await page.getByRole('button', { name: 'Budget Report' }).click();
  await expect(page.getByRole('heading', { name: 'Budget Report' })).toBeVisible();
  await expect(page.getByRole('heading', { name: seededProject.name })).toBeVisible();
  await expect(page.getByText('Financial Summary')).toBeVisible();
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

test('settings notifications can be updated in dev auth bypass', async ({ page }) => {
  await page.goto('/settings');

  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('tab', { name: /Notifications/i }).click();
  await expect(page.getByRole('heading', { name: 'Notification Preferences' })).toBeVisible();

  await page.getByLabel('Email notifications').click();
  await page.getByRole('button', { name: /Save Preferences/i }).click();

  await expect(page.getByText('Notification preferences saved.')).toBeVisible();
});
