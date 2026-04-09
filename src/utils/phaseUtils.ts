/**
 * Generates initials from a phase name.
 * @param phaseName - The name of the phase.
 * @returns A string of 1 or 2 initials, or '?'.
 */
export const getPhaseInitials = (phaseName: string): string => {
  if (!phaseName) return '?';
  return phaseName
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

/**
 * Formats a phase status string for display.
 * @param status - The raw status string (e.g., 'in_progress').
 * @returns A formatted status string (e.g., 'In Progress').
 */
export const getStatusText = (status: string): string => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Formats a date value (potentially from various sources) for display.
 * Uses safelyParseDate internally.
 * @param date - The date value (Date, string, Firestore Timestamp-like, null).
 * @returns A formatted date string (e.g., "Apr 9, 2025") or 'N/A' or 'Invalid Date'.
 */
export const formatPhaseDate = (date: Date | string | { toDate(): Date } | null | undefined): string => {
  try {
    if (!date) return 'N/A';
    
    let parsedDate: Date | null = null;
    
    if (date instanceof Date) {
      parsedDate = date;
    } else if (typeof date === 'string') {
      parsedDate = new Date(date);
    } else if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      // Handle Timestamp objects (which have toDate method)
      parsedDate = date.toDate();
    }
    
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      // Example format, adjust as needed
      return parsedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return 'N/A';
  } catch (error) {
    console.error('Error formatting phase date:', error);
    return 'Invalid Date';
  }
}; 
