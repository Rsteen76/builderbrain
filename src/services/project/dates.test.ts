import { Timestamp } from 'firebase/firestore';
import { addDays, dateToTimestamp, timestampToDate } from './dates';

describe('project date helpers', () => {
  test('addDays returns a new date without mutating the input', () => {
    const original = new Date('2024-01-01T00:00:00.000Z');

    const result = addDays(original, 10);

    expect(result).toEqual(new Date('2024-01-11T00:00:00.000Z'));
    expect(original).toEqual(new Date('2024-01-01T00:00:00.000Z'));
  });

  test('dateToTimestamp preserves existing Timestamp values', () => {
    const timestamp = Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z'));

    expect(dateToTimestamp(timestamp)).toBe(timestamp);
  });

  test('timestampToDate converts string and Timestamp values', () => {
    const timestamp = Timestamp.fromDate(new Date('2024-02-01T00:00:00.000Z'));

    expect(timestampToDate(timestamp)).toEqual(new Date('2024-02-01T00:00:00.000Z'));
    expect(timestampToDate('2024-03-01T00:00:00.000Z')).toEqual(new Date('2024-03-01T00:00:00.000Z'));
  });
});
