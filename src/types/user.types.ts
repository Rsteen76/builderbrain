import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'contractor' | 'subcontractor' | 'client';
export type ThemePreference = 'light' | 'dark';

export interface UserSettings {
  notifications: boolean;
  emailNotifications: boolean;
  theme: ThemePreference;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyName?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin: Timestamp;
  settings: UserSettings;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserSignupData extends UserCredentials {
  displayName: string;
  role: UserRole;
  companyName?: string;
  phoneNumber?: string;
} 