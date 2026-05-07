const fs = require('fs');
const path = require('path');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} = require('firebase/firestore');

const projectId = 'builderbrain-rules-test';

const now = () => new Date('2024-01-01T00:00:00.000Z');

const fixtures = {
  users: (userId) => ({
    email: `${userId}@example.com`,
    displayName: 'Test User',
    role: 'contractor',
    createdAt: now(),
    updatedAt: now(),
  }),
  projects: (userId) => ({
    userId,
    name: 'Test Project',
    status: 'planning',
    startDate: now(),
    createdAt: now(),
    updatedAt: now(),
  }),
  expenses: (userId) => ({
    userId,
    projectId: 'project-1',
    category: 'materials',
    amount: 100,
    date: now(),
    status: 'pending',
    createdBy: userId,
  }),
  expense_transactions: (userId) => ({
    userId,
    projectId: 'project-1',
    expenseId: 'expense-1',
    amount: 75,
    transactionDate: now(),
    status: 'completed',
    createdAt: now(),
    updatedAt: now(),
  }),
  subcontractors: (userId) => ({
    userId,
    name: 'Demo Subcontractor',
    specialty: 'Framing',
    contact: { email: 'sub@example.com', phone: '555-0100' },
    createdAt: now(),
    updatedAt: now(),
  }),
  bids: (userId) => ({
    userId,
    projectId: 'project-1',
    status: 'draft',
    totalAmount: 2500,
    createdAt: now(),
    updatedAt: now(),
  }),
  tasks: (userId) => ({
    userId,
    projectId: 'project-1',
    title: 'Frame wall',
    status: 'todo',
    priority: 'medium',
    createdAt: now(),
    updatedAt: now(),
  }),
  documents: (userId) => ({
    userId,
    projectId: 'project-1',
    name: 'Contract',
    type: 'contract',
    url: 'https://example.com/contract.pdf',
    uploadedBy: userId,
    createdAt: now(),
    updatedAt: now(),
  }),
};

async function runCase(name, testFn) {
  try {
    await testFn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    throw error;
  }
}

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  });

  try {
    await runCase('users are private to their own uid', async () => {
      const ownerDb = testEnv.authenticatedContext('user-1').firestore();
      const otherDb = testEnv.authenticatedContext('user-2').firestore();

      await assertSucceeds(setDoc(doc(ownerDb, 'users/user-1'), fixtures.users('user-1')));
      await assertSucceeds(getDoc(doc(ownerDb, 'users/user-1')));
      await assertFails(getDoc(doc(otherDb, 'users/user-1')));
      await assertFails(setDoc(doc(ownerDb, 'users/user-2'), fixtures.users('user-2')));
      await assertFails(deleteDoc(doc(ownerDb, 'users/user-1')));
    });

    await testEnv.clearFirestore();

    await runCase('projects enforce owner create/read/update/delete', async () => {
      const ownerDb = testEnv.authenticatedContext('user-1').firestore();
      const otherDb = testEnv.authenticatedContext('user-2').firestore();
      const projectRef = doc(ownerDb, 'projects/project-1');

      await assertSucceeds(setDoc(projectRef, fixtures.projects('user-1')));
      await assertSucceeds(getDoc(projectRef));
      await assertFails(getDoc(doc(otherDb, 'projects/project-1')));
      await assertSucceeds(updateDoc(projectRef, { name: 'Renamed Project' }));
      await assertFails(updateDoc(projectRef, { userId: 'user-2' }));
      await assertFails(deleteDoc(doc(otherDb, 'projects/project-1')));
      await assertSucceeds(deleteDoc(projectRef));
    });

    await testEnv.clearFirestore();

    await runCase('owned collections reject cross-user and malformed creates', async () => {
      const ownerDb = testEnv.authenticatedContext('user-1').firestore();
      const unauthDb = testEnv.unauthenticatedContext().firestore();

      for (const collectionName of ['projects', 'expenses', 'expense_transactions', 'subcontractors', 'bids', 'tasks', 'documents']) {
        const payload = fixtures[collectionName]('user-1');
        await assertSucceeds(setDoc(doc(ownerDb, `${collectionName}/${collectionName}-1`), payload));
        await assertFails(setDoc(doc(ownerDb, `${collectionName}/${collectionName}-2`), fixtures[collectionName]('user-2')));
        await assertFails(setDoc(doc(unauthDb, `${collectionName}/${collectionName}-3`), payload));
      }
    });

    await testEnv.clearFirestore();

    await runCase('owned related collections enforce delete ownership', async () => {
      const ownerDb = testEnv.authenticatedContext('user-1').firestore();
      const otherDb = testEnv.authenticatedContext('user-2').firestore();

      for (const collectionName of ['expenses', 'expense_transactions', 'bids', 'tasks', 'documents']) {
        const docPath = `${collectionName}/${collectionName}-delete`;
        await assertSucceeds(setDoc(doc(ownerDb, docPath), fixtures[collectionName]('user-1')));
        await assertFails(deleteDoc(doc(otherDb, docPath)));
        await assertSucceeds(deleteDoc(doc(ownerDb, docPath)));
      }
    });
  } finally {
    await testEnv.cleanup();
  }
}

main().catch(() => {
  process.exitCode = 1;
});
