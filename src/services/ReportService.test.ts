jest.mock('../config/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => {
  class MockTimestamp {
    private readonly date: Date;

    constructor(date: Date) {
      this.date = date;
    }

    toDate() {
      return this.date;
    }

    static fromDate = jest.fn((date: Date) => new MockTimestamp(date));
  }

  return {
    collection: jest.fn((_db, path) => `collection:${path}`),
    deleteField: jest.fn(() => 'deleted-field'),
    doc: jest.fn((_collectionRef, id) => `doc:shared_reports:${id}`),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn((base, ...constraints) => ({ base, constraints })),
    serverTimestamp: jest.fn(() => 'server-timestamp'),
    setDoc: jest.fn(),
    Timestamp: MockTimestamp,
    updateDoc: jest.fn(),
    where: jest.fn((field, op, value) => ({ field, op, value })),
  };
});

import { doc, setDoc } from 'firebase/firestore';
import { ReportService } from './ReportService';

describe('ReportService', () => {
  const originalCrypto = globalThis.crypto;
  const reportSnapshot = {
    budgetSummary: {},
    expensesByCategory: [],
    expenseCount: 0,
    projectionCount: 0,
  };

  const installGetRandomValuesMock = () => {
    let nextByte = 0;
    const getRandomValues = jest.fn((array: Uint8Array) => {
      array.forEach((_value, index) => {
        array[index] = nextByte % 256;
        nextByte += 1;
      });
      return array;
    });

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        getRandomValues,
      },
    });

    return getRandomValues;
  };

  const generateShareLink = () =>
    ReportService.generateShareLink(
      'project-123456789',
      'Kitchen Remodel',
      'user-1',
      reportSnapshot
    );

  beforeEach(() => {
    jest.clearAllMocks();
    (setDoc as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('generates cryptographically random share IDs without project or timestamp components', async () => {
    const getRandomValues = installGetRandomValuesMock();
    const mathRandomSpy = jest.spyOn(Math, 'random');

    const firstShareId = await generateShareLink();
    const secondShareId = await generateShareLink();

    expect(firstShareId).toMatch(/^[a-f0-9]{32}$/);
    expect(secondShareId).toMatch(/^[a-f0-9]{32}$/);
    expect(firstShareId).not.toBe(secondShareId);
    expect(firstShareId).not.toContain('project-');
    expect(firstShareId).not.toContain('12345678');
    expect(firstShareId).not.toMatch(/^project-\d{13}-[a-z0-9]{6}$/);
    expect(getRandomValues).toHaveBeenCalledTimes(2);
    expect(mathRandomSpy).not.toHaveBeenCalled();

    expect(doc).toHaveBeenCalledWith('collection:shared_reports', firstShareId);
    const firstStoredReport = (setDoc as jest.Mock).mock.calls[0][1];
    expect(firstStoredReport.shareId).toBe(firstShareId);
  });

  it('falls back to crypto.randomUUID when getRandomValues is unavailable', async () => {
    const randomUUID = jest
      .fn()
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000001')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000002');

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID,
      },
    });

    const shareId = await generateShareLink();

    expect(shareId).toBe('0000000000004000800000000000000100000000000040008000000000000002');
    expect(randomUUID).toHaveBeenCalledTimes(2);
  });
});
