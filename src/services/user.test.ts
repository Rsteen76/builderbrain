jest.mock('../config/firebase', () => ({
  auth: {},
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
    doc: jest.fn((_collectionRef, id) => `doc:${id}`),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    orderBy: jest.fn(),
    query: jest.fn((base, ...constraints) => ({ base, constraints })),
    setDoc: jest.fn(),
    Timestamp: MockTimestamp,
    updateDoc: jest.fn(),
    where: jest.fn((field, op, value) => ({ field, op, value })),
  };
});

import { doc, setDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { UserService } from './user';

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createUser strips undefined optional fields before writing to Firestore', async () => {
    const firebaseUser = {
      uid: 'user-1',
      email: 'avery@example.com',
      displayName: 'Avery',
      photoURL: null,
    } as FirebaseUser;

    await UserService.createUser(firebaseUser);

    expect(doc).toHaveBeenCalledWith('collection:users', 'user-1');
    expect(setDoc).toHaveBeenCalledTimes(1);

    const payload = (setDoc as jest.Mock).mock.calls[0][1];
    expect(payload).toMatchObject({
      id: 'user-1',
      email: 'avery@example.com',
      displayName: 'Avery',
      role: 'team_member',
    });
    expect(payload).not.toHaveProperty('photoURL');
  });
});
