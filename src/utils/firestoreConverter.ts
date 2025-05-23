import { Timestamp } from 'firebase/firestore';

/**
 * Converts a JavaScript Date object to a Firestore Timestamp.
 * Handles null and undefined inputs gracefully.
 * @param date The Date object to convert.
 * @returns A Firestore Timestamp, or null/undefined if the input was null/undefined.
 */
export function toTimestamp(date: Date | undefined | null): Timestamp | null | undefined {
  if (date === null) {
    return null;
  }
  if (date === undefined) {
    return undefined;
  }
  // Ensure it's a valid date before converting
  if (date instanceof Date && !isNaN(date.getTime())) {
    return Timestamp.fromDate(date);
  }
  // If it's not a valid date, or not a Date object at all (though type system should prevent this for 'Date' type)
  // we might return undefined or throw an error based on stricter requirements.
  // For now, returning undefined if it's not a valid Date.
  // However, if 'date' is typed as 'Date', it should always be a Date object.
  // The primary concern is invalid dates (e.g., new Date("invalid string")).
  return Timestamp.fromDate(date); // Let Firebase handle invalid dates if it can, or error out.
}

/**
 * Converts a Firestore Timestamp or a JavaScript Date object to a JavaScript Date object.
 * Handles null and undefined inputs gracefully.
 * @param timestamp The Firestore Timestamp or Date object to convert.
 * @returns A JavaScript Date object, or null/undefined if the input was null/undefined.
 */
export function toDate(timestamp: Timestamp | Date | undefined | null): Date | undefined | null {
  if (timestamp === null) {
    return null;
  }
  if (timestamp === undefined) {
    return undefined;
  }
  if (timestamp instanceof Date) {
    return timestamp; // Already a JS Date
  }
  // Check if it's a Firestore Timestamp-like object (duck typing for flexibility if needed, though 'instanceof Timestamp' is better)
  if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }
  // If it's not a Timestamp or Date, return undefined or handle as an error.
  // For now, returning undefined for unexpected types.
  return undefined; 
}
