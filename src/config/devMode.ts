import type { User as FirebaseUser } from 'firebase/auth';
import type { User } from '../services/user';

export const isDevAuthBypassEnabled =
  process.env.REACT_APP_DEV_AUTH_BYPASS === 'true';

const now = new Date();

export const devBypassFirebaseUser = {
  uid: 'dev-user',
  email: 'dev@builderbrain.local',
  displayName: 'Dev User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: now.toISOString(),
    lastSignInTime: now.toISOString(),
  },
  providerData: [],
  providerId: 'firebase',
  refreshToken: 'dev-auth-bypass',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'dev-auth-bypass',
  getIdTokenResult: async () => ({
    token: 'dev-auth-bypass',
    signInProvider: 'custom',
    signInSecondFactor: null,
    authTime: now.toISOString(),
    issuedAtTime: now.toISOString(),
    expirationTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    claims: {},
  }),
  reload: async () => {},
  toJSON: () => ({ uid: 'dev-user' }),
} as unknown as FirebaseUser;

export const devBypassAppUser: User = {
  id: 'dev-user',
  email: 'dev@builderbrain.local',
  displayName: 'Dev User',
  role: 'team_member',
  createdAt: now,
  updatedAt: now,
};
