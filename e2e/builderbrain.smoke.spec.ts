import { expect, test } from '@playwright/test';
import {
  getDevDataState,
  installSmokeTestGuards,
  selectMuiOption,
  waitForDevDataState,
} from './test-utils';

const seededProject = {
  id: 'proj-hillside',
  name: 'Hillside Custom Home',
};

const acceptedFoundationBid = {
  id: 'bid-hillside-foundation',
  title: 'Foundation and retaining wall package',
  subcontractor: 'Summit Foundations',
};

const submittedFramingBid = {
  id: 'bid-hillside-framing',
  title: 'Structural framing package',
};

test.beforeEach(async ({ page }) => {
  await installSmokeTestGuards(page);
});

test('main authenticated routes render without the global error boundary', async ({ page }) => {
  const routes = [
    { path: '/dashboard', heading: 'Dashboard' },
    { path: '/projects', heading: 'Projects' },
    { path: '/expenses', heading: 'Expenses & Payments' },
    { path: '/bids', text: /Filters|Add New Bid|Bid Management/i },
    { path: '/tasks', heading: 'Tasks' },
    { path: '/payments', heading: 'Payments' },
    { path: '/subcontractors', heading: 'Subcontractors' },
    { path: '/settings', heading: 'Settings' },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.getByText('The app hit an unexpected error.')).toHaveCount(0);
    await expect(page.getByText('Something went wrong')).toHaveCount(0);

    if ('heading' in route) {
      await expect(page.getByRole('heading', { name: route.heading, exact: true }).first()).toBeVisible();
    } else {
      await expect(page.locator('main').getByText(route.text).first()).toBeVisible();
    }
  }
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

test('dev auth bypass can edit project details and move project to on hold', async ({ page }) => {
  const editedProjectName = 'Hillside Custom Home - Playwright Edit';

  await page.goto(`/projects/${seededProject.id}`);

  await page.getByRole('button', { name: 'project actions' }).click();
  await page.getByRole('menuitem', { name: 'Edit Project' }).click();

  await expect(page).toHaveURL(new RegExp(`/projects/${seededProject.id}/edit$`));
  await expect(page.getByRole('heading', { name: 'Edit Project' })).toBeVisible();
  await expect(page.getByLabel('Project Name')).toHaveValue(seededProject.name);

  await page.getByLabel('Project Name').fill(editedProjectName);
  await page.getByLabel('Client Name').fill('Playwright Owner');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await expect(page.getByText('Project updated successfully')).toBeVisible();
  await waitForDevDataState(
    page,
    (state) =>
      state.projects.some(
        (project: { id: string; name: string; clientId?: string }) =>
          project.id === 'proj-hillside' &&
          project.name === 'Hillside Custom Home - Playwright Edit' &&
          project.clientId === 'Playwright Owner'
      )
  );

  await expect(page).toHaveURL(new RegExp(`/projects/${seededProject.id}$`));
  await expect(page.getByRole('heading', { name: editedProjectName })).toBeVisible();

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Move this project to On Hold');
    await dialog.accept();
  });

  await page.getByRole('button', { name: 'project actions' }).click();
  await page.getByRole('menuitem', { name: 'Move to On Hold' }).click();

  await expect(page.getByText('Project moved to On Hold.')).toBeVisible();
  await waitForDevDataState(
    page,
    (state) =>
      state.projects.some(
        (project: { id: string; status: string }) =>
          project.id === 'proj-hillside' && project.status === 'on_hold'
      )
  );
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

test('submitted bid edit form exposes lifecycle status controls', async ({ page }) => {
  await page.goto(`/bids/${submittedFramingBid.id}`);

  await expect(page.getByRole('heading', { name: submittedFramingBid.title })).toBeVisible();
  await expect(page.getByText('Submitted')).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Bid' })).toBeVisible();

  await selectMuiOption(page, 'Status', 'Accepted');
  await expect(page.getByRole('button', { name: 'Update Bid' })).toBeDisabled();

  await selectMuiOption(page, 'Status', 'Rejected');
  await expect(page.getByText('Rejected')).toBeVisible();

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Bid' })).toBeHidden();
  await expect(page.getByText('Submitted')).toBeVisible();
});

test('dev auth bypass can add a payment stage to an accepted bid schedule', async ({ page }) => {
  const stageName = 'Playwright retainage release';
  const stageAmount = 1234;

  await page.goto(`/bids/${acceptedFoundationBid.id}`);
  await expect(page.getByRole('heading', { name: acceptedFoundationBid.title })).toBeVisible();

  const initialState = await page.evaluate((bidId) => {
    const rawState = window.localStorage.getItem('builderbrain:dev-data:v1');
    const state = rawState ? JSON.parse(rawState) : { bids: [], expenses: [] };
    const bid = state.bids.find((item: { id: string }) => item.id === bidId);

    return {
      stageCount: bid?.paymentSchedule?.length || 0,
      expenseCount: state.expenses?.length || 0,
    };
  }, acceptedFoundationBid.id);

  await expect(page.getByText('Payment Progress').first()).toBeVisible();
  await page.getByText('Payment Schedule').last().click();
  await page.getByRole('button', { name: /Add Payment Stage/i }).click();

  await expect(page.getByRole('heading', { name: 'Add Payment Stage' })).toBeVisible();
  await page.getByLabel('Stage Name').fill(stageName);
  await page.getByLabel('Amount').fill(String(stageAmount));
  await page.getByLabel('Description').fill('Retainage release created by Playwright.');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('heading', { name: 'Add Payment Stage' })).toBeHidden();
  await expect(page.getByRole('cell', { name: stageName, exact: true })).toBeVisible();

  await page.waitForFunction(
    ({ bidId, expectedStageName, expectedAmount, expectedStageCount, expectedExpenseCount }) => {
      const rawState = window.localStorage.getItem('builderbrain:dev-data:v1');
      if (!rawState) return false;

      const state = JSON.parse(rawState);
      const bid = state.bids.find((item: { id: string }) => item.id === bidId);
      const stage = bid?.paymentSchedule?.find(
        (item: { name?: string; amount?: number; expenseId?: string }) =>
          item.name === expectedStageName && item.amount === expectedAmount && item.expenseId
      );
      const linkedExpense = state.expenses?.find(
        (expense: { id?: string; paymentStageId?: string; bidId?: string; amount?: number }) =>
          expense.id === stage?.expenseId &&
          expense.paymentStageId === stage?.id &&
          expense.bidId === bidId &&
          expense.amount === expectedAmount
      );

      return (
        bid?.paymentSchedule?.length === expectedStageCount + 1 &&
        state.expenses?.length === expectedExpenseCount + 1 &&
        Boolean(stage) &&
        Boolean(linkedExpense)
      );
    },
    {
      bidId: acceptedFoundationBid.id,
      expectedStageName: stageName,
      expectedAmount: stageAmount,
      expectedStageCount: initialState.stageCount,
      expectedExpenseCount: initialState.expenseCount,
    }
  );
});

