jest.mock('../config/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, collectionName) => ({ collectionName })),
  doc: jest.fn((_db, collectionName, id) => `doc:${collectionName}:${id}`),
  getDocs: jest.fn(),
  query: jest.fn((collectionRef, ...constraints) => ({
    collectionName: collectionRef.collectionName,
    constraints,
  })),
  where: jest.fn((field, op, value) => ({ field, op, value })),
  writeBatch: jest.fn(() => ({
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { collection, getDocs, query } from 'firebase/firestore';
import { DataResetService } from './data-reset';

describe('DataResetService', () => {
  const collectionNames = [
    'projects',
    'expenses',
    'bids',
    'subcontractors',
    'activity',
    'logs',
    'notifications',
    'tasks',
    'events',
    'messages',
    'comments',
    'phases',
    'documents',
  ];

  let confirmSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let removeItemSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (collection as jest.Mock).mockImplementation((_db, collectionName) => ({ collectionName }));
    (query as jest.Mock).mockImplementation((collectionRef, ...constraints) => ({
      collectionName: collectionRef.collectionName,
      constraints,
    }));
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

    (getDocs as jest.Mock).mockImplementation(({ collectionName }) => {
      if (collectionName === 'expenses') {
        return Promise.reject(new Error('permission denied'));
      }

      return Promise.resolve({ empty: true, docs: [] });
    });
  });

  afterEach(() => {
    confirmSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    removeItemSpy.mockRestore();
  });

  test('rejects reset when any collection deletion fails', async () => {
    await expect(DataResetService.resetAllUserData('user-1')).rejects.toThrow(
      'Failed to reset user data for 1 collection(s): expenses'
    );

    expect(getDocs).toHaveBeenCalledTimes(collectionNames.length);
    expect(consoleLogSpy).not.toHaveBeenCalledWith('All user data has been reset');
    expect(removeItemSpy).not.toHaveBeenCalledWith('recentActivity');
    expect(removeItemSpy).not.toHaveBeenCalledWith('lastProjects');
  });
});
