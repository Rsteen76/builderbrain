import { Timestamp } from 'firebase/firestore';
import type { Phase } from '../../types';
import { logger } from '../../utils/logger';

export type TimestampInput = Date | string | Timestamp | null | undefined;

export const dateToTimestamp = (date: TimestampInput): Timestamp | null => {
  if (!date) return null;

  if (date instanceof Timestamp) {
    return date;
  }

  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }

  if (typeof date === 'string') {
    try {
      return Timestamp.fromDate(new Date(date));
    } catch (e) {
      logger.error('Failed to convert string date to Timestamp:', e);
      return null;
    }
  }

  return null;
};

export const timestampToDate = (value: unknown): Date | null => {
  if (!value) return null;

  if (value instanceof Timestamp && typeof value.toDate === 'function') {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      return new Date(value);
    } catch (e) {
      logger.error('Failed to convert string to Date:', e);
      return null;
    }
  }

  return null;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const processPhaseDates = (phases: Phase[] = []): Phase[] =>
  phases.map(phase => ({
    ...phase,
    startDate: phase.startDate
      ? (phase.startDate instanceof Date ? Timestamp.fromDate(phase.startDate) : phase.startDate)
      : Timestamp.fromDate(new Date()),
    endDate: phase.endDate
      ? (phase.endDate instanceof Date ? Timestamp.fromDate(phase.endDate) : phase.endDate)
      : Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() + 30))),
  }));