test('dev auth bypass can mark a bid payment stage paid and create the linked expense', async ({ page }) => {
  const stageName = 'Walls complete';

  await page.goto(`/bids/${acceptedFoundationBid.id}`);

  await expect(page.getByRole('heading', { name: acceptedFoundationBid.title })).toBeVisible();
  await page.getByText('Payment Schedule').last().click();

  const stageRow = page.getByRole('row').filter({ hasText: stageName });
  await expect(stageRow).toBeVisible();
  await expect(stageRow.getByText('Pending')).toBeVisible();

  await stageRow.getByRole('button', { name: 'Create Expense' }).click();
  await expect(page.getByRole('heading', { name: 'Create Expense for Payment Stage' })).toBeVisible();
  await page.getByRole('button', { name: 'Create Expense' }).click();
  await expect(page.getByRole('heading', { name: 'Create Expense for Payment Stage' })).toBeHidden();
  await expect(page.getByText('Expense created successfully')).toBeVisible();

  await stageRow.getByRole('button', { name: 'Mark as Paid' }).click();

  await expect(page.getByRole('heading', { name: 'Edit Payment Stage' })).toBeVisible();
  await expect(page.getByLabel('Stage Name')).toHaveValue(stageName);
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('heading', { name: 'Edit Payment Stage' })).toBeHidden();
  await expect(page.getByText('Payment stage updated successfully')).toBeVisible();
  await expect(stageRow.getByText('Paid')).toBeVisible();

  const state = await getDevDataState(page);
  const bid = state.bids.find((item: { id: string }) => item.id === acceptedFoundationBid.id);
  const stage = bid.paymentSchedule.find((item: { id: string }) => item.id === 'stage-foundation-2');
  const linkedExpense = state.expenses.find((expense: { id?: string }) => expense.id === stage.expenseId);

  expect(stage.status).toBe('paid');
  expect(stage.expenseId).toBe(linkedExpense.id);
  expect(linkedExpense).toMatchObject({
    status: 'paid',
    amount: 30400,
    projectId: seededProject.id,
  });
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
  await selectMuiOption(page, 'Regional Cost Market', 'High-cost metro');
  await selectMuiOption(page, 'Finish Level', 'Premium');
  await page.getByLabel('Start Date').fill('01/15/2026');
  await page.getByLabel('Target Completion').fill('11/15/2026');
  await page.getByLabel('Estimated Total Project Cost').fill('800000');
  await page.getByLabel('Location').fill('Denver, CO');
  await page
    .getByLabel('Project Description')
    .fill('Smoke test project created through the browser wizard.');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.locator('input[value="Pre-Construction & Permits"]')).toBeVisible();
  await expect(page.locator('input[value="Framing & Dry-In"]')).toBeVisible();
  await expect(page.locator('input[value="Punch, Closeout & Warranty"]')).toBeVisible();
  await expect(page.locator('input[value="2026-01-15"]')).toBeVisible();
  await expect(page.locator('input[type="number"]').first()).toHaveValue(/[1-9]\d*/);
  await page.getByLabel('Milestone Title').fill('Foundation complete');
  await page.getByRole('button', { name: 'Add Milestone' }).click();
  await expect(page.getByText('Foundation complete')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('cell', { name: 'Phase Budget' }).first()).toBeVisible();
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
  await page.getByRole('button', { name: 'Submit Project' }).click();
  await expect(page.getByRole('heading', { name: 'Project Created Successfully!' })).toBeVisible();
  await waitForDevDataState(
    page,
    (state) => {
      const project = state.projects.find(
        (item: { name: string }) => item.name === 'Playwright Smoke Project'
      );
      return Boolean(
        project &&
          project.phases?.some((phase: { name: string }) => phase.name === 'Framing & Dry-In') &&
          project.keyMilestones?.some((milestone: { name: string }) => milestone.name === 'Foundation complete')
      );
    }
  );
});

test('project expenses tab renders basic expense UI', async ({ page }) => {
  await page.goto(`/projects/${seededProject.id}`);

  await page.getByRole('tab', { name: /Expenses/i }).click({ force: true });

  await expect(page.getByText('Expense Categories')).toBeVisible();
  await expect(page.getByText('Phase Budget vs Actual')).toBeVisible();
  await expect(page.getByRole('button', { name: /Add Expense/i })).toBeVisible();
});

test('dev auth bypass can create an expense in local dev storage', async ({ page }) => {
  const description = 'Playwright lumber package';

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

test('dev auth boundaries redirect signed-out protected routes and allow local sign in', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Development auth bypass is enabled.')).toBeVisible();

  await page.getByLabel('Email Address').fill('local-e2e@example.test');
  await page.getByLabel('Password').fill('local-dev-password');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Development auth bypass is enabled.')).toBeVisible();

  const state = await getDevDataState(page);
  expect(state.projects.some((project: { id: string }) => project.id === seededProject.id)).toBe(true);
});
